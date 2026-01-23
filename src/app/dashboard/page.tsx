"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCodeDisplay from "@/components/ui/QRCodeDisplay";
import {
  fetchUserWithRegistrations,
  handleImageError,
  getProfilePicture,
} from "@/lib/api";
import { UserWithRegistrations, EventRegistration } from "@/types/api";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] =
    useState<EventRegistration | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await fetchUserWithRegistrations(token);
        setUserData(data);
      } catch (err) {
        const error = err as Error;
        console.error("Dashboard fetch error:", error.message);

        // Only redirect to login if unauthorized, not if server is offline
        if (error.message === "UNAUTHORIZED") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        } else if (error.message === "SERVER_OFFLINE") {
          console.warn(
            "Backend server is offline. Please start the server at http://localhost:5000",
          );
          // Try to use cached user data for basic display
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              setUserData({
                user: parsedUser,
                registrations: [],
              });
            } catch {
              console.error("Failed to parse cached user data");
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Dispatch custom event to notify other components (like Navbar)
    window.dispatchEvent(new Event("user-logout"));
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-primary font-mono animate-pulse">
        INITIALIZING DASHBOARD PROTOCOLS...
      </div>
    );
  }

  if (!userData) return null;

  const { user, registrations } = userData;

  return (
    <div className="min-h-screen pt-24 px-4 bg-black">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-primary/20 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white font-orbitron mb-2">
              COMMAND CENTER
            </h1>
            <p className="text-gray-400 font-mono">
              WELCOME,{" "}
              <span className="text-primary">
                {user.name?.toUpperCase() || "USER"}
              </span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 px-6 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors uppercase text-sm tracking-widest"
          >
            Terminate Session
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="col-span-1 bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-primary pl-4">
              IDENTITY
            </h2>

            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 group-hover:border-primary transition-colors">
                  <img
                    src={getProfilePicture(user)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError(user.name)}
                  />
                </div>
                <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-4 font-mono text-sm">
              <div>
                <label className="block text-gray-500 text-xs">ROLE</label>
                <div className="text-primary uppercase">
                  {user.role?.replace(/_/g, " ") || "USER"}
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-xs">EMAIL</label>
                <div className="text-white break-all">{user.email}</div>
              </div>
              <div>
                <label className="block text-gray-500 text-xs">
                  CHECK-IN STATUS
                </label>
                <div
                  className={`font-bold ${
                    user.checkedIn ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {user.checkedIn ? "✓ CHECKED IN" : "○ PENDING"}
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-lg font-bold text-white mb-2">
                YOUR CHECK-IN QR CODE
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Use this single QR code for all event check-ins - building
                entrance and sessions
              </p>
              {userData.user.qrCode ? (
                <QRCodeDisplay
                  data={userData.user.qrCode}
                  size={300}
                  filename={`revil-qr-${userData.user.name
                    .replace(/\s+/g, "-")
                    .toLowerCase()}.png`}
                  showDownloadButton={true}
                />
              ) : (
                <div className="bg-black p-4 rounded-lg border border-primary/30 mb-4">
                  <div className="w-full h-64 flex flex-col items-center justify-center text-yellow-500">
                    <svg
                      className="w-12 h-12 mb-2"
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
                    <span className="text-sm text-center">
                      Please log out and log back in to generate your QR code
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 text-center">
                Save to your phone for easy access at events
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-2 space-y-8">
            {/* Status Panel */}
            <div className="bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-4">
                REGISTRATION STATUS
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 border border-primary/20">
                  <div className="text-3xl font-bold text-white mb-1">
                    {registrations.length}
                  </div>
                  <div className="text-xs text-gray-400 uppercase">
                    Total Registrations
                  </div>
                </div>
                <div className="bg-black/40 p-4 border border-primary/20">
                  <div className="text-3xl font-bold text-white mb-1">
                    {
                      registrations.filter(
                        (r) => r.registrationStatus === "attended",
                      ).length
                    }
                  </div>
                  <div className="text-xs text-gray-400 uppercase">
                    Events Attended
                  </div>
                </div>
              </div>
            </div>

            {/* Registrations List */}
            {registrations.length > 0 ? (
              <div className="bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white mb-4">
                  MY REGISTRATIONS
                </h2>
                <div className="space-y-3">
                  {registrations
                    .filter((reg) => reg.event && reg.event.title)
                    .map((reg) => (
                      <div
                        key={reg._id}
                        className="bg-black/40 border border-white/10 p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-white font-bold">
                            {reg.event.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              reg.registrationStatus === "attended"
                                ? "bg-green-500/20 text-green-400"
                                : reg.registrationStatus === "confirmed"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : reg.registrationStatus === "cancelled"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {reg.registrationStatus.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          {reg.isTeamRegistration && reg.teamName && (
                            <div>👥 Team: {reg.teamName}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-card/10 border border-white/10 p-8 rounded-lg backdrop-blur-sm text-center">
                <svg
                  className="w-16 h-16 text-gray-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-400 mb-4">No registrations yet</p>
                <button
                  className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
                  onClick={() => router.push("/events")}
                >
                  Browse Events
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-card/10 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-4">ACTIONS</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
                  onClick={() => router.push("/events")}
                >
                  Browse Events
                </button>
                <button
                  className="px-6 py-3 border border-gray-600 text-gray-300 font-bold uppercase text-sm hover:border-primary hover:text-primary transition-colors"
                  onClick={() => router.push("/workshops")}
                >
                  Browse Workshops
                </button>
                {/* Staff Scanner Link - Only show for superadmin, registration_team, or event_manager */}
                {(user.role === "superadmin" ||
                  user.role === "registration_team" ||
                  user.role === "event_manager") && (
                  <button
                    className="px-6 py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold uppercase text-sm hover:bg-cyan-500/30 hover:border-cyan-400 transition-colors flex items-center gap-2"
                    onClick={() => router.push("/checkin")}
                  >
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
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    QR Scanner
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration QR Code Modal */}
      {selectedRegistration && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRegistration(null)}
        >
          <div
            className="bg-black border border-primary/30 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Your QR Code</h3>
                <p className="text-primary text-sm">
                  Universal entry code for all events
                </p>
              </div>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="text-gray-400 hover:text-white transition-colors"
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

            <div className="bg-white p-4 rounded-lg mb-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="User QR Code"
                  className="w-full aspect-square object-contain"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-gray-500">
                  Generating QR Code...
                </div>
              )}
            </div>

            <div className="text-center text-gray-400 text-sm mb-4">
              <p>Use your single QR code for all event check-ins</p>
              <p>Admins will choose the appropriate action when scanning</p>
            </div>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>User:</span>
                <span className="text-white">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Events:</span>
                <span className="text-white">{registrations.length}</span>
              </div>
            </div>

            <button
              className="mt-4 w-full px-4 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors disabled:opacity-50"
              disabled={!qrCodeUrl}
            >
              Download QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
