"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRouter } from "next/navigation";
import PillNav from "@/components/ui/PillNav";
import {
  fetchUserProfile,
  handleImageError,
  getProfilePicture,
} from "@/lib/api";
import { UserProfile } from "@/types/api";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Workshops", href: "/workshops" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // Fetch user data if logged in
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        // Use the new profile API endpoint
        const userData = await fetchUserProfile(token);
        setUser(userData);
      } catch (err) {
        const error = err as Error;
        console.error("Failed to fetch user:", error.message);

        // Only clear token if unauthorized, not if server is offline
        if (error.message === "UNAUTHORIZED") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        } else if (error.message === "SERVER_OFFLINE") {
          console.warn("Backend server is offline. Please start the server.");
          // Try to use cached user data
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {
              console.error("Failed to parse cached user data");
            }
          }
        }
      }
    };

    fetchUser();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = () => {
      fetchUser();
    };

    // Listen for custom logout event from dashboard (same tab)
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logout", handleLogout);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logout", handleLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowDropdown(false);
    router.push("/");
  };

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: -100, opacity: 0 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-4 left-0 w-full z-50 md:top-8 px-4 md:px-8 pointer-events-none"
    >
      <div className="pointer-events-auto w-full flex items-center justify-between gap-4">
        <div className="flex-1 md:flex-initial">
          <PillNav
            logo="/revil_icon.png"
            logoAlt="REVIL"
            items={navItems}
            className="!relative !top-0 !left-0 !translate-x-0 !w-full md:!w-max rounded-full shadow-lg"
            ease="power2.easeOut"
            baseColor="transparent"
            pillColor="#333"
            pillTextColor="#ffffff"
            hoveredPillTextColor="#00f0ff"
          />
        </div>

        {/* Profile Section */}
        <div className="relative">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-primary/20 rounded-full px-4 py-2 hover:border-primary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                  <img
                    src={getProfilePicture(user)}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover"
                    onError={handleImageError(user.name)}
                  />
                </div>
                <span className="text-white text-sm font-medium hidden md:block">
                  {user.name?.split(" ")[0] || "User"}
                </span>
                <svg
                  className={`w-4 h-4 text-primary transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-primary/20 rounded-lg shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                        <img
                          src={getProfilePicture(user)}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                          onError={handleImageError(user.name)}
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white font-bold text-sm truncate">
                          {user.name || "User"}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {user.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push("/dashboard");
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-primary/10 rounded transition-colors flex items-center gap-2"
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Dashboard
                    </button>
                    {user.role === "admin" && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push("/admin");
                        }}
                        className="w-full text-left px-4 py-2 text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-2"
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Admin Panel
                      </button>
                    )}
                    {/* QR Scanner - for staff roles */}
                    {(user.role === "admin" ||
                      user.role === "registration-team" ||
                      user.role === "event-team") && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push("/checkin");
                        }}
                        className="w-full text-left px-4 py-2 text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors flex items-center gap-2"
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
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2"
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="bg-primary text-black font-bold px-6 py-2 rounded-full hover:bg-white transition-colors text-sm uppercase tracking-wider shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
