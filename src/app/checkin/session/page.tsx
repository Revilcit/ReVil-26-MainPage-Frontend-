"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import CheckInResult, { CheckInData } from "@/components/scanner/CheckInResult";
import ScannerStats from "@/components/scanner/ScannerStats";
import { fetchUserProfile, performCheckIn, fetchAllEvents } from "@/lib/api";
import { UserProfile, Event } from "@/types/api";

// Dynamic import to avoid SSR issues with camera
const QRScanner = dynamic(() => import("@/components/scanner/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-md mx-auto bg-black/50 rounded-2xl border-2 border-primary/30 aspect-square flex items-center justify-center">
      <div className="text-primary font-mono animate-pulse">
        Loading scanner...
      </div>
    </div>
  ),
});

export default function SessionCheckInPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Events
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [scanResult, setScanResult] = useState<CheckInData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  // Stats
  const [totalScans, setTotalScans] = useState(0);
  const [successfulScans, setSuccessfulScans] = useState(0);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(0);
  const [failedScans, setFailedScans] = useState(0);

  // Recent scans history
  const [recentScans, setRecentScans] = useState<CheckInData[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userData = await fetchUserProfile(token);
        setUser(userData);

        // Check if user has permission
        if (
          userData.role === "superadmin" ||
          userData.role === "event_manager"
        ) {
          setAuthorized(true);

          // Fetch events for selection
          const eventsData = await fetchAllEvents();
          // Filter to only upcoming/ongoing events
          const activeEvents = eventsData.filter(
            (e) => e.status === "upcoming" || e.status === "ongoing",
          );
          setEvents(activeEvents);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Auth error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (isProcessing || !selectedEvent) return;

      // Pause scanner and show processing
      setScannerActive(false);
      setIsProcessing(true);
      setTotalScans((prev) => prev + 1);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Parse QR code - should be user QR code with userId
        const qrCode = decodedText;

        // Perform session check-in with selected event ID
        const result = await performCheckIn(
          token,
          qrCode,
          "session",
          selectedEvent._id,
        );

        const checkInData: CheckInData = {
          success: result.success,
          alreadyCheckedIn: result.alreadyCheckedIn,
          message: result.message,
          data: result.data,
        };

        setScanResult(checkInData);

        // Update stats
        if (result.success && !result.alreadyCheckedIn) {
          setSuccessfulScans((prev) => prev + 1);
        } else if (result.alreadyCheckedIn) {
          setAlreadyCheckedIn((prev) => prev + 1);
        } else {
          setFailedScans((prev) => prev + 1);
        }

        // Add to recent scans
        setRecentScans((prev) => [checkInData, ...prev].slice(0, 10));
      } catch (error) {
        console.error("Check-in error:", error);
        const errorResult: CheckInData = {
          success: false,
          message: error instanceof Error ? error.message : "Check-in failed",
        };
        setScanResult(errorResult);
        setFailedScans((prev) => prev + 1);
        setRecentScans((prev) => [errorResult, ...prev].slice(0, 10));
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, selectedEvent, router],
  );

  const handleReset = () => {
    setScanResult(null);
    setScannerActive(true);
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    // Reset stats for new event
    setTotalScans(0);
    setSuccessfulScans(0);
    setAlreadyCheckedIn(0);
    setFailedScans(0);
    setRecentScans([]);
    setScanResult(null);
    setScannerActive(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-red-400 text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You need <span className="text-primary">event_manager</span> or{" "}
            <span className="text-primary">superadmin</span> role to access the
            session check-in scanner.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Event Selection Screen
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-black pt-20 pb-10 px-4">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-cyan-400 font-mono text-sm">
                SESSION CHECK-IN
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Select <span className="text-cyan-400">Event</span>
            </h1>
            <p className="text-gray-400">
              Choose an event to start scanning attendees
            </p>
          </motion.div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <svg
                className="w-16 h-16 mx-auto text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400">No active events found</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event, index) => (
                <motion.button
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleEventSelect(event)}
                  className="bg-black/40 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-5 text-left hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-2 py-1 text-xs font-mono rounded ${
                        event.status === "ongoing"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {event.status?.toUpperCase()}
                    </span>
                    {event.isTeamEvent && (
                      <span className="px-2 py-1 text-xs font-mono bg-primary/20 text-primary rounded">
                        TEAM
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                    {event.title}
                  </h3>
                  {event.venue && (
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {event.venue}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      {event.currentRegistrations || 0}
                      {event.eventType === "workshop" &&
                        ` / ${event.capacity}`}{" "}
                      registered
                    </span>
                    <svg
                      className="w-5 h-5 text-cyan-500 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
            >
              ← Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Scanner Screen
  return (
    <div className="min-h-screen bg-black pt-20 pb-10 px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-cyan-400 font-mono text-sm">
              SESSION CHECK-IN
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
            {selectedEvent.title}
          </h1>
          <p className="text-gray-400 text-sm">{selectedEvent.venue}</p>
          {user && (
            <p className="text-gray-500 text-xs mt-2">
              Scanner: <span className="text-cyan-400">{user.name}</span>
            </p>
          )}
        </motion.div>

        {/* Change Event Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center"
        >
          <button
            onClick={() => setSelectedEvent(null)}
            className="px-4 py-2 text-sm text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
          >
            ← Change Event
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <ScannerStats
            totalScans={totalScans}
            successfulScans={successfulScans}
            alreadyCheckedIn={alreadyCheckedIn}
            failedScans={failedScans}
          />
        </motion.div>

        {/* Main Scanner Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-cyan-500/20 p-4 md:p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                QR Scanner
              </h2>
              <AnimatePresence mode="wait">
                {scannerActive && !scanResult && (
                  <motion.div
                    key="scanner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <QRScanner onScan={handleScan} isActive={scannerActive} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result Display */}
              <AnimatePresence mode="wait">
                {(scanResult || isProcessing) && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckInResult
                      result={scanResult}
                      onReset={handleReset}
                      isLoading={isProcessing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-cyan-500/20 p-4 md:p-6 h-full">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Session Attendance
              </h2>

              {recentScans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="font-mono text-sm">No attendees scanned</p>
                  <p className="text-xs mt-1">
                    Scan attendee QR codes to track
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {recentScans.map((scan, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border ${
                        scan.success && !scan.alreadyCheckedIn
                          ? "bg-green-500/10 border-green-500/30"
                          : scan.alreadyCheckedIn
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            scan.success && !scan.alreadyCheckedIn
                              ? "bg-green-500/20"
                              : scan.alreadyCheckedIn
                                ? "bg-yellow-500/20"
                                : "bg-red-500/20"
                          }`}
                        >
                          {scan.success && !scan.alreadyCheckedIn && (
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {scan.alreadyCheckedIn && (
                            <svg
                              className="w-4 h-4 text-yellow-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01"
                              />
                            </svg>
                          )}
                          {!scan.success && (
                            <svg
                              className="w-4 h-4 text-red-400"
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
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {scan.data?.user?.name || "Unknown"}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {scan.data?.user?.email || scan.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
          >
            ← Back to Dashboard
          </button>
        </motion.div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 224, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 224, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
