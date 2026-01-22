"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface CheckInData {
  success: boolean;
  alreadyCheckedIn?: boolean;
  message: string;
  data?: {
    user: {
      name: string;
      email: string;
      picture?: string;
    };
    event?: {
      title: string;
      date?: string;
      venue?: string;
    };
    timestamp?: string;
  };
}

interface CheckInResultProps {
  result: CheckInData | null;
  onReset: () => void;
  isLoading?: boolean;
}

export default function CheckInResult({
  result,
  onReset,
  isLoading = false,
}: CheckInResultProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/60 backdrop-blur-lg rounded-2xl border border-primary/30 p-8 text-center"
      >
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-primary font-mono text-lg">Processing check-in...</p>
      </motion.div>
    );
  }

  if (!result) return null;

  const isSuccess = result.success && !result.alreadyCheckedIn;
  const isAlreadyCheckedIn = result.success && result.alreadyCheckedIn;
  const isError = !result.success;

  // Log error details to console for debugging
  if (isError) {
    console.error("Check-in Error:", {
      message: result.message,
      fullResult: result,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-black/60 backdrop-blur-lg rounded-2xl border-2 p-6 md:p-8 ${
        isSuccess
          ? "border-green-500"
          : isAlreadyCheckedIn
            ? "border-yellow-500"
            : "border-red-500"
      }`}
    >
      {/* Status Icon */}
      <div className="flex justify-center mb-6">
        {isSuccess && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        )}
        {isAlreadyCheckedIn && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </motion.div>
        )}
        {isError && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Status Message */}
      <h2
        className={`text-xl md:text-2xl font-bold text-center mb-4 ${
          isSuccess
            ? "text-green-400"
            : isAlreadyCheckedIn
              ? "text-yellow-400"
              : "text-red-400"
        }`}
      >
        {isSuccess
          ? "Check-in Successful!"
          : isAlreadyCheckedIn
            ? "Already Checked In"
            : "Check-in Failed"}
      </h2>

      <p className="text-gray-300 text-center mb-6">{result.message}</p>

      {/* User Details */}
      {result.data?.user && (
        <div className="bg-black/40 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-4">
            {result.data.user.picture ? (
              <Image
                src={result.data.user.picture}
                alt={result.data.user.name}
                width={60}
                height={60}
                className="rounded-full border-2 border-primary"
              />
            ) : (
              <div className="w-15 h-15 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {result.data.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">
                {result.data.user.name}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {result.data.user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Event Details */}
      {result.data?.event && (
        <div className="bg-black/40 rounded-xl p-4 mb-4">
          <h4 className="text-primary text-sm font-mono mb-2">EVENT DETAILS</h4>
          <p className="text-white font-semibold">{result.data.event.title}</p>
          {result.data.event.venue && (
            <p className="text-gray-400 text-sm mt-1">
              📍 {result.data.event.venue}
            </p>
          )}
          {result.data.event.date && (
            <p className="text-gray-400 text-sm">
              📅 {new Date(result.data.event.date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Timestamp */}
      {result.data?.timestamp && (
        <p className="text-gray-500 text-xs text-center mb-6 font-mono">
          {isAlreadyCheckedIn ? "Originally checked in: " : "Checked in: "}
          {new Date(result.data.timestamp).toLocaleString()}
        </p>
      )}

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full py-3 px-6 bg-primary text-black font-bold rounded-xl hover:bg-primary/80 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <svg
          className="w-5 h-5"
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
        Scan Next QR Code
      </button>
    </motion.div>
  );
}
