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
  addedBy?: string;
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
  
  // Manual entry states
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    college: "",
    department: "",
    year: "",
    isTeamRegistration: false,
    teamName: "",
    teamMembers: [] as TeamMember[],
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<{
    code: string;
    image: string;
    userName: string;
    eventName: string;
    userEmail: string;
  } | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  
  // Event details for team event logic
  const [eventDetails, setEventDetails] = useState<{
    isTeamEvent: boolean;
    teamSize: { min: number; max: number };
  } | null>(null);
  
  // Computed values for team handling
  const isTeamEvent = eventDetails?.isTeamEvent || false;
  const minTeamSize = eventDetails?.teamSize?.min || 2;
  const maxTeamSize = eventDetails?.teamSize?.max || 5;

  useEffect(() => {
    fetchRegistrations();
    fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      const event = response.data.data;
      setEventTitle(event.title);
      setEventDetails({
        isTeamEvent: event.isTeamEvent || false,
        teamSize: event.teamSize || { min: 2, max: 5 },
      });
      
      // Initialize team members if it's a team event
      if (event.isTeamEvent) {
        const minSize = event.teamSize?.min || 2;
        const initialTeamMembers: TeamMember[] = Array.from(
          { length: minSize - 1 },
          () => ({
            name: "",
            email: "",
            phoneNumber: "",
            college: "",
            department: "",
            year: "",
            isLeader: false,
          })
        );
        setManualEntry((prev) => ({
          ...prev,
          isTeamRegistration: true,
          teamMembers: initialTeamMembers,
        }));
      }
    } catch {
      // Event details might not be accessible, fall back to registration data
      console.log("Could not fetch event details directly");
    }
  };

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
      // Get event title from first registration
      if (response.data.data.length > 0 && response.data.data[0].event?.title) {
        setEventTitle(response.data.data[0].event.title);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch registrations",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post(`/event-manager/events/${id}/registrations/manual`, manualEntry);
      toast.success("Manual registration added successfully");
      setShowManualEntryModal(false);
      
      // Show QR code if generated
      if (response.data.qrCode) {
        setGeneratedQR({
          code: response.data.qrCode.code,
          image: response.data.qrCode.image,
          userName: manualEntry.name,
          eventName: eventTitle || "Event",
          userEmail: manualEntry.email,
        });
        setShowQRModal(true);
      }
      
      resetManualEntry();
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add registration");
    } finally {
      setSubmitting(false);
    }
  };

  const resetManualEntry = () => {
    // Reset to initial state, respecting team event settings
    const initialTeamMembers: TeamMember[] = isTeamEvent
      ? Array.from({ length: minTeamSize - 1 }, () => ({
          name: "",
          email: "",
          phoneNumber: "",
          college: "",
          department: "",
          year: "",
          isLeader: false,
        }))
      : [];

    setManualEntry({
      name: "",
      email: "",
      phoneNumber: "",
      college: "",
      department: "",
      year: "",
      isTeamRegistration: isTeamEvent,
      teamName: "",
      teamMembers: initialTeamMembers,
    });
  };

  const addTeamMember = () => {
    if (manualEntry.teamMembers.length < maxTeamSize - 1) {
      setManualEntry({
        ...manualEntry,
        teamMembers: [
          ...manualEntry.teamMembers,
          {
            name: "",
            email: "",
            phoneNumber: "",
            college: "",
            department: "",
            year: "",
            isLeader: false,
          },
        ],
      });
    }
  };

  const removeTeamMember = (index: number) => {
    if (manualEntry.teamMembers.length > minTeamSize - 1) {
      const newMembers = [...manualEntry.teamMembers];
      newMembers.splice(index, 1);
      setManualEntry({
        ...manualEntry,
        teamMembers: newMembers,
      });
    }
  };

  const updateTeamMember = (
    index: number,
    field: keyof TeamMember,
    value: string | boolean
  ) => {
    const newMembers = [...manualEntry.teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setManualEntry({
      ...manualEntry,
      teamMembers: newMembers,
    });
  };

  const handleSendQREmail = async () => {
    if (!generatedQR) return;
    try {
      await api.post("/event-manager/send-qr-email", {
        email: generatedQR.userEmail,
        name: generatedQR.userName,
        qrCode: generatedQR.code,
        qrCodeImage: generatedQR.image,
        eventTitle: generatedQR.eventName,
      });
      toast.success(`QR code sent to ${generatedQR.userEmail}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send email");
    }
  };

  const handlePrintQR = () => {
    if (!generatedQR) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>QR Code - ${generatedQR.userName}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
            <h2>${generatedQR.userName}</h2>
            <p>${generatedQR.eventName}</p>
            <img src="${generatedQR.image}" style="width:300px;height:300px;" />
            <p style="font-family:monospace;font-size:12px;">${generatedQR.code}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
      const response = await api.post(
        `/event-manager/registrations/${regId}/send-od`,
      );
      toast.success(response.data?.message || "OD Letter sent successfully");
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
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowManualEntryModal(true)}
              className="px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/50 rounded hover:bg-orange-600/30 transition-colors text-sm font-semibold"
            >
              ➕ Add Manual Entry
            </button>
          </div>
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
                    onClick={() =>
                      reg.isTeamRegistration && setViewingTeam(reg)
                    }
                  >
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {reg.user.name}
                          </span>
                          {reg.addedBy && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                              💰 SPOT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {reg.user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          📱 {reg.phoneNumber || reg.user.phoneNumber || "N/A"}
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
                    <td
                      className="px-6 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                    <td
                      className="px-6 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleCheckIn(reg._id)}
                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                          reg.sessionCheckIn?.status
                            ? "bg-green-500 text-white"
                            : "bg-gray-600 text-gray-300 hover:bg-primary hover:text-black"
                        }`}
                      >
                        {reg.sessionCheckIn?.status ? "Present" : "Absent"}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                    <td
                      className="px-6 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => sendODLetter(reg._id)}
                        className="text-primary hover:text-white transition-colors text-sm"
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {viewingTeam.teamMembers &&
                viewingTeam.teamMembers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      Team Members
                      <span className="text-sm font-normal text-gray-400">
                        ({viewingTeam.teamMembers.length})
                      </span>
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
                                <h4 className="text-white font-bold text-lg">
                                  {member.name}
                                </h4>
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
                              <p className="text-xs text-gray-400 mb-1">
                                📧 Email
                              </p>
                              <p className="text-gray-200 text-sm break-all">
                                {member.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                📱 Phone
                              </p>
                              <p className="text-gray-200 text-sm font-medium">
                                {member.phoneNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                🏫 College
                              </p>
                              <p className="text-gray-200 text-sm">
                                {member.college}
                              </p>
                            </div>
                            {member.department && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  🎓 Department
                                </p>
                                <p className="text-gray-200 text-sm">
                                  {member.department}
                                </p>
                              </div>
                            )}
                            {member.year && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  📅 Year
                                </p>
                                <p className="text-gray-200 text-sm">
                                  {member.year}
                                </p>
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

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManualEntryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowManualEntryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-orange-500/30 p-8 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(255,165,0,0.2)]"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-orbitron text-orange-400">
                  ➕ Manual Registration
                </h2>
                <button
                  onClick={() => setShowManualEntryModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleManualEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualEntry.name}
                      onChange={(e) =>
                        setManualEntry({ ...manualEntry, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={manualEntry.email}
                      onChange={(e) =>
                        setManualEntry({ ...manualEntry, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={manualEntry.phoneNumber}
                      onChange={(e) =>
                        setManualEntry({ ...manualEntry, phoneNumber: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      College *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualEntry.college}
                      onChange={(e) =>
                        setManualEntry({ ...manualEntry, college: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                      placeholder="Enter college name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={manualEntry.department}
                      onChange={(e) =>
                        setManualEntry({ ...manualEntry, department: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                      placeholder="Enter department"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Year
                    </label>
                    <select
                      value={manualEntry.year}
                      onChange={(e) =>
                        setManualEntry({ ...manualEntry, year: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                </div>

                {/* Team Event Section */}
                {isTeamEvent && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">👥</span>
                      <h3 className="text-lg font-bold text-orange-400">
                        Team Registration
                      </h3>
                      <span className="text-xs text-gray-400">
                        (Min: {minTeamSize}, Max: {maxTeamSize} members)
                      </span>
                    </div>

                    {/* Team Name */}
                    <div className="mb-4">
                      <label className="block text-gray-400 text-sm mb-1">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        value={manualEntry.teamName}
                        onChange={(e) =>
                          setManualEntry({ ...manualEntry, teamName: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                        required={isTeamEvent}
                        placeholder="Enter team name"
                      />
                    </div>

                    {/* Leader Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mb-4">
                      <p className="text-blue-400 text-sm">
                        👤 <strong>{manualEntry.name || "Leader"}</strong> (details above) will be the Team Leader
                      </p>
                    </div>

                    {/* Team Members */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-300">
                          Team Members ({manualEntry.teamMembers.length + 1}/{maxTeamSize})
                        </h4>
                        {manualEntry.teamMembers.length < maxTeamSize - 1 && (
                          <button
                            type="button"
                            onClick={addTeamMember}
                            className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded hover:bg-orange-500/30 transition-colors"
                          >
                            + Add Member
                          </button>
                        )}
                      </div>

                      {manualEntry.teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-white">
                              Member {index + 2}
                            </span>
                            {manualEntry.teamMembers.length > minTeamSize - 1 && (
                              <button
                                type="button"
                                onClick={() => removeTeamMember(index)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) =>
                                  updateTeamMember(index, "name", e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                                required={isTeamEvent}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={member.email}
                                onChange={(e) =>
                                  updateTeamMember(index, "email", e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                                required={isTeamEvent}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Phone <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                value={member.phoneNumber}
                                onChange={(e) =>
                                  updateTeamMember(index, "phoneNumber", e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                                required={isTeamEvent}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                College <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={member.college}
                                onChange={(e) =>
                                  updateTeamMember(index, "college", e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                                required={isTeamEvent}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Department
                              </label>
                              <input
                                type="text"
                                value={member.department || ""}
                                onChange={(e) =>
                                  updateTeamMember(index, "department", e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Year
                              </label>
                              <select
                                value={member.year || ""}
                                onChange={(e) =>
                                  updateTeamMember(index, "year", e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              >
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                                <option value="5th Year">5th Year</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManualEntryModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 font-bold text-sm uppercase rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-orange-500 text-black font-bold text-sm uppercase rounded hover:bg-orange-400 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Adding..." : "Add Registration"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Display Modal */}
      <AnimatePresence>
        {showQRModal && generatedQR && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-green-500/30 p-8 rounded-lg w-full max-w-md text-center shadow-[0_0_50px_rgba(0,255,0,0.2)]"
            >
              <h2 className="text-2xl font-orbitron text-green-400 mb-2">
                ✅ Registration Added!
              </h2>
              <p className="text-gray-400 mb-4">{generatedQR.userName}</p>
              <p className="text-sm text-primary mb-4">{generatedQR.eventName}</p>

              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img
                  src={generatedQR.image}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <p className="text-xs text-gray-500 font-mono mb-6 break-all">
                {generatedQR.code}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handlePrintQR}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white font-bold text-sm uppercase rounded hover:bg-gray-600 transition-colors"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={handleSendQREmail}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold text-sm uppercase rounded hover:bg-blue-500 transition-colors"
                >
                  📧 Email
                </button>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full mt-4 px-4 py-3 bg-green-600 text-black font-bold text-sm uppercase rounded hover:bg-green-500 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
