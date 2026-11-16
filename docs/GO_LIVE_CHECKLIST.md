# Go-Live Checklist: Friends & Beta Testers

Goal: the coach running at **coach.internationallashmasters.com** (or your chosen name), invite-only, for a small group of friends to test.
Tick each box as you go. **You** = Deanna, **Claude** = done in this project.

---

## Stage 1: Decisions (5 minutes) — You
- [ ] Choose the address: `coach.` / `app.` / `business.` + internationallashmasters.com
- [ ] Choose an invite code for friends (e.g. a word only they'll get)
- [ ] Check where your domain is managed: **Shopify admin → Settings → Domains**. Does it say "Managed by Shopify" or another provider (GoDaddy, Crazy Domains…)?

## Stage 2: Prepare the app for the internet — Claude
- [ ] Switch from the test database (a file on this Mac) to an online database
- [ ] Add the invite code to sign-up, so only people you invite can join
- [ ] Add daily limits on coach questions per person (protects your Claude bill)
- [ ] Re-run all tests

## Stage 3: Create three free accounts — You (with Claude guiding)
Use your business email. Never paste passwords or keys into the chat.
- [ ] **GitHub** (github.com): stores the app's code privately
- [ ] **Supabase** (supabase.com): the online database. Create a project in the **Sydney** region and save the database password somewhere safe (e.g. your password manager)
- [ ] **Vercel** (vercel.com): hosts the app. Sign up **with your GitHub account**

## Stage 4: Connect everything — You + Claude
- [ ] Claude saves the code to your private GitHub
- [ ] In Vercel: **Add New → Project →** pick the repository (Claude tells you each click)
- [ ] In Vercel's **Environment Variables**, paste your private settings (Claude gives you the list of names. You paste the values, which never go in chat):
  - database connection (from Supabase)
  - Claude API key (make a **new** key named "ILM coach – live")
  - invite code, app address, admin email
- [ ] Deploy. Vercel gives you a temporary address (…vercel.app)
- [ ] Claude sets up the database tables on Supabase and tests the temporary address

## Stage 5: Your own address — You (with Claude guiding)
- [ ] In Vercel: **Project → Settings → Domains →** add `coach.internationallashmasters.com`. Vercel shows one "CNAME" setting
- [ ] In **Shopify → Settings → Domains → (your domain) → DNS settings** (or your domain provider): add that CNAME
- [ ] Wait 5–60 minutes. The padlock (https) appears automatically
- [ ] Claude checks the address works end to end

## Stage 6: Safety checks before inviting anyone — You + Claude
- [ ] In the Claude Console: set a **monthly spend limit** (e.g. $50 to start)
- [ ] Create your own account on the live site and try: onboarding, numbers, start an activity, build a plan, chat, community
- [ ] Make your account the Community moderator (your email is set as admin)

## Stage 7: Invite friends — You
- [ ] Send the link + invite code, with a short note: "It's a test version. The coach is AI. Please tell me what's confusing."
- [ ] Optional: add a "Business Coach" link to your Shopify menu (**Online Store → Navigation**)
- [ ] Collect feedback. Claude updates the app, and changes go live automatically within minutes

---

### Known limits for the friends test
- No password reset yet (you can reset a password for someone if needed)
- Coaching content is still draft
- Reminder emails/texts are preview-only until Omnisend is connected
- No payments: the app is free for testers
