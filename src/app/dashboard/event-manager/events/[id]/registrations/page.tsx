"use client";

import { useEffect, useState, use } from "react";
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
    phoneNumber?: string;
    college?: string;
  };
  event?: {
    _id: string;
    title: string;
  };
  phoneNumber?: string;
  college?: string;
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  sessionCheckIn: {
    status: boolean;
    timestamp?: string;
  };
  buildingCheckIn: {
    status: boolean;
    timestamp?: string;
  };
  hasReceivedODLetter: boolean;
}

export default function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [viewingTeam, setViewingTeam] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [id, search]);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(
        `/event-manager/events/${id}/registrations?search=${search}`,
      );
      setRegistrations(response.data.data);
      const total = response.data.data.length;
      const checkedIn = response.data.data.filter(
        (r: any) => r.sessionCheckIn?.status,
      ).length;
      setStats({ total, checkedIn });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch registrations",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckIn = async (regId: string) => {
    try {
      await api.put(`/event-manager/registrations/${regId}/session-checkin`);
      toast.success(`Check-in status updated`);
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const sendODLetter = async (regId: string) => {
    try {
      await api.post(`/event-manager/registrations/${regId}/send-od-letter`);
      toast.success("OD Letter sent successfully");
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OD letter");
    }
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
            href="/dashboard/event-manager/events"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Events
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            EVENT
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            REGISTRATIONS
          </h2>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-black border border-primary/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 uppercase">
                Total Registrations
              </div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
          </div>
          <div className="bg-black border border-green-500/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 uppercase">
                Session Checked In
              </div>
              <div className="text-3xl font-bold text-green-500">
                {stats.checkedIn}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <label className="block text-gray-400 text-sm mb-2">
            Search registrations
          </label>
          <DebouncedSearch
            onSearch={setSearch}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
          />
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    OD Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {registrations.map((reg) => (
                  <tr 
                    key={reg._id} 
                    className={`hover:bg-gray-900/50 transition-colors ${
                      reg.isTeamRegistration ? "cursor-pointer" : ""
                    }`}
                    onClick={() => reg.isTeamRegistration && setViewingTeam(reg)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-white">
                          {reg.user.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {reg.user.email}
                        </div>
                        {reg.isTeamRegistration && reg.teamName && (
                          <button
                            onClick={() => setViewingTeam(reg)}
                            className="mt-1 px-2 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors inline-flex items-center gap-1 w-fit"
                          >
                            👥 {reg.teamName}
                            <span className="text-[10px] bg-cyan-500/30 px-1.5 py-0.5 rounded">
                              {reg.teamMembers?.length || 0} members
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                          reg.buildingCheckIn?.status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {reg.buildingCheckIn?.status ? "Entered" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleCheckIn(reg._id)}
                        disabled={!reg.buildingCheckIn?.status}
                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                          reg.sessionCheckIn?.status
                            ? "bg-green-500 text-white"
                            : "bg-gray-600 text-gray-300 hover:bg-primary hover:text-black"
                        } ${!reg.buildingCheckIn?.status ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {reg.sessionCheckIn?.status ? "Present" : "Absent"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`text-xs font-semibold ${
                          reg.hasReceivedODLetter
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {reg.hasReceivedODLetter ? "Sent" : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => sendODLetter(reg._id)}
                        disabled={!reg.sessionCheckIn?.status}
                        className={`text-primary hover:text-white transition-colors text-sm ${
                          !reg.sessionCheckIn?.status
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {reg.hasReceivedODLetter ? "Resend OD" : "Send OD"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {registrations.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No registrations found
            </div>
          )}
        </motion.div>
      </div>

      {/* Team Details Modal */}
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
                  Event: {viewingTeam.event?.title || "N/A"}
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
                                  ⭐ Leader
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

            <div className="mt-8">
              <button
                onClick={() => setViewingTeam(null)}
                className="w-full px-6 py-3 bg-primary text-black font-bold text-sm uppercase rounded hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
