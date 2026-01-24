"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { getPaymentStatus } from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [status, setStatus] = useState<
    "verifying" | "success" | "failed" | "pending" | "user_dropped"
  >("verifying");
  const [message, setMessage] = useState("Verifying payment...");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get("order_id");

        if (!orderId) {
          setStatus("failed");
          setMessage("Invalid payment callback");
          toast.error("Payment verification failed");
          return;
        }

        // Poll for payment status (max 10 attempts)
        let attempts = 0;
        const maxAttempts = 10;

        const checkStatus = async (): Promise<boolean> => {
          try {
            const paymentData = await getPaymentStatus(orderId);
            setPaymentDetails(paymentData);

            if (paymentData.status === "SUCCESS") {
              setStatus("success");
              setMessage("Payment successful! Registration complete.");
              toast.success("Workshop registration successful!");
              return true;
            } else if (paymentData.status === "FAILED") {
              setStatus("failed");
              setMessage("Payment failed. Please try again.");
              toast.error("Payment failed");
              return true;
            } else if (paymentData.status === "CANCELLED") {
              setStatus("failed");
              setMessage("Payment was cancelled.");
              toast.error("Payment cancelled");
              return true;
            } else if (paymentData.status === "PENDING") {
              // Check if this is a stale pending payment (user dropped)
              const createdAt = new Date(paymentData.createdAt);
              const now = new Date();
              const minutesElapsed =
                (now.getTime() - createdAt.getTime()) / (1000 * 60);

              if (attempts >= maxAttempts || minutesElapsed > 15) {
                // After max attempts or 15 minutes, treat as user dropped
                setStatus("user_dropped");
                setMessage(
                  "Payment session expired. Please try registering again.",
                );
                toast.error("Payment session expired");
                return true;
              }

              // Still pending, continue polling
              setMessage(
                `Payment pending... Checking again in 2 seconds (${attempts}/${maxAttempts})`,
              );
              return false;
            }

            return false; // Unknown status, continue polling
          } catch (error) {
            console.error("Error checking payment status:", error);
            return false;
          }
        };

        // Initial check
        const resolved = await checkStatus();
        if (resolved) {
          // Redirect after 2 seconds
          setTimeout(() => {
            if (status === "success") {
              router.push("/dashboard");
            } else {
              router.push(`/workshops/${slug}/register`);
            }
          }, 2000);
          return;
        }

        // Poll every 2 seconds
        const intervalId = setInterval(async () => {
          attempts++;

          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            setStatus("failed");
            setMessage(
              "Payment verification timeout. Please check your dashboard.",
            );
            toast.error("Verification timeout");
            setTimeout(() => {
              router.push("/dashboard");
            }, 3000);
            return;
          }

          const resolved = await checkStatus();
          if (resolved) {
            clearInterval(intervalId);
            // Redirect after 2 seconds
            setTimeout(() => {
              if (status === "success") {
                router.push("/dashboard");
              } else {
                router.push(`/workshops/${slug}/register`);
              }
            }, 2000);
          }
        }, 2000);

        return () => clearInterval(intervalId);
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage("Failed to verify payment");
        toast.error("Verification failed");

        setTimeout(() => {
          router.push(`/workshops/${slug}/register`);
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, router, slug, status]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center pt-20 px-4">
      <div className="max-w-md w-full">
        <div className="bg-black border border-primary/20 rounded-lg p-8 text-center">
          {/* Status Icon */}
          {status === "verifying" && (
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status === "success" && (
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {status === "failed" && (
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {status === "user_dropped" && (
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {status === "pending" && (
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {/* Status Message */}
          <h1
            className={`text-2xl font-bold mb-3 font-orbitron ${
              status === "verifying"
                ? "text-primary"
                : status === "success"
                  ? "text-green-500"
                  : status === "pending"
                    ? "text-blue-500"
                    : status === "user_dropped"
                      ? "text-yellow-500"
                      : "text-red-500"
            }`}
          >
            {status === "verifying"
              ? "VERIFYING PAYMENT"
              : status === "success"
                ? "PAYMENT SUCCESSFUL"
                : status === "pending"
                  ? "PAYMENT PENDING"
                  : status === "user_dropped"
                    ? "PAYMENT EXPIRED"
                    : "PAYMENT FAILED"}
          </h1>

          <p className="text-gray-300 mb-6">{message}</p>

          {/* Payment details for pending/user_dropped */}
          {(status === "pending" || status === "user_dropped") &&
            paymentDetails && (
              <div className="bg-gray-900/50 rounded p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-white font-mono text-xs">
                      {paymentDetails.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-yellow-500">
                      {paymentDetails.status}
                    </span>
                  </div>
                </div>
                {status === "user_dropped" && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-xs text-gray-300">
                      Your payment session has expired. If you completed the
                      payment, please check your dashboard. Otherwise, you can
                      start a new registration.
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Redirect Info */}
          {status !== "verifying" &&
            status !== "pending" &&
            status !== "user_dropped" && (
              <p className="text-sm text-gray-500">
                Redirecting in a moment...
              </p>
            )}

          {/* Manual Navigation Buttons */}
          {(status === "failed" || status === "user_dropped") && (
            <div className="space-y-3 mt-6">
              <button
                onClick={() => router.push(`/workshops/${slug}/register`)}
                className="w-full px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full px-6 py-3 border border-gray-600 text-gray-300 font-bold uppercase text-sm hover:bg-gray-900 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {status === "pending" && (
            <div className="space-y-3 mt-6">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full px-6 py-3 bg-blue-500 text-white font-bold uppercase text-sm hover:bg-blue-600 transition-colors"
              >
                Check Dashboard
              </button>
              <p className="text-xs text-gray-500">
                Payment is being verified. Please wait...
              </p>
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
