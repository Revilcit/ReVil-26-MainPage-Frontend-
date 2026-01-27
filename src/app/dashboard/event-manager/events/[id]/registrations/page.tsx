"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DebouncedSearch } from "@/components/ui/DebouncedSearch";
import { motion } from "framer-motion";
import Link from "next/link";

interface Registration {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  sessionCheckedIn: boolean;
  buildingCheckedIn: boolean;
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
        (r: any) => r.sessionCheckedIn,
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

  const toggleCheckIn = async (regId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/event-manager/registrations/${regId}/session-checkin`, {
        status: !currentStatus,
      });
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Email
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-gray-900/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {reg.user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {reg.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                          reg.buildingCheckedIn
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {reg.buildingCheckedIn ? "Entered" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() =>
                          toggleCheckIn(reg._id, reg.sessionCheckedIn)
                        }
                        disabled={!reg.buildingCheckedIn}
                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                          reg.sessionCheckedIn
                            ? "bg-green-500 text-white"
                            : "bg-gray-600 text-gray-300 hover:bg-primary hover:text-black"
                        } ${!reg.buildingCheckedIn ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {reg.sessionCheckedIn ? "Present" : "Absent"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => sendODLetter(reg._id)}
                        disabled={!reg.sessionCheckedIn}
                        className={`text-primary hover:text-white transition-colors ${
                          !reg.sessionCheckedIn
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
    </div>
  );
}
