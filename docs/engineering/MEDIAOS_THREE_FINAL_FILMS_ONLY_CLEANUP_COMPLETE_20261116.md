# MediaOS — three completed films only, storage cleanup completion (2026-11-16)

## Director rule

Only the three complete videos EP001, EP002, EP003 should be retained as playable MP4 media. Remove superseded individual SHOT and old whole-film WIP MP4 payloads, plus standalone voice audio. Each complete film has embedded AAC audio. Do not generate replacement voices, alter the final master video, or delete production scripts, Git source code, scene recipes, approvals, content hashes and provenance. When non-null audio fields have database foreign-key references, write zero-length audio to remove media payload without breaking referential integrity.

## Verified final protected film rows

| Film | Render ID | Runtime | Frames | MP4 bytes | Final content SHA256 | Embedded audio |
|---|---|---:|---:|---:|---|---|
| EP001 | `904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8` | 20:56.77 | 37703 | 94164846 | `5c9dcbba1a5293d9a8bb19654b4aacaa0b752e1a8a8f63f26937b1fcc8192066` | AAC 48000 Hz stereo |
| EP002 | `56c2a4b7-8bc0-465b-baea-80fa3707e709` | 13:01.53 | 23446 | 83569046 | `3a295b5952780a8fe9ecb795332bb7edc229aad5fde70b91daa53bf505f13d09` | AAC 48000 Hz mono |
| EP003 | `63827ce6-2ea8-4853-a61b-8549fe8db967` | 21:26.43 | 38593 | 152025545 | `1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6` | AAC 48000 Hz mono |

Actual FFprobe readback and SHA verification: Railway deployment `e3de9389-2cfc-45a6-97e2-d0d971bd74e2` event `THREE_FINAL_MASTERS_ACTUAL_MP4_AUDIO_QA_PASS` for all three.

## MP4 cleaning done

EP003 previously removed 43 obsolete full and SHOT MP4 payloads, retaining its official 11-SHOT master. The separate EP001 + EP002 + EP003 final-master-only cleanup later removed **103 additional old MP4 payloads** while checking all three protected full masters after every batch. Final Railway deployment `41df3d0f-4143-4a88-b19e-f509b86dd979` event `MEDIAOS_FINAL_THREE_ONLY_ALL_SHOT_MP4S_PRUNED` reported **remainingCount:0**, **remainingMiB:0**, `protectedMastersStillByteIntact:true`. Total historical obsolete video payloads removed across EP003 and final-three cleanup: 146, with the three selected films retained.

## Standalone voice cleanup done

Production standalone audio deletion deployment `8284b8d6-5da6-48a2-937f-d9c264b28a26` event `MEDIAOS_THREE_FINAL_FILMS_ALL_STANDALONE_VOICES_REMOVED`: **114 positive-length audio rows, ~66.02 MiB**, ten separate audio table categories, `allResidualVoices:0`, all three complete MP4 masters checked after deletion. EP001 clip workflow, Studio preview and archive audio, EP002 creative voice takes and EP003 package voice takes were cleared. For NOT NULL `bytea` columns with FK-referenced take IDs, **zero-length bytea** preserves historical approval/reference metadata; the actual standalone audio payload no longer exists. Script text and project metadata remain, by design.

Old Spline render/snapshot media also cleaned: `spline_shot_render.video_data` and `spline_snapshot.image_data` contain no positive-length legacy blobs. Latest verification deployment `2159c824-609e-4119-96b5-0b8e60ba9ca2` event `MEDIAOS_FINAL_FILMS_SPLINE_LEGACY_BLOBS_REMOVED` reports remainingVideo=0 and remainingSnapshots=0.

Safety: all deletion switches on the one-time Railway worker were disabled after the successful cleanup. PostgreSQL physical volume capacity is not equal to logical removed media bytes: Railway last observed `DISK_USAGE_GB` approximately **4.11 GB**; do not claim all deleted MP4/voice bytes were returned to the underlying filesystem immediately. Do not use `VACUUM FULL` on the near-capacity production database without a separate safe maintenance plan.

UI: EP003 workspace has a single official `#/ep003/full` player and old shot/WIP deep links redirect to that master. Other historical metadata and Git sources intentionally remain but should not be represented as playable old media.
