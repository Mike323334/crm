import { useEffect, useMemo, useState } from "react";
import { register, login, getMe, forgotPassword, resetPassword } from "./auth";
import {
  createActivity,
  createContact,
  createDeal,
  createInvite,
  createPipeline,
  deleteActivity,
  deleteContact,
  deleteDeal,
  getContact,
  getDashboard,
  listInvites,
  listActivities,
  listContacts,
  listDeals,
  listPipelines,
  listUsers,
  getPipelineAnalytics,
  getActivityNotifications,
  revokeInvite,
  resetUserPassword,
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  resolveFileUrl,
  updateActivity,
  updateContact,
  updateDeal,
  updateUserRole,
  updateUserStatus
} from "./crmApi";

const initialAuth = {
  email: "",
  password: "",
  inviteToken: "",
  companyName: "",
  companyDomain: ""
};
const initialContact = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  title: "",
  status: "lead",
  tags: "",
  notes: ""
};
const initialDeal = {
  title: "",
  amount: "",
  stage: "prospecting",
  status: "open",
  probability: 0,
  closeDate: ""
};
const initialActivity = {
  type: "task",
  title: "",
  dueDate: "",
  status: "open",
  notes: ""
};

const App = () => {
  const [registerForm, setRegisterForm] = useState(initialAuth);
  const [loginForm, setLoginForm] = useState(initialAuth);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactForm, setContactForm] = useState(initialContact);

  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [activityNotifications, setActivityNotifications] = useState({
    overdue: [],
    upcoming: []
  });
  const [dealForm, setDealForm] = useState(initialDeal);
  const [activityForm, setActivityForm] = useState(initialActivity);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
    expiresInDays: 7
  });
  const [invites, setInvites] = useState([]);
  const [copiedToken, setCopiedToken] = useState("");
  const [lastInviteToken, setLastInviteToken] = useState("");

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [pipelineDeals, setPipelineDeals] = useState([]);
  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    stages: "Prospecting, Proposal, Negotiation, Won, Lost"
  });
  const [pipelineAnalytics, setPipelineAnalytics] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [attachments, setAttachments] = useState([]);
  const [attachmentDealId, setAttachmentDealId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);

  const [users, setUsers] = useState([]);
  const [passwordResets, setPasswordResets] = useState({});

  const isAuthed = Boolean(token);
  const isAdmin = me?.role === "admin";
  const selectedPipeline = pipelines.find(
    (pipeline) => pipeline._id === selectedPipelineId
  );
  const selectedContactName = useMemo(() => {
    if (!selectedContact) return "Contact";
    return `${selectedContact.firstName} ${selectedContact.lastName}`.trim();
  }, [selectedContact]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await register(registerForm);
      localStorage.setItem("token", result.token);
      setToken(result.token);
      setRegisterForm(initialAuth);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(loginForm.email, loginForm.password);
      localStorage.setItem("token", result.token);
      setToken(result.token);
      setLoginForm(initialAuth);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");
    setResetInfo("");
    setLoading(true);
    try {
      const result = await forgotPassword(forgotEmail);
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setResetLink(result.resetLink || "");
        setResetInfo("Reset token generated. Paste it below to reset.");
      } else {
        setResetInfo("If the email exists, a reset token was created.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setResetInfo("");
    setLoading(true);
    try {
      await resetPassword(resetToken, resetPasswordValue);
      setResetInfo("Password updated. You can sign in now.");
      setResetPasswordValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");
    if (token) {
      setResetToken(token);
      setResetInfo("Reset token loaded from link.");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setMe(null);
    setContacts([]);
    setSelectedContactId("");
    setSelectedContact(null);
  };

  const loadMe = async () => {
    if (!token) return;
    const result = await getMe(token);
    setMe(result.user);
  };

  const loadDashboard = async () => {
    if (!token) return;
    const result = await getDashboard(token);
    setStats(result.stats);
  };

  const loadInvites = async () => {
    if (!token || !isAdmin) return;
    const result = await listInvites(token);
    setInvites(result.invites);
  };

  const loadPipelines = async () => {
    if (!token) return;
    const result = await listPipelines(token);
    setPipelines(result.pipelines);
    if (!selectedPipelineId && result.pipelines.length > 0) {
      setSelectedPipelineId(result.pipelines[0]._id);
    }
  };

  const loadPipelineDeals = async () => {
    if (!token || !selectedPipelineId) return;
    const result = await listDeals(token);
    const filtered = result.deals.filter(
      (deal) => deal.pipelineId === selectedPipelineId
    );
    setPipelineDeals(filtered);
  };

  const loadPipelineAnalytics = async () => {
    if (!token || !selectedPipelineId) return;
    const result = await getPipelineAnalytics(token, selectedPipelineId);
    setPipelineAnalytics(result.analytics);
  };

  const loadUsers = async () => {
    if (!token || !isAdmin) return;
    const result = await listUsers(token);
    setUsers(result.users);
  };

  const loadContacts = async () => {
    if (!token) return;
    const result = await listContacts(token, contactSearch);
    setContacts(result.contacts);
  };

  const loadAllActivities = async () => {
    if (!token) return;
    const result = await listActivities(token);
    setAllActivities(result.activities);
  };

  const loadActivityNotifications = async () => {
    if (!token) return;
    const result = await getActivityNotifications(token, 7);
    setActivityNotifications(result);
  };

  const loadContactDetail = async (contactId) => {
    if (!token || !contactId) return;
    const [contactResult, dealsResult, activitiesResult] = await Promise.all([
      getContact(token, contactId),
      listDeals(token, contactId),
      listActivities(token, contactId)
    ]);
    setSelectedContact(contactResult.contact);
    setDeals(dealsResult.deals);
    setActivities(activitiesResult.activities);
    setContactForm({
      ...initialContact,
      ...contactResult.contact,
      tags: (contactResult.contact.tags || []).join(", ")
    });
    const attachmentsResult = await listAttachments(token, contactId);
    setAttachments(attachmentsResult.attachments);
  };

  const handleCreateContact = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...contactForm,
        tags: contactForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      };
      const result = await createContact(token, payload);
      setContacts([result.contact, ...contacts]);
      setContactForm(initialContact);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = async (event) => {
    event.preventDefault();
    if (!selectedContactId) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...contactForm,
        tags: contactForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      };
      const result = await updateContact(token, selectedContactId, payload);
      setSelectedContact(result.contact);
      setContacts(
        contacts.map((contact) =>
          contact._id === result.contact._id ? result.contact : contact
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (id) => {
    setError("");
    setLoading(true);
    try {
      await deleteContact(token, id);
      setContacts(contacts.filter((contact) => contact._id !== id));
      if (selectedContactId === id) {
        setSelectedContactId("");
        setSelectedContact(null);
        setDeals([]);
        setActivities([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (event) => {
    event.preventDefault();
    if (!selectedContactId) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...dealForm,
        contactId: selectedContactId,
        amount: Number(dealForm.amount || 0),
        probability: Number(dealForm.probability || 0),
        closeDate: dealForm.closeDate ? new Date(dealForm.closeDate) : null
      };
      const result = await createDeal(token, payload);
      setDeals([result.deal, ...deals]);
      if (result.deal.pipelineId === selectedPipelineId) {
        setPipelineDeals([result.deal, ...pipelineDeals]);
      }
      setDealForm(initialDeal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeal = async (deal) => {
    setError("");
    setLoading(true);
    try {
      const result = await updateDeal(token, deal._id, deal);
      setDeals(deals.map((item) => (item._id === deal._id ? result.deal : item)));
      setPipelineDeals(
        pipelineDeals.map((item) =>
          item._id === deal._id ? result.deal : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeal = async (id) => {
    setError("");
    setLoading(true);
    try {
      await deleteDeal(token, id);
      setDeals(deals.filter((deal) => deal._id !== id));
      setPipelineDeals(pipelineDeals.filter((deal) => deal._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAttachment = async (event) => {
    event.preventDefault();
    if (!attachmentFile || !selectedContactId) return;
    setError("");
    setLoading(true);
    try {
      const result = await uploadAttachment(token, {
        contactId: selectedContactId,
        dealId: attachmentDealId || undefined,
        file: attachmentFile
      });
      setAttachments([result.attachment, ...attachments]);
      setAttachmentFile(null);
      setAttachmentDealId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (id) => {
    setError("");
    setLoading(true);
    try {
      await deleteAttachment(token, id);
      setAttachments(attachments.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (event) => {
    event.preventDefault();
    if (!selectedContactId) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...activityForm,
        contactId: selectedContactId,
        dueDate: activityForm.dueDate ? new Date(activityForm.dueDate) : null
      };
      const result = await createActivity(token, payload);
      setActivities([result.activity, ...activities]);
      setActivityForm(initialActivity);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createInvite(token, inviteForm);
      setInvites([result.invite, ...invites]);
      setInviteForm({ email: "", role: "member", expiresInDays: 7 });
      setLastInviteToken(result.invite?.token || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async (tokenValue) => {
    try {
      await navigator.clipboard.writeText(tokenValue);
      setCopiedToken(tokenValue);
      setTimeout(() => setCopiedToken(""), 1500);
    } catch (err) {
      setError("Unable to copy invite token");
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    setError("");
    setLoading(true);
    try {
      const result = await revokeInvite(token, inviteId);
      setInvites(
        invites.map((invite) =>
          invite._id === inviteId ? result.invite : invite
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const stages = pipelineForm.stages
        .split(",")
        .map((stage, index) => ({
          name: stage.trim(),
          order: index
        }))
        .filter((stage) => stage.name);
      const result = await createPipeline(token, {
        name: pipelineForm.name || "New Pipeline",
        stages
      });
      setPipelines([...pipelines, result.pipeline]);
      setSelectedPipelineId(result.pipeline._id);
      setPipelineForm({
        name: "",
        stages: "Prospecting, Proposal, Negotiation, Won, Lost"
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setError("");
    setLoading(true);
    try {
      const result = await updateUserRole(token, userId, role);
      setUsers(users.map((user) => (user._id === userId ? result.user : user)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId, isActive) => {
    setError("");
    setLoading(true);
    try {
      const result = await updateUserStatus(token, userId, isActive);
      setUsers(users.map((user) => (user._id === userId ? result.user : user)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (userId) => {
    const password = passwordResets[userId];
    if (!password) {
      setError("Enter a temporary password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetUserPassword(token, userId, password);
      setPasswordResets({ ...passwordResets, [userId]: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActivity = async (activity) => {
    setError("");
    setLoading(true);
    try {
      const result = await updateActivity(token, activity._id, activity);
      setActivities(
        activities.map((item) =>
          item._id === activity._id ? result.activity : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    setError("");
    setLoading(true);
    try {
      await deleteActivity(token, id);
      setActivities(activities.filter((activity) => activity._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadMe().catch((err) => setError(err.message));
    loadDashboard().catch((err) => setError(err.message));
    loadPipelines().catch((err) => setError(err.message));
    loadActivityNotifications().catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    loadInvites().catch((err) => setError(err.message));
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    loadUsers().catch((err) => setError(err.message));
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || view !== "pipeline") return;
    loadPipelines().catch((err) => setError(err.message));
  }, [token, view]);

  useEffect(() => {
    if (!token || view !== "pipeline" || !selectedPipelineId) return;
    loadPipelineDeals().catch((err) => setError(err.message));
    loadPipelineAnalytics().catch((err) => setError(err.message));
  }, [token, view, selectedPipelineId]);

  useEffect(() => {
    if (!token || view !== "calendar") return;
    loadAllActivities().catch((err) => setError(err.message));
  }, [token, view]);

  useEffect(() => {
    if (!token || view !== "contacts") return;
    loadContacts().catch((err) => setError(err.message));
  }, [token, view, contactSearch]);

  useEffect(() => {
    if (!token || !selectedContactId) return;
    loadContactDetail(selectedContactId).catch((err) => setError(err.message));
  }, [token, selectedContactId]);

  useEffect(() => {
    if (view !== "dashboard" || !token) return;
    loadDashboard().catch((err) => setError(err.message));
  }, [view, token]);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>CRM Workspace</h1>
          <p>Manage contacts, deals, and activities in one place.</p>
        </div>
        <div className="topbar-actions">
          {isAuthed ? (
            <>
              <span className="chip">{me?.email || "Signed in"}</span>
              <button type="button" className="ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <span className="chip">Not signed in</span>
          )}
        </div>
      </header>

      {error ? <div className="error">{error}</div> : null}

      {!isAuthed ? (
        <div className="grid two">
          <section className="card">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Invite token (optional)"
                value={registerForm.inviteToken}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    inviteToken: e.target.value
                  })
                }
              />
              <input
                type="text"
                placeholder="Company name (first admin only)"
                value={registerForm.companyName}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    companyName: e.target.value
                  })
                }
              />
              <input
                type="text"
                placeholder="Company domain e.g. crm.com"
                value={registerForm.companyDomain}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    companyDomain: e.target.value
                  })
                }
              />
              <button type="submit" disabled={loading}>
                {loading ? "Working..." : "Create account"}
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Working..." : "Sign in"}
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Forgot Password</h2>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Generate reset token"}
              </button>
            </form>
            {resetInfo ? <p className="muted">{resetInfo}</p> : null}
            {resetLink ? (
              <p className="muted">
                Reset link:{" "}
                <a href={resetLink} target="_blank" rel="noreferrer">
                  {resetLink}
                </a>
              </p>
            ) : null}
          </section>

          <section className="card">
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <input
                type="text"
                placeholder="Reset token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>
        </div>
      ) : (
        <>
          <nav className="tabs">
            <button
              type="button"
              className={view === "dashboard" ? "active" : ""}
              onClick={() => setView("dashboard")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={view === "contacts" ? "active" : ""}
              onClick={() => setView("contacts")}
            >
              Contacts
            </button>
            <button
              type="button"
              className={view === "pipeline" ? "active" : ""}
              onClick={() => setView("pipeline")}
            >
              Pipeline
            </button>
            <button
              type="button"
              className={view === "calendar" ? "active" : ""}
              onClick={() => setView("calendar")}
            >
              Calendar
            </button>
          </nav>

          {view === "dashboard" ? (
            <section className="grid three">
              <div className="card stat">
                <h3>Contacts</h3>
                <p>{stats?.contactsCount ?? 0}</p>
              </div>
              <div className="card stat">
                <h3>Open Deals</h3>
                <p>{stats?.openDeals ?? 0}</p>
              </div>
              <div className="card stat">
                <h3>Total Pipeline</h3>
                <p>${(stats?.totalDealValue ?? 0).toLocaleString()}</p>
              </div>
              <div className="card stat">
                <h3>Activities Due</h3>
                <p>{stats?.activitiesDue ?? 0}</p>
              </div>
              <div className="card">
                <h3>Upcoming Tasks</h3>
                <div className="list dense">
                  {activityNotifications.upcoming.length === 0 ? (
                    <p className="muted">No upcoming tasks.</p>
                  ) : (
                    activityNotifications.upcoming.slice(0, 4).map((activity) => (
                      <div key={activity._id} className="list-item">
                        <div className="list-main">
                          <strong>{activity.title}</strong>
                          <span className="muted">
                            Due{" "}
                            {activity.dueDate
                              ? new Date(activity.dueDate).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="card">
                <h3>Overdue</h3>
                <div className="list dense">
                  {activityNotifications.overdue.length === 0 ? (
                    <p className="muted">No overdue tasks.</p>
                  ) : (
                    activityNotifications.overdue.slice(0, 4).map((activity) => (
                      <div key={activity._id} className="list-item">
                        <div className="list-main">
                          <strong>{activity.title}</strong>
                          <span className="muted">
                            Due{" "}
                            {activity.dueDate
                              ? new Date(activity.dueDate).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="card">
                <h3>Quick Actions</h3>
                <p className="muted">
                  Jump to contacts to add new people, deals, and activities.
                </p>
                <button type="button" onClick={() => setView("contacts")}>
                  Go to contacts
                </button>
              </div>
              {isAdmin ? (
                <div className="card">
                  <h3>Invite Employees</h3>
                  <form onSubmit={handleCreateInvite} className="form-grid">
                    <input
                      type="email"
                      placeholder="Employee email"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, email: e.target.value })
                      }
                      required
                    />
                    <select
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, role: e.target.value })
                      }
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  <select
                    value={inviteForm.expiresInDays}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        expiresInDays: Number(e.target.value)
                      })
                    }
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                    <button type="submit" disabled={loading}>
                      {loading ? "Sending..." : "Generate invite"}
                    </button>
                  </form>
                {lastInviteToken ? (
                  <div className="token-row">
                    <span className="muted small">Latest token:</span>
                    <code className="token">{lastInviteToken}</code>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => handleCopyInvite(lastInviteToken)}
                    >
                      {copiedToken === lastInviteToken ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : null}
                  <div className="list dense">
                    {invites.length === 0 ? (
                      <p className="muted">No invites yet.</p>
                    ) : (
                      invites.map((invite) => (
                        <div key={invite._id} className="list-item">
                          <div className="list-main">
                            <strong>{invite.email}</strong>
                            <span className="muted">
                              {invite.role} • {invite.status}
                            </span>
                          <span className="muted small">
                            {invite.expiresAt
                              ? `Expires ${new Date(
                                  invite.expiresAt
                                ).toLocaleDateString()}`
                              : "No expiry"}
                          </span>
                          </div>
                          <div className="inline-actions">
                            <code className="token">{invite.token}</code>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => handleCopyInvite(invite.token)}
                            >
                              {copiedToken === invite.token ? "Copied" : "Copy"}
                            </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => handleRevokeInvite(invite._id)}
                            disabled={invite.status === "revoked"}
                          >
                            {invite.status === "revoked" ? "Revoked" : "Revoke"}
                          </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="muted small">
                    Share the token with the employee. They will enter it during
                    registration.
                  </p>
                </div>
              ) : null}
              {isAdmin ? (
                <div className="card">
                  <h3>User Management</h3>
                  <div className="list dense">
                    {users.length === 0 ? (
                      <p className="muted">No users yet.</p>
                    ) : (
                      users.map((user) => (
                        <div key={user._id} className="list-item user-item">
                          <div className="list-main">
                            <strong>{user.email}</strong>
                            <span className="muted">
                              {user.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <div className="inline-actions">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user._id, e.target.value)
                              }
                            >
                              <option value="member">Member</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() =>
                                handleStatusToggle(user._id, !user.isActive)
                              }
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                          <div className="inline-actions">
                            <input
                              type="text"
                              placeholder="Temp password"
                              value={passwordResets[user._id] || ""}
                              onChange={(e) =>
                                setPasswordResets({
                                  ...passwordResets,
                                  [user._id]: e.target.value
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => handlePasswordReset(user._id)}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {view === "contacts" ? (
            <div className="grid two">
              <section className="card">
                <div className="card-header">
                  <h2>Contacts</h2>
                  <input
                    type="search"
                    placeholder="Search"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
                <div className="list">
                  {contacts.length === 0 ? (
                    <p className="muted">No contacts yet.</p>
                  ) : (
                    contacts.map((contact) => (
                      <div
                        key={contact._id}
                        className={`list-item ${
                          selectedContactId === contact._id ? "active" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="list-main"
                          onClick={() => setSelectedContactId(contact._id)}
                        >
                          <strong>
                            {contact.firstName} {contact.lastName}
                          </strong>
                          <span className="muted">
                            {contact.company || "No company"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleDeleteContact(contact._id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="card">
                <h2>Add Contact</h2>
                <form onSubmit={handleCreateContact} className="form-grid">
                  <input
                    type="text"
                    placeholder="First name"
                    value={contactForm.firstName}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, firstName: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={contactForm.lastName}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, lastName: e.target.value })
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={contactForm.company}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, company: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={contactForm.title}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, title: e.target.value })
                    }
                  />
                  <select
                    value={contactForm.status}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, status: e.target.value })
                    }
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={contactForm.tags}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, tags: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Notes"
                    value={contactForm.notes}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, notes: e.target.value })
                    }
                  />
                  <button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Add contact"}
                  </button>
                </form>
              </section>

              <section className="card full">
                <h2>{selectedContactName} Details</h2>
                {!selectedContact ? (
                  <p className="muted">Select a contact to view details.</p>
                ) : (
                  <div className="grid two">
                    <form onSubmit={handleUpdateContact} className="form-grid">
                      <input
                        type="text"
                        placeholder="First name"
                        value={contactForm.firstName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            firstName: e.target.value
                          })
                        }
                        required
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={contactForm.lastName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            lastName: e.target.value
                          })
                        }
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, email: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={contactForm.phone}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, phone: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={contactForm.company}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, company: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Title"
                        value={contactForm.title}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, title: e.target.value })
                        }
                      />
                      <select
                        value={contactForm.status}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, status: e.target.value })
                        }
                      >
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Customer</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={contactForm.tags}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, tags: e.target.value })
                        }
                      />
                      <textarea
                        placeholder="Notes"
                        value={contactForm.notes}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, notes: e.target.value })
                        }
                      />
                      <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Update contact"}
                      </button>
                    </form>

                    <div className="stack">
                      <div className="card nested">
                        <h3>Deals</h3>
                        <form onSubmit={handleCreateDeal} className="form-grid">
                          <input
                            type="text"
                            placeholder="Deal title"
                            value={dealForm.title}
                            onChange={(e) =>
                              setDealForm({ ...dealForm, title: e.target.value })
                            }
                            required
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            value={dealForm.amount}
                            onChange={(e) =>
                              setDealForm({ ...dealForm, amount: e.target.value })
                            }
                          />
                          <select
                            value={dealForm.stage}
                            onChange={(e) =>
                              setDealForm({ ...dealForm, stage: e.target.value })
                            }
                          >
                            <option value="prospecting">Prospecting</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Probability (%)"
                            value={dealForm.probability}
                            onChange={(e) =>
                              setDealForm({
                                ...dealForm,
                                probability: e.target.value
                              })
                            }
                          />
                          <input
                            type="date"
                            value={dealForm.closeDate}
                            onChange={(e) =>
                              setDealForm({
                                ...dealForm,
                                closeDate: e.target.value
                              })
                            }
                          />
                          <button type="submit" disabled={loading}>
                            Add deal
                          </button>
                        </form>
                        <div className="list dense">
                          {deals.length === 0 ? (
                            <p className="muted">No deals yet.</p>
                          ) : (
                            deals.map((deal) => (
                              <div key={deal._id} className="list-item">
                                <div className="list-main">
                                  <strong>{deal.title}</strong>
                                  <span className="muted">
                                    ${deal.amount || 0} • {deal.stage}
                                  </span>
                                </div>
                                <div className="inline-actions">
                                  <select
                                    value={deal.status}
                                    onChange={(e) =>
                                      handleUpdateDeal({
                                        ...deal,
                                        status: e.target.value
                                      })
                                    }
                                  >
                                    <option value="open">Open</option>
                                    <option value="won">Won</option>
                                    <option value="lost">Lost</option>
                                  </select>
                                  <button
                                    type="button"
                                    className="ghost"
                                    onClick={() => handleDeleteDeal(deal._id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="card nested">
                        <h3>Activities</h3>
                        <form onSubmit={handleCreateActivity} className="form-grid">
                          <input
                            type="text"
                            placeholder="Activity title"
                            value={activityForm.title}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                title: e.target.value
                              })
                            }
                            required
                          />
                          <select
                            value={activityForm.type}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                type: e.target.value
                              })
                            }
                          >
                            <option value="task">Task</option>
                            <option value="call">Call</option>
                            <option value="meeting">Meeting</option>
                            <option value="email">Email</option>
                          </select>
                          <input
                            type="date"
                            value={activityForm.dueDate}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                dueDate: e.target.value
                              })
                            }
                          />
                          <select
                            value={activityForm.status}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                status: e.target.value
                              })
                            }
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                          <textarea
                            placeholder="Notes"
                            value={activityForm.notes}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                notes: e.target.value
                              })
                            }
                          />
                          <button type="submit" disabled={loading}>
                            Add activity
                          </button>
                        </form>
                        <div className="list dense">
                          {activities.length === 0 ? (
                            <p className="muted">No activities yet.</p>
                          ) : (
                            activities.map((activity) => (
                              <div key={activity._id} className="list-item">
                                <div className="list-main">
                                  <strong>{activity.title}</strong>
                                  <span className="muted">
                                    {activity.type} • {activity.status}
                                  </span>
                                </div>
                                <div className="inline-actions">
                                  <select
                                    value={activity.status}
                                    onChange={(e) =>
                                      handleUpdateActivity({
                                        ...activity,
                                        status: e.target.value
                                      })
                                    }
                                  >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In progress</option>
                                    <option value="done">Done</option>
                                  </select>
                                  <button
                                    type="button"
                                    className="ghost"
                                    onClick={() =>
                                      handleDeleteActivity(activity._id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="card nested">
                        <h3>Attachments</h3>
                        <form onSubmit={handleUploadAttachment} className="form-grid">
                          <input
                            type="file"
                            onChange={(e) =>
                              setAttachmentFile(e.target.files?.[0] || null)
                            }
                          />
                          <select
                            value={attachmentDealId}
                            onChange={(e) => setAttachmentDealId(e.target.value)}
                          >
                            <option value="">Attach to contact</option>
                            {deals.map((deal) => (
                              <option key={deal._id} value={deal._id}>
                                {deal.title}
                              </option>
                            ))}
                          </select>
                          <button type="submit" disabled={loading || !attachmentFile}>
                            Upload
                          </button>
                        </form>
                        <div className="list dense">
                          {attachments.length === 0 ? (
                            <p className="muted">No files yet.</p>
                          ) : (
                            attachments.map((item) => (
                              <div key={item._id} className="list-item">
                                <div className="list-main">
                                  <strong>{item.originalName}</strong>
                                  <span className="muted">
                                    {(item.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                                <div className="inline-actions">
                                  <a
                                    className="ghost"
                                    href={resolveFileUrl(item.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Download
                                  </a>
                                  <button
                                    type="button"
                                    className="ghost"
                                    onClick={() => handleDeleteAttachment(item._id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {view === "pipeline" ? (
            <div className="grid two">
              <section className="card">
                <div className="card-header">
                  <h2>Pipeline Board</h2>
                  <select
                    value={selectedPipelineId}
                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                  >
                    {pipelines.map((pipeline) => (
                      <option key={pipeline._id} value={pipeline._id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!selectedPipeline ? (
                  <p className="muted">No pipeline yet.</p>
                ) : (
                  <div className="pipeline-board">
                    {selectedPipeline.stages
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((stage) => {
                        const stageDeals = pipelineDeals.filter(
                          (deal) => deal.stageId === stage._id
                        );
                        return (
                          <div key={stage._id} className="pipeline-column">
                            <h3>{stage.name}</h3>
                            {stageDeals.length === 0 ? (
                              <p className="muted small">No deals</p>
                            ) : (
                              stageDeals.map((deal) => (
                                <div key={deal._id} className="pipeline-card">
                                  <strong>{deal.title}</strong>
                                  <span className="muted">
                                    ${deal.amount || 0}
                                  </span>
                                  <select
                                    value={deal.stageId}
                                    onChange={(e) =>
                                      handleUpdateDeal({
                                        ...deal,
                                        stageId: e.target.value
                                      })
                                    }
                                  >
                                    {selectedPipeline.stages
                                      .slice()
                                      .sort((a, b) => a.order - b.order)
                                      .map((stageOption) => (
                                        <option
                                          key={stageOption._id}
                                          value={stageOption._id}
                                        >
                                          {stageOption.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>

              {selectedPipeline && pipelineAnalytics ? (
                <section className="card">
                  <h2>Pipeline Analytics</h2>
                  <div className="grid two">
                    <div className="card stat">
                      <h3>Win Rate</h3>
                      <p>{pipelineAnalytics.winRate}%</p>
                    </div>
                    <div className="card stat">
                      <h3>Avg Time in Stage</h3>
                      <p>
                        {pipelineAnalytics.perStageAvgDays.length === 0
                          ? "0"
                          : (
                              pipelineAnalytics.perStageAvgDays.reduce(
                                (sum, stage) => sum + stage.avgDays,
                                0
                              ) / pipelineAnalytics.perStageAvgDays.length
                            ).toFixed(2)}{" "}
                        days
                      </p>
                    </div>
                  </div>
                  <div className="list dense">
                    {pipelineAnalytics.perStageAvgDays.map((stage) => (
                      <div key={stage.stageId} className="list-item">
                        <div className="list-main">
                          <strong>{stage.stageName}</strong>
                          <span className="muted">
                            Avg {stage.avgDays} days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {isAdmin ? (
                <section className="card">
                  <h2>Create Pipeline</h2>
                  <form onSubmit={handleCreatePipeline} className="form-grid">
                    <input
                      type="text"
                      placeholder="Pipeline name"
                      value={pipelineForm.name}
                      onChange={(e) =>
                        setPipelineForm({
                          ...pipelineForm,
                          name: e.target.value
                        })
                      }
                    />
                    <textarea
                      placeholder="Stages (comma separated)"
                      value={pipelineForm.stages}
                      onChange={(e) =>
                        setPipelineForm({
                          ...pipelineForm,
                          stages: e.target.value
                        })
                      }
                    />
                    <button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Create pipeline"}
                    </button>
                  </form>
                  <p className="muted small">
                    Deals will use the first stage as default.
                  </p>
                </section>
              ) : null}
            </div>
          ) : null}

          {view === "calendar" ? (
            <section className="card">
              <div className="card-header">
                <h2>Task Calendar</h2>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                  >
                    Previous
                  </button>
                  <span className="chip">
                    {calendarMonth.toLocaleString("default", {
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="calendar-header">
                    {day}
                  </div>
                ))}
                {(() => {
                  const start = new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth(),
                    1
                  );
                  const end = new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    0
                  );
                  const startDay = start.getDay();
                  const totalDays = end.getDate();
                  const cells = [];

                  for (let i = 0; i < startDay; i += 1) {
                    cells.push(
                      <div key={`empty-${i}`} className="calendar-cell empty" />
                    );
                  }

                  for (let day = 1; day <= totalDays; day += 1) {
                    const date = new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      day
                    );
                    const dateKey = date.toDateString();
                    const tasks = allActivities.filter((activity) => {
                      if (!activity.dueDate) return false;
                      return new Date(activity.dueDate).toDateString() === dateKey;
                    });
                    cells.push(
                      <div key={dateKey} className="calendar-cell">
                        <div className="calendar-date">{day}</div>
                        {tasks.slice(0, 3).map((task) => (
                          <div key={task._id} className="calendar-task">
                            {task.title}
                          </div>
                        ))}
                        {tasks.length > 3 ? (
                          <div className="calendar-more">
                            +{tasks.length - 3} more
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
};

export default App;
