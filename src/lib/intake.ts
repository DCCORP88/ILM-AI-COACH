// Project intake: the questions the coach asks when a project starts, per project type.
// Built from Deanna's workflow playbooks (coaching/workflows). Answers already known from the
// business profile or lodged numbers are pre-filled so owners aren't asked twice.

export type IntakeQuestion = {
  key: string;
  label: string;
  type: "text" | "long" | "number" | "choice";
  options?: string[];
  metricKey?: string; // numeric answer that can pre-fill from / serve as a baseline for this metric
  help?: string;
  pathways?: ("solo" | "educator" | "salon")[]; // only ask on these main programs
  labelFor?: Partial<Record<"solo" | "educator" | "salon", string>>; // wording per main program
  showIf?: { key: string; values: string[] }; // only ask when an earlier answer matches
  section?: string; // heading shown above this question
};

const COMMON_END: IntakeQuestion[] = [
  { key: "hours", label: "How many hours a week can you give this project?", type: "number" },
  { key: "tried", label: "What have you already tried for this, and what happened?", type: "long", help: "e.g. \"Raised prices $10 last year and lost two clients\", \"Ran a Black Friday discount, got busy but earned less\", or \"Nothing yet\"" },
];

export const INTAKE: Record<string, IntakeQuestion[]> = {
  retention: [
    { key: "rebook_rate", label: "Current rebook rate (%)", type: "number", metricKey: "rebook_rate_reported", help: "From your booking system, e.g. Fresha. Leave blank if you don't know." },
    { key: "visits", label: "Client visits per month", type: "number", metricKey: "visits" },
    { key: "rebook_in_chair", label: "Do you rebook clients before they leave?", type: "choice", options: ["Every client", "Sometimes", "Rarely / never"] },
    { key: "deposit_rebook", label: "Do you take a deposit on rebookings?", type: "choice", options: ["Yes", "No"] },
    { key: "reminders", label: "Do you send reminders or follow up clients who haven't rebooked?", type: "choice", options: ["Automatic reminders + follow-up", "Reminders only", "Neither"] },
    { key: "why_not", label: "What do clients say when they don't rebook?", type: "long", help: "e.g. \"I'll book later\", \"need to check my calendar\"" },
    ...COMMON_END,
  ],
  loyalty: [
    { key: "returning", label: "Returning clients per month", type: "number", metricKey: "returning_clients" },
    { key: "referrals", label: "New clients from referrals per month", type: "number", metricKey: "referrals" },
    { key: "reviews", label: "Google reviews in the last month", type: "number", metricKey: "google_reviews" },
    { key: "existing", label: "Do you have a loyalty or referral program now?", type: "choice", options: ["Yes, and it works", "Yes, but no one uses it", "No"] },
    { key: "want_most", label: "What do you most want more of?", type: "choice", options: ["Rebookings", "Referrals", "Reviews", "Higher spend", "Not sure"] },
    { key: "booking_system", label: "Which booking system do you use?", type: "text" },
    ...COMMON_END,
  ],
  "local-marketing": [
    { key: "enquiries", label: "Enquiries per month", type: "number", metricKey: "enquiries" },
    { key: "enquiry_bookings", label: "How many of those book?", type: "number", metricKey: "enquiry_bookings" },
    { key: "new_clients", label: "New clients per month", type: "number", metricKey: "new_clients" },
    { key: "capacity", label: "How full is your diary?", type: "choice", options: ["Mostly empty", "About half", "Mostly full", "Fully booked with a waitlist"] },
    { key: "sources", label: "Where do new clients come from now?", type: "long", help: "e.g. Instagram, Google, word of mouth, walk-ins" },
    { key: "google_profile", label: "Is your Google Business Profile set up with services, photos and a booking link?", type: "choice", options: ["Yes, fully", "Partly", "No"] },
    { key: "dream_client", label: "Who is your dream client?", type: "long", help: "Age, lifestyle, what they value, the style they want" },
    { key: "budget", label: "Monthly budget for this project ($)", type: "number" },
    ...COMMON_END,
  ],
  "digital-marketing": [
    { key: "offer_message", label: "In one sentence, who do you help and with what?", labelFor: { educator: "In one sentence, which students do you help, and to achieve what?" }, type: "long", help: "Don't worry if it's rough; we'll sharpen it." },
    { key: "enquiries", label: "Enquiries per month", labelFor: { educator: "Course enquiries per month" }, type: "number", metricKey: "enquiries" },
    { key: "followers", label: "Instagram followers", type: "number", metricKey: "instagram_followers" },
    { key: "posting", label: "How often do you post now?", type: "choice", options: ["Daily", "A few times a week", "Weekly", "Rarely"] },
    { key: "next_step", label: "When someone likes your post, what's their next step?", type: "choice", options: ["Book via link", "DM me", "Join my email list", "Nothing clear"] },
    { key: "goal_type", label: "What should your content do most?", type: "choice", options: ["Bring salon bookings", "Sell a course or digital product", "Build authority", "Grow an email list"] },
    ...COMMON_END,
  ],
  email: [
    { key: "subscribers", label: "Email list size", type: "number", metricKey: "email_subscribers" },
    { key: "platform", label: "Email platform (if any)", type: "text" },
    { key: "collect", label: "How do you collect emails now?", labelFor: { educator: "How do you collect emails from potential students now?" }, type: "long" },
    { key: "selling", label: "What will your emails mainly lead to?", type: "choice", options: ["Salon bookings", "Course enrolments", "Product sales", "Not sure yet"] },
    ...COMMON_END,
  ],
  "meta-ads": [
    { key: "offer", label: "What exactly will the ad promote?", type: "long" },
    { key: "destination", label: "Where will the ad send people?", type: "choice", options: ["Booking page", "Instagram profile", "Landing page", "Lead form", "Not decided"] },
    { key: "booking_ready", label: "Is that page ready, with a clear booking or buy button?", type: "choice", options: ["Yes", "Partly", "No"] },
    { key: "budget", label: "Total ad budget for this campaign ($)", type: "number" },
    { key: "creative", label: "Do you have video or photos to use?", type: "choice", options: ["Yes, plenty", "A few", "None yet"] },
    { key: "past_ads", label: "Have you run ads before? What happened?", type: "long" },
    { key: "new_clients", label: "New clients per month now", type: "number", metricKey: "new_clients" },
    ...COMMON_END,
  ],
  pricing: [
    { key: "top_services", label: "Your top 3 services, prices and appointment lengths", type: "long" },
    { key: "last_change", label: "When did you last change your prices?", type: "choice", options: ["In the last 6 months", "6–12 months ago", "Over a year ago", "Never"] },
    { key: "capacity", label: "How full is your diary?", type: "choice", options: ["Mostly empty", "About half", "Mostly full", "Fully booked with a waitlist"] },
    { key: "pay_yourself", label: "Do you pay yourself a set wage?", type: "choice", options: ["Yes", "No", "Sometimes"] },
    { key: "revenue", label: "Revenue collected last month ($)", type: "number", metricKey: "revenue_collected" },
    { key: "costs", label: "Total costs last month ($)", type: "number", metricKey: "costs_total" },
    { key: "discounts", label: "Do you discount for friends, family or everyone?", type: "choice", options: ["Rarely", "Friends & family", "Most clients"] },
    ...COMMON_END,
  ],
  policies: [
    { key: "no_shows", label: "No-shows and late cancellations per month", type: "number", metricKey: "no_shows" },
    { key: "deposit", label: "Do you take deposits?", type: "choice", options: ["Yes, on all services", "On some", "No"] },
    { key: "written", label: "Are your policies written on your website and booking form?", type: "choice", options: ["Yes", "Partly", "No"] },
    { key: "enforce", label: "Do you enforce them?", type: "choice", options: ["Always", "Sometimes", "Rarely"] },
    { key: "pay_later", label: "Do clients ever pay after the appointment?", type: "choice", options: ["Never", "Sometimes", "Often"] },
    { key: "booking_system", label: "Which booking system do you use?", type: "text" },
    ...COMMON_END,
  ],
  retail: [
    { key: "retail", label: "Retail / aftercare sales last month ($)", type: "number", metricKey: "retail_revenue" },
    { key: "revenue", label: "Revenue collected last month ($)", type: "number", metricKey: "revenue_collected" },
    { key: "stock", label: "What aftercare products do you stock?", type: "long" },
    { key: "when", label: "When do you recommend products?", type: "choice", options: ["At the end, once they see the result", "During the service", "Only if asked", "Never"] },
    ...COMMON_END,
  ],
  course: [
    { key: "topic", label: "What would you teach?", type: "text" },
    { key: "experience", label: "Years working in this service", type: "number" },
    { key: "confidence", label: "Could you answer any question a student throws at you, and fix problems, not just perform the service?", type: "choice", options: ["Yes, confidently", "Mostly", "Not yet"] },
    { key: "learner", label: "Who is your ideal student?", type: "long" },
    { key: "demand", label: "What evidence do you have that people want it?", type: "long", help: "e.g. people asking you, waitlist, followers asking" },
    { key: "timeframe", label: "When would you like to launch?", type: "text" },
    ...COMMON_END,
  ],
  hiring: [
    { key: "capacity", label: "How full is your diary?", type: "choice", options: ["Mostly full", "Fully booked with a waitlist", "About half"] },
    { key: "hours_worked", label: "Hours a week you work in the chair", type: "number" },
    { key: "role", label: "What role do you need?", type: "choice", options: ["Qualified artist", "Junior / trainee", "Reception / admin", "VA", "Not sure"] },
    { key: "sops", label: "Do you have written SOPs?", type: "choice", options: ["Yes", "Some", "No"] },
    { key: "revenue", label: "Revenue collected last month ($)", type: "number", metricKey: "revenue_collected" },
    ...COMMON_END,
  ],
  finance: [
    { key: "tools", label: "How do you track money now?", type: "long", help: "e.g. Xero, spreadsheet, bookkeeper, nothing yet" },
    { key: "tax_aside", label: "Do you put money aside for tax and GST?", type: "choice", options: ["Always", "Sometimes", "No"] },
    { key: "pay_yourself", label: "Do you pay yourself a set wage?", type: "choice", options: ["Yes", "No", "Sometimes"] },
    { key: "revenue", label: "Revenue collected last month ($)", type: "number", metricKey: "revenue_collected" },
    { key: "costs", label: "Total costs last month ($)", type: "number", metricKey: "costs_total" },
    ...COMMON_END,
  ],
  other: [
    { key: "outcome", label: "What do you want to be different when this project is finished?", type: "long" },
    { key: "measure", label: "How will you know it worked? Which number should change?", type: "long" },
    { key: "obstacle", label: "What's the main thing in the way?", type: "long" },
    ...COMMON_END,
  ],
};

/** Questions for a project: the activity's own set if it has one, otherwise its type's set,
 *  plus any extra questions for the owner's main program, filtered and worded for that program. */
export function intakeFor(category: string, stepKey = "", pathway = ""): IntakeQuestion[] {
  const base = STEP_INTAKE[stepKey] ?? INTAKE[category] ?? INTAKE.other;
  const extra = PATHWAY_EXTRA[category] ?? [];
  const all = [...base.filter((q) => !COMMON_KEYS.has(q.key)), ...extra.filter((q) => !base.some((b) => b.key === q.key)), ...base.filter((q) => COMMON_KEYS.has(q.key))];
  return all
    .filter((q) => !q.pathways || q.pathways.includes(pathway as "solo"))
    .map((q) => ({ ...q, label: q.labelFor?.[pathway as "solo"] ?? q.label }));
}

/** Whether a question should be shown, given the answers so far. */
export function isVisible(q: IntakeQuestion, answers: Record<string, string>): boolean {
  if (!q.showIf) return true;
  return q.showIf.values.includes(answers[q.showIf.key] ?? "");
}

/** Template plans used when the AI coach is off (demo mode). Drawn from the playbooks. */
export const TEMPLATE_TASKS: Record<string, string[]> = {
  retention: ["Rebook every client before they leave for 2 weeks, using a set rebooking line", "Take a deposit on every rebooking", "Turn on booking-system reminders and an 8-week lapsed-client follow-up", "Recommend one aftercare product at the end of each service", "Lodge your rebook rate at the end of the month"],
  loyalty: ["Decide the one behaviour to reward (rebooking, referrals, reviews or spend)", "Cost each reward with the pricing worksheet", "Set the program up in your booking system", "Tell every client at checkout and on your booking page", "Lodge members, referrals and reviews monthly"],
  "local-marketing": ["Complete your Google Business Profile (services, prices, photos, booking link)", "Ask every happy client for a Google review this week", "Contact two local businesses that share your dream client", "Add your suburb plus your services to your bio, website and captions", "Track enquiries and how many book, every week"],
  "digital-marketing": ["Write your one-sentence offer: I help [WHO] achieve [OUTCOME] without [OBSTACLE]", "Put it in your Instagram bio", "Choose your content pillars and batch a month of posts", "Give every post a next step (book, DM, or join the list)", "Track enquiries from social weekly"],
  email: ["Choose a lead magnet that solves a small, urgent problem", "Collect consented emails at booking", "Draft a short welcome sequence", "Plan one monthly email", "Track list size and clicks monthly"],
  "meta-ads": ["Check the offer, message and booking page are ready before spending", "Write the campaign brief: cold ad plus retargeting", "Prepare 2–3 short videos (hook, why, do)", "Set the budget worked back from your revenue goal", "Weekly: compare Meta results with real bookings"],
  pricing: ["Run the pricing worksheet on your top 3 services", "List anyone you discount and why", "Decide new prices and apply them to new bookings only", "Prepare your answer for price questions", "Track average spend and bookings for 8 weeks"],
  policies: ["Write your deposit, 48-hour reschedule and no-show policy", "Add it to your booking system, website and booking form", "Prepare your enforcement message", "Take payment before every client leaves", "Track no-shows monthly"],
  retail: ["Choose 1–2 aftercare products for each service", "Recommend them once the client can see their result", "Explain how the product protects their investment", "Track retail sales monthly"],
  course: ["Complete the readiness check honestly and list gaps", "Interview six potential students", "Write course outcomes and sort content into must / should / could", "Cost every line, then price the course", "Plan your pre-launch content"],
  hiring: ["Confirm the books are full and capacity is the problem", "Write SOPs for your 3 most-booked services", "Write the role and trial-service checklist", "Check pay and trial rules with Fair Work or an adviser", "Plan onboarding at a reduced rate"],
  finance: ["Open a separate account for tax and GST", "Ask your accountant what percentage to set aside", "Set yourself a fixed wage", "Set a monthly revenue target", "Lodge revenue and costs monthly"],
  other: ["Define the outcome and the number that should change", "Lodge your starting number", "Break the work into weekly steps", "Review progress in your weekly check-in"],
};

const COMMON_KEYS = new Set(["hours", "tried"]);
const FORMAT_OPTIONS = ["In person", "Online", "Both (hybrid)"];
const IN_PERSON = { key: "format", values: ["In person", "Both (hybrid)"] };
const ONLINE = { key: "format", values: ["Online", "Both (hybrid)"] };
const HYBRID = { key: "format", values: ["Both (hybrid)"] };

const FORMAT_QUESTIONS: IntakeQuestion[] = [
  { key: "format", label: "Will this course be in person, online, or both?", type: "choice", options: FORMAT_OPTIONS, section: "Course format" },
  // In person
  { key: "ip_days", label: "How many days will the in-person training run?", type: "choice", options: ["Half day", "1 day", "2 days", "3+ days"], showIf: IN_PERSON, help: "Deanna's rule: lash extension courses need at least 2 days" },
  { key: "ip_class_size", label: "Students per class", type: "number", showIf: IN_PERSON },
  { key: "ip_venue", label: "Where will you train?", type: "choice", options: ["My salon / studio", "Hired venue", "Not decided"], showIf: IN_PERSON },
  { key: "ip_models", label: "How will students get models?", type: "choice", options: ["I supply models", "Students bring their own", "Mannequins only", "Not decided"], showIf: IN_PERSON },
  { key: "ip_kit", label: "Is a kit included?", type: "choice", options: ["Included in the price", "Optional extra", "No kit"], showIf: IN_PERSON },
  // Online
  { key: "ol_delivery", label: "How will the online part be delivered?", type: "choice", options: ["Self-paced videos", "Live sessions", "Videos + live Q&A"], showIf: ONLINE },
  { key: "ol_platform", label: "Course platform", type: "choice", options: ["Thinkific", "Skool", "Kajabi", "Shopify / my website", "Not chosen yet"], showIf: ONLINE },
  { key: "ol_practical", label: "How will you check practical skills remotely?", type: "choice", options: ["Photo submissions", "Video submissions", "Live video assessment", "A practical day in person", "Not sure yet"], showIf: ONLINE },
  { key: "ol_access", label: "How long do students keep access?", type: "choice", options: ["3 months", "6 months", "12 months", "Lifetime"], showIf: ONLINE },
  { key: "hy_split", label: "Which parts are online and which in person?", type: "long", showIf: HYBRID, help: "e.g. theory online, practical day in the salon" },
];

/** Question sets for individual program activities (override the project type's set). */
export const STEP_INTAKE: Record<string, IntakeQuestion[]> = {
  readiness: [
    { key: "topic", label: "What would you teach?", type: "text", section: "About you as an educator" },
    { key: "experience", label: "Years working in this service", type: "number" },
    { key: "clients_done", label: "Roughly how many clients have you done this service on?", type: "number" },
    { key: "confidence", label: "Could you answer any question a student throws at you, not just perform the service?", type: "choice", options: ["Yes, confidently", "Mostly", "Not yet"] },
    { key: "fixing", label: "Can you spot and fix problems: retention issues, reactions, poor results, other artists' work?", type: "choice", options: ["Yes, confidently", "Some of them", "Not yet"] },
    { key: "why_teach", label: "Why do you want to teach?", type: "long", help: "Be honest. \"Just for the money\" is a red flag Deanna checks for." },
    { key: "gaps", label: "Which parts of the service or the theory are you least sure about?", type: "long" },
    { key: "taught_before", label: "Have you trained anyone before (staff, juniors, a friend)?", type: "choice", options: ["Yes, several", "Once or twice", "No"] },
    ...COMMON_END,
  ],
  validate: [
    { key: "topic", label: "What would you teach?", type: "text", section: "Demand" },
    ...FORMAT_QUESTIONS.slice(0, 1),
    { key: "asked", label: "How many people have asked you to teach them in the last 6 months?", type: "number" },
    { key: "waitlist", label: "Do you have a waitlist or a list of interested people?", type: "choice", options: ["Yes", "A few names", "No"] },
    { key: "learner", label: "Who is your ideal student?", type: "long", help: "e.g. new artists 6–12 months in, salon owners training staff" },
    { key: "find_six", label: "Where could you find six potential students to interview?", type: "long", help: "Instagram followers, past clients, local beauty schools, Facebook groups" },
    { key: "audience", label: "Instagram followers", type: "number", metricKey: "instagram_followers" },
    { key: "email_list", label: "Email list size", type: "number", metricKey: "email_subscribers" },
    { key: "competitors", label: "Who else teaches this near you or online, and roughly what do they charge?", type: "long" },
    ...COMMON_END,
  ],
  "course-design": [
    { key: "topic", label: "Course name or topic", type: "text", section: "The course" },
    { key: "learner", label: "Who is it for, and what level are they at when they start?", type: "long" },
    ...FORMAT_QUESTIONS,
    { key: "modules", label: "How many modules feel right?", type: "choice", options: ["3–4", "5–8", "9–12", "Not sure"], section: "Content structure", help: "Deanna's guidance: 5–8 is the sweet spot" },
    { key: "split", label: "Theory vs practical split", type: "choice", options: ["Mostly theory", "About half and half", "Mostly practical (e.g. 30/70)", "Not sure"] },
    { key: "materials", label: "What materials will students get?", type: "long", help: "e.g. manual, workbook, videos, templates, kit list" },
    { key: "topics", label: "List everything you'd want to teach", type: "long", section: "Topics", help: "One per line. The coach sorts these into must / should / could so the course isn't overloaded." },
    { key: "struggles", label: "What do students most often get wrong, or struggle with after other courses?", type: "long" },
    { key: "difference", label: "What do you teach that others don't?", type: "long", help: "Your point of difference" },
    { key: "theory_assess", label: "Theory assessment", type: "choice", options: ["Quiz / written test", "Workbook questions", "No theory assessment", "Not sure"], section: "Assessments" },
    { key: "pass_mark", label: "Pass mark for theory (%)", type: "number", showIf: { key: "theory_assess", values: ["Quiz / written test", "Workbook questions"] } },
    { key: "practical_assess", label: "How many full sets or models must they complete to pass?", type: "number" },
    { key: "assess_how", label: "How is the practical assessed?", type: "choice", options: ["Live, by me", "Photo submissions", "Video submissions", "Case studies", "A mix"] },
    { key: "criteria", label: "What does \"competent\" look like for the main skill?", type: "long", help: "e.g. correct isolation, no stickies, even mapping, retention at the 2-week fill" },
    { key: "fail", label: "What happens if a student doesn't pass?", type: "choice", options: ["Resubmit for free", "Extra session (fee)", "Extra session (free)", "Not decided"] },
    { key: "certificate", label: "What's required to earn the certificate?", type: "long", help: "e.g. pass theory and practical, all payments complete" },
    ...COMMON_END,
  ],
  "course-price": [
    { key: "topic", label: "Course name or topic", type: "text", section: "The course" },
    ...FORMAT_QUESTIONS,
    { key: "cost_lines", label: "List every cost per intake with an amount", type: "long", section: "Costs", help: "e.g. venue $300, models 4 × $50, kits 4 × $180, manuals 4 × $25, your time, marketing, platform fees" },
    { key: "students_per_intake", label: "Realistic students per intake (or per month online)", type: "number" },
    { key: "intakes", label: "Intakes per year (in person) or launches per year (online)", type: "number" },
    { key: "price_idea", label: "What price are you thinking? ($)", type: "number", section: "Price" },
    { key: "positioning", label: "How will you position it?", type: "choice", options: ["Beginner mentor", "Advanced expert", "Niche specialist", "Not sure"] },
    { key: "payment_plans", label: "Will you offer payment plans or deposits?", type: "choice", options: ["Deposit + balance", "Weekly payment plan", "Both", "Pay in full only"] },
    { key: "competitors", label: "What do similar courses cost?", type: "long" },
    ...COMMON_END,
  ],
  "course-launch": [
    { key: "topic", label: "Course name or topic", type: "text", section: "The launch" },
    ...FORMAT_QUESTIONS.slice(0, 1),
    { key: "launch_date", label: "Launch or first intake date", type: "text" },
    { key: "seats", label: "Seats to fill (in person) or enrolment target (online)", type: "number" },
    { key: "audience", label: "Instagram followers", type: "number", metricKey: "instagram_followers" },
    { key: "email_list", label: "Email list size", type: "number", metricKey: "email_subscribers" },
    { key: "landing_page", label: "Do you have a sales/landing page?", type: "choice", options: ["Yes, ready", "Drafted", "No"] },
    { key: "proof", label: "What proof do you have?", type: "long", help: "Student results, testimonials, before/afters, awards" },
    { key: "objections", label: "What do people say stops them booking a course?", type: "long", help: "Money, time, trust, timing" },
    { key: "ads", label: "Budget for ads, if any ($)", type: "number" },
    ...COMMON_END,
  ],
};

/** Extra questions on shared activities, depending on the owner's main program. */
const PATHWAY_EXTRA: Record<string, IntakeQuestion[]> = {
  pricing: [
    { key: "pricing_what", label: "What are you pricing?", type: "choice", options: ["Salon services", "A course", "Both"], pathways: ["educator"] },
    { key: "team_pay", label: "How are your artists paid?", type: "choice", options: ["Wage only", "Wage + commission", "Commission only", "Contractors / chair rental"], pathways: ["salon"] },
    { key: "artist_levels", label: "Do prices differ by artist level (junior / senior / master)?", type: "choice", options: ["Yes", "No", "Thinking about it"], pathways: ["salon"] },
    { key: "busiest_artist", label: "Which artists are fully booked and which have gaps?", type: "long", pathways: ["salon"] },
  ],
  retention: [
    { key: "team_rebook", label: "Does every team member rebook clients before they leave?", type: "choice", options: ["Everyone", "Some", "Not really"], pathways: ["salon"] },
    { key: "artist_rates", label: "Rebook rate by artist, if your booking system shows it", type: "long", pathways: ["salon"] },
  ],
  finance: [
    { key: "payroll", label: "Monthly wages and super for staff ($)", type: "number", pathways: ["salon"] },
    { key: "payroll_tool", label: "How do you run payroll?", type: "choice", options: ["Xero payroll", "Other software", "Bookkeeper / accountant", "Manually"], pathways: ["salon"] },
  ],
  "digital-marketing": [
    { key: "course_content", label: "Is this content mainly to sell a course?", type: "choice", options: ["Yes", "Partly", "No, salon bookings"], pathways: ["educator"] },
  ],
  email: [
    { key: "students_list", label: "Do you keep past students on a separate list?", type: "choice", options: ["Yes", "No", "No past students yet"], pathways: ["educator"] },
  ],
  course: FORMAT_QUESTIONS,
};

/** Course outline the coach drafts for "Design your course". */
export type CourseOutline = {
  title: string;
  outcomes: string[];
  modules: { title: string; outcome: string; lessons: { title: string; type: "theory" | "practical" | "assessment"; minutes: number | null }[] }[];
  topicPriority: { must: string[]; should: string[]; could: string[] };
  assessments: { name: string; type: "theory" | "practical"; method: string; criteria: string; passMark: string; checksOutcomes: string[] }[];
  materials: string[];
};

export function outlineToMarkdown(o: CourseOutline): string {
  const lines = [`# ${o.title}`, "", "## Learning outcomes", "By the end of this course, students will be able to:", ...o.outcomes.map((x) => `- ${x}`), ""];
  lines.push("## Topics: must / should / could", `**Must:** ${o.topicPriority.must.join("; ") || "-"}`, `**Should:** ${o.topicPriority.should.join("; ") || "-"}`, `**Could (bonus or later course):** ${o.topicPriority.could.join("; ") || "-"}`, "");
  lines.push("## Modules");
  o.modules.forEach((m, i) => {
    lines.push(`### Module ${i + 1}: ${m.title}`, `_Outcome: ${m.outcome}_`);
    m.lessons.forEach((l) => lines.push(`- [${l.type}] ${l.title}${l.minutes ? ` (${l.minutes} min)` : ""}`));
    lines.push("");
  });
  lines.push("## Assessment plan");
  o.assessments.forEach((a) => lines.push(`- **${a.name}** (${a.type}, ${a.method}). Criteria: ${a.criteria}. Pass: ${a.passMark}. Checks: ${a.checksOutcomes.join(", ")}`));
  lines.push("", "## Materials", ...o.materials.map((m) => `- ${m}`), "", "_Draft outline from your coach. Edit freely; every save creates a new version._");
  return lines.join("\n");
}

export const COURSE_KEYS = ["topic", "learner", "format", "ip_days", "ip_class_size", "ip_venue", "ip_models", "ip_kit", "ol_delivery", "ol_platform", "ol_practical", "ol_access", "hy_split", "experience"];
