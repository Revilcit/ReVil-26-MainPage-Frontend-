"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Registration {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  event: {
    _id: string;
    title: string;
    date: string;
    venue: string;
    eventType?: string;
  };
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: Array<{
    name: string;
    email: string;
    phoneNumber: string;
    college: string;
    isLeader: boolean;
  }>;
  phoneNumber?: string;
  college?: string;
  registrationStatus: string;
  attended: boolean;
  buildingCheckIn?: {
    status: boolean;
    timestamp?: string;
  };
  sessionCheckIn?: {
    status: boolean;
    timestamp?: string;
  };
  createdAt: string;
}

interface EventOption {
  _id: string;
  title: string;
  date: string;
  venue: string;
  type?: string;
}

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Registration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [sendingOD, setSendingOD] = useState<string | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Registration | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // New state for edit functionality
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [editTeamModalOpen, setEditTeamModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [allEvents, setAllEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [changingEvent, setChangingEvent] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [editedTeamMembers, setEditedTeamMembers] = useState<
    Array<{
      name: string;
      email: string;
      phoneNumber: string;
      college: string;
      isLeader: boolean;
    }>
  >([]);
  const [editedTeamName, setEditedTeamName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Get user role from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserRole(userData.role);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }

    fetchRegistrations(token);
  }, [router]);

  const fetchRegistrations = async (token: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/recent?limit=10000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch registrations");
      }

      const result = await response.json();
      // console.log(result.data);
      setRegistrations(result.data);
      setFilteredRegistrations(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/roles/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAllEvents(result.data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredRegistrations(registrations);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = registrations.filter(
      (reg) =>
        reg.user?.name?.toLowerCase().includes(lowercaseQuery) ||
        reg.user?.email?.toLowerCase().includes(lowercaseQuery) ||
        reg.event?.title?.toLowerCase().includes(lowercaseQuery) ||
        reg.teamName?.toLowerCase().includes(lowercaseQuery),
    );
    setFilteredRegistrations(filtered);
  };

  const handleCheckInToggle = async (
    registrationId: string,
    type: "building" | "session",
    currentStatus: boolean,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${registrationId}/checkin`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            status: !currentStatus,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update check-in status");
      }

      // Refresh registrations
      fetchRegistrations(token);
    } catch (err: any) {
      // console.log(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleSendQRCode = async (registrationId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSendingEmail(registrationId);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${registrationId}/resend-qr`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send QR code");
      }

      alert("QR code sent successfully!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendODLetter = async (registrationId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSendingOD(registrationId);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${registrationId}/send-od`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send OD letter");
      }

      alert("OD letter sent successfully!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingOD(null);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this registration? This action cannot be undone.",
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setDeletingId(registrationId);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${registrationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete registration");
      }

      alert("Registration deleted successfully!");
      fetchRegistrations(token);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const openTeamModal = (registration: Registration) => {
    setSelectedTeam(registration);
    setTeamModalOpen(true);
  };

  // Open Edit Event Modal
  const openEditEventModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setSelectedEventId(registration.event?._id || "");
    setEditEventModalOpen(true);
    fetchAllEvents();
  };

  // Open Edit Team Modal
  const openEditTeamModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setEditedTeamName(registration.teamName || "");
    setEditedTeamMembers(
      registration.teamMembers ? [...registration.teamMembers] : [],
    );
    setEditTeamModalOpen(true);
  };

  // Handle changing event for a registration
  const handleChangeEvent = async () => {
    if (!selectedRegistration || !selectedEventId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setChangingEvent(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${selectedRegistration._id}/change-event`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newEventId: selectedEventId }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to change event");
      }

      alert(result.message);
      setEditEventModalOpen(false);
      setSelectedRegistration(null);
      fetchRegistrations(token);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setChangingEvent(false);
    }
  };

  // Handle saving team member changes
  const handleSaveTeamChanges = async () => {
    if (!selectedRegistration) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Validate team members
    for (const member of editedTeamMembers) {
      if (
        !member.name ||
        !member.email ||
        !member.phoneNumber ||
        !member.college
      ) {
        alert("All team member fields are required");
        return;
      }
    }

    setSavingTeam(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${selectedRegistration._id}/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamName: editedTeamName,
            teamMembers: editedTeamMembers,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update team details");
      }

      alert("Team details updated successfully!");
      setEditTeamModalOpen(false);
      setSelectedRegistration(null);
      fetchRegistrations(token);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingTeam(false);
    }
  };

  // Update a specific team member field
  const updateTeamMember = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const updated = [...editedTeamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTeamMembers(updated);
  };

  const exportToCSV = () => {
    if (registrations.length === 0) {
      alert("No registrations to export");
      return;
    }

    setExporting(true);
    try {
      // CSV headers (excluding createdAt)
      const headers = [
        "Registration ID",
        "User Name",
        "User Email",
        "Event Title",
        "Event Date",
        "Event Venue",
        "Event Type",
        "Is Team Registration",
        "Team Name",
        "Team Members Count",
        "Team Members Details",
        "Phone Number",
        "College",
        "Registration Status",
        "Attended",
        "Building Check-In Status",
        "Building Check-In Time",
        "Session Check-In Status",
        "Session Check-In Time",
      ];

      // Convert registrations to CSV rows
      const rows = registrations.map((reg) => {
        // Format team members details
        const teamMembersDetails = reg.teamMembers
          ? reg.teamMembers
              .map(
                (m) =>
                  `${m.name} (${m.email}, ${m.phoneNumber}, ${m.college}${m.isLeader ? " - Leader" : ""})`,
              )
              .join(" | ")
          : "";

        return [
          reg._id,
          reg.user?.name || "Unknown",
          reg.user?.email || "N/A",
          reg.event?.title || "Event Deleted",
          reg.event?.date || "N/A",
          reg.event?.venue || "N/A",
          reg.event?.eventType || "N/A",
          reg.isTeamRegistration ? "Yes" : "No",
          reg.teamName || "",
          reg.teamMembers?.length || 0,
          teamMembersDetails,
          reg.phoneNumber || "",
          reg.college || "",
          reg.registrationStatus,
          reg.attended ? "Yes" : "No",
          reg.buildingCheckIn?.status ? "Checked In" : "Not Checked In",
          reg.buildingCheckIn?.timestamp || "",
          reg.sessionCheckIn?.status ? "Checked In" : "Not Checked In",
          reg.sessionCheckIn?.timestamp || "",
        ];
      });

      // Escape CSV values
      const escapeCSV = (
        value: string | number | boolean | null | undefined,
      ) => {
        const str = String(value ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `registrations_export_${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully exported ${registrations.length} registrations!`);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING REGISTRATIONS...
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
          <Link
            href="/admin"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            REGISTRATION
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl md:text-4xl text-primary font-orbitron">
              MANAGEMENT
            </h2>
            {userRole === "superadmin" && (
              <button
                onClick={exportToCSV}
                disabled={exporting || registrations.length === 0}
                className="px-6 py-3 bg-primary text-black font-bold rounded hover:bg-white transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Exporting...
                  </>
                ) : (
                  <>📥 Export All ({registrations.length})</>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Search BEvent Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">
                    Reg ar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <input
            type="text"
            placeholder="Search by name, email, event, or team name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-6 py-4 bg-black border border-primary/30 text-white rounded-lg focus:border-primary focus:outline-none font-mono"
          />
          <div className="text-gray-400 text-sm mt-2">
            Showing {filteredRegistrations.length} of {registrations.length}{" "}
            registrations
          </div>
        </motion.div>

        {/* Registrations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black border border-primary/20 rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-primary/20">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                    Reg Type
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((registration, index) => (
                  <tr
                    key={registration._id}
                    className={`border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors ${
                      index % 2 === 0 ? "bg-black" : "bg-gray-900/10"
                    }`}
                  >
                    {/* User Info */}
                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="text-white font-semibold text-xs">
                          {registration.user?.name || "Unknown"}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {registration.user?.email || "N/A"}
                        </div>
                        {registration.isTeamRegistration &&
                          registration.teamName && (
                            <div className="text-primary text-xs font-mono">
                              {registration.teamName}
                            </div>
                          )}
                      </div>
                    </td>

                    {/* Event Info */}
                    <td className="px-3 py-2">
                      <div className="text-white text-xs">
                        {registration.event?.title || "Event Deleted"}
                      </div>
                    </td>

                    {/* Event Type */}
                    <td className="px-3 py-2 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                        {registration.event?.eventType || "N/A"}
                      </span>
                    </td>

                    {/* Registration Type */}
                    <td className="px-3 py-2 text-center">
                      {registration.isTeamRegistration ? (
                        <button
                          onClick={() => openTeamModal(registration)}
                          className="inline-block px-2 py-0.5 text-xs rounded bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 transition-colors cursor-pointer"
                        >
                          Team ({registration.teamMembers?.length || 0})
                        </button>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
                          Solo
                        </span>
                      )}
                    </td>

                    {/* Building Check-in */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() =>
                            handleCheckInToggle(
                              registration._id,
                              "building",
                              registration.buildingCheckIn?.status || false,
                            )
                          }
                          className={`px-2 py-0.5 text-xs rounded font-semibold transition-colors ${
                            registration.buildingCheckIn?.status
                              ? "bg-green-500/20 text-green-400 border border-green-500/50"
                              : "bg-red-500/20 text-red-400 border border-red-500/50"
                          }`}
                        >
                          {registration.buildingCheckIn?.status ? "✓" : "✗"}
                        </button>
                      </div>
                    </td>

                    {/* Session Check-in */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() =>
                            handleCheckInToggle(
                              registration._id,
                              "session",
                              registration.sessionCheckIn?.status || false,
                            )
                          }
                          className={`px-2 py-0.5 text-xs rounded font-semibold transition-colors ${
                            registration.sessionCheckIn?.status
                              ? "bg-green-500/20 text-green-400 border border-green-500/50"
                              : "bg-red-500/20 text-red-400 border border-red-500/50"
                          }`}
                        >
                          {registration.sessionCheckIn?.status ? "✓" : "✗"}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded uppercase ${
                          registration.registrationStatus === "registered"
                            ? "bg-blue-500/20 text-blue-400"
                            : registration.registrationStatus === "attended"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {registration.registrationStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {userRole === "superadmin" && (
                          <>
                            <button
                              onClick={() => openEditEventModal(registration)}
                              className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded hover:bg-yellow-500/30 transition-colors whitespace-nowrap"
                              title="Change Event"
                            >
                              🔄
                            </button>
                            {registration.isTeamRegistration && (
                              <button
                                onClick={() => openEditTeamModal(registration)}
                                className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded hover:bg-purple-500/30 transition-colors whitespace-nowrap"
                                title="Edit Team Details"
                              >
                                ✏️
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleSendQRCode(registration._id)}
                          disabled={sendingEmail === registration._id}
                          className="px-2 py-0.5 text-xs bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          title="Send QR Code"
                        >
                          {sendingEmail === registration._id ? "..." : "📧"}
                        </button>
                        <button
                          onClick={() => handleSendODLetter(registration._id)}
                          disabled={sendingOD === registration._id}
                          className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          title="Send OD Letter"
                        >
                          {sendingOD === registration._id ? "..." : "📄"}
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteRegistration(registration._id)
                          }
                          disabled={deletingId === registration._id}
                          className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          title="Delete Registration"
                        >
                          {deletingId === registration._id ? "..." : "🗑️"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Team Members Modal */}
        {teamModalOpen && selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border-2 border-primary/30 rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-primary/20 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-primary font-orbitron">
                    TEAM DETAILS
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedTeam.teamName}
                  </p>
                </div>
                <button
                  onClick={() => setTeamModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Event:</div>
                  <div className="text-white font-semibold">
                    {selectedTeam.event?.title}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-3">
                    Team Members ({selectedTeam.teamMembers?.length || 0}):
                  </div>
                  <div className="space-y-3">
                    {selectedTeam.teamMembers?.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-black/50 border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-white font-semibold">
                              {member.name}
                            </div>
                            {member.isLeader && (
                              <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary border border-primary/50 rounded">
                                LEADER
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">📧 {member.email}</div>
                          <div className="text-gray-400">
                            📱 {member.phoneNumber}
                          </div>
                          <div className="text-gray-400 col-span-full">
                            🏫 {member.college}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setTeamModalOpen(false)}
                  className="w-full px-6 py-3 bg-primary text-black font-bold rounded hover:bg-white transition-colors uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Event Modal */}
        {editEventModalOpen && selectedRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border-2 border-primary/30 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-primary/20 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-primary font-orbitron">
                    CHANGE EVENT
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedRegistration.user?.name} - Currently:{" "}
                    {selectedRegistration.event?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditEventModalOpen(false);
                    setSelectedRegistration(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">
                    Registration Type:
                  </div>
                  <div className="text-white">
                    {selectedRegistration.isTeamRegistration
                      ? `Team (${selectedRegistration.teamMembers?.length || 0} members)`
                      : "Individual"}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">
                    Select New Event:
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-primary/30 text-white rounded focus:border-primary focus:outline-none"
                  >
                    <option value="">-- Select an event --</option>
                    {allEvents.map((event) => (
                      <option
                        key={event._id}
                        value={event._id}
                        disabled={event._id === selectedRegistration.event?._id}
                      >
                        {event.title}{" "}
                        {event._id === selectedRegistration.event?._id
                          ? "(Current)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <div className="text-yellow-400 text-sm">
                    <strong>⚠️ Note:</strong> Changing the event will:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-400/80">
                      <li>Update capacity counts for both events</li>
                      <li>Reset check-in status for the registration</li>
                      <li>The QR code will still work for the new event</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setEditEventModalOpen(false);
                      setSelectedRegistration(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeEvent}
                    disabled={
                      changingEvent ||
                      !selectedEventId ||
                      selectedEventId === selectedRegistration.event?._id
                    }
                    className="flex-1 px-6 py-3 bg-primary text-black font-bold rounded hover:bg-white transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingEvent ? "Changing..." : "Change Event"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Team Modal */}
        {editTeamModalOpen && selectedRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border-2 border-primary/30 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-primary/20 px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-2xl font-bold text-primary font-orbitron">
                    EDIT TEAM DETAILS
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedRegistration.event?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditTeamModalOpen(false);
                    setSelectedRegistration(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Team Name */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">
                    Team Name:
                  </label>
                  <input
                    type="text"
                    value={editedTeamName}
                    onChange={(e) => setEditedTeamName(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-primary/30 text-white rounded focus:border-primary focus:outline-none"
                    placeholder="Enter team name"
                  />
                </div>

                {/* Team Members */}
                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-3">
                    Team Members ({editedTeamMembers.length}):
                  </div>
                  <div className="space-y-4">
                    {editedTeamMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-black/50 border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-white font-semibold">
                            Member {idx + 1}
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={member.isLeader}
                              onChange={(e) =>
                                updateTeamMember(
                                  idx,
                                  "isLeader",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-primary">Team Leader</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) =>
                                updateTeamMember(idx, "name", e.target.value)
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={member.email}
                              onChange={(e) =>
                                updateTeamMember(idx, "email", e.target.value)
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={member.phoneNumber}
                              onChange={(e) =>
                                updateTeamMember(
                                  idx,
                                  "phoneNumber",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                              placeholder="Phone Number"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              College
                            </label>
                            <input
                              type="text"
                              value={member.college}
                              onChange={(e) =>
                                updateTeamMember(idx, "college", e.target.value)
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                              placeholder="College/Institution"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="text-blue-400 text-sm">
                    <strong>💡 Tip:</strong> After updating email addresses, use
                    the &quot;Send OD Letter&quot; button to resend OD letters
                    to the updated email addresses.
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setEditTeamModalOpen(false);
                      setSelectedRegistration(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTeamChanges}
                    disabled={savingTeam}
                    className="flex-1 px-6 py-3 bg-primary text-black font-bold rounded hover:bg-white transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingTeam ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {searchQuery
              ? "No registrations match your search"
              : "No registrations found"}
          </div>
        )}
      </div>
    </div>
  );
}
