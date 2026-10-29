/**
 * Model Registry for BIC Hackathon Platform
 * Direct mapping of models from bic_hackathon_design backend (SQLAlchemy BaseDBModel subclasses)
 * Categorized strictly into:
 *   1. Normal (Customer / Public Facing)
 *   2. Private (Admin Panel Only)
 */

export const MODEL_VISIBILITY = {
  NORMAL: 'normal',
  PRIVATE: 'private'
};

export const BACKEND_MODELS = {
  // ==========================================
  // NORMAL / CUSTOMER-FACING MODELS
  // ==========================================
  Hackathon: {
    name: 'Hackathon',
    tableName: 'hackathons',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Core hackathon profile, schedule, event dates, themes, and official competition guidelines.',
    sourceFile: 'app/models/hackathons.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'title', type: 'String(100)', unique: true, required: true },
      { name: 'sub_heading', type: 'String(255)' },
      { name: 'version', type: 'String(50)' },
      { name: 'year', type: 'Integer' },
      { name: 'description', type: 'Text' },
      { name: 'venue', type: 'String(255)' },
      { name: 'start_date', type: 'DateTime(timezone=True)' },
      { name: 'end_date', type: 'DateTime(timezone=True)' },
      { name: 'event_time', type: 'String(50)' },
      { name: 'theme', type: 'String(255)' },
      { name: 'rules', type: 'JSON' },
      { name: 'registration_startdate', type: 'Date' },
      { name: 'registration_enddate', type: 'Date' },
      { name: 'minimum_team_size', type: 'Integer' },
      { name: 'max_team_size', type: 'Integer' },
      { name: 'is_tshirt_included', type: 'boolean', default: false },
      { name: 'created_by', type: 'ForeignKey("users.id")' }
    ]
  },

  Prize: {
    name: 'Prize',
    tableName: 'prizes',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Prize pool bounties, cash awards, and special track recognitions.',
    sourceFile: 'app/models/crm.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'prize_money', type: 'Numeric(10, 2)' },
      { name: 'title', type: 'String(100)', required: true },
      { name: 'description', type: 'Text' }
    ]
  },

  Challenge: {
    name: 'Challenge',
    tableName: 'challenges',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Hackathon problem statements, industry prompts, and technical challenge briefs.',
    sourceFile: 'app/models/crm.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'problem_statement', type: 'Text', required: true }
    ]
  },

  Schedule: {
    name: 'Schedule',
    tableName: 'schedules',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Hackathon timeline, phases, mentor check-ins, and demo schedules.',
    sourceFile: 'app/models/schedules.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'title', type: 'String(100)', required: true },
      { name: 'description', type: 'String(255)' },
      { name: 'start_time', type: 'DateTime(timezone=True)', required: true },
      { name: 'end_time', type: 'DateTime(timezone=True)', required: true },
      { name: 'status', type: 'String(50)', required: true },
      { name: 'image', type: 'String(500)' },
      { name: 'remarks', type: 'String(255)' },
      { name: 'created_by', type: 'ForeignKey("users.id")' }
    ]
  },

  ScheduleEvent: {
    name: 'ScheduleEvent',
    tableName: 'schedule_events',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Specific sub-events, workshop sessions, keynotes, and presentation slots.',
    sourceFile: 'app/models/schedules.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'schedule_id', type: 'ForeignKey("schedules.id")', required: true },
      { name: 'member_id', type: 'ForeignKey("users.id")', required: true },
      { name: 'description', type: 'String(255)' },
      { name: 'start_time', type: 'DateTime(timezone=True)' },
      { name: 'end_time', type: 'DateTime(timezone=True)' },
      { name: 'remarks', type: 'String(255)' },
      { name: 'has_completed', type: 'Boolean', default: false },
      { name: 'created_by', type: 'ForeignKey("users.id")' }
    ]
  },

  Sponsor: {
    name: 'Sponsor',
    tableName: 'sponsors',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Public partner brandings, company logos, social handles, and web domains.',
    sourceFile: 'app/models/sponsors.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'name', type: 'String(100)', unique: true, required: true },
      { name: 'description', type: 'Text' },
      { name: 'logo_url', type: 'String(255)' },
      { name: 'facebook_url', type: 'String(255)' },
      { name: 'instagram_url', type: 'String(255)' },
      { name: 'twitter_url', type: 'String(255)' },
      { name: 'website_url', type: 'String(255)' },
      { name: 'contact_email', type: 'String(255)' },
      { name: 'phone_number1', type: 'String(50)' },
      { name: 'phone_number2', type: 'String(50)' },
      { name: 'location', type: 'String(255)' },
      { name: 'service', type: 'Text' }
    ]
  },

  FAQs: {
    name: 'FAQs',
    tableName: 'faqs',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Frequently asked questions, participation rules, and eligibility answers.',
    sourceFile: 'app/models/crm.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'question', type: 'String(255)', required: true },
      { name: 'answer', type: 'Text', required: true }
    ]
  },

  ContactUs: {
    name: 'ContactUs',
    tableName: 'contact_us',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Public inquiry submission endpoint for incoming inquiries.',
    sourceFile: 'app/models/crm.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'name', type: 'String(100)', required: true },
      { name: 'email', type: 'String(255)', required: true },
      { name: 'subject', type: 'String(255)', required: true },
      { name: 'message', type: 'Text', required: true }
    ]
  },

  TermsAndConditions: {
    name: 'TermsAndConditions',
    tableName: 'terms_and_conditions',
    visibility: MODEL_VISIBILITY.NORMAL,
    description: 'Official contest rules, intellectual property ownership, and liability disclaimers.',
    sourceFile: 'app/models/crm.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'content', type: 'Text', required: true }
    ]
  },

  // ==========================================
  // PRIVATE / ADMIN-PANEL ONLY MODELS
  // ==========================================
  Sponsorship: {
    name: 'Sponsorship',
    tableName: 'sponsorships',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Confidential financial ledgers: paid vs pledged funds, contract notes, and tier benefits.',
    sourceFile: 'app/models/sponsors.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'sponsor_id', type: 'ForeignKey("sponsors.id")', required: true },
      { name: 'paid', type: 'Numeric(10, 2)', default: 0, required: true },
      { name: 'pledged', type: 'Numeric(10, 2)', default: 0, required: true },
      { name: 'type', type: 'String(50)', required: true },
      { name: 'service', type: 'String(255)' },
      { name: 'notes', type: 'Text' }
    ]
  },

  Department: {
    name: 'Department',
    tableName: 'departments',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Internal hackathon organizing committees (Logistics, Tech, Sponsorship, Hospitality).',
    sourceFile: 'app/models/organizers.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'title', type: 'String(100)', unique: true, required: true },
      { name: 'description', type: 'Text' }
    ]
  },

  Organizer: {
    name: 'Organizer',
    tableName: 'organizers',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Internal organizing staff, shift assignments, and departmental roles.',
    sourceFile: 'app/models/organizers.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'user_id', type: 'ForeignKey("users.id")', required: true },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'position', type: 'String(100)', required: true },
      { name: 'department_id', type: 'ForeignKey("departments.id")' },
      { name: 'order', type: 'Integer' },
      { name: 'status', type: 'String(50)', required: true }
    ]
  },

  OrgTask: {
    name: 'OrgTask',
    tableName: 'org_tasks',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Internal operational task tracker: assignees, deadlines, priority levels, and work links.',
    sourceFile: 'app/models/organizers.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'date_assigned', type: 'DateTime(timezone=True)' },
      { name: 'task', type: 'String(255)', required: true },
      { name: 'description', type: 'Text' },
      { name: 'department_id', type: 'ForeignKey("departments.id")' },
      { name: 'assigned_to', type: 'ForeignKey("users.id")' },
      { name: 'priority', type: 'String(50)', required: true },
      { name: 'deadline_date', type: 'DateTime(timezone=True)' },
      { name: 'status', type: 'String(50)', required: true },
      { name: 'completed_date', type: 'DateTime(timezone=True)' },
      { name: 'link', type: 'String(255)' }
    ]
  },

  User: {
    name: 'User',
    tableName: 'users',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Confidential user identity accounts, security credentials, telephone, and residency details.',
    sourceFile: 'app/models/users.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'username', type: 'String(100)', unique: true, required: true },
      { name: 'email', type: 'String(255)', unique: true, required: true },
      { name: 'first_name', type: 'String(255)' },
      { name: 'last_name', type: 'String(255)' },
      { name: 'password', type: 'String(255)', required: true, sensitive: true },
      { name: 'age', type: 'Integer' },
      { name: 'street', type: 'String(255)' },
      { name: 'address', type: 'String(255)' },
      { name: 'city_province', type: 'String(255)' },
      { name: 'college', type: 'String(255)' },
      { name: 'semester', type: 'String(50)' },
      { name: 'phone_number', type: 'String(20)' },
      { name: 'role_id', type: 'ForeignKey("users_roles.id")' }
    ]
  },

  Role: {
    name: 'Role',
    tableName: 'users_roles',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'System access control levels (Admin, Organizer, Judge, Participant, Volunteer).',
    sourceFile: 'app/models/users.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'name', type: 'String(100)', unique: true, required: true },
      { name: 'description', type: 'Text' }
    ]
  },

  Participant: {
    name: 'Participant',
    tableName: 'participants',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Confidential participant profiles: medical needs, food allergies, resume links, and merchandise sizes.',
    sourceFile: 'app/models/teams.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'user_id', type: 'ForeignKey("users.id")', required: true },
      { name: 'team_id', type: 'ForeignKey("teams.id")' },
      { name: 'cv', type: 'String(255)' },
      { name: 'food_preference', type: 'String(100)' },
      { name: 'tshirt_size', type: 'String(20)' },
      { name: 'medications', type: 'Text', sensitive: true },
      { name: 'extra_details', type: 'Text' },
      { name: 'github_link', type: 'String(255)' }
    ]
  },

  Team: {
    name: 'Team',
    tableName: 'teams',
    visibility: MODEL_VISIBILITY.NORMAL, // Base team name & repo is public, registrations & checkins are private
    description: 'Registered hacking teams, institutional affiliations, and submitted repository links.',
    sourceFile: 'app/models/teams.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'name', type: 'String(100)', required: true },
      { name: 'college_org', type: 'String(255)' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'status', type: 'String(50)', required: true },
      { name: 'has_agreed_to_terms', type: 'boolean', default: false },
      { name: 'github_repo_link', type: 'String(255)' }
    ]
  },

  TeamMember: {
    name: 'TeamMember',
    tableName: 'team_members',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Internal team roster mapping, member statuses, and project roles.',
    sourceFile: 'app/models/teams.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'team_id', type: 'ForeignKey("teams.id")', required: true },
      { name: 'user_id', type: 'ForeignKey("users.id")', required: true },
      { name: 'status', type: 'String(50)', required: true },
      { name: 'role', type: 'String(50)', required: true }
    ]
  },

  Registration: {
    name: 'Registration',
    tableName: 'registrations',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Internal evaluation workflow for team applications (Pending, Approved, Waitlisted, Rejected).',
    sourceFile: 'app/models/teams.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'team_id', type: 'ForeignKey("teams.id")', required: true },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'status', type: 'String(50)', required: true }
    ]
  },

  CheckIn: {
    name: 'CheckIn',
    tableName: 'check_ins',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'On-site venue entry control and physical desk check-in verification log.',
    sourceFile: 'app/models/teams.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'team_id', type: 'ForeignKey("teams.id")', required: true },
      { name: 'checkin_time', type: 'DateTime(timezone=True)', required: true }
    ]
  },

  Table: {
    name: 'Table',
    tableName: 'tables',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Physical workstation desk and lab room allocation for participating squads.',
    sourceFile: 'app/models/teams.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'hackathon_id', type: 'ForeignKey("hackathons.id")', required: true },
      { name: 'team_id', type: 'ForeignKey("teams.id")', required: true },
      { name: 'status', type: 'String(50)', required: true },
      { name: 'room_number', type: 'String(50)', required: true }
    ]
  },

  Notification: {
    name: 'Notification',
    tableName: 'notifications',
    visibility: MODEL_VISIBILITY.PRIVATE,
    description: 'Admin broadcast dispatches, SMS/Email queue notifications, and targeted notices.',
    sourceFile: 'app/models/notifications.py',
    fields: [
      { name: 'id', type: 'uuid.UUID', primaryKey: true },
      { name: 'is_active', type: 'boolean', default: true },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' },
      { name: 'user_id', type: 'ForeignKey("users.id")' },
      { name: 'recipients', type: 'String(255)' },
      { name: 'message', type: 'Text', required: true },
      { name: 'read_at', type: 'DateTime(timezone=True)' }
    ]
  }
};

/**
 * Returns list of normal (customer-facing) models
 */
export function getNormalModels() {
  return Object.values(BACKEND_MODELS).filter(m => m.visibility === MODEL_VISIBILITY.NORMAL);
}

/**
 * Returns list of private (admin panel only) models
 */
export function getPrivateModels() {
  return Object.values(BACKEND_MODELS).filter(m => m.visibility === MODEL_VISIBILITY.PRIVATE);
}
