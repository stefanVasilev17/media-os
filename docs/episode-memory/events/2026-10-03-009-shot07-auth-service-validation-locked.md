# EP001 Creator Memory Event — SHOT 07 LOCKED

Date: 2026-10-03
Status: LOCKED
Scope: EP001 script narration

Locked shot:
- SHOT 07 — Auth Service / Validation Steps
- Planned timeline: 06:25–07:50

Canonical narration:

06:25–06:38 — “The selected destination is the Auth Service — the part of the system responsible for deciding whether this login attempt can move toward a successful sign-in. But it cannot make that decision from the password alone.”

06:38–06:51 — “First it goes through Validation Steps. These checks help the Auth Service understand what kind of authentication information arrived, whether it can be used, and what still needs to be looked up before a decision is possible.”

06:51–07:05 — “One of those checks is Token Status. If the request carries an older proof from a previous login, the system can see whether it is Expired — meaning its allowed time has ended — or Revoked, meaning the system deliberately stopped trusting it.”

07:05–07:16 — “For a fresh login like ours, the Auth Service still needs to identify the account behind the credentials. That starts a User Lookup.”

07:16–07:29 — “The lookup needs something that identifies the account. That may be a User ID, when the system already knows an internal identifier, or a Username such as the email or account name the person entered.”

07:29–07:40 — “The important point is that the Auth Service does not yet have all the facts it needs. It knows what decision it is responsible for, but the account information itself lives somewhere else.”

07:40–07:50 — “Together, these Validation Steps answer three questions: is there an older proof we can still trust, which account are we talking about, and what information do we still need before we can decide?”

This shot supersedes any earlier draft for the same timeline and content area.