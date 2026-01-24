"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log the message for debugging
      // console.log("Received postMessage:", event.origin, event.data);

      // Accept messages from backend (ngrok URL)
      // In production, validate event.origin matches your backend domain
      if (event.data.type === "AUTH_SUCCESS" && event.data.token) {
        // console.log("Authentication successful, storing token");
        localStorage.setItem("token", event.data.token);

        // Store user data if provided (includes profile picture)
        if (event.data.user) {
          localStorage.setItem("user", JSON.stringify(event.data.user));
        }

        // Dispatch storage event for other components to detect
        window.dispatchEvent(new Event("storage"));

        // console.log("Redirecting to dashboard");
        router.push("/dashboard");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  const handleGoogleLogin = () => {
    setLoading(true);
    setError("");

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `${API_URL}/auth/google`,
      "Google Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Check if popup was blocked
    if (!popup) {
      setError("Popup was blocked. Please allow popups for this site.");
      setLoading(false);
      return;
    }

    // Monitor popup close without success
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="container mx-auto px-4 py-32 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-black/50 backdrop-blur-md border border-primary/20 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center font-orbitron tracking-widest">
          ACCESS REVIL
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm uppercase tracking-wider">
          Secure Protocol Login
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold hover:bg-gray-200 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Authenticating..." : "Sign in with Google"}
          </button>

          {/* <div className="bg-primary/5 border border-primary/20 p-4 rounded">
            <p className="text-gray-400 text-sm text-center">
              <span className="text-primary font-bold">Secure OAuth 2.0</span>{" "}
              authentication via Google
            </p>
          </div> */}

          <p className="text-center text-xs text-gray-500 mt-6">
            First time here? Don&apos;t worry, signing in will automatically
            create your account.
          </p>
        </div>
      </div>
    </div>
  );
}
