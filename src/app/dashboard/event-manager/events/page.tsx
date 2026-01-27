"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

interface Event {
  _id: string;
  title: string;
  category: string;
  type: string;
  startTime: string;
  endTime?: string;
  venue?: string;
  currentRegistrations?: number;
  capacity?: number;
}

export default function ManagedEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [searchQuery, filterType, filterCategory, events]);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/event-manager/events");
      setEvents(response.data.data);
      setFilteredEvents(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(lowercaseQuery) ||
          event.venue?.toLowerCase().includes(lowercaseQuery),
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((event) => event.type === filterType);
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((event) => event.category === filterCategory);
    }

    setFilteredEvents(filtered);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Title", "Type", "Category", "Start Time", "Venue", "Registrations"];
    const rows = filteredEvents.map((event) => [
      event.title,
      event.type,
      event.category,
      new Date(event.startTime).toLocaleString(),
      event.venue || "N/A",
      event.currentRegistrations || "0",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `events_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Events exported successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING EVENTS...
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
            href="/dashboard/event-manager"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Event Manager Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            MANAGED
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            EVENTS
          </h2>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3">
              <label className="block text-gray-400 text-sm mb-2">
                Search events
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                placeholder="Search by title or venue..."
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Filter by type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="workshop">Workshop</option>
                <option value="talk">Talk</option>
                <option value="competition">Competition</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Filter by category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="non-technical">Non-Technical</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              Showing {filteredEvents.length} of {events.length} events
            </div>
            <button
              onClick={handleExport}
              disabled={filteredEvents.length === 0}
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* Events Table */}
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
                    Event
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredEvents.map((event, index) => (
                  <tr
                    key={event._id}
                    className={`hover:bg-gray-900/50 transition-colors ${
                      index % 2 === 0 ? "bg-black" : "bg-gray-900/10"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {event.title}
                      </div>
                      {event.venue && (
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {event.venue}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-primary/10 text-primary">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-700 text-gray-300">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(event.startTime).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-white">
                        {event.currentRegistrations || 0}
                        {event.capacity && (
                          <span className="text-gray-500">
                            {" "}
                            / {event.capacity}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/event-manager/events/${event._id}/registrations`}
                        className="text-primary hover:text-white transition-colors"
                      >
                        View Registrations
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {searchQuery || filterType !== "all" || filterCategory !== "all"
                ? "No events match your filters"
                : "No events assigned to you"}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
