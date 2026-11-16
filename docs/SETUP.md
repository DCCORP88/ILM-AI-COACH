# Setup Guide: Beauty Business Coach (prototype)

**Status:** working local prototype, 16 Nov 2026. Not deployed, no payments, and coaching content is still in draft.

## What's built
| Area | What works now |
|---|---|
| Accounts | Sign up, log in, log out, 30-day secure session cookie, hashed passwords. Each account owns one business. |
| Data isolation | Every query is scoped to the signed-in business (`src/lib/data.ts`). Tested: another business's projects, tasks, resources and numbers can't be read, edited, attached to or deleted, including by changing IDs in URLs. |
| Onboarding & profile | Pathway (solo / educator / salon), stage, services and prices, location and jurisdiction, capacity, hours, budget, 90-day goal. Editable at any time. |
| **My numbers** | Owners lodge 26 defined numbers per period (revenue collected/booked, visits, new/returning, rebook rate, no-shows, enquiries, retail, reviews, referrals, loyalty, email, Meta ads, students…). The app calculates average spend, profit, rebook rate, utilisation, retail share, enquiry conversion, cost per new client, CTR/CPC/CPL, and shows each formula. Missing data shows "Add data" or "Not enough data", never zero. Re-entering a period updates it instead of duplicating it. |
| **My program** | Step-by-step activities per pathway, each linked to a tool, a project and the numbers that show the result. Training progress is tracked separately from business results. |
| **Projects** | Separate workspaces with their own coach chat, goals (baseline → target → logged results with a progress bar), action plan (tasks with due dates and recorded outcomes), decisions, summary, next step, project-only budget, "resume where you left off", search/filter, complete/archive/reopen, and Markdown export. |
| **Coach** | Server-side Claude API (`claude-opus-5-5`). Each request loads COACH_INSTRUCTIONS.md plus up to 3 relevant workflow files (chosen by project category and message), the business profile, the lodged numbers with calculated metrics, and the project's goals, tasks and decisions. Answers end with a Next action and a Measure. The owner saves answers as tasks, decisions or resources. Shows which coaching files were used. **Demo mode** (no API key) gives a clearly labelled placeholder answer. |
| **Project intake & tailored plan** | A new project opens with 5–9 questions for its type (`src/lib/intake.ts`), pre-filled from lodged numbers. The coach turns the answers into a plan: diagnosis, assumptions, missing info, goals and week-by-week tasks (structured output). The owner reviews it, edits targets, ticks what to keep, and adds it to the project. Goal baselines always come from the owner's own numbers or answers, never from the AI. Demo mode uses the playbook template. |
| **Your next step** | The dashboard and My program always show ONE next action with one button (`src/lib/nextstep.ts`): onboarding → numbers → review plan → answer questions → overdue task → weekly check-in → monthly numbers → next task or activity. Plus a 4-stage "How the program works" guide. |
| **Accountability reminders** | Profile & reminders page: opt-in email and/or text, weekly or twice weekly on a chosen day, overdue alerts, recorded consent, stop any time. Each reminder contains the customer's next step and a link. `npm run reminders` (daily on the host) sends due reminders. Without provider keys (Resend for email, Twilio for SMS) reminders are saved as previews and **nothing is sent**. |
| **Business at a glance** | Dashboard section 3: Shopify-style KPI cards (revenue, visits, new clients, rebook rate, average spend, retail) with ▲/▼ vs the previous equal period and 12-month trend lines; period picker (latest month, 3/6/12 months, all time); monthly bar chart with a table view. Money and counts are summed, rates recalculated from totals (`src/lib/trends.ts`). |
| **Planner** | Profile → "Connect your planner": a private, read-only calendar link (iCalendar feed) with tasks on their due dates and a weekly check-in. Works with Apple Calendar/Outlook; Google Calendar needs the app online. Link can be reset or disconnected. |
| **Community** | In-app members' feed: join with a display name and guidelines, post (wins, questions, marketing, educators, general), comment, like, report. Moderators (`ADMIN_EMAILS`) pin, hide, resolve reports and pause members. Limits: 10 posts and 50 comments per day. Only display names are shown; the coach never reads community posts. Optional `COMMUNITY_EXTERNAL_URL` links an outside group (Facebook, Skool). |
| **Ask the coach** | Free-form chat page for any business question. It still reads the business profile and lodged numbers, keeps a list of previous chats, and any chat can be turned into a tracked project (conversation kept). |
| **Marketing** | Marketing numbers dashboard plus quick-start projects: local salon marketing, loyalty & referral, content & offer message, email, Meta ads plan, aftercare retail. New playbooks: `coaching/workflows/local-salon-marketing.md`, `loyalty-programs.md`, `digital-marketing.md`. Nothing is ever posted, sent or spent. |
| Tools | Pricing worksheet (incl. GST option), revenue goal calculator, rebooking scenario, ad metrics, all calculated in code with formulas shown and safe handling of zero or missing inputs. |
| Resources | Saved scripts, SOPs, campaigns and drafts with version history, status (draft / approved / used outside the app) and .md download. |
| Weekly check-in | Completed work (prefilled from ticked tasks), blockers, numbers, and top 3 priorities, which become this week's tasks. |
| Dashboard | This week's priorities and overdue tasks, check-in reminder, program progress, business snapshot vs the previous period with sources and dates, stale-data warning, and active projects. |
| Privacy | Full data export (JSON) and permanent account deletion. The coach is told not to collect client health or contact details. |

## Run it on your Mac
Requires Node.js 20+ (this Mac has Node 24).

```bash
cd "/Users/deannacampese/ai Beauty Business Coach"
```

```bash
npm install
```

```bash
npx prisma db push
```

```bash
npx tsx prisma/seed.ts
```

```bash
npm run dev
```

Open http://localhost:3000. The demo login is `demo@example.test` / `demo-password-123` (synthetic data, badged "Demo data"). You can also create your own account.

Run the tests:

```bash
npm test
```

## Switch the real AI coach on
1. Create an account at https://platform.claude.com, which you control. A Claude.ai subscription doesn't cover app usage; the API is billed separately per use.
2. Create an API key and set a monthly spend limit in the Console.
3. Open the `.env` file in the project folder and paste the key after `ANTHROPIC_API_KEY=`. Never put the key in chat, email or any other file.
4. Restart the app. The sidebar badge "Coach: demo mode" disappears.

## Files that matter
- `coaching/manifest.json`: which coaching files the app may load, and their status. In production set `COACH_CONTENT_LEVEL="approved"` and mark files `approved` only after Deanna signs them off.
- `src/lib/metrics.ts`: number definitions and formulas. `src/lib/calc.ts`: calculators. `src/lib/program.ts`: program activities.
- `src/lib/coach.ts`: how each coach request is assembled.
- `src/lib/data.ts`: the only place business data is queried (tenant isolation).

## Services needed for production (owner-controlled accounts)
| Service | Why | Notes |
|---|---|---|
| Anthropic (Claude API) | The AI coach | Set spend limits; costs depend on usage. |
| Supabase (or another Postgres host) | Database, private file storage, auth (optional) | Switch `provider` in `prisma/schema.prisma` to `postgresql`; choose an Australian region. |
| Vercel (or similar) | Hosting | Protect preview deployments. |
| Stripe | Subscriptions | Test mode first; access controlled by signed webhooks. |
| GitHub (private repo) | Source and version history | Keep `.env` out (already in `.gitignore`). |
| Email provider (e.g. Resend/Postmark) | Password reset and billing emails | Not built yet. |

See `docs/LAUNCH_BLOCKERS.md` for what's still needed before real customers.
