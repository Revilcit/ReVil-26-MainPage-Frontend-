"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface ManualEntry {
  _id: string;
  user: {
    name: string;
    email: string;
    phoneNumber: string;
    college: string;
  };
  event: {
    title: string;
    date?: string;
  };
  addedBy: string;
  createdAt: string;
  paymentStatus: string;
}

export default function ManualEntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byEvent: {} as Record<string, number>,
    byTeamMember: {} as Record<string, number>,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchManualEntries(token);
  }, [router]);

  const fetchManualEntries = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/manual-entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch manual entries");
      }

      const data = await response.json();
      setEntries(data.data);

      // Calculate stats
      const total = data.data.length;
      const byEvent: Record<string, number> = {};
      const byTeamMember: Record<string, number> = {};

      data.data.forEach((entry: ManualEntry) => {
        // Count by event
        const eventTitle = entry.event.title;
        byEvent[eventTitle] = (byEvent[eventTitle] || 0) + 1;

        // Count by team member
        const addedBy = entry.addedBy || "Unknown";
        byTeamMember[addedBy] = (byTeamMember[addedBy] || 0) + 1;
      });

      setStats({ total, byEvent, byTeamMember });
    } catch (error) {
      console.error("Error fetching manual entries:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING...
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
            MANUAL
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            REGISTRATIONS
          </h2>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border border-primary/20 p-6 rounded-lg"
          >
            <h3 className="text-gray-400 text-sm mb-2">Total Manual Entries</h3>
            <p className="text-4xl font-bold text-primary">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black border border-primary/20 p-6 rounded-lg"
          >
            <h3 className="text-gray-400 text-sm mb-2">
              Events with Manual Entries
            </h3>
            <p className="text-4xl font-bold text-primary">
              {Object.keys(stats.byEvent).length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black border border-primary/20 p-6 rounded-lg"
          >
            <h3 className="text-gray-400 text-sm mb-2">Team Members Active</h3>
            <p className="text-4xl font-bold text-primary">
              {Object.keys(stats.byTeamMember).length}
            </p>
          </motion.div>
        </div>

        {/* By Event Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Manual Entries by Event
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.byEvent)
              .sort(([, a], [, b]) => b - a)
              .map(([event, count]) => (
                <div
                  key={event}
                  className="flex justify-between items-center p-3 bg-gray-900/50 rounded"
                >
                  <span className="text-gray-300 text-sm">{event}</span>
                  <span className="text-primary font-bold">{count}</span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* By Team Member Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            Manual Entries by Team Member
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.byTeamMember)
              .sort(([, a], [, b]) => b - a)
              .map(([member, count]) => (
                <div
                  key={member}
                  className="flex justify-between items-center p-3 bg-gray-900/50 rounded"
                >
                  <span className="text-gray-300 text-sm">{member}</span>
                  <span className="text-primary font-bold">{count}</span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* All Entries Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black border border-primary/20 rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-primary/20">
            <h3 className="text-xl font-bold text-white">All Manual Entries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/10 border-b border-primary/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {entries.map((entry, index) => (
                  <tr
                    key={entry._id}
                    className={`hover:bg-gray-900/50 transition-colors ${
                      index % 2 === 0 ? "bg-black" : "bg-gray-900/10"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {entry.user.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {entry.user.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        📱 {entry.user.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {entry.event.title}
                      </div>
                      {entry.event.date && (
                        <div className="text-xs text-gray-400">
                          {new Date(entry.event.date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {entry.addedBy || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        {entry.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {entries.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No manual entries found
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
