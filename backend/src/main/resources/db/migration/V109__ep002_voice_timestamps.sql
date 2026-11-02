alter table ep002_creative_voice_take
    add column if not exists elevenlabs_alignment jsonb;

comment on column ep002_creative_voice_take.elevenlabs_alignment is
    'Original ElevenLabs with-timestamps alignment and normalized_alignment for THIS immutable saved take. Older recordings have NULL: never invent cue times.';
