package com.architecturalthinking.mediaos.remotion;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StorageHealthService {
    private static final long MB = 1024L * 1024;
    private static final long WAL_FALLBACK_BYTES = 128 * MB;
    private static final long SYSTEM_RESERVE_BYTES = 128 * MB;
    private final JdbcClient jdbc;

    public StorageHealthService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record Snapshot(
            long configuredVolumeBytes, long databaseBytes, long walBytes,
            boolean walMeasured, long safetyReserveBytes, long estimatedUsedBytes,
            int estimatedPercent, String status, long retainedMp4Bytes,
            long lockedMp4Bytes, int retainedMp4Count, int lockedMp4Count,
            boolean exactVolumeUsageAvailable, String measurementNote
    ) {}

    public Snapshot snapshot() {
        long capacity = configuredVolumeBytes();
        long databaseBytes = jdbc.sql("select pg_database_size(current_database())")
                .query(Long.class).single();
        long walBytes;
        boolean walMeasured = true;
        try {
            walBytes = jdbc.sql("select coalesce(sum(size), 0) from pg_ls_waldir()")
                    .query(Long.class).single();
        } catch (Exception unavailable) {
            walBytes = WAL_FALLBACK_BYTES;
            walMeasured = false;
        }
        long[] media = jdbc.sql("""
                select coalesce(sum(r.size_bytes) filter (where r.video_data is not null),0) as retained,
                       coalesce(sum(r.size_bytes) filter (where r.video_data is not null
                         and exists (select 1 from visual_shot_lock l where l.render_id=r.id)),0) as locked,
                       count(*) filter (where r.video_data is not null) as retained_count,
                       count(*) filter (where r.video_data is not null
                         and exists (select 1 from visual_shot_lock l where l.render_id=r.id)) as locked_count
                from remotion_render r
                """).query((rs, n) -> new long[] {
                    rs.getLong("retained"), rs.getLong("locked"),
                    rs.getLong("retained_count"), rs.getLong("locked_count")
                }).single();
        long used = databaseBytes + walBytes + SYSTEM_RESERVE_BYTES;
        int percent = (int) Math.ceil(100d * used / capacity);
        return new Snapshot(
                capacity, databaseBytes, walBytes, walMeasured, SYSTEM_RESERVE_BYTES,
                used, percent, classification(percent),
                media[0], media[1], (int) media[2], (int) media[3], false,
                "Estimate, not actual Railway volume usage: PostgreSQL database allocation + WAL + fixed safety reserve. Check Railway for real disk utilization."
        );
    }

    public static class StorageLimitException extends ResponseStatusException {
        public StorageLimitException(String reason) {
            super(HttpStatus.INSUFFICIENT_STORAGE, reason);
        }
    }

    public void requireRenderHeadroom() {
        Snapshot s = snapshot();
        if (s.estimatedPercent() >= 85) {
            throw new StorageLimitException(
                    "STORAGE_GUARD: estimated storage risk is " + s.estimatedPercent()
                    + "%. Render was not queued. Preserve Director LOCKED assets and free obsolete data.");
        }
    }

    public void requireUploadHeadroom(long videoBytes) {
        Snapshot s = snapshot();
        long writeOverhead = Math.multiplyExact(videoBytes, 2);
        long freeReserve = Math.max(64 * MB, s.configuredVolumeBytes() / 20);
        if (s.estimatedUsedBytes() + writeOverhead >= s.configuredVolumeBytes() - freeReserve) {
            throw new StorageLimitException(
                    "STORAGE_GUARD: MP4 requires " + (videoBytes / MB)
                    + " MB plus database write headroom. Upload stopped before database write; "
                    + "approved shots are unchanged. Free old media or increase storage, then retry.");
        }
    }

    public static String classification(int percent) {
        if (percent >= 85) return "CRITICAL";
        if (percent >= 70) return "WARNING";
        return "ESTIMATED_OK";
    }

    private long configuredVolumeBytes() {
        String raw = System.getenv("MEDIA_OS_PG_VOLUME_MB");
        try {
            return Math.max(500, raw == null ? 1000 : Long.parseLong(raw.trim())) * MB;
        } catch (NumberFormatException ignored) {
            return 1000 * MB;
        }
    }
}
