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
    title: string;
    date: string;
    venue: string;
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchRegistrations(token);
  }, [router]);

  const fetchRegistrations = async (token: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/recent?limit=500`,
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
      console.log(result.data);
      setRegistrations(result.data);
      setFilteredRegistrations(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      console.log(err);
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
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            MANAGEMENT
          </h2>
        </motion.div>

        {/* Search Bar */}
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-primary">
                    Building Check-in
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-primary">
                    Session Check-in
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-primary">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-primary">
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
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-white font-semibold text-sm">
                          {registration.user?.name || "Unknown"}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {registration.user?.email || "N/A"}
                        </div>
                        {registration.isTeamRegistration &&
                          registration.teamName && (
                            <div className="text-primary text-xs font-mono">
                              Team: {registration.teamName}
                            </div>
                          )}
                      </div>
                    </td>

                    {/* Event Info */}
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">
                        {registration.event?.title || "Event Deleted"}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          registration.isTeamRegistration
                            ? "bg-primary/20 text-primary"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {registration.isTeamRegistration
                          ? "Team"
                          : "Individual"}
                      </span>
                    </td>

                    {/* Building Check-in */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() =>
                            handleCheckInToggle(
                              registration._id,
                              "building",
                              registration.buildingCheckIn?.status || false,
                            )
                          }
                          className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                            registration.buildingCheckIn?.status
                              ? "bg-green-500/20 text-green-400 border border-green-500/50"
                              : "bg-red-500/20 text-red-400 border border-red-500/50"
                          }`}
                        >
                          {registration.buildingCheckIn?.status
                            ? "✓ Yes"
                            : "✗ No"}
                        </button>
                        {registration.buildingCheckIn?.timestamp && (
                          <div className="text-xs text-gray-500">
                            {new Date(
                              registration.buildingCheckIn.timestamp,
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Session Check-in */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() =>
                            handleCheckInToggle(
                              registration._id,
                              "session",
                              registration.sessionCheckIn?.status || false,
                            )
                          }
                          className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                            registration.sessionCheckIn?.status
                              ? "bg-green-500/20 text-green-400 border border-green-500/50"
                              : "bg-red-500/20 text-red-400 border border-red-500/50"
                          }`}
                        >
                          {registration.sessionCheckIn?.status
                            ? "✓ Yes"
                            : "✗ No"}
                        </button>
                        {registration.sessionCheckIn?.timestamp && (
                          <div className="text-xs text-gray-500">
                            {new Date(
                              registration.sessionCheckIn.timestamp,
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs rounded ${
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
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleSendQRCode(registration._id)}
                          disabled={sendingEmail === registration._id}
                          className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                        >
                          {sendingEmail === registration._id
                            ? "Sending..."
                            : "📧 Send QR"}
                        </button>
                        <button
                          onClick={() => handleSendODLetter(registration._id)}
                          disabled={sendingOD === registration._id}
                          className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                        >
                          {sendingOD === registration._id
                            ? "Sending..."
                            : "📄 Send OD"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

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
