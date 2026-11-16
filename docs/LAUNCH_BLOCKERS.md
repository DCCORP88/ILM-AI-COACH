# Launch Blockers and Next Stages

**As of 16 Nov 2026.** The prototype runs locally with synthetic data. These items must be done before paying customers use it.

## Must fix before a private pilot (real users)
1. **Deanna's content review.** COACH_INSTRUCTIONS.md, the 8 workflow playbooks and the program activities are drafts. Mark each `approved` in `coaching/manifest.json` only after review. Use the open review list at the end of COACH_INSTRUCTIONS.md.
2. **Live Claude API key** in `.env` with a spend limit, then test real coach answers against the acceptance checks (asks for missing numbers, doesn't repeat known answers, ends with a next action and a measure).
3. **Hosting + database:** move to Postgres (e.g. Supabase, Australian region), deploy to a protected staging URL, set up backups.
4. **Password reset and email verification** (needs an email provider).
5. **Rate limiting** on login, sign-up and the coach (cost and abuse control), plus per-account monthly coach usage limits.
6. **Privacy policy and terms** that accurately describe the third-party processing (Anthropic, host, database). They need legal review.
7. **Reminder sending:** create a Resend account (verified sending domain, e.g. a coach.internationallashmasters.com address) and/or a Twilio account (Australian SMS needs a registered sender ID or number), add the keys to the host's environment, and schedule `npm run reminders` daily. Confirm the opt-out wording meets the Spam Act 2003.
8. **Community before launch:** community guidelines and terms reviewed, a moderator plan (who checks reports and how often), and email alerts to moderators for new reports (not built yet).
9. **Monitoring and error logging** that avoids logging personal content.

## Must fix before paid launch
8. **Stripe billing in test mode → live:** checkout, signed webhooks, an entitlement table, and access checked on the server for every page. Test purchase, renewal, failed payment, cancellation, duplicate events, and grace or expiry rules.
9. **Commercial decisions (Deanna):** brand/name, price, subscription vs fixed term, included AI usage, trial/refund/cancellation terms, support boundaries.
10. **Final curriculum** to replace the draft program activities and populate "My training".
11. **Security review** (dependency audit; `npm audit` currently reports issues to check) and a full test of the purchase and account journey.

## Planned next build stages (not built yet)
- Report uploads (CSV from Fresha, Xero, Ads Manager) with column mapping, duplicate-import protection and conflicting-period warnings. Today, numbers are typed in manually.
- Campaign planner and course builder as structured tools (today they run through projects, the coach and resources).
- Moving a saved answer or resource between projects, and project duplication.
- Content calendar, reminders, and read-only integrations (Fresha, Xero, Meta, email platform) after their APIs and permissions are checked. No integration is implemented or shown as working yet.
- Brand design (see the design question in the build notes).

## Known limitations
- Coach replies arrive in one piece (no live typing), and can take up to a minute.
- One user per business. Staff logins are not supported.
- Currency is shown as AUD.
- Workflow selection uses keywords and project category. Retrieval or search can be added when content volume grows.
