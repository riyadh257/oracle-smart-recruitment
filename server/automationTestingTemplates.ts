/**
 * Automation Testing Templates Module
 * Pre-configured test scenario templates for common workflows
 */

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  scenarioType: 'candidate_application' | 'interview_scheduling' | 'email_campaign' | 'engagement_tracking' | 'ab_testing' | 'full_workflow';
  triggers: {
    name: string;
    triggerType: string;
    delayMinutes: number;
    triggerConditions?: Record<string, any>;
  }[];
  campaigns: {
    name: string;
    campaignType: 'email' | 'sms' | 'notification' | 'multi_channel';
    content?: Record<string, any>;
  }[];
  sampleDataConfig: {
    candidateCount: number;
    jobCount: number;
    generateApplications: boolean;
  };
}

export const TEST_TEMPLATES: TestTemplate[] = [
  {
    id: 'candidate_onboarding',
    name: 'New Candidate Onboarding Flow',
    description: 'Tests the complete candidate onboarding workflow from application to first interview',
    scenarioType: 'full_workflow',
    triggers: [
      {
        name: 'Application Submitted',
        triggerType: 'application_submitted',
        delayMinutes: 0
      },
      {
        name: 'Application Reviewed',
        triggerType: 'manual',
        delayMinutes: 60
      },
      {
        name: 'Interview Scheduled',
        triggerType: 'interview_scheduled',
        delayMinutes: 0
      }
    ],
    campaigns: [
      {
        name: 'Application Confirmation Email',
        campaignType: 'email',
        content: {
          subject: 'Application Received',
          template: 'application_confirmation'
        }
      },
      {
        name: 'Interview Invitation Email',
        campaignType: 'email',
        content: {
          subject: 'Interview Invitation',
          template: 'interview_invitation'
        }
      },
      {
        name: 'Interview Reminder SMS',
        campaignType: 'sms',
        content: {
          template: 'interview_reminder'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 5,
      jobCount: 2,
      generateApplications: true
    }
  },
  {
    id: 'interview_reminder_campaign',
    name: 'Interview Reminder Campaign Test',
    description: 'Tests automated interview reminder system across multiple channels',
    scenarioType: 'interview_scheduling',
    triggers: [
      {
        name: '24 Hour Reminder',
        triggerType: 'time_based',
        delayMinutes: 1440 // 24 hours
      },
      {
        name: '2 Hour Reminder',
        triggerType: 'time_based',
        delayMinutes: 120
      },
      {
        name: '30 Minute Reminder',
        triggerType: 'time_based',
        delayMinutes: 30
      }
    ],
    campaigns: [
      {
        name: '24h Email Reminder',
        campaignType: 'email',
        content: {
          subject: 'Interview Tomorrow',
          template: 'interview_reminder_24h'
        }
      },
      {
        name: '2h SMS Reminder',
        campaignType: 'sms',
        content: {
          template: 'interview_reminder_2h'
        }
      },
      {
        name: '30m Push Notification',
        campaignType: 'notification',
        content: {
          title: 'Interview Starting Soon',
          template: 'interview_reminder_30m'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 3,
      jobCount: 2,
      generateApplications: true
    }
  },
  {
    id: 'engagement_tracking',
    name: 'Candidate Engagement Tracking',
    description: 'Tests engagement scoring and re-engagement campaigns',
    scenarioType: 'engagement_tracking',
    triggers: [
      {
        name: 'Low Engagement Detected',
        triggerType: 'engagement_score_change',
        delayMinutes: 0,
        triggerConditions: {
          scoreThreshold: 30,
          direction: 'below'
        }
      },
      {
        name: 'High Engagement Detected',
        triggerType: 'engagement_score_change',
        delayMinutes: 0,
        triggerConditions: {
          scoreThreshold: 80,
          direction: 'above'
        }
      }
    ],
    campaigns: [
      {
        name: 'Re-engagement Email',
        campaignType: 'email',
        content: {
          subject: 'We Miss You!',
          template: 'reengagement_email'
        }
      },
      {
        name: 'High Engagement Follow-up',
        campaignType: 'email',
        content: {
          subject: 'Next Steps in Your Journey',
          template: 'high_engagement_followup'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 10,
      jobCount: 3,
      generateApplications: false
    }
  },
  {
    id: 'ab_testing_campaign',
    name: 'A/B Testing Email Campaign',
    description: 'Tests A/B testing functionality for email campaigns',
    scenarioType: 'ab_testing',
    triggers: [
      {
        name: 'Campaign Start',
        triggerType: 'manual',
        delayMinutes: 0
      }
    ],
    campaigns: [
      {
        name: 'Variant A - Formal Tone',
        campaignType: 'email',
        content: {
          subject: 'Professional Opportunity Awaits',
          template: 'formal_outreach',
          variant: 'A'
        }
      },
      {
        name: 'Variant B - Casual Tone',
        campaignType: 'email',
        content: {
          subject: 'Great Job Match for You!',
          template: 'casual_outreach',
          variant: 'B'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 20,
      jobCount: 2,
      generateApplications: false
    }
  },
  {
    id: 'feedback_collection',
    name: 'Post-Interview Feedback Collection',
    description: 'Tests automated feedback request workflow after interviews',
    scenarioType: 'interview_scheduling',
    triggers: [
      {
        name: 'Interview Completed',
        triggerType: 'interview_completed',
        delayMinutes: 0
      },
      {
        name: 'Feedback Reminder',
        triggerType: 'time_based',
        delayMinutes: 1440 // 24 hours
      }
    ],
    campaigns: [
      {
        name: 'Feedback Request Email',
        campaignType: 'email',
        content: {
          subject: 'Share Your Interview Experience',
          template: 'feedback_request'
        }
      },
      {
        name: 'Feedback Reminder',
        campaignType: 'email',
        content: {
          subject: 'Reminder: Share Your Feedback',
          template: 'feedback_reminder'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 5,
      jobCount: 2,
      generateApplications: true
    }
  },
  {
    id: 'bulk_application_processing',
    name: 'Bulk Application Processing',
    description: 'Tests high-volume application processing and auto-matching',
    scenarioType: 'candidate_application',
    triggers: [
      {
        name: 'Application Received',
        triggerType: 'application_submitted',
        delayMinutes: 0
      },
      {
        name: 'Auto-Match Complete',
        triggerType: 'manual',
        delayMinutes: 5
      }
    ],
    campaigns: [
      {
        name: 'Application Acknowledgment',
        campaignType: 'email',
        content: {
          subject: 'Application Received',
          template: 'bulk_application_ack'
        }
      },
      {
        name: 'Match Notification',
        campaignType: 'multi_channel',
        content: {
          subject: 'Great Match Found!',
          template: 'match_notification'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 15,
      jobCount: 5,
      generateApplications: true
    }
  },
  {
    id: 'nurture_campaign',
    name: 'Talent Pool Nurture Campaign',
    description: 'Tests long-term candidate nurturing with periodic touchpoints',
    scenarioType: 'email_campaign',
    triggers: [
      {
        name: 'Week 1 Touchpoint',
        triggerType: 'time_based',
        delayMinutes: 10080 // 7 days
      },
      {
        name: 'Week 2 Touchpoint',
        triggerType: 'time_based',
        delayMinutes: 20160 // 14 days
      },
      {
        name: 'Month 1 Touchpoint',
        triggerType: 'time_based',
        delayMinutes: 43200 // 30 days
      }
    ],
    campaigns: [
      {
        name: 'Week 1 - Company Culture',
        campaignType: 'email',
        content: {
          subject: 'Learn About Our Culture',
          template: 'nurture_week1'
        }
      },
      {
        name: 'Week 2 - Career Growth',
        campaignType: 'email',
        content: {
          subject: 'Career Growth Opportunities',
          template: 'nurture_week2'
        }
      },
      {
        name: 'Month 1 - New Opportunities',
        campaignType: 'email',
        content: {
          subject: 'New Roles That Match Your Profile',
          template: 'nurture_month1'
        }
      }
    ],
    sampleDataConfig: {
      candidateCount: 10,
      jobCount: 3,
      generateApplications: false
    }
  }
];

/**
 * Get all available templates
 */
export function getAllTemplates(): TestTemplate[] {
  return TEST_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TestTemplate | undefined {
  return TEST_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by scenario type
 */
export function getTemplatesByType(scenarioType: string): TestTemplate[] {
  return TEST_TEMPLATES.filter(t => t.scenarioType === scenarioType);
}
