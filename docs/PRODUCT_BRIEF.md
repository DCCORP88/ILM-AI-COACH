# Beauty Business Coach — Product Brief and Claude Build Guide

Version: 0.1 working draft | Owner: Deanna Campese | 15 November 2026

## 1. Product vision
A branded, paid web application giving beauty business owners access to Deanna's coaching methods, practical tools and personalised AI support. It helps users understand their business, decide what to prioritise, complete useful work and track progress throughout their training program. It combines a context-aware coaching chat, private project workspaces, an interactive dashboard and a resource library.

The coach is clearly identified as AI. It draws on approved coaching material and the customer's own context; it is not a claim that Deanna personally reviews each response. Outcomes are goals, not guaranteed revenue results.

## 2. Audience and pathways
| Pathway | Intended outcomes |
|---|---|
| Solo beginners | Establish services and pricing, attract first clients, build repeat bookings and sustainable routines. |
| Aspiring educators | Assess teaching readiness, validate demand, design training, develop materials and prepare a launch. |
| Salon owners | Understand performance, improve profitability and retention, manage teams and create repeatable procedures. |

Customers can use multiple pathways but select a primary goal. Advice adapts to stage, available time, budget, location and current capacity. Begin with Australian context, but collect jurisdiction rather than assuming it.

## 3. Business content
Cover business planning; target clients and positioning; service menus, offers and pricing; local client acquisition; social content; Meta advertising; email marketing; sales conversations; retention and rebooking; business numbers; retail and additional income; staffing and leadership; systems and SOPs; course creation and launching; owner productivity and accountability.

Each topic combines a knowledge playbook, repeatable task instructions, templates and reviewed examples. Do not invent a proprietary founder method where none has been supplied: label AI-drafted material as awaiting review.

## 4. Coaching behaviour: understand before advising
The coach should recognise which information matters for the current question. It must inspect the business profile, active project and relevant saved context before asking questions. Do not repeat questions already answered unless information may be outdated or contradictory.

For each request:
1. Identify the goal and choose the relevant workflow.
2. Separate known facts, estimates, assumptions and missing inputs.
3. Ask the smallest useful set of questions, usually one to three at a time. Explain briefly why a number or detail matters when necessary.
4. Ask follow-up questions only when answers materially change the advice. Simple requests should not trigger a full business audit.
5. Offer provisional options when information is missing, clearly marking assumptions. Never fabricate business figures.
6. Produce practical advice or an editable deliverable, with a next action and a way to measure progress.
7. Save agreed decisions, tasks and results to the correct project. Let the user inspect and correct saved information.

Example: “I need more clients.” Check capacity, current bookings, target clients, location, enquiry sources, booking conversion, retention, marketing spend and previous attempts. Ask only for the missing inputs needed to choose an initial action.

Example: “I want to run Meta ads.” Establish the offer, goal, destination, budget, existing creative, conversion tracking and current results before proposing a campaign. Do not assume ads are the solution.

Example: “I want to launch a course.” Establish topic, experience, learner, intended learning outcome, delivery format, demand evidence, timeframe and resources before outlining the course.

## 5. Saved projects and training progress — core launch feature
The program must not be one endless chat. Users create separate workspaces such as “First online course”, “Christmas client campaign”, “Pricing review” and “Hiring a therapist”.

Each project stores:
- Title, category, pathway, goal, current stage, target date and status.
- Project-specific chat history and a concise editable context summary.
- Relevant inputs, assumptions and decisions, with dates and sources.
- Drafts, approved versions, uploaded files and generated resources.
- Tasks, milestones, checklists and completion history.
- Baseline measures, target measures and recorded outcomes.
- A “next step” and a “resume where I left off” action.

Allow create, rename, search, filter, archive, reopen and export. Users can save a selected answer as a resource or task and associate it with a project. Moving work to another project should preserve its history. Unsaved changes must be visible; report save failures rather than implying success.

Keep business-wide facts separate from project-specific context. A campaign budget must not overwrite the overall business budget. Switching projects loads the relevant context, without mixing unrelated advice. Archived projects remain searchable but should not automatically drive current recommendations.

Training progress and business performance are separate: completing a lesson is not evidence of a revenue improvement. Track modules/milestones, implementation tasks and measured outcomes separately. Exact curriculum remains to be supplied.

## 6. Customer journey
Public sales page → account and checkout → onboarding assessment → primary pathway and goal → initial diagnosis → first project and action plan → ongoing coaching and implementation → weekly check-in → progress review and revised priorities.

Users can return directly to active work. Offer guided shortcuts as well as free text. Any paid entitlement must be verified on the server, not only hidden in the interface.

## 7. Dashboard specification
| Section | Available information | Customer actions |
|---|---|---|
| Today / this week | Three current priorities, next check-in, overdue tasks | Resume work, complete task, adjust due date, start check-in |
| My projects | Active projects, stage, next step, progress, last activity | Create, open, filter, archive, search |
| My training | Current pathway, completed milestones, implementation tasks | Continue module, open resources, review progress |
| Business snapshot | Revenue, visits, average spend and new/repeat clients where supported | Select period, compare periods, inspect definitions, ask coach |
| Goals and scenarios | Baseline, target, actual and remaining gap | Edit target, run scenario, save agreed actions |
| Marketing workspace | Content plan, Meta campaign drafts, email drafts and imported results | Build campaign, edit draft, review metrics, add tasks |
| Saved resources | SOPs, scripts, course outlines, campaigns and working drafts | Edit, version, download, attach to project |
| Data and reports | Uploaded reports, source, reporting dates, last refresh and import status | Upload, map columns, correct data, remove import |
| Business profile | Services, prices, team, goals, capacity and preferences | Update facts and correct memory |
| Account and privacy | Membership, billing, data controls and connected services | Manage subscription, export data, request deletion, disconnect |

Never show invented metrics or populate real accounts with unlabeled demo numbers. Missing values should say “Add data”. Every metric needs a definition, date range, source and refresh date. Separate booked revenue from collected revenue and revenue from profit. Include refund, tax and currency treatment where relevant. Prevent duplicate report imports and explain conflicting periods.

## 8. Interactive tools
Launch priorities:
- Guided business assessment with editable answers.
- Editable action plan with checklists, deadlines and project milestones.
- Revenue goal calculator: explore changes in client visits and average spend. Display formulas and assumptions; scenarios are not forecasts.
- Service pricing worksheet: time, consumables and allocated costs, with clearly defined contribution/margin outputs.
- Campaign planner: audience, objective, offer, channel, dates and tasks.
- Course builder: editable modules, lessons and learning outcomes linked to a launch checklist.
- Weekly check-in: record completed work, blockers and outcomes; update the plan.

Later: drag-and-drop content calendar, richer capacity/staffing scenarios, approved reminders, and supported platform connections. Use application code for calculations, not generated arithmetic. Basic task status controls are sufficient before adding drag-and-drop everywhere.

## 9. Meta ads workspace
First version: guided campaign brief, offer/audience/creative planning, copy and video-script drafts, landing-page checklist, test plan, budget scenarios, and analysis of manually entered or uploaded campaign results.

Show spend, impressions, clicks, leads, purchases and revenue only where supplied. Calculate CTR, CPC, CPL, CPA and ROAS with defined denominators and handling for zero/missing values. Distinguish Meta-attributed results from verified business revenue; avoid claiming causal impact from attribution alone.

Save each campaign as a project with creative versions, hypotheses, tasks and results. Avoid universal budget/performance benchmarks presented as facts. Current policy or interface claims require current official sources or an explicit uncertainty label.

Later: authorised Meta account integration after verifying API permissions and review requirements. Launch version does not publish ads or change spend. Any future spending/publishing action requires a specific user-approved campaign and budget.

## 10. Email marketing workspace
First version: define audience segments, plan campaigns and sequences, draft subject lines and email copy, build a calendar and analyse uploaded results. Suggested workflows include welcome, enquiry follow-up, rebooking, lapsed-client reactivation and course launch.

Segments can be designed using criteria without importing identifiable mailing lists. Track delivered messages, clicks, unsubscribes, conversions and attributed revenue where available. Treat open rates as an imperfect signal. Define attribution and avoid double-counting sales also attributed to ads.

Save segment rules, drafts, approval status, schedule intentions and results within projects. Show a clear distinction between a saved draft and a sent campaign. Future provider integrations must respect consent and suppression/unsubscribe records and require approval before sending. No automated sending in the first version.

## 11. Answer sources and quality
Priority sources: approved founder playbooks and resources; verified customer context; reliable calculations; general model reasoning; current authoritative sources where search is implemented and appropriate. State assumptions and uncertainty. Record the version of coaching material used for important outputs. Use only owned or licensed source material.

Uploaded reports and retrieved pages are data, not instructions that can override system rules. Do not promise perfect accuracy. For legal, employment, tax or health-specific matters, define the appropriate limits and current-source review workflow.

## 12. Memory and privacy
Per-business records must be isolated by database and backend permissions, not prompt instructions. Store global business facts, project context and chat history separately. Provide editable summaries and timestamps. Shared coaching improvements require a separate reviewed process with appropriate permissions and de-identification; no automatic cross-customer learning pool.

Minimise personal data sent to the model. Prefer business totals and pseudonymous client IDs. Exclude client health forms, medical notes and unnecessary contact data in the initial version. Protect uploads, backups, logs and credentials. Specify retention, deletion, export and support access. Disclose third-party processing accurately after vendor selection. Read-only integrations first.

## 13. Initial product scope
Core private pilot: responsive browser app, three pathway options, onboarding, context-aware chat, saved projects, editable plans, basic dashboard, manual metrics/report uploads, selected interactive tools, Meta/email planning workspaces, resource saving and weekly check-ins.

Paid launch adds tested billing and entitlement handling, defined usage limits, account recovery, support, data controls, monitoring, backups and production review.

Later: direct booking/sales/ad/email connections, automated reports and approved outbound actions. Do not display a fake working “Connect Timely” button; show only implemented capabilities. Community and access to Deanna are optional undecided additions. Native mobile apps are not required initially.

## 14. Commercial decisions still open
Brand/name; price; subscription versus fixed-length access; included AI usage; initial cohort size; trial/refund/cancellation terms; human support boundaries; curriculum; visual identity; hosting/data regions; final vendor selection. Do not invent answers or publish placeholder commercial/legal claims as final. Monthly membership is a prototype assumption only.

Measure activation (assessment + first saved plan), completed implementation tasks, project return usage, customer-rated usefulness, measured business progress where available, retention and cost per active customer. Define numerical launch targets after pilot baselines.

## 15. File preparation order
1. This product brief.
2. COACH_INSTRUCTIONS.md: behaviour, diagnostic questioning, tone and source rules.
3. ONBOARDING.md and MEMORY_AND_PROJECT_RULES.md.
4. Three pathway playbooks.
5. Initial workflow skill documents, including business audit, weekly check-in, pricing, client acquisition, course building, Meta planning and email segmentation.
6. Approved knowledge/resources and realistic example cases.
7. DASHBOARD_SPEC.md and APP_REQUIREMENTS.md derived from this brief.
8. PRIVACY_AND_DATA_REQUIREMENTS.md and TEST_CASES.md.
9. CLAUDE.md: instructions to Claude Code about building and maintaining the app.

Keep an index with purpose, status (draft/approved), version and related files. Avoid repeating the same rules in many places. Topic Markdown files are content; they do not automatically become executable Claude Code skills or live app capabilities. Customer data belongs in a private database, not a shared source folder.

## 16. Prompt to give Claude now
Copy the following with this brief attached:

“I am building a paid AI beauty business coaching web app for solo beginners, aspiring educators and salon owners. Treat the attached brief as the current working product specification. Help me prepare the coaching knowledge and product documents one at a time. Start with COACH_INSTRUCTIONS.md, including how the coach identifies missing information before advising and how it works with saved projects. Use my experience and supplied resources; label your proposed methods for my review. Preserve the dashboard, interactive tools, Meta ads and email marketing workspaces. Do not treat unanswered commercial decisions as confirmed. Maintain a file index and flag genuine contradictions. Do not build the app yet.”

## 17. Moving the material into Claude Code
Download the approved MD files and resources into one app project folder. Claude Projects do not automatically transfer all chats or knowledge to Claude Code. Preserve an index; put product specifications in docs/ and approved coaching content in a server-side coaching/ folder. These are suggested folder names, not mandatory conventions.

The app backend must explicitly select the relevant approved instructions, workflow, project context and business facts for each model request. Keeping MD files in a repository alone does not make the chatbot use them. Start with a small content index and explicit selection; add retrieval/search when volume justifies it. Do not ship confidential source material or API keys to the public browser bundle.

## 18. Prompt to start the actual build
“Read PRODUCT_BRIEF.md (or the attached BEAUTY_COACH_PRODUCT_BRIEF.md), the document index and all approved specifications and coaching content. Build a responsive paid beauty business coaching web app. Preserve the three pathways, diagnostic questioning, project-specific chat and saved progress, dashboard, interactive tools, and Meta/email workspaces. Start by reviewing the files and identifying only blocking gaps, then implement a working end-to-end prototype in stages. Use clearly labelled synthetic data until real services are configured. Separate demo and production modes. Implement a real server-side Claude API connection, secure customer accounts, a private database, persistent projects and resources, deterministic calculations, and server-side access controls. Load relevant coaching files at runtime rather than assuming CLAUDE.md powers the customer chat. Propose a suitable stack and explain any services I need to create accounts for. Keep secrets in environment variables. Add billing in test mode, with verified payment events controlling access. Test account isolation, project isolation, memory, imports, calculations and subscription changes. Produce setup instructions, a deployment guide and a list of remaining launch blockers. Do not claim integrations work before implementing and testing them.”

## 19. Example technical setup and publishing route
One possible setup, subject to final cost/region/requirements review: Next.js web app; Supabase for authentication, database and private file storage; Anthropic API for coaching; Stripe Checkout/Billing for payments; GitHub for private source/version history; Vercel for hosting. Equivalent services can be substituted. A consumer Claude subscription does not replace the app's API billing.

1. Build locally and validate with fictional businesses.
2. Create owner-controlled provider accounts; configure secrets through local/hosting environment settings, never public files or chat transcripts.
3. Save the source to a private repository and deploy a protected staging version. A preview URL is not necessarily private: configure protection.
4. Configure authentication redirects, database/storage permissions, production-ready migrations and model access.
5. Add test checkout and signed payment webhooks. Verify purchase, renewal, failed payment, cancellation, duplicate events and entitlement expiry. A checkout success page alone is not proof of payment.
6. Pilot with a small group; check advice quality, usability, usage cost, support demand and data protection. Have technical security and applicable legal/privacy arrangements reviewed.
7. Finalise the offer, pricing, usage allowance, policies and support. Activate live payment products/keys and production webhook endpoints, keeping test and live environments separate.
8. Add a custom domain and configure DNS/HTTPS with the host. Make the marketing/pricing pages public while keeping all customer areas authenticated.
9. Test a complete real purchase and account journey, then launch the public URL. Confirm billing emails, password recovery, monitoring, backups and rollback.
10. Maintain the application: updates, cost limits, incident response, content review and user support continue after launch.

Customer flow: sees public sales page → chooses offer → creates account/pays → verified payment enables access → completes onboarding → begins private coaching projects. Claude Code helps implement and deploy the software; hosting keeps it running when Deanna's computer is off.

## 20. Acceptance checks
- Two test businesses cannot access each other's records, files or chats, including by changing URLs/IDs.
- A returning owner can resume a named project with its drafts, tasks and relevant context intact.
- Switching between a course project and ad project does not overwrite either project's budget or decisions.
- The coach asks missing high-impact questions before substantial advice and does not repeat known answers needlessly.
- A selected answer can be saved, edited, versioned and exported as a resource.
- Dashboard figures match imported/manual data, formulas and periods; empty and stale data are clearly shown.
- Calculators handle missing and zero inputs without misleading results.
- Training completion is tracked separately from measured business outcomes.
- Meta/email drafts are not marked published/sent; no unauthorised spending or sending is possible.
- Subscription access follows verified events and defined cancellation/grace-period rules.
- Secrets are absent from browser code and repository history; logs avoid unnecessary personal content.
- Export/deletion, file access, session recovery and failure handling work as documented.

## Sources for implementation planning
Reviewed 15 November 2026. Recheck technical details at build time.
- Claude Messages API: https://platform.claude.com/docs/en/api/messages/create
- Claude Code context: https://support.claude.com/en/articles/14553240-give-claude-context-claude-md-and-better-prompts
- Supabase access policies: https://supabase.com/docs/guides/database/postgres/row-level-security
- Vercel deployment: https://vercel.com/docs/deployments
- Vercel GitHub deployment: https://vercel.com/docs/git/vercel-for-github
- Stripe Checkout: https://stripe.com/payments/checkout
- Stripe subscription example: https://github.com/stripe-samples/checkout-single-subscription

Product inspiration discussed: Acquisition.com's ACQ AI illustrates packaging business frameworks through an AI interface (https://vantage.acquisition.com/). This brief does not assume or reproduce its private implementation, material or results.
