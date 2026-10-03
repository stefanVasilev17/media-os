# EP001 Memory Event — SHOT 08 User Database / User Data LOCKED

Date: 2026-10-03
Status: LOCKED

SHOT 08 — User Database / User Data
Planned timeline: 07:50–09:20

Locked narration:

07:50–08:03 — “That missing information lives in the User Database. The Auth Service sends its User Lookup here because this is where the system keeps the account data needed to understand who this login belongs to and whether that account can continue.”

08:03–08:17 — “The first group is User Data. Profile can contain the identity information connected to the account, while Settings can hold choices and account-specific configuration that change how that user should be treated.”

08:17–08:32 — “The database can also return the stored information needed to check the password. That does not mean sending the original plaintext password back to the Auth Service. The system only needs a stored representation that lets it answer whether what you entered matches what this account expects.”

08:32–08:46 — “Then we have Access Rights. A Role can describe the broader responsibility of the account — for example, a regular user or an administrator — while Scopes can describe more specific actions that account may be allowed to perform.”

08:46–08:57 — “Those access details do not decide whether the password is correct. They answer a different question: if this person is successfully identified, what should the system allow that identity to do afterward?”

08:57–09:09 — “Our map also keeps Session Management close to this account information. Create represents starting new remembered login state after a successful decision, while Refresh represents extending or replacing that state when the system allows it.”

09:09–09:20 — “Together, the User Database gives the Auth Service the facts it was missing: which account this is, whether the submitted secret can be accepted, what that identity may be allowed to do, and what account state should influence the journey next.”
