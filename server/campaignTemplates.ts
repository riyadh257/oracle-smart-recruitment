/**
 * Email Campaign Templates
 * Pre-built campaign sequences that employers can launch with one click
 */

import { getDb } from "./db";

export interface CampaignStep {
  stepNumber: number;
  delayDays: number;
  emailTemplateId?: number;
  subject: string;
  content: string;
  sendTime?: { hour: number; minute: number };
}

export interface CampaignTemplate {
  id: number;
  name: string;
  description: string;
  category: "welcome" | "nurture" | "reengagement" | "interview" | "onboarding" | "custom";
  sequence: CampaignStep[];
  totalSteps: number;
  estimatedDuration: number;
  isActive: boolean;
  usageCount: number;
}

/**
 * Pre-built campaign templates
 */
const PREBUILT_TEMPLATES: Omit<CampaignTemplate, "id" | "usageCount">[] = [
  {
    name: "Welcome Series - New Candidates",
    description: "3-email welcome sequence for newly registered candidates",
    category: "welcome",
    totalSteps: 3,
    estimatedDuration: 7,
    isActive: true,
    sequence: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: "Welcome to {{company_name}} - Let's Get Started!",
        content: `Hi {{candidate_name}},

Welcome to {{company_name}}! We're excited to have you in our talent network.

We're committed to matching you with opportunities that align with your skills and career goals. Here's what happens next:

1. Complete your profile (if you haven't already)
2. We'll match you with relevant opportunities
3. Get notified when perfect roles open up

In the meantime, explore our company culture and current openings.

Best regards,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
      {
        stepNumber: 2,
        delayDays: 3,
        subject: "{{candidate_name}}, Here's How We Match Talent",
        content: `Hi {{candidate_name}},

Quick update on how our smart matching works:

Our AI analyzes 10,000+ attributes to find your perfect fit, including:
- Technical skills and experience
- Career trajectory and goals
- Cultural fit indicators
- Location and work preferences

We're currently reviewing your profile against {{active_jobs_count}} open positions.

Want to improve your match score? Update your profile with recent projects and skills.

Best,
{{employer_name}}`,
        sendTime: { hour: 14, minute: 0 },
      },
      {
        stepNumber: 3,
        delayDays: 7,
        subject: "Your First Week: What's Next?",
        content: `Hi {{candidate_name}},

It's been a week since you joined our talent network. Here's what you should know:

✓ Your profile has been viewed {{profile_views}} times
✓ You're matched with {{matched_jobs}} relevant positions
✓ {{new_jobs_count}} new jobs were posted this week

Next steps:
1. Check your match dashboard for opportunities
2. Set up job alerts for your preferred roles
3. Connect with our recruiters for personalized guidance

We're here to help you find your next great opportunity!

Best,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
    ],
  },
  {
    name: "Nurture Campaign - Passive Candidates",
    description: "5-email nurture sequence to engage passive candidates over 30 days",
    category: "nurture",
    totalSteps: 5,
    estimatedDuration: 30,
    isActive: true,
    sequence: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: "{{candidate_name}}, Exciting Opportunities at {{company_name}}",
        content: `Hi {{candidate_name}},

I came across your profile and was impressed by your background in {{candidate_skills}}.

We have several exciting opportunities at {{company_name}} that align with your experience. Even if you're not actively looking, I'd love to share what we're working on.

Would you be open to a brief conversation?

Best regards,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
      {
        stepNumber: 2,
        delayDays: 7,
        subject: "Inside {{company_name}}: Our Culture & Values",
        content: `Hi {{candidate_name}},

Wanted to share more about what makes {{company_name}} special:

🌟 Our Culture:
- Innovation-driven environment
- Work-life balance priority
- Continuous learning opportunities
- Collaborative team structure

📈 Growth Opportunities:
- Clear career progression paths
- Mentorship programs
- Professional development budget
- Internal mobility

Even if timing isn't right now, we'd love to stay connected for future opportunities.

Best,
{{employer_name}}`,
        sendTime: { hour: 14, minute: 0 },
      },
      {
        stepNumber: 3,
        delayDays: 14,
        subject: "{{candidate_name}}, Meet Our Team",
        content: `Hi {{candidate_name}},

I thought you might enjoy learning about the team you'd potentially work with:

[Team spotlight content]

Our {{department_name}} team is doing groundbreaking work in {{focus_area}}. They're looking for talented individuals like you to join them.

Interested in learning more? Let's schedule a casual chat.

Best,
{{employer_name}}`,
        sendTime: { hour: 11, minute: 0 },
      },
      {
        stepNumber: 4,
        delayDays: 21,
        subject: "New Role Alert: {{job_title}} at {{company_name}}",
        content: `Hi {{candidate_name}},

A new position just opened that matches your profile perfectly:

**{{job_title}}**
- Location: {{job_location}}
- Experience: {{experience_required}}
- Key Skills: {{required_skills}}

This role offers:
✓ Competitive compensation
✓ Flexible work arrangements
✓ Growth opportunities
✓ Cutting-edge projects

Interested? Reply to this email or apply directly through our portal.

Best,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
      {
        stepNumber: 5,
        delayDays: 30,
        subject: "Staying in Touch - {{company_name}}",
        content: `Hi {{candidate_name}},

I know you're busy, so I'll keep this brief.

Even if now isn't the right time, I'd love to stay connected. We're always looking for exceptional talent like you.

What's the best way to keep you updated on opportunities that match your interests?

- Monthly newsletter?
- Quarterly check-ins?
- Only when perfect matches arise?

Let me know your preference, or feel free to reach out anytime.

Best regards,
{{employer_name}}`,
        sendTime: { hour: 15, minute: 0 },
      },
    ],
  },
  {
    name: "Re-engagement Campaign - Inactive Candidates",
    description: "4-email sequence to re-engage candidates who haven't interacted in 60+ days",
    category: "reengagement",
    totalSteps: 4,
    estimatedDuration: 14,
    isActive: true,
    sequence: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: "We Miss You, {{candidate_name}}!",
        content: `Hi {{candidate_name}},

It's been a while since we last connected. We've made some exciting updates to our platform and have new opportunities that might interest you.

What's new:
- {{new_features_count}} new features to improve your job search
- {{new_jobs_count}} new positions in your field
- Enhanced matching algorithm for better recommendations

Take a moment to update your profile and see what's new!

Best,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
      {
        stepNumber: 2,
        delayDays: 4,
        subject: "{{candidate_name}}, Your Profile Needs Attention",
        content: `Hi {{candidate_name}},

Quick heads up: Your profile hasn't been updated in {{days_inactive}} days.

Keeping your profile current helps us:
✓ Match you with better opportunities
✓ Show you to relevant employers
✓ Send you targeted job alerts

It only takes 5 minutes to update. Want to give it a refresh?

[Update Profile Button]

Best,
{{employer_name}}`,
        sendTime: { hour: 14, minute: 0 },
      },
      {
        stepNumber: 3,
        delayDays: 9,
        subject: "Last Chance: {{hot_job_count}} Hot Jobs Waiting",
        content: `Hi {{candidate_name}},

Don't miss out! We have {{hot_job_count}} positions that match your background:

{{#each hot_jobs}}
- {{title}} at {{company}} ({{location}})
{{/each}}

These roles are filling fast. Take a look before they're gone!

[View Jobs Button]

Still not interested? Let us know your preferences so we can send better matches.

Best,
{{employer_name}}`,
        sendTime: { hour: 11, minute: 0 },
      },
      {
        stepNumber: 4,
        delayDays: 14,
        subject: "Final Check-In: Should We Stay Connected?",
        content: `Hi {{candidate_name}},

I want to respect your time and inbox. If you're no longer interested in opportunities with {{company_name}}, no problem at all.

Please let me know:
- Still interested? Update your profile
- Need a break? Pause notifications
- Not interested? Unsubscribe below

Whatever you choose, thanks for being part of our network.

Best regards,
{{employer_name}}`,
        sendTime: { hour: 15, minute: 0 },
      },
    ],
  },
  {
    name: "Interview Process Series",
    description: "3-email sequence guiding candidates through the interview process",
    category: "interview",
    totalSteps: 3,
    estimatedDuration: 7,
    isActive: true,
    sequence: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: "Interview Scheduled: {{job_title}} at {{company_name}}",
        content: `Hi {{candidate_name}},

Great news! We'd like to invite you to interview for the {{job_title}} position.

**Interview Details:**
- Date: {{interview_date}}
- Time: {{interview_time}}
- Duration: {{interview_duration}} minutes
- Format: {{interview_format}}
- Interviewer: {{interviewer_name}}, {{interviewer_title}}

**What to Prepare:**
- Review the job description
- Prepare questions about the role and team
- Test your video setup (if virtual)
- Have examples of relevant work ready

We're excited to learn more about you!

Best,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
      {
        stepNumber: 2,
        delayDays: 1,
        subject: "Interview Tomorrow: Quick Reminders",
        content: `Hi {{candidate_name}},

Your interview is tomorrow! Here are some final reminders:

**Logistics:**
- Time: {{interview_time}} ({{timezone}})
- Join link: {{meeting_link}}
- Backup contact: {{phone_number}}

**Tips for Success:**
1. Join 5 minutes early
2. Find a quiet space with good lighting
3. Have your resume handy
4. Prepare 2-3 questions for us

**What We'll Cover:**
- Your background and experience
- The role and team structure
- Company culture and values
- Next steps in the process

Looking forward to speaking with you!

Best,
{{employer_name}}`,
        sendTime: { hour: 16, minute: 0 },
      },
      {
        stepNumber: 3,
        delayDays: 7,
        subject: "Thank You & Next Steps",
        content: `Hi {{candidate_name}},

Thank you for taking the time to interview with us for the {{job_title}} position. It was great learning more about your experience and background.

**What's Next:**
- Our team is reviewing all candidates
- We'll make a decision by {{decision_date}}
- You'll hear from us either way
- Feel free to reach out with any questions

In the meantime, here are some resources to learn more about {{company_name}}:
- Company blog: {{blog_url}}
- Team profiles: {{team_url}}
- Recent news: {{news_url}}

Thanks again for your interest!

Best regards,
{{employer_name}}`,
        sendTime: { hour: 14, minute: 0 },
      },
    ],
  },
  {
    name: "Onboarding Series - New Hires",
    description: "4-email sequence to welcome and onboard new hires",
    category: "onboarding",
    totalSteps: 4,
    estimatedDuration: 30,
    isActive: true,
    sequence: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: "Welcome to {{company_name}}, {{candidate_name}}!",
        content: `Hi {{candidate_name}},

Congratulations and welcome to {{company_name}}! We're thrilled to have you join our team as {{job_title}}.

**Your First Day:**
- Date: {{start_date}}
- Time: {{start_time}}
- Location: {{office_location}}
- Report to: {{manager_name}}

**Before You Start:**
- Complete HR paperwork (link sent separately)
- Set up your equipment
- Review the employee handbook
- Join our Slack workspace

We've prepared everything to make your first day smooth and welcoming. See you soon!

Best,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
      {
        stepNumber: 2,
        delayDays: 1,
        subject: "Your First Day Checklist",
        content: `Hi {{candidate_name}},

Your first day is tomorrow! Here's your checklist:

**Morning:**
- Arrive at {{start_time}}
- Bring: ID, completed paperwork
- Meet your onboarding buddy: {{buddy_name}}

**Day 1 Schedule:**
- 9:00 AM: Welcome & orientation
- 10:30 AM: Team introductions
- 12:00 PM: Lunch with your team
- 2:00 PM: Setup & training
- 4:00 PM: First day wrap-up

**What to Expect:**
- Meet your team members
- Get your workspace set up
- Learn about our tools and processes
- Ask lots of questions!

Excited to see you tomorrow!

Best,
{{employer_name}}`,
        sendTime: { hour: 16, minute: 0 },
      },
      {
        stepNumber: 3,
        delayDays: 7,
        subject: "Your First Week: How's It Going?",
        content: `Hi {{candidate_name}},

You've completed your first week at {{company_name}}! How's it going?

**This Week's Highlights:**
- Met {{team_size}} team members
- Completed {{training_modules}} training modules
- Set up your development environment
- Started on your first project

**Next Week:**
- Deep dive into {{project_name}}
- 1-on-1 with {{manager_name}}
- Team lunch on {{lunch_date}}
- Continue onboarding training

**Need Help?**
- Your buddy: {{buddy_name}} ({{buddy_email}})
- Your manager: {{manager_name}} ({{manager_email}})
- HR: {{hr_contact}}

Keep up the great work!

Best,
{{employer_name}}`,
        sendTime: { hour: 14, minute: 0 },
      },
      {
        stepNumber: 4,
        delayDays: 30,
        subject: "30 Days In: Your Onboarding Feedback",
        content: `Hi {{candidate_name}},

Congratulations on completing your first month at {{company_name}}!

**Your Progress:**
- Completed all onboarding modules
- Contributed to {{projects_count}} projects
- Built relationships with your team
- Demonstrated {{key_strengths}}

**What's Next:**
- 30-day review with {{manager_name}}
- Set goals for the next quarter
- Explore growth opportunities
- Continue building your impact

**We'd Love Your Feedback:**
How was your onboarding experience? Please take 5 minutes to complete our survey:
[Survey Link]

Your feedback helps us improve for future hires.

Thanks for being part of the team!

Best,
{{employer_name}}`,
        sendTime: { hour: 10, minute: 0 },
      },
    ],
  },
];

/**
 * Initialize pre-built templates in database
 */
export async function initializePrebuiltTemplates(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const template of PREBUILT_TEMPLATES) {
    const [existing] = (await db.execute(
      `SELECT id FROM campaignTemplates WHERE name = ? AND category = ?`,
      [template.name, template.category]
    )) as any;

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO campaignTemplates (name, description, category, sequence, totalSteps, estimatedDuration, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          template.name,
          template.description,
          template.category,
          JSON.stringify(template.sequence),
          template.totalSteps,
          template.estimatedDuration,
          template.isActive,
        ]
      );
    }
  }
}

/**
 * Get all campaign templates
 */
export async function getAllCampaignTemplates(category?: string): Promise<CampaignTemplate[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = category
    ? `SELECT * FROM campaignTemplates WHERE category = ? AND isActive = TRUE ORDER BY usageCount DESC, name ASC`
    : `SELECT * FROM campaignTemplates WHERE isActive = TRUE ORDER BY category ASC, usageCount DESC, name ASC`;

  const params = category ? [category] : [];
  const [results] = (await db.execute(query, params)) as any;

  return results.map((row: any) => ({
    ...row,
    sequence: JSON.parse(row.sequence),
  }));
}

/**
 * Launch a campaign from template
 */
export async function launchCampaign(
  employerId: number,
  templateId: number,
  campaignName: string,
  targetListId?: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get template
  const [templates] = (await db.execute(`SELECT * FROM campaignTemplates WHERE id = ?`, [templateId])) as any;

  if (templates.length === 0) {
    throw new Error("Campaign template not found");
  }

  // Create launch record
  const [result] = (await db.execute(
    `INSERT INTO campaignLaunches (employerId, campaignTemplateId, name, targetListId, status, currentStep)
     VALUES (?, ?, ?, ?, 'active', 0)`,
    [employerId, templateId, campaignName, targetListId || null]
  )) as any;

  // Increment usage count
  await db.execute(`UPDATE campaignTemplates SET usageCount = usageCount + 1 WHERE id = ?`, [templateId]);

  return result.insertId;
}

/**
 * Get employer's launched campaigns
 */
export async function getEmployerCampaigns(employerId: number, status?: string): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = status
    ? `SELECT cl.*, ct.name as templateName, ct.category, ct.totalSteps, ct.estimatedDuration
       FROM campaignLaunches cl
       JOIN campaignTemplates ct ON cl.campaignTemplateId = ct.id
       WHERE cl.employerId = ? AND cl.status = ?
       ORDER BY cl.launchedAt DESC`
    : `SELECT cl.*, ct.name as templateName, ct.category, ct.totalSteps, ct.estimatedDuration
       FROM campaignLaunches cl
       JOIN campaignTemplates ct ON cl.campaignTemplateId = ct.id
       WHERE cl.employerId = ?
       ORDER BY cl.launchedAt DESC`;

  const params = status ? [employerId, status] : [employerId];
  const [results] = (await db.execute(query, params)) as any;

  return results;
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: number,
  employerId: number,
  status: "active" | "paused" | "completed" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(`UPDATE campaignLaunches SET status = ?, updatedAt = NOW() WHERE id = ? AND employerId = ?`, [
    status,
    campaignId,
    employerId,
  ]);

  if (status === "completed" || status === "cancelled") {
    await db.execute(`UPDATE campaignLaunches SET completedAt = NOW() WHERE id = ?`, [campaignId]);
  }
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(employerId: number): Promise<{
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalEmailsSent: number;
  avgOpenRate: number;
  avgClickRate: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = (await db.execute(
    `SELECT 
       COUNT(*) as totalCampaigns,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCampaigns,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCampaigns,
       SUM(emailsSent) as totalEmailsSent,
       AVG(avgOpenRate) as avgOpenRate,
       AVG(avgClickRate) as avgClickRate
     FROM campaignLaunches
     WHERE employerId = ?`,
    [employerId]
  )) as any;

  return stats[0] || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalEmailsSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  };
}
