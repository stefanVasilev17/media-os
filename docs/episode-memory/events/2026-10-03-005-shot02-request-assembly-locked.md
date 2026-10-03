# EP001 Memory Event — SHOT 02 Request Assembly LOCKED

Date: 2026-10-03
Episode: EP001 — What Really Happens When You Click Login?
Status: LOCKED

The creator explicitly approved and LOCKED the revised SHOT 02 narration structure and timing.

## Locked shot

Title: `SHOT 02 — Request Assembly`
Timeline: `00:31–01:45`
Planned duration: `74 sec`

## Locked narration

`00:31–00:43`
“Before the app sends anything, it first Validates what you entered. That means checking whether the information needed for this login is present and usable. When that check passes, Submit moves the attempt from editing on the screen into the process of actually sending it.”

`00:43–00:53`
“That handoff starts Request Assembly — the step where separate pieces of information are turned into one message the rest of the system can understand.”

`00:53–01:07`
“The first piece is the Payload. This carries the actual login data, such as the identity you entered — for example your email — together with the password or secret you just provided. In our map, that data can be organized as JSON or Form data.”

`01:07–01:21`
“The message also gets Headers. These usually do not contain the main login data. Instead, they describe the message around it. A User-Agent can identify the kind of browser or app that sent it, while Accept can tell the system what kind of response that client knows how to handle.”

`01:21–01:34`
“Then we add Request Context. A Timestamp tells us when this login attempt was created, while Source helps describe where it came from — for example, which client or entry point started the request.”

`01:34–01:45`
“Together, these pieces answer three simple questions: what are we sending, how should it be read, and what should the system know about this attempt? By the end of Request Assembly, the login is no longer just a button click. It is a structured message ready to begin its journey through the system.”

## Locked global structure reinforced by this shot

For every main or secondary technical object in future Architectural Thinking videos, narration should follow this explanation sequence whenever relevant:

1. Explain the simple meaning first.
2. Name the exact visible term from the Spline diagram.
3. Explain what information the object contains or carries.
4. Give one concrete example.
5. Explain why that information matters to the next step.
6. Close with a short mental-model sentence that reconnects the details to the larger story.

This structure is now considered a global script standard, not just an EP001 preference.
