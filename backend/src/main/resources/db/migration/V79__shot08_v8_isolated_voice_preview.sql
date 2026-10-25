CREATE TABLE shot08_v8_voice_preview (
    segment_number INTEGER PRIMARY KEY CHECK (segment_number BETWEEN 1 AND 3),
    narration TEXT NOT NULL,
    generated_audio BYTEA NOT NULL,
    audio_content_type TEXT NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL CHECK (duration_seconds > 0),
    alignment JSONB NOT NULL,
    voice_model_id TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
