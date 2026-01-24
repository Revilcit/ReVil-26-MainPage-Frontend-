"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface OverviewStats {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  checkedInUsers: number;
}

interface RoleDistribution {
  _id: string;
  count: number;
}

interface EventStatus {
  _id: string;
  count: number;
}

interface RecentRegistration {
  _id: string;
  count: number;
}

interface TopEvent {
  _id: string;
  title: string;
  currentRegistrations: number;
  capacity: number;
  date: string;
  eventType: string;
}

interface DashboardData {
  overview: OverviewStats;
  roleDistribution: RoleDistribution[];
  eventsByStatus: EventStatus[];
  recentRegistrations: RecentRegistration[];
  topEvents: TopEvent[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check user role first
    checkUserRole(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserRole = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // console.log("Unauthorized - redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch user profile");
      }

      const result = await response.json();
      // console.log("User profile:", result.data);
      const role = result.data.role;

      if (role !== "superadmin") {
        // console.log("User is not superadmin, redirecting to dashboard");
        setError("You must be an admin to access this page");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
        return;
      }

      // Load admin data
      fetchAdminData(token);
    } catch (err) {
      console.error("Error checking user role:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const fetchAdminData = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admin statistics");
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING ADMIN DASHBOARD...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 font-mono text-xl mb-4">ERROR</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
          >
            Back to Dashboard
          </button>
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
            ADMIN
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            DASHBOARD
          </h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/events"
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
            >
              Manage Events
            </Link>
            <Link
              href="/admin/registrations"
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
            >
              View Registrations
            </Link>
            <Link
              href="/admin/roles"
              className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded hover:bg-purple-600/30 transition-colors text-sm font-semibold"
            >
              🔐 Manage Roles
            </Link>
          </div>
        </motion.div>

        {data && (
          <>
            {/* Overview Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard
                title="Total Users"
                value={data.overview.totalUsers}
                icon="👥"
                color="primary"
              />
              <StatCard
                title="Total Events"
                value={data.overview.totalEvents}
                icon="📅"
                color="blue"
              />
              <StatCard
                title="Registrations"
                value={data.overview.totalRegistrations}
                icon="🎫"
                color="green"
              />
              <StatCard
                title="Checked In"
                value={data.overview.checkedInUsers}
                icon="✓"
                color="purple"
              />
            </motion.div>

            {/* Role Distribution & Event Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Role Distribution */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black border border-primary/20 p-6 rounded-lg"
              >
                <h3 className="text-xl font-bold text-white font-orbitron mb-4">
                  USER ROLES
                </h3>
                <div className="space-y-3">
                  {data.roleDistribution.map((role) => (
                    <div
                      key={role._id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-400 capitalize">
                        {role._id}
                      </span>
                      <span className="text-primary font-bold">
                        {role.count}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Event Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black border border-primary/20 p-6 rounded-lg"
              >
                <h3 className="text-xl font-bold text-white font-orbitron mb-4">
                  EVENT STATUS
                </h3>
                <div className="space-y-3">
                  {data.eventsByStatus.map((status) => (
                    <div
                      key={status._id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-400 capitalize">
                        {status._id}
                      </span>
                      <span className="text-primary font-bold">
                        {status.count}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Top Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
            >
              <h3 className="text-xl font-bold text-white font-orbitron mb-4">
                TOP EVENTS BY REGISTRATIONS
              </h3>
              <div className="space-y-4">
                {data.topEvents.map((event, index) => (
                  <div
                    key={event._id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded border border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {event.title}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary font-bold text-xl">
                        {event.currentRegistrations}
                      </div>
                      {event.eventType === "workshop" && (
                        <>
                          <div className="text-sm text-gray-400">
                            / {event.capacity} capacity
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(
                              (event.currentRegistrations / event.capacity) *
                                100,
                            )}
                            % filled
                          </div>
                        </>
                      )}
                      {event.eventType !== "workshop" && (
                        <div className="text-sm text-gray-400">registered</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Registration Trends */}
            {data.recentRegistrations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-black border border-primary/20 p-6 rounded-lg"
              >
                <h3 className="text-xl font-bold text-white font-orbitron mb-4">
                  REGISTRATION TRENDS (LAST 7 DAYS)
                </h3>
                <div className="space-y-2">
                  {data.recentRegistrations.map((day) => (
                    <div
                      key={day._id}
                      className="flex items-center justify-between p-3 bg-gray-900/30 rounded"
                    >
                      <span className="text-gray-400">{day._id}</span>
                      <span className="text-primary font-bold">
                        {day.count} registrations
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
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
    purple: "border-purple-500/30 bg-purple-500/5",
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
