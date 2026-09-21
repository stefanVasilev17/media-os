package com.architecturalthinking.mediaos.spline;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/worker/spline/snapshot")
public class SplineSnapshotWorkerController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;

    private final JdbcClient jdbc;
    private final String workerKey;

    public SplineSnapshotWorkerController(
            JdbcClient jdbc,
            @Value("${SPLINE_WORKER_KEY:}") String workerKey
    ) {
        this.jdbc = jdbc;
        this.workerKey = workerKey;
    }

    @PostMapping(value = "/{jobId}", consumes = "image/png")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void upload(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId,
            @PathVariable UUID jobId,
            @RequestParam int width,
            @RequestParam int height,
            @RequestBody byte[] image
    ) {
        verifyKey(key);

        if (width < 100 || height < 100 || width > 12000 || height > 12000) {
            throw new InvalidSnapshotException("Invalid snapshot dimensions.");
        }
        if (image.length == 0 || image.length > MAX_SNAPSHOT_BYTES) {
            throw new InvalidSnapshotException("Invalid snapshot size.");
        }

        int owned = jdbc.sql("""
                select count(*)
                from production_job
                where id = :jobId
                  and worker_id = :workerId
                  and task_type = 'CAPTURE_SPLINE_SNAPSHOT'
                  and status in ('CLAIMED', 'RUNNING')
                """)
                .param("jobId", jobId)
                .param("workerId", workerId)
                .query(Integer.class)
                .single();

        if (owned != 1) {
            throw new InvalidSnapshotException("Snapshot job is not owned by this worker.");
        }

        jdbc.sql("""
                insert into spline_snapshot(
                    id, project_id, worker_id, content_type, width, height, image_data, captured_at
                )
                values (:id, :projectId, :workerId, 'image/png', :width, :height, :image, now())
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId)
                .param("width", width)
                .param("height", height)
                .param("image", image)
                .update();

        jdbc.sql("""
                delete from spline_snapshot
                where id in (
                    select id
                    from spline_snapshot
                    where project_id = :projectId
                    order by captured_at desc
                    offset 5
                )
                """)
                .param("projectId", PROJECT_ID)
                .update();
    }

    private void verifyKey(String key) {
        if (workerKey.isBlank() || !workerKey.equals(key)) {
            throw new WorkerAuthException();
        }
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    private static class WorkerAuthException extends RuntimeException {}

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    private static class InvalidSnapshotException extends RuntimeException {
        InvalidSnapshotException(String message) {
            super(message);
        }
    }
}
