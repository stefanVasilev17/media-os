# EP001 Creator Workflow Correction — Direct Next Script

Date: 2026-10-03
Status: ACTIVE

The creator explicitly changed the collaboration flow for script approvals and corrections.

## New interaction rule

- When the creator writes `LOCK`, `LOCKED`, or otherwise approves the current shot, do not summarize what was stored, changed, or committed.
- Immediately present the next shot script.
- When the creator gives a correction, do not explain the correction process or restate implementation notes unless explicitly asked.
- Immediately present the corrected version of the current shot script.
- Memory events and repository updates may still be performed silently in the background, but user-facing responses should stay focused on the script itself.

This rule applies to EP001 and should be used as the default collaboration behavior for future script development in Architectural Thinking unless explicitly overridden.
