// The pathway program: activities owners complete, each tied to a tool and a number to track.
// Built from Deanna's methods (coaching/workflows + source notes). DRAFT until Deanna approves,
// and to be replaced by her final curriculum. Training progress is tracked separately from results.

export type Pathway = "solo" | "educator" | "salon";

export const PATHWAYS: Record<Pathway, { label: string; description: string }> = {
  solo: { label: "Solo beginner", description: "Set up services and prices, attract first clients, build repeat bookings and sustainable routines." },
  educator: { label: "Aspiring educator", description: "Check readiness, validate demand, design and price a course, build materials and launch." },
  salon: { label: "Salon owner", description: "Understand your numbers, improve profit and retention, lead a team and build repeatable systems." },
};

export type ProgramStepDef = {
  key: string;
  pathways: Pathway[];
  module: string;
  title: string;
  activity: string;          // the concrete thing to do
  measure: string[];         // metric keys that show the result
  tool?: { label: string; href: string };
  projectCategory?: string;  // suggested project to start for this step
};

export const PROGRAM: ProgramStepDef[] = [
  // Foundations — everyone
  { key: "baseline", pathways: ["solo", "educator", "salon"], module: "1. Know your numbers",
    title: "Lodge your starting numbers",
    activity: "Enter last month's revenue collected, visits, new and returning clients, rebook rate and no-shows. This is your baseline — every result is measured against it.",
    measure: ["revenue_collected", "visits", "new_clients", "returning_clients", "rebook_rate_reported", "no_shows"],
    tool: { label: "Add numbers", href: "/numbers" } },
  { key: "price-check", pathways: ["solo", "salon", "educator"], module: "1. Know your numbers",
    title: "Run the pricing worksheet on your top 3 services",
    activity: "Work out the true cost of each service from your fixed costs, product costs and wages (including your own pay). Decide whether any price needs to rise.",
    measure: ["revenue_collected", "visits"], tool: { label: "Pricing worksheet", href: "/tools#pricing" }, projectCategory: "pricing" },
  // Protect your time
  { key: "policies", pathways: ["solo", "salon"], module: "2. Protect your time",
    title: "Put your deposit and cancellation policy live",
    activity: "Set a deposit, a 48-hour reschedule window and a no-show fee in your booking system, and add the policy to your website and booking form. Stick to it from day one.",
    measure: ["no_shows"], projectCategory: "policies" },
  // Keep clients
  { key: "rebook-chair", pathways: ["solo", "salon"], module: "3. Keep your clients",
    title: "Rebook every client before they leave — for 2 weeks",
    activity: "Offer the next appointment time at the end of every service and lock it in with a deposit. Track how many clients rebook.",
    measure: ["rebooked_visits", "visits", "rebook_rate_reported"], projectCategory: "retention" },
  { key: "loyalty", pathways: ["solo", "salon"], module: "3. Keep your clients",
    title: "Launch or tidy up a loyalty and referral program",
    activity: "Choose rewards for visits, reviews and referrals (points, tiers or a simple punch card), set it up in your booking system and tell every client at checkout.",
    measure: ["loyalty_members", "referrals", "returning_clients"], projectCategory: "loyalty" },
  { key: "retail", pathways: ["solo", "salon"], module: "3. Keep your clients",
    title: "Recommend aftercare at the end of every service",
    activity: "Recommend one or two aftercare products once the client can see their result, explaining how it protects their investment. Track retail sales.",
    measure: ["retail_revenue", "revenue_collected"], projectCategory: "retail" },
  // Get found locally
  { key: "local-marketing", pathways: ["solo", "salon"], module: "4. Get found locally",
    title: "Build your local marketing plan",
    activity: "Optimise your Google Business Profile, ask every happy client for a Google review, and pick two local channels (e.g. local businesses, community groups, local Facebook pages) to work for the next 4 weeks.",
    measure: ["google_reviews", "enquiries", "new_clients"], projectCategory: "local-marketing" },
  { key: "offer-message", pathways: ["solo", "salon", "educator"], module: "4. Get found locally",
    title: "Write your one-sentence offer message",
    activity: "Answer the 4 Clarity Questions (who, what, why now, why you) and write: I help [WHO] achieve [OUTCOME] without [OBSTACLE]. Put it in your Instagram bio this week.",
    measure: ["enquiries"], projectCategory: "digital-marketing" },
  // Digital
  { key: "content-plan", pathways: ["solo", "salon", "educator"], module: "5. Digital marketing",
    title: "Plan 4 weeks of content from your content pillars",
    activity: "Choose your content pillars, batch-create a month of posts (before/afters, education, client stories, behind the scenes) and track enquiries from social.",
    measure: ["enquiries", "instagram_followers"], projectCategory: "digital-marketing" },
  { key: "email-list", pathways: ["solo", "salon", "educator"], module: "5. Digital marketing",
    title: "Start your email list with a welcome sequence",
    activity: "Collect consented emails at booking, plan a short welcome sequence and one monthly email. Track list size and clicks.",
    measure: ["email_subscribers", "email_clicks"], projectCategory: "email" },
  { key: "meta-plan", pathways: ["salon", "educator"], module: "5. Digital marketing",
    title: "Plan (don't launch yet) a Meta ads test",
    activity: "Only once your offer and funnel are ready: write a campaign brief with a budget worked back from your revenue goal. Record spend and results when you run it.",
    measure: ["ad_spend", "ad_clicks", "ad_leads", "new_clients"], tool: { label: "Ad metrics", href: "/tools#ads" }, projectCategory: "meta-ads" },
  // Salon owners
  { key: "team-sops", pathways: ["salon"], module: "6. Team and systems",
    title: "Write SOPs for your 3 most-booked services",
    activity: "Document setup, consultation, service steps, aftercare talk, rebooking and retail for each, so every team member delivers the same standard.",
    measure: ["rebook_rate_reported", "retail_revenue"], projectCategory: "hiring" },
  { key: "money-habits", pathways: ["solo", "salon"], module: "6. Team and systems",
    title: "Set up your money habits",
    activity: "Open a separate account for tax and GST, ask your accountant what to set aside, set yourself a fixed wage and a monthly revenue target.",
    measure: ["revenue_collected", "costs_total"], projectCategory: "finance" },
  // Educators
  { key: "readiness", pathways: ["educator"], module: "2. Are you ready to teach?",
    title: "Complete the readiness check",
    activity: "Be honest: can you answer any question a student would throw at you, and fix problems — not just perform the service? Note the gaps you need to close first.",
    measure: [], projectCategory: "course" },
  { key: "validate", pathways: ["educator"], module: "2. Are you ready to teach?",
    title: "Validate demand with 6 conversations",
    activity: "Interview six potential students about what they want to learn and what stops them. Write their words, not yours, into your Ideal Student Profile.",
    measure: ["enquiries"], projectCategory: "course" },
  { key: "course-design", pathways: ["educator"], module: "3. Design your course",
    title: "Write your course outcomes and session plan",
    activity: "Define what students will be able to do by the end, sort content into must / should / could, and plan sessions with practice and assessment.",
    measure: [], projectCategory: "course" },
  { key: "course-price", pathways: ["educator"], module: "3. Design your course",
    title: "Cost every line, then price your course",
    activity: "List every cost (kit, venue, models, materials, your time) and divide by realistic student numbers to find break-even, then set a price that positions the course.",
    measure: ["course_revenue"], tool: { label: "Pricing worksheet", href: "/tools#pricing" }, projectCategory: "course" },
  { key: "course-launch", pathways: ["educator"], module: "4. Launch",
    title: "Run your pre-launch and launch",
    activity: "Warm up your audience with content, build a landing page, send your launch emails and handle objections. Record enquiries and enrolments.",
    measure: ["enquiries", "students_enrolled", "course_revenue"], projectCategory: "course" },
];

export function programFor(pathway: string): ProgramStepDef[] {
  return PROGRAM.filter((s) => s.pathways.includes(pathway as Pathway));
}

export const PROJECT_CATEGORIES: Record<string, string> = {
  pricing: "Pricing review",
  policies: "Salon policies",
  retention: "Rebooking & retention",
  loyalty: "Loyalty & referral program",
  retail: "Retail & aftercare sales",
  "local-marketing": "Local salon marketing",
  "digital-marketing": "Digital marketing & content",
  email: "Email marketing",
  "meta-ads": "Meta ads campaign",
  course: "Course creation & launch",
  hiring: "Hiring & team",
  finance: "Money & finance",
  other: "Other",
};

/** Why each activity matters, shown when the owner starts it. Drawn from Deanna's playbooks (draft). */
export const STEP_WHY: Record<string, string> = {
  baseline: "You can't see progress without a starting point. These numbers become your baseline, and the coach uses them so its advice fits your business, not a generic one.",
  "price-check": "Most beauty owners underprice because they never count all their costs, including their own wage. Deanna's rule: price from your real costs, then check local rates. Don't undercut.",
  policies: "Every no-show is lost income and a slot someone else could have had. Policies set from day one and kept make you look professional, and people won't take advantage of you.",
  "rebook-chair": "Retention beats acquisition. Rebooking before the client leaves fills your books ahead of time and trains clients to see you as busy. Lash'd aims for an 80% rebook rate.",
  loyalty: "Loyal clients are paying your bills. A simple program rewards the behaviour you want most: coming back, rebooking, reviews and referrals.",
  retail: "Aftercare protects the result, so clients come back happy, and it adds revenue without adding chair time. Clients trust their therapist's advice because you've seen their lashes up close.",
  "local-marketing": "You're a local business, so get local with locals. Reviews, a complete Google profile and local partnerships bring in clients who live close enough to keep coming back.",
  "offer-message": "Offers fail from confusion, not competition. If someone can't understand your offer in 10 seconds, no amount of posting will fix it. The message comes before the marketing.",
  "content-plan": "Content needs a job: 80% give, 20% ask, and every post needs a next step. Batching a month at once makes it a system, not a daily scramble.",
  "email-list": "Rent social media for attention; own email for relationships. Your list is the one audience an algorithm can't take away.",
  "meta-plan": "Meta ads only work once the offer and funnel are built. Planning first protects your money; the app never launches ads or spends for you.",
  "team-sops": "Written SOPs mean every client gets the same standard, whoever does the service, and they make hiring and training far easier.",
  "money-habits": "The most common money mistake is not putting aside tax and GST. A separate account, a set wage and a revenue target stop busy months turning into bad surprises.",
  readiness: "You're ready to teach when you can answer any question a student throws at you and fix problems, not just perform the service. Closing gaps first protects your reputation.",
  validate: "Six real conversations tell you what students want and what stops them buying, before you spend months building a course nobody books.",
  "course-design": "Students choose an educator for their standard, not their syllabus. Clear outcomes and planned practice and assessment make a course worth its price.",
  "course-price": "Cost every line before you set a price, so you know your break-even. Positioning, not the price itself, decides whether the price feels fair.",
  "course-launch": "Launch day is not day one. Warming up your audience, a clear landing page and launch emails turn interest into enrolments.",
};

export type ProgramSection = { pathway: Pathway; main: boolean; steps: ProgramStepDef[] };

/** The owner's program: their main pathway first, then any extra pathways they follow,
 *  without repeating activities that are already in an earlier section. */
export function programSections(mainPathway: string, otherPathways: string): ProgramSection[] {
  const main = (PATHWAYS[mainPathway as Pathway] ? mainPathway : "solo") as Pathway;
  const extras = otherPathways.split(",").map((p) => p.trim()).filter((p): p is Pathway => p in PATHWAYS && p !== main);
  const seen = new Set<string>();
  return [main, ...new Set(extras)].map((pw, i) => {
    const steps = programFor(pw).filter((s) => !seen.has(s.key));
    steps.forEach((s) => seen.add(s.key));
    return { pathway: pw, main: i === 0, steps };
  }).filter((sec) => sec.steps.length > 0);
}

export function fullProgram(mainPathway: string, otherPathways: string): ProgramStepDef[] {
  return programSections(mainPathway, otherPathways).flatMap((s) => s.steps);
}
