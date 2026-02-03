"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface EventStats {
  totalEvents: number;
  totalRegistrations: number;
  sessionCheckedIn: number;
  notCheckedIn: number;
}

interface RecentRegistration {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  event: {
    title: string;
  };
  createdAt: string;
}

interface DashboardStats {
  overview: EventStats;
  recentRegistrations: RecentRegistration[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    green: "border-green-500/30 bg-green-500/5",
    red: "border-red-500/30 bg-red-500/5",
  };

  return (
    <div
      className={`${colorClasses[color]} border p-6 rounded-lg backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl">{icon}</div>
        <div className="text-3xl font-bold text-white">{value}</div>
      </div>
      <div className="text-sm text-gray-400 uppercase font-mono">{title}</div>
    </div>
  );
}

export default function EventManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/event-manager/dashboard/stats");
      setStats(response.data.data);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard");
      if (error.response?.status === 403) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING DASHBOARD...
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
            EVENT MANAGER
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            DASHBOARD
          </h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/dashboard/event-manager/events"
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
            >
              Manage Events
            </Link>
            <Link
              href="/dashboard/event-manager/certificates"
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition-colors text-sm"
            >
              📜 Generate Certificates
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600/20 text-gray-400 border border-gray-500/50 rounded hover:bg-gray-600/30 transition-colors text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Managed Events"
            value={stats?.overview.totalEvents || 0}
            icon="📅"
            color="primary"
          />
          <StatCard
            title="Registrations"
            value={stats?.overview.totalRegistrations || 0}
            icon="🎫"
            color="blue"
          />
          <StatCard
            title="Session Checked In"
            value={stats?.overview.sessionCheckedIn || 0}
            icon="✓"
            color="green"
          />
          <StatCard
            title="Not Checked In"
            value={stats?.overview.notCheckedIn || 0}
            icon="✗"
            color="red"
          />
        </motion.div>

        {/* Recent Registrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black border border-primary/20 rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-primary/20">
            <h3 className="text-xl font-bold text-white font-orbitron">
              RECENT REGISTRATIONS
            </h3>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.recentRegistrations?.map((reg) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {reg.event.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentRegistrations ||
                  !stats.recentRegistrations.length) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No recent registrations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
