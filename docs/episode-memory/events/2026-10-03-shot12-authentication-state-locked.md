# EP001 — SHOT 12 LOCK

Status: LOCKED

Shot: SHOT 12 — Authentication State / Session Creation
Timeline: 14:10–15:45

Canonical narration:

14:10–14:25 — “The Auth Service has accepted the login, but now that decision has to survive beyond this single request. That is the job of Authentication State — turning a successful check into proof the system can recognize again later.”

14:25–14:42 — “Inside Session Creation, different systems can represent that proof in different ways. One design may create a Session ID, a unique reference that points back to remembered login state. Another may issue a Token, such as a JSON Web Token — JWT, that carries enough trusted information for later requests to prove who the user is.”

14:42–14:54 — “Whichever form is used, that trust should not last forever. A TTL — Time To Live — gives it a lifetime, so the system knows when this remembered authentication should stop being accepted and the person needs to prove themselves again.”

14:54–15:09 — “Now that proof has to make its way back to the app. In a browser-based flow, it may travel inside a Cookie, and a Set-Cookie instruction in the response tells the browser to store it so it can be included automatically when the next request is made.”

15:09–15:23 — “At the same time, Response Prep gets the successful answer ready for the return journey. It may include the User Data the screen needs immediately — perhaps the user’s name or basic profile information — without sending the entire account record back.”

15:23–15:35 — “It can also include a Redirect, telling the app where the successful journey should continue — for example, away from the Login screen and toward the authenticated part of the product.”

15:35–15:45 — “And this is the real transformation: the password was used to prove the login once; Authentication State creates the proof that future requests can use instead.”

Notes:
- Use full expansion “JSON Web Token — JWT” on first mention.
- Preserve story-first narration. Technical terms should appear naturally inside the story, not as glossary definitions.
