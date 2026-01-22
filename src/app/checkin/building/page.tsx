"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import CheckInResult, { CheckInData } from "@/components/scanner/CheckInResult";
import ScannerStats from "@/components/scanner/ScannerStats";
import { fetchUserProfile, performCheckIn } from "@/lib/api";
import { UserProfile } from "@/types/api";

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

export default function BuildingCheckInPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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
          userData.role === "registration_team"
        ) {
          setAuthorized(true);
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
      if (isProcessing) return;

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
        // QR code should be user QR code (JSON with userId)
        const qrCode = decodedText;

        const result = await performCheckIn(token, qrCode, "building");

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
        console.error("Building Check-in Scan Failed:", {
          error: error,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          qrCode: decodedText,
          timestamp: new Date().toISOString(),
          scanType: "building",
        });
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
    [isProcessing, router],
  );

  const handleReset = () => {
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
            You need <span className="text-primary">registration_team</span> or{" "}
            <span className="text-primary">superadmin</span> role to access the
            building check-in scanner.
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

  return (
    <div className="min-h-screen bg-black pt-20 pb-10 px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-primary font-mono text-sm">
              BUILDING ENTRANCE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Building <span className="text-primary">Check-In</span>
          </h1>
          <p className="text-gray-400">
            Scan attendee QR codes at the building entrance
          </p>
          {user && (
            <p className="text-gray-500 text-sm mt-2">
              Logged in as: <span className="text-primary">{user.name}</span> (
              {user.role})
            </p>
          )}
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
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-primary/20 p-4 md:p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
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
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-primary/20 p-4 md:p-6 h-full">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
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
                Recent Check-ins
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="font-mono text-sm">No scans yet</p>
                  <p className="text-xs mt-1">Scan a QR code to see history</p>
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
