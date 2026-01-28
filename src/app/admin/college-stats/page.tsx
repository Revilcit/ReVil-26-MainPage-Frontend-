"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface CollegeData {
  college: string;
  count: number;
  individuals: number;
  teamMembers: number;
  eventCount: number;
  events: string[];
}

interface EventOption {
  _id: string;
  title: string;
}

export default function CollegeStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collegeData, setCollegeData] = useState<CollegeData[]>([]);
  const [totalPeople, setTotalPeople] = useState(0);
  const [totalColleges, setTotalColleges] = useState(0);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    checkUserRole(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCollegeStats(token, selectedEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const checkUserRole = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch user profile");
      }

      const result = await response.json();
      const role = result.data.role;

      if (role !== "superadmin") {
        setError("You must be an admin to access this page");
        setTimeout(() => router.push("/dashboard"), 2000);
        return;
      }

      // Fetch events for filter dropdown
      fetchEvents(token);
      // Fetch college stats
      fetchCollegeStats(token, "all");
    } catch (err) {
      console.error("Error checking user role:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const fetchEvents = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setEvents(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const fetchCollegeStats = async (token: string, eventFilter: string) => {
    setLoading(true);
    try {
      const url =
        eventFilter === "all"
          ? `${API_URL}/api/admin/stats/college-distribution`
          : `${API_URL}/api/admin/stats/college-distribution-by-event/${eventFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch college statistics");
      }

      const result = await response.json();
      setCollegeData(result.data || []);
      setTotalPeople(result.totalPeople || 0);
      setTotalColleges(result.totalColleges || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredColleges = collegeData.filter((college) =>
    college.college.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const exportToCSV = () => {
    const headers = "College,Total Count,Individuals,Team Members,Events\n";
    const rows = filteredColleges
      .map(
        (c) =>
          `"${c.college}",${c.count},${c.individuals},${c.teamMembers},"${c.events?.join("; ") || ""}"`,
      )
      .join("\n");

    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `college-stats-${selectedEvent === "all" ? "all-events" : selectedEvent}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING COLLEGE STATISTICS...
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
            onClick={() => router.push("/admin")}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
          >
            Back to Admin
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
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            COLLEGE
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            STATISTICS
          </h2>
          <p className="text-gray-400">
            View attendee distribution by college, including team members
          </p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-black border border-primary/30 bg-primary/5 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">🎓</div>
              <div className="text-3xl font-bold text-white">
                {totalColleges}
              </div>
            </div>
            <div className="text-sm text-gray-400 uppercase font-mono">
              Total Colleges
            </div>
          </div>
          <div className="bg-black border border-green-500/30 bg-green-500/5 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">👥</div>
              <div className="text-3xl font-bold text-white">{totalPeople}</div>
            </div>
            <div className="text-sm text-gray-400 uppercase font-mono">
              Total Attendees
            </div>
          </div>
          <div className="bg-black border border-blue-500/30 bg-blue-500/5 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📊</div>
              <div className="text-3xl font-bold text-white">
                {totalColleges > 0
                  ? Math.round(totalPeople / totalColleges)
                  : 0}
              </div>
            </div>
            <div className="text-sm text-gray-400 uppercase font-mono">
              Avg per College
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-green-600 text-white font-bold uppercase text-sm hover:bg-green-500 transition-colors rounded"
          >
            📥 Export CSV
          </button>
        </motion.div>

        {/* College Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black border border-primary/20 rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50">
                  <th className="text-left px-6 py-4 text-primary font-mono text-sm uppercase">
                    #
                  </th>
                  <th className="text-left px-6 py-4 text-primary font-mono text-sm uppercase">
                    College
                  </th>
                  <th className="text-center px-6 py-4 text-primary font-mono text-sm uppercase">
                    Total
                  </th>
                  <th className="text-center px-6 py-4 text-primary font-mono text-sm uppercase">
                    Individuals
                  </th>
                  <th className="text-center px-6 py-4 text-primary font-mono text-sm uppercase">
                    Team Members
                  </th>
                  <th className="text-center px-6 py-4 text-primary font-mono text-sm uppercase">
                    Events
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No colleges found
                    </td>
                  </tr>
                ) : (
                  filteredColleges.map((college, index) => (
                    <React.Fragment key={college.college}>
                      <tr
                        className="border-t border-gray-800 hover:bg-gray-900/30 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedCollege(
                            expandedCollege === college.college
                              ? null
                              : college.college,
                          )
                        }
                      >
                        <td className="px-6 py-4 text-gray-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                          <div className="flex items-center gap-2">
                            <span
                              className={`transform transition-transform ${
                                expandedCollege === college.college
                                  ? "rotate-90"
                                  : ""
                              }`}
                            >
                              ▶
                            </span>
                            {college.college}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-primary font-bold text-lg">
                            {college.count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-blue-400">
                          {college.individuals}
                        </td>
                        <td className="px-6 py-4 text-center text-purple-400">
                          {college.teamMembers}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-400">
                          {college.eventCount || college.events?.length || 0}
                        </td>
                      </tr>
                      {expandedCollege === college.college && (
                        <tr className="bg-gray-900/50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="text-sm text-gray-400">
                              <span className="text-primary font-semibold">
                                Events:
                              </span>{" "}
                              {college.events?.join(", ") || "N/A"}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Visual Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-black border border-primary/20 p-6 rounded-lg"
        >
          <h3 className="text-xl font-bold text-white font-orbitron mb-4">
            TOP 10 COLLEGES
          </h3>
          <div className="space-y-3">
            {filteredColleges.slice(0, 10).map((college, index) => (
              <div key={college.college} className="flex items-center gap-4">
                <div className="w-8 text-gray-500 font-mono text-sm">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm truncate max-w-xs">
                      {college.college}
                    </span>
                    <span className="text-primary font-bold">
                      {college.count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                      style={{
                        width: `${(college.count / (filteredColleges[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
