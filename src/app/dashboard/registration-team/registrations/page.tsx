"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DebouncedSearch } from "@/components/ui/DebouncedSearch";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface TeamMember {
  name: string;
  email: string;
  phoneNumber: string;
  college: string;
  department?: string;
  year?: string;
  isLeader?: boolean;
}

interface Registration {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    college: string;
  };
  event: {
    _id: string;
    title: string;
    eventType?: string;
    isTeamEvent?: boolean;
  };
  phoneNumber?: string;
  college?: string;
  department?: string;
  year?: string;
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  buildingCheckIn: {
    status: boolean;
    timestamp?: string;
  };
  sessionCheckIn?: {
    status: boolean;
    timestamp?: string;
  };
  paymentStatus: string;
  registrationStatus?: string;
  createdAt?: string;
}

export default function RegistrationTeamList() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Registration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Registration | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [uniqueEvents, setUniqueEvents] = useState<
    Array<{ _id: string; title: string }>
  >([]);

  useEffect(() => {
    fetchRegistrations();
  }, [search]);

  useEffect(() => {
    handleFilter();
  }, [filterStatus, filterEvent, registrations]);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(
        `/registration-team/registrations?search=${search}`,
      );
      const data = response.data.data;
      setRegistrations(data);
      setFilteredRegistrations(data);

      // Extract unique events
      const eventsMap = new Map();
      data.forEach((reg: Registration) => {
        if (reg.event && reg.event._id) {
          eventsMap.set(reg.event._id, {
            _id: reg.event._id,
            title: reg.event.title,
          });
        }
      });
      setUniqueEvents(Array.from(eventsMap.values()));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch registrations",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = [...registrations];

    // Apply status filter
    if (filterStatus === "checkedIn") {
      filtered = filtered.filter((reg) => reg.buildingCheckIn?.status);
    } else if (filterStatus === "notCheckedIn") {
      filtered = filtered.filter((reg) => !reg.buildingCheckIn?.status);
    }

    // Apply event filter
    if (filterEvent !== "all") {
      filtered = filtered.filter((reg) => reg.event._id === filterEvent);
    }

    setFilteredRegistrations(filtered);
  };

  const toggleBuildingCheckIn = async (regId: string) => {
    try {
      await api.put(
        `/registration-team/registrations/${regId}/building-checkin`
      );
      toast.success(`Check-in status updated`);
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    try {
      await api.patch(`/registration-team/users/${editingReg.user._id}`, {
        name: editingReg.user.name,
        email: editingReg.user.email,
        phoneNumber: editingReg.user.phoneNumber,
        college: editingReg.user.college,
      });
      toast.success("User details updated");
      setEditingReg(null);
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Phone",
      "College",
      "Department",
      "Event",
      "Team Registration",
      "Team Name",
      "Team Size",
      "Building Check-in",
      "Payment Status",
      "Registration Date",
    ];
    const rows = filteredRegistrations.map((reg) => [
      reg.user.name,
      reg.user.email,
      reg.phoneNumber || reg.user.phoneNumber || "N/A",
      reg.college || reg.user.college,
      reg.department || "N/A",
      reg.event.title,
      reg.isTeamRegistration ? "Yes" : "No",
      reg.teamName || "N/A",
      reg.isTeamRegistration && reg.teamMembers ? reg.teamMembers.length.toString() : "1",
      reg.buildingCheckIn?.status ? "Yes" : "No",
      reg.paymentStatus || "N/A",
      reg.createdAt ? new Date(reg.createdAt).toLocaleString() : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registrations_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Registrations exported successfully");
  };

  if (loading && !search) {
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
            href="/dashboard/registration-team"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Registration Team Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            ALL
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            REGISTRATIONS
          </h2>
          <p className="text-gray-400">
            Showing {registrations.length} registration
            {registrations.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3">
              <label className="block text-gray-400 text-sm mb-2">
                Search by name, email, or college
              </label>
              <DebouncedSearch
                onSearch={setSearch}
                placeholder="Search registrations..."
                className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Filter by status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="checkedIn">Checked In</option>
                <option value="notCheckedIn">Not Checked In</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Filter by event
              </label>
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
              >
                <option value="all">All Events</option>
                {uniqueEvents.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              Showing {filteredRegistrations.length} of {registrations.length}{" "}
              registrations
            </div>
            <button
              onClick={handleExport}
              disabled={filteredRegistrations.length === 0}
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
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
              <thead className="bg-primary/10 border-b border-primary/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Event / Team
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRegistrations.map((reg, index) => (
                  <tr
                    key={reg._id}
                    className={`hover:bg-gray-900/50 transition-colors ${
                      index % 2 === 0 ? "bg-black" : "bg-gray-900/10"
                    } ${
                      reg.isTeamRegistration ? "cursor-pointer" : ""
                    }`}
                    onClick={() => reg.isTeamRegistration && setViewingTeam(reg)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {reg.user.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-1">
                            {reg.user.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            📱 {reg.phoneNumber || reg.user.phoneNumber || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            🏫 {reg.college || reg.user.college}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-700 text-gray-300 inline-block">
                          {reg.event.title}
                        </span>
                        {reg.isTeamRegistration && reg.teamName ? (
                          <button
                            onClick={() => setViewingTeam(reg)}
                            className="px-2 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors inline-flex items-center gap-1"
                          >
                            👥 {reg.teamName}
                            <span className="text-[10px] bg-cyan-500/30 px-1.5 py-0.5 rounded">
                              {reg.teamMembers?.length || 0} members
                            </span>
                          </button>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400 inline-block">
                            Individual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleBuildingCheckIn(reg._id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${
                          reg.buildingCheckIn?.status
                            ? "bg-green-500 text-white"
                            : "bg-gray-600 text-gray-300 hover:bg-primary hover:text-black"
                        }`}
                      >
                        {reg.buildingCheckIn?.status ? "✓ Checked" : "Check In"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          reg.paymentStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : reg.paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {reg.paymentStatus || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingReg(reg)}
                        className="text-primary hover:text-white transition-colors text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {search || filterStatus !== "all" || filterEvent !== "all"
                ? "No registrations match your filters"
                : "No registrations found"}
            </div>
          )}
        </motion.div>
      </div>

      {/* Team Details Modal */}
      <AnimatePresence>
        {viewingTeam && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewingTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-cyan-500/30 p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,240,255,0.2)]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-orbitron text-cyan-400">
                      👥 {viewingTeam.teamName}
                    </h2>
                    <span className="px-3 py-1 text-sm rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {viewingTeam.teamMembers?.length || 0} Members
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Event: {viewingTeam.event.title}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Registered: {viewingTeam.createdAt ? new Date(viewingTeam.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setViewingTeam(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Team Members Section */}
                {viewingTeam.teamMembers && viewingTeam.teamMembers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      Team Members
                      <span className="text-sm font-normal text-gray-400">({viewingTeam.teamMembers.length})</span>
                    </h3>
                    <div className="grid gap-4">
                      {viewingTeam.teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="bg-gray-900/70 border border-gray-700 rounded-lg p-5 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-lg">{member.name}</h4>
                                {member.isLeader && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    ⭐ Co-Leader
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">📧 Email</p>
                              <p className="text-gray-200 text-sm break-all">{member.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">📱 Phone</p>
                              <p className="text-gray-200 text-sm font-medium">{member.phoneNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">🏫 College</p>
                              <p className="text-gray-200 text-sm">{member.college}</p>
                            </div>
                            {member.department && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">🎓 Department</p>
                                <p className="text-gray-200 text-sm">{member.department}</p>
                              </div>
                            )}
                            {member.year && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">📅 Year</p>
                                <p className="text-gray-200 text-sm">{member.year}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setViewingTeam(null)}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white font-bold text-sm uppercase rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setEditingReg(viewingTeam);
                    setViewingTeam(null);
                  }}
                  className="flex-1 px-6 py-3 bg-primary text-black font-bold text-sm uppercase rounded hover:bg-white transition-colors"
                >
                  Edit Leader Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border border-primary/30 p-8 rounded-lg w-full max-w-md"
            >
              <h2 className="text-xl font-orbitron text-white mb-6">
                Edit User Details
              </h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editingReg.user.name}
                    onChange={(e) =>
                      setEditingReg({
                        ...editingReg,
                        user: { ...editingReg.user, name: e.target.value },
                      })
                    }
                    className="w-full bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingReg.user.email}
                    onChange={(e) =>
                      setEditingReg({
                        ...editingReg,
                        user: { ...editingReg.user, email: e.target.value },
                      })
                    }
                    className="w-full bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editingReg.user.phoneNumber || ""}
                    onChange={(e) =>
                      setEditingReg({
                        ...editingReg,
                        user: { ...editingReg.user, phoneNumber: e.target.value },
                      })
                    }
                    className="w-full bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    College
                  </label>
                  <input
                    type="text"
                    value={editingReg.user.college}
                    onChange={(e) =>
                      setEditingReg({
                        ...editingReg,
                        user: { ...editingReg.user, college: e.target.value },
                      })
                    }
                    className="w-full bg-black border border-gray-600 rounded px-4 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingReg(null)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 font-bold text-sm uppercase rounded hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-black font-bold text-sm uppercase rounded hover:bg-white transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
