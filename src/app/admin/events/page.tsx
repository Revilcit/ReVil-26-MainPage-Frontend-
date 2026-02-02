"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Event {
  _id: string;
  title: string;
  description: string;
  fullDescription?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  currentRegistrations: number;
  eventType: "workshop" | "talk" | "panel" | "networking" | "competition";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  manualRegistrationOpen?: boolean;
  isTeamEvent: boolean;
  teamSize?: {
    min: number;
    max: number;
  };
  host?: string;
  prerequisites?: string[];
  image?: string;
  slug?: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const result = await response.json();
      setEvents(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${eventTitle}"? This will also delete all registrations for this event.`,
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete event");
      }

      // Remove from local state
      setEvents(events.filter((event) => event._id !== eventId));
      alert("Event deleted successfully");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setEvents(
        events.map((event) =>
          event._id === eventId
            ? { ...event, status: newStatus as Event["status"] }
            : event,
        ),
      );
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleManualRegistration = async (
    eventId: string,
    currentState: boolean | undefined,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newState = !currentState;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/events/${eventId}/manual-registration`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ manualRegistrationOpen: newState }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to toggle manual registration");
      }

      // Update local state
      setEvents(
        events.map((event) =>
          event._id === eventId
            ? { ...event, manualRegistrationOpen: newState }
            : event,
        ),
      );
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent({ ...event });
    setIsEditModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/events/${editingEvent._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingEvent),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to update event");
      }

      const result = await response.json();

      // Update local state
      setEvents(
        events.map((event) =>
          event._id === editingEvent._id ? result.data : event,
        ),
      );

      alert("Event updated successfully!");
      setIsEditModalOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Event, value: any) => {
    if (!editingEvent) return;
    setEditingEvent({ ...editingEvent, [field]: value });
  };

  const exportRegistrations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to export registrations");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/export/registrations`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to export registrations");
      }

      // Get the CSV content
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registrations_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Error exporting registrations: ${err.message}`);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filterStatus !== "all" && event.status !== filterStatus) return false;
    if (filterType !== "all" && event.eventType !== filterType) return false;
    return true;
  });

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
            href="/admin"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            EVENT
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            MANAGEMENT
          </h2>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                <option value="panel">Panel</option>
                <option value="networking">Networking</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportRegistrations}
                className="w-full px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
              >
                Export All Registrations
              </button>
            </div>
          </div>
          <div className="text-gray-400 text-sm mt-4">
            Showing {filteredEvents.length} events
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-black border border-primary/20 p-6 rounded-lg hover:border-primary/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {event.title}
                  </h3>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        event.status === "upcoming"
                          ? "bg-blue-500/20 text-blue-400"
                          : event.status === "ongoing"
                            ? "bg-green-500/20 text-green-400"
                            : event.status === "completed"
                              ? "bg-gray-500/20 text-gray-400"
                              : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {event.status}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                      {event.eventType}
                    </span>
                    {event.isTeamEvent && (
                      <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">
                        Team Event
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-400">
                {event.isTeamEvent && event.teamSize && (
                  <div>
                    👥 Team Size: {event.teamSize.min}-{event.teamSize.max}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Registrations</span>
                  <span className="text-primary font-bold">
                    {event.currentRegistrations}
                    {event.eventType === "workshop" && ` / ${event.capacity}`}
                  </span>
                </div>
                {event.eventType === "workshop" && (
                  <>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{
                          width: `${Math.min(
                            (event.currentRegistrations / event.capacity) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(
                        (event.currentRegistrations / event.capacity) * 100,
                      )}
                      % filled
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={event.status}
                  onChange={(e) =>
                    handleStatusChange(event._id, e.target.value)
                  }
                  className="px-3 py-2 bg-black border border-gray-600 text-white rounded text-sm focus:border-primary focus:outline-none"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() =>
                    handleToggleManualRegistration(
                      event._id,
                      event.manualRegistrationOpen,
                    )
                  }
                  className={`px-4 py-2 border rounded text-sm transition-colors ${
                    event.manualRegistrationOpen
                      ? "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/50 hover:bg-gray-500/30"
                  }`}
                  title={
                    event.manualRegistrationOpen
                      ? "Manual registration is open"
                      : "Manual registration is closed"
                  }
                >
                  {event.manualRegistrationOpen ? "✓ Manual Reg" : "Manual Reg"}
                </button>
                <Link
                  href={`/events/${event._id}`}
                  className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDeleteEvent(event._id, event.title)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}

          {/* Edit Modal */}
          <AnimatePresence>
            {isEditModalOpen && editingEvent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => !saving && setIsEditModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black border border-primary/30 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                >
                  <h2 className="text-2xl font-bold text-white mb-6 font-orbitron">
                    EDIT EVENT
                  </h2>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) =>
                          handleFieldChange("title", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        placeholder="Event title"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Short Description *
                      </label>
                      <textarea
                        value={editingEvent.description}
                        onChange={(e) =>
                          handleFieldChange("description", e.target.value)
                        }
                        rows={3}
                        className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        placeholder="Brief description"
                      />
                    </div>

                    {/* Full Description */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Full Description
                      </label>
                      <textarea
                        value={editingEvent.fullDescription || ""}
                        onChange={(e) =>
                          handleFieldChange("fullDescription", e.target.value)
                        }
                        rows={5}
                        className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        placeholder="Detailed description"
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Date *
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            editingEvent.date
                              ? new Date(editingEvent.date)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              "date",
                              new Date(e.target.value).toISOString(),
                            )
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Start Time
                        </label>
                        <input
                          type="text"
                          value={editingEvent.startTime || ""}
                          onChange={(e) =>
                            handleFieldChange("startTime", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                          placeholder="e.g., 10:00 AM"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          End Time
                        </label>
                        <input
                          type="text"
                          value={editingEvent.endTime || ""}
                          onChange={(e) =>
                            handleFieldChange("endTime", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                          placeholder="e.g., 12:00 PM"
                        />
                      </div>
                    </div>

                    {/* Venue and Host */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Venue *
                        </label>
                        <input
                          type="text"
                          value={editingEvent.venue}
                          onChange={(e) =>
                            handleFieldChange("venue", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                          placeholder="Event venue"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Host
                        </label>
                        <input
                          type="text"
                          value={editingEvent.host || ""}
                          onChange={(e) =>
                            handleFieldChange("host", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                          placeholder="Event host"
                        />
                      </div>
                    </div>

                    {/* Type, Status, and Capacity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Event Type *
                        </label>
                        <select
                          value={editingEvent.eventType}
                          onChange={(e) =>
                            handleFieldChange("eventType", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        >
                          <option value="workshop">Workshop</option>
                          <option value="talk">Talk</option>
                          <option value="panel">Panel</option>
                          <option value="networking">Networking</option>
                          <option value="competition">Competition</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Status *
                        </label>
                        <select
                          value={editingEvent.status}
                          onChange={(e) =>
                            handleFieldChange("status", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">
                          Capacity *
                        </label>
                        <input
                          type="number"
                          value={editingEvent.capacity}
                          onChange={(e) =>
                            handleFieldChange(
                              "capacity",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                          placeholder="Max capacity"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Team Event Settings */}
                    <div>
                      <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <input
                          type="checkbox"
                          checked={editingEvent.isTeamEvent}
                          onChange={(e) =>
                            handleFieldChange("isTeamEvent", e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        Team Event
                      </label>
                      {editingEvent.isTeamEvent && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">
                              Min Team Size
                            </label>
                            <input
                              type="number"
                              value={editingEvent.teamSize?.min || 2}
                              onChange={(e) =>
                                handleFieldChange("teamSize", {
                                  ...editingEvent.teamSize,
                                  min: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                              min="2"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">
                              Max Team Size
                            </label>
                            <input
                              type="number"
                              value={editingEvent.teamSize?.max || 5}
                              onChange={(e) =>
                                handleFieldChange("teamSize", {
                                  ...editingEvent.teamSize,
                                  max: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                              min="2"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={editingEvent.image || ""}
                        onChange={(e) =>
                          handleFieldChange("image", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Slug (URL-friendly name)
                      </label>
                      <input
                        type="text"
                        value={editingEvent.slug || ""}
                        onChange={(e) =>
                          handleFieldChange("slug", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                        placeholder="event-slug"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleSaveEvent}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingEvent(null);
                      }}
                      disabled={saving}
                      className="px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CANCEL
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-gray-400">No events found</div>
        )}
      </div>
    </div>
  );
}
