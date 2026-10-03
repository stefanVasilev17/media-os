# Global Script Explanation Standard — LOCKED

Date: 2026-10-03
Scope: All future Architectural Thinking videos
Status: LOCKED

The creator explicitly approved the narration/explanation structure developed in EP001 SHOT 02 and promoted it to a channel-wide script standard.

## Global narration rule

For every main object and every secondary object that becomes active in the Spline story:

1. Explain its role in plain language first.
2. Name the exact object/term as it appears in the current Spline diagram.
3. Explain what information the object contains or works with.
4. Give one or more concrete examples of that information when useful.
5. Explain why that information is needed and how it helps the next decision or next object in the journey.
6. End the explanation with a short integrating sentence that collapses the details back into a simple mental model for the viewer.

## Example pattern approved in EP001

For Request Assembly:
- Payload = the actual login information being sent.
- JSON / Form = examples of how that information can be structured.
- Headers = extra information that helps the receiving side handle the message.
- User-Agent = example information describing the client that sent it.
- Accept = example information describing what kind of response the client can understand.
- Request Context = information about the attempt itself.
- Timestamp = when it was created.
- Source = where it came from.
- Integrating takeaway: what are we sending, how should it be read, and what should the system know about this attempt?

## Style constraints

- Senior-level reasoning must come from causal depth, not jargon density.
- Do not speak in vague generic summaries when the active object contains meaningful information that can be explained concretely.
- Do not turn the narration into a glossary or protocol tutorial.
- Technical terms shown in the Spline diagram should be spoken when their object becomes active/focused, but must be explained in simple language.
- Background/dim objects do not need to be named until they participate in the story.
- Preserve exact planned spoken time ranges for every script segment.
- Prefer a slightly longer shot over rushing narration when the information needs more space.
- Use no more than three consecutive rhetorical repetitions; prefer two unless the third adds value.
- The standard applies to all future Architectural Thinking episodes unless explicitly overridden by a later creator decision.

## Production intent

The viewer should finish a segment able to answer three things:
- What is this object called?
- What information does it contain or use?
- Why does that information matter to the next step in the system?

This standard is now channel-wide and should be treated as a reusable script-generation rule for future MediaOS packages and agents.
