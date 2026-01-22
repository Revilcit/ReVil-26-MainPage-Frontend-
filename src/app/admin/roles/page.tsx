"use client";

import { useState, useEffect } from "react";
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
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, eventsRes] = await Promise.all([
        api.get("/admin/roles/users"),
        api.get("/admin/roles/events"),
      ]);
      setUsers(usersRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
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
        return "bg-red-100 text-red-800 border-red-300";
      case "event_manager":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "registration_team":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
      <div className="min-h-screen flex items-center justify-center bg-black pt-24">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING ROLES...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
              ROLE
            </h1>
            <h2 className="text-3xl md:text-4xl text-primary font-orbitron">
              MANAGEMENT
            </h2>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Assign Role
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Managed Events</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-t border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(
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
                            className="text-sm text-purple-400 font-medium"
                          >
                            • {event.title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.role !== "user" && (
                        <>
                          <button
                            onClick={() => openModal(user)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRevokeRole(user._id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                      {user.role === "user" && (
                        <button
                          onClick={() => openModal(user)}
                          className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Assign Role
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
              <h2 className="text-2xl font-bold mb-6">
                {selectedUser ? "Update Role" : "Assign Role"}
              </h2>

              {/* Email Input (only if no user selected) */}
              {!selectedUser && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Enter the email of the user you want to assign a role to
                  </p>
                </div>
              )}

              {selectedUser && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">User</p>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              )}

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
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
                  <label className="block text-sm font-medium mb-2">
                    Managed Events
                  </label>
                  <div className="max-h-60 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700 p-4">
                    {events.map((event) => (
                      <label
                        key={event._id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents([...selectedEvents, event._id]);
                            } else {
                              setSelectedEvents(
                                selectedEvents.filter((id) => id !== event._id),
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Select the events this manager can handle check-ins for
                  </p>
                </div>
              )}

              {/* Role Descriptions */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Role Permissions:</p>
                {selectedRole === "superadmin" && (
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Full system access</li>
                    <li>• Manage all users and roles</li>
                    <li>• Handle all check-ins (building + sessions)</li>
                    <li>• Manage events and registrations</li>
                  </ul>
                )}
                {selectedRole === "event_manager" && (
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Manage check-in for assigned events only</li>
                    <li>• View attendance for their events</li>
                    <li>• Cannot manage building check-in</li>
                  </ul>
                )}
                {selectedRole === "registration_team" && (
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Handle building entrance check-in</li>
                    <li>• View building check-in status</li>
                    <li>• Cannot manage session check-ins</li>
                  </ul>
                )}
                {selectedRole === "user" && (
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Register for events</li>
                    <li>• View personal dashboard</li>
                    <li>• No admin privileges</li>
                  </ul>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAssignRole}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {selectedUser ? "Update Role" : "Assign Role"}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
