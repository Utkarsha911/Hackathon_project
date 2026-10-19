import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  logout,
  formatThrottleMessage
} from '../services/api';

// Private Admin Fallback Datasets (for standalone admin tools if backend is offline)
import departmentsData from '../data/json/departments.json';
import orgTasksData from '../data/json/org_tasks.json';
import usersData from '../data/json/users.json';
import rolesData from '../data/json/roles.json';
import teamMembersData from '../data/json/team_members.json';
import notificationsData from '../data/json/notifications.json';

const HackathonContext = createContext();

export function HackathonProvider({ children }) {
  // Navigation View State: 'customer' (public portal) | 'admin' (private operations) | 'architecture' (model explorer)
  const [currentView, setCurrentView] = useState('customer');
  const [adminTab, setAdminTab] = useState('overview'); // overview, sponsorships, tasks, teams, participants, checkins, tables, notifications, export
  
  // API Connection State (strictly fetched from API)
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Normal / Public Models State (NO static data - fetched directly from API)
  const [hackathon, setHackathon] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [contactUsList, setContactUsList] = useState([]);
  const [terms, setTerms] = useState([]);
  const [teams, setTeams] = useState([]);

  // Private / Admin Models State (populated from API)
  const [sponsorships, setSponsorships] = useState([]);
  const [departments, setDepartments] = useState(departmentsData || []);
  const [organizers, setOrganizers] = useState([]);
  const [orgTasks, setOrgTasks] = useState(orgTasksData || []);
  const [users, setUsers] = useState(usersData || []);
  const [roles, setRoles] = useState(rolesData || []);
  const [participants, setParticipants] = useState([]);
  const [teamMembers, setTeamMembers] = useState(teamMembersData || []);
  const [registrations, setRegistrations] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [tables, setTables] = useState([]);
  const [notifications, setNotifications] = useState(notificationsData || []);

  // Schedule Event Attendances state (tracking checkins per schedule event session)
  const [eventAttendances, setEventAttendances] = useState([
    {
      id: 'att-001',
      schedule_event_id: 'sev-01',
      user_id: 'usr-005',
      scanned_at: '2026-11-14T08:30:00Z',
      notes: 'Gate 1 QR Scan Verified'
    },
    {
      id: 'att-002',
      schedule_event_id: 'sev-01',
      user_id: 'usr-006',
      scanned_at: '2026-11-14T08:45:00Z',
      notes: 'Gate 2 QR Scan Verified'
    }
  ]);

  // Global Toast Alert State
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Authenticated Current User State (for normal users outside and admins)
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());

  const closeToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ id: Date.now(), message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      setCurrentUserState(null);
      showToast('You have been logged out.', 'info');
    };

    const handleUserUpdated = (e) => {
      setCurrentUserState(e?.detail || getCurrentUser());
    };

    const handleAuthLogin = (e) => {
      const u = e?.detail?.user || getCurrentUser();
      setCurrentUserState(u);
      showToast(`Welcome back, ${u?.first_name || u?.email || 'Hacker'}!`, 'success');
    };

    window.addEventListener('bic_auth_logout', handleAuthLogout);
    window.addEventListener('bic_user_updated', handleUserUpdated);
    window.addEventListener('bic_auth_login', handleAuthLogin);

    return () => {
      window.removeEventListener('bic_auth_logout', handleAuthLogout);
      window.removeEventListener('bic_user_updated', handleUserUpdated);
      window.removeEventListener('bic_auth_login', handleAuthLogin);
    };
  }, [showToast]);

  const loginWithGoogle = async (token) => {
    const res = await api.users.googleLogin(token);
    const u = res?.user || getCurrentUser();
    setCurrentUserState(u);
    return res;
  };

  const logoutUser = () => {
    logout();
    setCurrentUserState(null);
  };

  // -------------------------------------------------------------
  // Real-time API Synchronizer with Graceful Fallback
  // -------------------------------------------------------------
  const refreshData = useCallback(async () => {
    setIsLoadingApi(true);
    let connected = false;

    try {
      // 0. Primary Call: GET /api/v1/hackathons/current-hackathon/
      const currentDetails = await (api.hackathons.getCurrentHackathon
        ? api.hackathons.getCurrentHackathon()
        : api.hackathons.getCurrentDetails()
      ).catch((err) => {
        console.info('Current hackathon endpoint not reachable, trying fallback:', err?.message);
        return null;
      });

      let hasEmbeddedRelations = false;

      if (currentDetails && typeof currentDetails === 'object' && currentDetails.id) {
        setHackathon(prev => ({ ...prev, ...currentDetails }));
        connected = true;

        if (Array.isArray(currentDetails.prizes)) {
          setPrizes(currentDetails.prizes);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.challenges) && currentDetails.challenges.length > 0) {
          setChallenges(currentDetails.challenges);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.schedules) && currentDetails.schedules.length > 0) {
          setSchedules(currentDetails.schedules);
          const extractedEvents = [];
          currentDetails.schedules.forEach(s => {
            if (Array.isArray(s.events)) {
              extractedEvents.push(...s.events);
            }
          });
          if (extractedEvents.length > 0) {
            setScheduleEvents(extractedEvents);
          }
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.sponsorships) && currentDetails.sponsorships.length > 0) {
          setSponsorships(currentDetails.sponsorships);
          const extractedSponsors = currentDetails.sponsorships
            .filter(sp => sp.sponsor)
            .map(sp => ({
              ...sp.sponsor,
              sponsorship_id: sp.id,
              tier: sp.type,
              service: sp.service || sp.sponsor.service,
              pledged: sp.pledged,
              paid: sp.paid,
            }));
          if (extractedSponsors.length > 0) {
            setSponsors(extractedSponsors);
          }
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.faqs)) {
          setFaqs(currentDetails.faqs);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.organizers)) {
          setOrganizers(currentDetails.organizers);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.teams) && currentDetails.teams.length > 0) {
          setTeams(currentDetails.teams);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.participants) && currentDetails.participants.length > 0) {
          setParticipants(currentDetails.participants);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.registrations) && currentDetails.registrations.length > 0) {
          setRegistrations(currentDetails.registrations);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.check_ins) && currentDetails.check_ins.length > 0) {
          setCheckIns(currentDetails.check_ins);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.tables) && currentDetails.tables.length > 0) {
          setTables(currentDetails.tables);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.terms_and_conditions) && currentDetails.terms_and_conditions.length > 0) {
          setTerms(currentDetails.terms_and_conditions);
          hasEmbeddedRelations = true;
        }

        if (Array.isArray(currentDetails.contact_us) && currentDetails.contact_us.length > 0) {
          setContactUsList(currentDetails.contact_us);
          hasEmbeddedRelations = true;
        }
      } else {
        // Fallback: Query hackathons list
        const hackathonsRes = await api.hackathons.getAll().catch(() => null);
        const list = Array.isArray(hackathonsRes)
          ? hackathonsRes
          : Array.isArray(hackathonsRes?.results)
          ? hackathonsRes.results
          : [];
        if (list.length > 0) {
          setHackathon(prev => ({ ...prev, ...list[0] }));
          connected = true;
        }
      }

      // If modular relations are not bundled in current-hackathon, query modular endpoints
      if (!hasEmbeddedRelations) {

        const prizesRes = await api.crm.getPrizes().catch(() => null);
        const prizesList = Array.isArray(prizesRes)
          ? prizesRes
          : Array.isArray(prizesRes?.results)
          ? prizesRes.results
          : [];
        if (prizesList.length > 0) {
          setPrizes(prizesList);
          connected = true;
        }

        const challengesRes = await api.crm.getChallenges().catch(() => null);
        if (Array.isArray(challengesRes) && challengesRes.length > 0) {
          setChallenges(challengesRes);
          connected = true;
        }

        const faqsRes = await api.crm.getFaqs().catch(() => null);
        const faqsList = Array.isArray(faqsRes)
          ? faqsRes
          : Array.isArray(faqsRes?.results)
          ? faqsRes.results
          : [];
        if (faqsList.length > 0) {
          setFaqs(faqsList);
          connected = true;
        }

        const termsRes = await api.crm.getTerms().catch(() => null);
        if (Array.isArray(termsRes) && termsRes.length > 0) {
          setTerms(termsRes);
          connected = true;
        }

        const sponsorsRes = await api.sponsors.getAll().catch(() => null);
        const sponsorsList = Array.isArray(sponsorsRes)
          ? sponsorsRes
          : Array.isArray(sponsorsRes?.results)
          ? sponsorsRes.results
          : [];
        if (sponsorsList.length > 0) {
          setSponsors(sponsorsList);
          connected = true;
        }

        const sponsorshipsRes = await api.sponsors.getPackages().catch(() => null);
        const packagesList = Array.isArray(sponsorshipsRes)
          ? sponsorshipsRes
          : Array.isArray(sponsorshipsRes?.results)
          ? sponsorshipsRes.results
          : [];
        if (packagesList.length > 0) {
          setSponsorships(packagesList);
          connected = true;
        }

        // Only fetch generic schedules if current-hackathon did not embed schedules
        if (!currentDetails?.schedules || currentDetails.schedules.length === 0) {
          const schedulesRes = await api.schedules.getAll().catch(() => null);
          if (Array.isArray(schedulesRes) && schedulesRes.length > 0) {
            setSchedules(schedulesRes);
            const extractedEvents = [];
            schedulesRes.forEach(s => {
              if (Array.isArray(s.events)) {
                extractedEvents.push(...s.events);
              }
            });
            if (extractedEvents.length > 0) {
              setScheduleEvents(extractedEvents);
            }
            connected = true;
          }
        }

        const teamsRes = await api.teams.getAll().catch(() => null);
        const teamsList = Array.isArray(teamsRes)
          ? teamsRes
          : Array.isArray(teamsRes?.results)
          ? teamsRes.results
          : [];
        if (teamsList.length > 0) {
          setTeams(teamsList);
          connected = true;
        }

        const registrationsRes = await api.teams.getRegistrations().catch(() => null);
        if (Array.isArray(registrationsRes) && registrationsRes.length > 0) {
          setRegistrations(registrationsRes);
          connected = true;
        }

        const tablesRes = await api.teams.getTables().catch(() => null);
        if (Array.isArray(tablesRes) && tablesRes.length > 0) {
          setTables(tablesRes);
          connected = true;
        }

        const checkInsRes = await api.teams.getCheckIns().catch(() => null);
        if (Array.isArray(checkInsRes) && checkInsRes.length > 0) {
          setCheckIns(checkInsRes);
          connected = true;
        }
      }

      // Users sync (if available)
      const unwrapList = (data) => (Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : null));

      const usersRes = await api.users.getAll().catch(() => null);
      const parsedUsers = unwrapList(usersRes);
      if (parsedUsers && parsedUsers.length > 0) {
        setUsers(parsedUsers);
        connected = true;
      }

      setIsApiConnected(connected);
    } catch (err) {
      console.warn('API sync completed with local fallbacks active:', err);
      setIsApiConnected(false);
    } finally {
      setIsLoadingApi(false);
    }
  }, []);

  useEffect(() => {
    // Avoid calling unnecessary customer portal APIs when accessing admin panel
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/admin-control-site') || window.location.pathname.startsWith('/admin'))
    ) {
      return;
    }
    refreshData();
  }, [refreshData]);

  // -------------------------------------------------------------
  // Data Action Helpers (Sync with Backend + Local Optimistic Update)
  // -------------------------------------------------------------

  // Customer: Register new squad
  const registerTeam = async (teamFormData) => {
    let collegeWebsite = teamFormData.college_website?.trim() || '';
    if (collegeWebsite && !/^https?:\/\//i.test(collegeWebsite)) {
      collegeWebsite = `https://${collegeWebsite}`;
    }

    const payload = {
      name: (teamFormData.name || teamFormData.teamName || '').trim(),
      college_name: (teamFormData.college_name || teamFormData.college || '').trim(),
      affilated_university: (teamFormData.affilated_university || '').trim(),
      college_address: (teamFormData.college_address || '').trim(),
      college_website: collegeWebsite || '',
      coordinator_phone: (teamFormData.coordinator_phone || teamFormData.phone || '').trim(),
      coordinator_email: (teamFormData.coordinator_email || teamFormData.leaderEmail || '').trim(),
      no_of_members: Number(teamFormData.no_of_members) || 1
    };

    const createdTeam = await api.hackathons.teams.create(payload);

    if (createdTeam && createdTeam.id) {
      setTeams((prev) => [createdTeam, ...(prev || [])]);
    }

    showToast(`Team "${payload.name}" registered successfully! Awaiting review.`, 'success');
    return createdTeam;
  };

  // Customer: Submit contact inquiry
  const submitContactInquiry = async (inquiry) => {
    const payload = {
      name: inquiry.name?.trim(),
      email: inquiry.email?.trim(),
      message: inquiry.subject?.trim()
        ? `[${inquiry.subject.trim()}] ${inquiry.message?.trim()}`
        : inquiry.message?.trim()
    };

    try {
      const res = await api.crm.submitContact(payload);
      const newInquiry = {
        id: res?.id || `cnt-${Date.now().toString().slice(-4)}`,
        status: res?.status || 'new',
        created_at: res?.created_at || new Date().toISOString(),
        updated_at: res?.updated_at || new Date().toISOString(),
        ...payload
      };
      setContactUsList(prev => [newInquiry, ...prev]);
      showToast('Your message has been received by our hackathon organizers.', 'success');
      return { success: true, data: res };
    } catch (err) {
      const isThrottled =
        err?.status === 429 ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('throttled')) ||
        (typeof err?.data?.detail === 'string' && err.data.detail.toLowerCase().includes('throttled'));

      if (isThrottled) {
        const rawDetail = err?.data?.detail || err?.message || '';
        const userMsg = formatThrottleMessage(rawDetail);
        showToast(userMsg, 'error');
        const throttleErr = new Error(userMsg);
        throttleErr.isThrottled = true;
        throttleErr.raw = err;
        throw throttleErr;
      }

      const errMsg = err?.message || 'Failed to submit contact message. Please try again.';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  // Admin: Approve/Reject Team Registration
  const updateRegistrationStatus = async (teamId, status) => {
    setRegistrations(prev =>
      prev.map(r => r.team_id === teamId ? { ...r, status, updated_at: new Date().toISOString() } : r)
    );
    setTeams(prev =>
      prev.map(t => t.id === teamId ? { ...t, status, updated_at: new Date().toISOString() } : t)
    );

    try {
      await api.teams.update(teamId, { status });
    } catch (err) {
      console.warn('Backend team status update noted; local store saved:', err);
    }

    showToast(`Team registration updated to "${status.toUpperCase()}"`);
  };

  // Admin: Check in a team with optional table allocation
  const checkInTeam = async (teamId, roomNumber = null) => {
    const existing = checkIns.find(c => c.team_id === teamId);
    if (!existing) {
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

      try {
        await api.teams.createCheckIn({
          hackathon_id: hackathon.id,
          team_id: teamId
        });
      } catch (err) {
        console.warn('Backend check-in sync noted; local store saved:', err);
      }
    }

    if (roomNumber) {
      assignTable(teamId, roomNumber);
      showToast(`Team verified and desk ${roomNumber} allocated!`);
    } else {
      showToast('Team badge scanned and successfully checked in!');
    }
  };

  // Admin / Scanner: Create a new User record conforming to User model
  const createUser = async (userData) => {
    const newUserId = userData.id || `usr-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newUser = {
      id: newUserId,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
      username: userData.username || (userData.email ? userData.email.split('@')[0] : `user_${Date.now().toString().slice(-4)}`),
      email: userData.email || `${newUserId}@participant.bichackathon.org`,
      first_name: userData.first_name || userData.name?.split(' ')[0] || 'Attendee',
      last_name: userData.last_name || userData.name?.split(' ').slice(1).join(' ') || '',
      phone_number: userData.phone_number || userData.phone || '+977-9800000000',
      college: userData.college || 'Kathmandu University',
      role: userData.role || 'user',
      semester: userData.semester || 'Undergraduate',
      city_province: userData.city_province || 'Kathmandu, Bagmati',
      street: userData.street || 'Main Campus Rd',
      address: userData.address || 'Hostel Block',
      age: userData.age ? Number(userData.age) : 21
    };

    setUsers(prev => [newUser, ...prev]);

    try {
      await api.users.create({
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        password: userData.password || 'SecurePassword123!',
        role: newUser.role,
        college: newUser.college,
        phone_number: newUser.phone_number
      });
    } catch (err) {
      console.warn('Backend user creation sync noted; local store saved:', err);
    }

    showToast(`User record created: ${newUser.first_name} ${newUser.last_name} (${newUser.id})`);
    return newUser;
  };

  // Admin: Record Schedule Event Check-in / Attendance & Create User record if needed
  const checkInScheduleEvent = (eventId, attendeeInfo) => {
    let targetUser = null;
    let isNewUserCreated = false;

    if (attendeeInfo.userId) {
      targetUser = users.find(u => u.id === attendeeInfo.userId);
    } else if (attendeeInfo.id && attendeeInfo.id.startsWith('usr-')) {
      targetUser = users.find(u => u.id === attendeeInfo.id);
    } else if (attendeeInfo.email) {
      targetUser = users.find(u => u.email.toLowerCase() === attendeeInfo.email.toLowerCase());
    }

    if (!targetUser) {
      targetUser = createUser(attendeeInfo);
      isNewUserCreated = true;
    }

    const alreadyAttended = eventAttendances.some(
      a => a.schedule_event_id === eventId && a.user_id === targetUser.id
    );

    if (alreadyAttended) {
      showToast(`${targetUser.first_name || targetUser.username} is already checked in for this event.`, 'info');
      return { user: targetUser, isNewUserCreated: false, alreadyAttended: true };
    }

    const newAttendance = {
      id: `att-${Date.now().toString().slice(-4)}`,
      schedule_event_id: eventId,
      user_id: targetUser.id,
      scanned_at: new Date().toISOString(),
      notes: attendeeInfo.notes || (isNewUserCreated ? 'Walk-in Registered via Event Scanner' : 'QR Scan Verified')
    };

    setEventAttendances(prev => [newAttendance, ...prev]);

    const eventObj = scheduleEvents.find(e => e.id === eventId);
    const eventName = eventObj ? eventObj.description : 'Schedule Event';

    showToast(`Checked in ${targetUser.first_name} ${targetUser.last_name} for "${eventName}"!`);
    return { user: targetUser, isNewUserCreated, attendance: newAttendance };
  };

  // Admin: Assign Table / Room
  const assignTable = async (teamId, roomNumber) => {
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

    try {
      await api.teams.assignTable({
        hackathon_id: hackathon.id,
        team_id: teamId,
        status: 'assigned',
        room_number: roomNumber
      });
    } catch (err) {
      console.warn('Backend table allocation sync noted; local store saved:', err);
    }

    showToast(`Workstation table allocated: ${roomNumber}`);
  };

  // Admin: Add / Update Org Task
  const addOrgTask = async (taskData) => {
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

    try {
      await api.organizers.createTask({
        task: taskData.task,
        description: taskData.description || null,
        priority: taskData.priority || 'medium',
        status: 'pending',
        department_id: taskData.department_id || null,
        assigned_to: taskData.assigned_to || null
      });
    } catch (err) {
      console.warn('Backend task creation sync noted; local store saved:', err);
    }

    showToast('Operational task dispatched to organizer queue.');
  };

  const updateOrgTaskStatus = async (taskId, status) => {
    setOrgTasks(prev =>
      prev.map(t => t.id === taskId ? {
        ...t,
        status,
        completed_date: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      } : t)
    );

    try {
      await api.organizers.updateTask(taskId, {
        status,
        completed_date: status === 'completed' ? new Date().toISOString() : null
      });
    } catch (err) {
      console.warn('Backend task status update noted; local store saved:', err);
    }

    showToast(`Task status moved to ${status}`);
  };

  // Admin: Upload Organizer Profile Image
  const uploadOrganizerImage = async (organizerId, file) => {
    try {
      const updatedOrg = await api.organizers.uploadImage(organizerId, file);
      setOrganizers(prev =>
        prev.map(o => o.id === organizerId ? { ...o, image: updatedOrg.image } : o)
      );
      showToast('Organizer profile image uploaded successfully!');
      return updatedOrg;
    } catch (err) {
      console.error('Error uploading organizer image:', err);
      showToast(err.message || 'Failed to upload image', 'error');
      throw err;
    }
  };

  // Admin: Record sponsorship installment payment
  const recordSponsorshipPayment = async (sponsorshipId, paymentAmount) => {
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

    const target = sponsorships.find(s => s.id === sponsorshipId);
    if (target) {
      try {
        await api.sponsors.updateSponsorship(sponsorshipId, {
          paid: Number(target.paid) + Number(paymentAmount)
        });
      } catch (err) {
        console.warn('Backend sponsorship update sync noted; local store saved:', err);
      }
    }

    showToast(`Sponsorship payment of NPR ${paymentAmount.toLocaleString()} recorded.`);
  };

  // Admin: Dispatch notification broadcast
  const sendBroadcastNotification = async (message, recipients = 'all_participants') => {
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

    try {
      await api.notifications.create({
        message,
        recipients
      });
    } catch (err) {
      console.warn('Backend notification broadcast sync noted; local store saved:', err);
    }

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
    Notification: notifications,
    EventAttendance: eventAttendances
  };

  const value = {
    currentView,
    setCurrentView,
    adminTab,
    setAdminTab,
    toast,
    showToast,
    closeToast,
    // API State
    api,
    isApiConnected,
    isLoadingApi,
    apiError,
    refreshData,
    getAuthToken,
    setAuthToken,
    clearAuthToken,
    getRefreshToken,
    setRefreshToken,
    clearRefreshToken,
    logout,
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
    setUsers,
    roles,
    participants,
    teamMembers,
    registrations,
    checkIns,
    tables,
    notifications,
    eventAttendances,
    setEventAttendances,
    // Authentication (Normal Users & Admins)
    currentUser,
    setCurrentUser: setCurrentUserState,
    loginWithGoogle,
    logoutUser,
    showToast,
    // Operations
    registerTeam,
    submitContactInquiry,
    updateRegistrationStatus,
    checkInTeam,
    assignTable,
    createUser,
    checkInScheduleEvent,
    addOrgTask,
    updateOrgTaskStatus,
    uploadOrganizerImage,
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
