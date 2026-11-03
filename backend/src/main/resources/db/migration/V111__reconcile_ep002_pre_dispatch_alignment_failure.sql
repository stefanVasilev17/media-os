-- Reconcile ONLY the observed 2026-11-03 SHOT01 attempt that failed on
-- NoClassDefFoundError: org/reactivestreams/Publisher at
-- ElevenLabsForcedAlignmentService.java:66, in new MultipartBodyBuilder().
-- This happens before constructing/sending RestClient.post() at lines 70-75.
-- Evidence: Railway backend HTTP POST 2026-11-03T11:37:21Z and deploy stack.
-- Preserve the historical request and its actor; do NOT delete or auto-retry it.
-- Any new paid call still requires separate explicit Director confirmation.
alter table ep002_creative_alignment_request
    drop constraint if exists ep002_creative_alignment_request_status_check;

alter table ep002_creative_alignment_request
    add constraint ep002_creative_alignment_request_status_check
    check(status in ('IN_FLIGHT','COMPLETED','UNCERTAIN','NOT_SENT'));

do $$
declare matching_requests integer;
begin
    select count(*) into matching_requests
    from ep002_creative_alignment_request r
    join ep002_creative_voice_take t on t.id=r.take_id
    where r.shot_key='SHOT01'
      and r.status='IN_FLIGHT'
      and r.started_at>=timestamptz '2026-11-03 11:37:19+00'
      and r.started_at<timestamptz '2026-11-03 11:37:23+00'
      and t.elevenlabs_alignment is null;

    if matching_requests>1 then
        raise exception 'More than one matching pre-dispatch request; manual audit required.';
    end if;

    update ep002_creative_alignment_request r
    set status='NOT_SENT',
        completed_at=now(),
        failure_reason='LOCAL_MULTIPART_CLASSLOAD_BEFORE_HTTP'
    where r.shot_key='SHOT01'
      and r.status='IN_FLIGHT'
      and r.started_at>=timestamptz '2026-11-03 11:37:19+00'
      and r.started_at<timestamptz '2026-11-03 11:37:23+00'
      and exists (
        select 1 from ep002_creative_voice_take t
        where t.id=r.take_id and t.elevenlabs_alignment is null
      );
end $$;
