import React, { createContext, useContext, useState } from 'react';

// Import all model JSON datasets directly
import hackathonData from '../data/json/hackathon.json';
import prizesData from '../data/json/prizes.json';
import challengesData from '../data/json/challenges.json';
import schedulesData from '../data/json/schedules.json';
import scheduleEventsData from '../data/json/schedule_events.json';
import sponsorsData from '../data/json/sponsors.json';
import faqsData from '../data/json/faqs.json';
import contactUsData from '../data/json/contact_us.json';
import termsData from '../data/json/terms.json';
import teamsData from '../data/json/teams.json';

// Private Admin Datasets
import sponsorshipsData from '../data/json/sponsorships.json';
import departmentsData from '../data/json/departments.json';
import organizersData from '../data/json/organizers.json';
import orgTasksData from '../data/json/org_tasks.json';
import usersData from '../data/json/users.json';
import rolesData from '../data/json/roles.json';
import participantsData from '../data/json/participants.json';
import teamMembersData from '../data/json/team_members.json';
import registrationsData from '../data/json/registrations.json';
import checkInsData from '../data/json/check_ins.json';
import tablesData from '../data/json/tables.json';
import notificationsData from '../data/json/notifications.json';

const HackathonContext = createContext();

export function HackathonProvider({ children }) {
  // Navigation View State: 'customer' (public portal) | 'admin' (private operations) | 'architecture' (model explorer)
  const [currentView, setCurrentView] = useState('customer');
  const [adminTab, setAdminTab] = useState('overview'); // overview, sponsorships, tasks, teams, participants, checkins, tables, notifications, export
  
  // Normal / Public Models State
  const [hackathon, setHackathon] = useState(hackathonData);
  const [prizes, setPrizes] = useState(prizesData);
  const [challenges, setChallenges] = useState(challengesData);
  const [schedules, setSchedules] = useState(schedulesData);
  const [scheduleEvents, setScheduleEvents] = useState(scheduleEventsData);
  const [sponsors, setSponsors] = useState(sponsorsData);
  const [faqs, setFaqs] = useState(faqsData);
  const [contactUsList, setContactUsList] = useState(contactUsData);
  const [terms, setTerms] = useState(termsData);
  const [teams, setTeams] = useState(teamsData);

  // Private / Admin Models State
  const [sponsorships, setSponsorships] = useState(sponsorshipsData);
  const [departments, setDepartments] = useState(departmentsData);
  const [organizers, setOrganizers] = useState(organizersData);
  const [orgTasks, setOrgTasks] = useState(orgTasksData);
  const [users, setUsers] = useState(usersData);
  const [roles, setRoles] = useState(rolesData);
  const [participants, setParticipants] = useState(participantsData);
  const [teamMembers, setTeamMembers] = useState(teamMembersData);
  const [registrations, setRegistrations] = useState(registrationsData);
  const [checkIns, setCheckIns] = useState(checkInsData);
  const [tables, setTables] = useState(tablesData);
  const [notifications, setNotifications] = useState(notificationsData);

  // Global Toast Alert State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // Data Action Helpers
  // -------------------------------------------------------------

  // Customer: Register new squad
  const registerTeam = (teamFormData) => {
    const newTeamId = `team-${Date.now().toString().slice(-4)}`;
    const newUserId = `usr-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const newTeam = {
      id: newTeamId,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      name: teamFormData.teamName,
      college_org: teamFormData.college,
      hackathon_id: hackathon.id,
      status: 'pending',
      github_repo_link: teamFormData.githubRepo || null,
      project_title: teamFormData.projectTitle || 'Untitled Prototype',
      track: teamFormData.track || 'Autonomous AI & HealthTech'
    };

    // Sensitive User Account
    const newUser = {
      id: newUserId,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      username: teamFormData.leaderEmail.split('@')[0],
      email: teamFormData.leaderEmail,
      first_name: teamFormData.leaderName.split(' ')[0] || teamFormData.leaderName,
      last_name: teamFormData.leaderName.split(' ')[1] || '',
      password: '$2b$12$autogen_hash_temp',
      phone_number: teamFormData.phone,
      college: teamFormData.college,
      role_id: 'rol-03'
    };

    // Private Participant details (diet, medical, resume)
    const newParticipant = {
      id: `par-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      hackathon_id: hackathon.id,
      user_id: newUserId,
      team_id: newTeamId,
      cv: teamFormData.cvLink || null,
      food_preference: teamFormData.foodPreference || 'Standard',
      tshirt_size: teamFormData.tshirtSize || 'L',
      medications: teamFormData.medications || 'None declared',
      extra_details: teamFormData.extraDetails || null,
      github_link: teamFormData.githubLink || null
    };

    // Private Registration Review Ticket
    const newRegistration = {
      id: `reg-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      team_id: newTeamId,
      hackathon_id: hackathon.id,
      status: 'pending'
    };

    // Private TeamMember mapping
    const newTeamMember = {
      id: `tmb-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      team_id: newTeamId,
      user_id: newUserId,
      status: 'active',
      role: 'leader'
    };

    setTeams(prev => [newTeam, ...prev]);
    setUsers(prev => [newUser, ...prev]);
    setParticipants(prev => [newParticipant, ...prev]);
    setRegistrations(prev => [newRegistration, ...prev]);
    setTeamMembers(prev => [newTeamMember, ...prev]);

    showToast(`Team "${teamFormData.teamName}" registered successfully! Awaiting admin review.`);
    return newTeam;
  };

  // Customer: Submit contact inquiry
  const submitContactInquiry = (inquiry) => {
    const newInquiry = {
      id: `cnt-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      hackathon_id: hackathon.id,
      ...inquiry
    };
    setContactUsList(prev => [newInquiry, ...prev]);
    showToast('Your message has been received by our hackathon organizers.');
  };

  // Admin: Approve/Reject Team Registration
  const updateRegistrationStatus = (teamId, status) => {
    setRegistrations(prev =>
      prev.map(r => r.team_id === teamId ? { ...r, status, updated_at: new Date().toISOString() } : r)
    );
    setTeams(prev =>
      prev.map(t => t.id === teamId ? { ...t, status, updated_at: new Date().toISOString() } : t)
    );
    showToast(`Team registration updated to "${status.toUpperCase()}"`);
  };

  // Admin: Check in a team
  const checkInTeam = (teamId) => {
    const existing = checkIns.find(c => c.team_id === teamId);
    if (existing) {
      showToast('This team is already checked in.', 'info');
      return;
    }
    const newCheckIn = {
      id: `chk-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      hackathon_id: hackathon.id,
      team_id: teamId,
      checkin_time: new Date().toISOString()
    };
    setCheckIns(prev => [newCheckIn, ...prev]);
    showToast('Team badge scanned and successfully checked in!');
  };

  // Admin: Assign Table / Room
  const assignTable = (teamId, roomNumber) => {
    const existing = tables.find(t => t.team_id === teamId);
    if (existing) {
      setTables(prev =>
        prev.map(t => t.team_id === teamId ? { ...t, room_number: roomNumber, updated_at: new Date().toISOString() } : t)
      );
    } else {
      const newTable = {
        id: `tbl-${Date.now().toString().slice(-4)}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        hackathon_id: hackathon.id,
        team_id: teamId,
        status: 'assigned',
        room_number: roomNumber
      };
      setTables(prev => [newTable, ...prev]);
    }
    showToast(`Workstation table allocated: ${roomNumber}`);
  };

  // Admin: Add / Update Org Task
  const addOrgTask = (taskData) => {
    const newTask = {
      id: `tsk-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      date_assigned: new Date().toISOString(),
      status: 'pending',
      ...taskData
    };
    setOrgTasks(prev => [newTask, ...prev]);
    showToast('Operational task dispatched to organizer queue.');
  };

  const updateOrgTaskStatus = (taskId, status) => {
    setOrgTasks(prev =>
      prev.map(t => t.id === taskId ? {
        ...t,
        status,
        completed_date: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      } : t)
    );
    showToast(`Task status moved to ${status}`);
  };

  // Admin: Record sponsorship installment payment
  const recordSponsorshipPayment = (sponsorshipId, paymentAmount) => {
    setSponsorships(prev =>
      prev.map(s => {
        if (s.id === sponsorshipId) {
          const newPaid = Number(s.paid) + Number(paymentAmount);
          return {
            ...s,
            paid: newPaid,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      })
    );
    showToast(`Sponsorship payment of NPR ${paymentAmount.toLocaleString()} recorded.`);
  };

  // Admin: Dispatch notification broadcast
  const sendBroadcastNotification = (message, recipients = 'all_participants') => {
    const newNotif = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
      recipients,
      message,
      read_at: null
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(`Notification broadcasted to ${recipients.replace('_', ' ')}!`);
  };

  // Aggregated data dictionary for JSON exports
  const allDataStore = {
    Hackathon: hackathon,
    Prize: prizes,
    Challenge: challenges,
    Schedule: schedules,
    ScheduleEvent: scheduleEvents,
    Sponsor: sponsors,
    FAQs: faqs,
    ContactUs: contactUsList,
    TermsAndConditions: terms,
    Team: teams,
    Sponsorship: sponsorships,
    Department: departments,
    Organizer: organizers,
    OrgTask: orgTasks,
    User: users,
    Role: roles,
    Participant: participants,
    TeamMember: teamMembers,
    Registration: registrations,
    CheckIn: checkIns,
    Table: tables,
    Notification: notifications
  };

  const value = {
    currentView,
    setCurrentView,
    adminTab,
    setAdminTab,
    toast,
    showToast,
    // Datasets
    hackathon,
    setHackathon,
    prizes,
    challenges,
    schedules,
    scheduleEvents,
    sponsors,
    faqs,
    contactUsList,
    terms,
    teams,
    sponsorships,
    departments,
    organizers,
    orgTasks,
    users,
    roles,
    participants,
    teamMembers,
    registrations,
    checkIns,
    tables,
    notifications,
    // Operations
    registerTeam,
    submitContactInquiry,
    updateRegistrationStatus,
    checkInTeam,
    assignTable,
    addOrgTask,
    updateOrgTaskStatus,
    recordSponsorshipPayment,
    sendBroadcastNotification,
    allDataStore
  };

  return (
    <HackathonContext.Provider value={value}>
      {children}
    </HackathonContext.Provider>
  );
}

export function useHackathon() {
  const context = useContext(HackathonContext);
  if (!context) {
    throw new Error('useHackathon must be used within a HackathonProvider');
  }
  return context;
}
