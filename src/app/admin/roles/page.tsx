"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  managedEvents?: Array<{ _id: string; title: string; date: string }>;
  createdAt: string;
  lastLogin?: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  venue: string;
  type: string;
}

export default function RoleManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, eventsRes] = await Promise.all([
        api.get("/admin/roles/users"),
        api.get("/admin/roles/events"),
      ]);
      setUsers(usersRes.data.data);
      setAllUsers(usersRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(
        `/admin/users/search?query=${encodeURIComponent(query)}`,
      );
      setSearchResults(response.data.data || []);
    } catch (err: any) {
      console.error("Search error:", err);
      setSearchResults([]);
    }
  };

  const selectUserFromSearch = (user: User) => {
    setSelectedUser(user);
    setEmailInput(user.email);
    setSelectedRole(user.role);
    if (user.role === "event_manager" && user.managedEvents) {
      setSelectedEvents(user.managedEvents.map((e) => e._id));
    }
    setUserSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleTableSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase()),
    );
    setUsers(filtered);
  };

  const handleAssignRole = async () => {
    try {
      setError("");
      setSuccess("");

      if (!emailInput && !selectedUser) {
        setError("Please select a user or enter an email");
        return;
      }

      if (!selectedRole) {
        setError("Please select a role");
        return;
      }

      if (selectedRole === "event_manager" && selectedEvents.length === 0) {
        setError("Event managers must be assigned at least one event");
        return;
      }

      const email = selectedUser ? selectedUser.email : emailInput;

      const response = await api.put("/admin/roles/assign", {
        email,
        role: selectedRole,
        eventIds: selectedRole === "event_manager" ? selectedEvents : [],
      });

      setSuccess(response.data.message);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign role");
    }
  };

  const handleRevokeRole = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke this user's privileges?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await api.delete(`/admin/roles/revoke/${userId}`);
      setSuccess("Role revoked successfully");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to revoke role");
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedRole("");
    setSelectedEvents([]);
    setEmailInput("");
    setUserSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const openModal = (user?: User) => {
    resetForm();
    if (user) {
      setSelectedUser(user);
      setSelectedRole(user.role);
      if (user.role === "event_manager" && user.managedEvents) {
        setSelectedEvents(user.managedEvents.map((e) => e._id));
      }
    }
    setShowModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-500/10 text-red-500 border border-red-500/30";
      case "event_manager":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/30";
      case "registration_team":
        return "bg-green-500/10 text-green-400 border border-green-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Superadmin";
      case "event_manager":
        return "Event Manager";
      case "registration_team":
        return "Registration Team";
      default:
        return "User";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING ROLE MANAGEMENT...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 bg-black pb-12">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            ROLE
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            MANAGEMENT
          </h2>
          <div className="flex gap-4 flex-wrap items-center justify-between">
            <Link
              href="/admin"
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
            >
              ← Back to Admin Dashboard
            </Link>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
            >
              + Assign Role
            </button>
          </div>
        </motion.div>

        {/* Alert Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-500/10 border border-green-500/50 text-green-500 rounded-lg"
          >
            {success}
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => handleTableSearch(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-primary/20 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors font-mono"
          />
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black border border-primary/20 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary/5 border-b border-primary/20">
                  <th className="px-6 py-4 text-left text-primary font-orbitron text-sm uppercase">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-primary font-orbitron text-sm uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-primary font-orbitron text-sm uppercase">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-primary font-orbitron text-sm uppercase">
                    Managed Events
                  </th>
                  <th className="px-6 py-4 text-left text-primary font-orbitron text-sm uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 font-mono"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-mono">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-mono uppercase ${getRoleBadgeColor(
                            user.role,
                          )}`}
                        >
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.managedEvents && user.managedEvents.length > 0 ? (
                          <div className="space-y-1">
                            {user.managedEvents.map((event) => (
                              <div
                                key={event._id}
                                className="text-sm text-primary font-mono"
                              >
                                • {event.title}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-600 font-mono text-sm">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.role !== "user" && (
                            <>
                              <button
                                onClick={() => openModal(user)}
                                className="px-3 py-1 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 transition-colors text-xs font-mono uppercase"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRevokeRole(user._id)}
                                className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors text-xs font-mono uppercase"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                          {user.role === "user" && (
                            <button
                              onClick={() => openModal(user)}
                              className="px-3 py-1 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 transition-colors text-xs font-mono uppercase"
                            >
                              Assign Role
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black border border-primary/30 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold font-orbitron text-primary mb-6">
                {selectedUser ? "UPDATE ROLE" : "ASSIGN ROLE"}
              </h2>

              {/* User Search (only if no user selected) */}
              {!selectedUser && (
                <div className="mb-6">
                  <label className="block text-sm font-mono text-primary uppercase mb-2">
                    Search User
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-4 py-3 bg-black border border-primary/20 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors font-mono"
                    />
                    {isSearching && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-black border border-primary/30 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => selectUserFromSearch(user)}
                            className="w-full px-4 py-3 text-left hover:bg-primary/10 border-b border-primary/10 transition-colors"
                          >
                            <div className="font-mono text-white">
                              {user.name}
                            </div>
                            <div className="font-mono text-sm text-gray-400">
                              {user.email}
                            </div>
                            <div className="font-mono text-xs text-primary mt-1">
                              Current: {getRoleDisplayName(user.role)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono mt-2">
                    Search for a user to assign them a role
                  </p>
                </div>
              )}

              {/* Email Input (alternative to search) */}
              {!selectedUser && (
                <div className="mb-6">
                  <label className="block text-sm font-mono text-primary uppercase mb-2">
                    Or Enter Email Directly
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 bg-black border border-primary/20 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
              )}

              {selectedUser && (
                <div className="mb-6 p-4 bg-primary/5 border border-primary/20">
                  <p className="text-sm text-gray-500 font-mono uppercase">
                    User
                  </p>
                  <p className="font-mono text-white text-lg">
                    {selectedUser.name}
                  </p>
                  <p className="text-sm text-gray-400 font-mono">
                    {selectedUser.email}
                  </p>
                </div>
              )}

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-mono text-primary uppercase mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-primary/20 text-white focus:outline-none focus:border-primary transition-colors font-mono"
                >
                  <option value="">Select a role</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="event_manager">Event Manager</option>
                  <option value="registration_team">Registration Team</option>
                  <option value="user">User (No special privileges)</option>
                </select>
              </div>

              {/* Event Selection (only for event managers) */}
              {selectedRole === "event_manager" && (
                <div className="mb-6">
                  <label className="block text-sm font-mono text-primary uppercase mb-2">
                    Managed Events
                  </label>
                  <div className="max-h-60 overflow-y-auto bg-black border border-primary/20 p-4">
                    {events.length === 0 ? (
                      <p className="text-gray-500 font-mono text-sm">
                        No events available
                      </p>
                    ) : (
                      events.map((event) => (
                        <label
                          key={event._id}
                          className="flex items-center gap-3 p-2 hover:bg-primary/5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(event._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEvents([
                                  ...selectedEvents,
                                  event._id,
                                ]);
                              } else {
                                setSelectedEvents(
                                  selectedEvents.filter(
                                    (id) => id !== event._id,
                                  ),
                                );
                              }
                            }}
                            className="w-4 h-4 accent-primary"
                          />
                          <div className="flex-1">
                            <p className="font-mono text-white">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono mt-2">
                    Select events this manager can handle
                  </p>
                </div>
              )}

              {/* Role Descriptions */}
              <div className="mb-6 p-4 bg-primary/5 border border-primary/20">
                <p className="text-sm font-mono text-primary uppercase mb-2">
                  Role Permissions:
                </p>
                {selectedRole === "superadmin" && (
                  <ul className="text-sm text-gray-400 space-y-1 font-mono">
                    <li>• Full system access</li>
                    <li>• Manage all users and roles</li>
                    <li>• Handle all check-ins (building + sessions)</li>
                    <li>• Manage events and registrations</li>
                  </ul>
                )}
                {selectedRole === "event_manager" && (
                  <ul className="text-sm text-gray-400 space-y-1 font-mono">
                    <li>• Manage check-in for assigned events only</li>
                    <li>• View attendance for their events</li>
                    <li>• Send OD letters to participants</li>
                    <li>• Cannot manage building check-in</li>
                  </ul>
                )}
                {selectedRole === "registration_team" && (
                  <ul className="text-sm text-gray-400 space-y-1 font-mono">
                    <li>• Handle building entrance check-in</li>
                    <li>• View building check-in status</li>
                    <li>• Edit participant details</li>
                    <li>• Cannot manage session check-ins</li>
                  </ul>
                )}
                {selectedRole === "user" && (
                  <ul className="text-sm text-gray-400 space-y-1 font-mono">
                    <li>• Register for events</li>
                    <li>• View personal dashboard</li>
                    <li>• No admin privileges</li>
                  </ul>
                )}
                {!selectedRole && (
                  <p className="text-sm text-gray-500 font-mono">
                    Select a role to see permissions
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAssignRole}
                  className="flex-1 px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors font-mono"
                >
                  {selectedUser ? "Update Role" : "Assign Role"}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-black border border-primary/30 text-primary hover:bg-primary/10 font-mono uppercase text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
