/**
 * API Utility Functions for ReVil 2026
 */

import axios from "axios";
import { UserProfile, UserWithRegistrations, ApiResponse } from "@/types/api";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Axios instance with default configuration
 */
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Get default avatar URL based on user's name
 */
export function getDefaultAvatarUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=667eea&color=fff&size=200`;
}

/**
 * Safely get profile picture with fallback
 */
export function getProfilePicture(user: {
  picture?: string;
  name: string;
}): string {
  if (user.picture && user.picture.trim() !== "") {
    return user.picture;
  }
  return getDefaultAvatarUrl(user.name);
}

/**
 * Handle image load error with fallback
 */
export function handleImageError(userName: string) {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = getDefaultAvatarUrl(userName);
  };
}

/**
 * Fetch user profile from /api/users/profile
 */
export async function fetchUserProfile(token: string): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data: ApiResponse<UserProfile> = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch user profile");
    }

    return data.data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("SERVER_OFFLINE");
    }
    throw error;
  }
}

/**
 * Fetch user with registrations from /api/users/me
 */
export async function fetchUserWithRegistrations(
  token: string,
): Promise<UserWithRegistrations> {
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    const data: ApiResponse<UserWithRegistrations> = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch user data");
    }

    return data.data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("SERVER_OFFLINE");
    }
    throw error;
  }
}

/**
 * Register for an event
 */
export async function registerForEvent(
  token: string,
  registrationData: import("@/types/api").RegistrationData,
): Promise<import("@/types/api").Registration> {
  try {
    const response = await fetch(`${API_URL}/api/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include",
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to register for event");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("SERVER_OFFLINE");
    }
    throw error;
  }
}

/**
 * Fetch all events (regular events only, excludes workshops)
 */
export async function fetchEvents(): Promise<import("@/types/api").Event[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/events?eventType=event&status=upcoming`,
      {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch events from backend:", error);
    throw error;
  }
}

/**
 * Fetch all workshops
 */
export async function fetchWorkshops(): Promise<import("@/types/api").Event[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/events?eventType=workshop&status=upcoming`,
      {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch workshops: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch workshops from backend:", error);
    throw error;
  }
}

/**
 * Setup authentication listener for OAuth callback
 */
export function setupAuthListener(
  onSuccess: (
    token: string,
    user: {
      id: string;
      name: string;
      email: string;
      picture: string;
      role: string;
      checkedIn: boolean;
    },
  ) => void,
  _onError?: (error: Error) => void,
) {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === "AUTH_SUCCESS") {
      const { token, user } = event.data;
      onSuccess(token, user);
    }
  };

  window.addEventListener("message", handleMessage);

  return () => {
    window.removeEventListener("message", handleMessage);
  };
}

/**
 * Open Google OAuth login popup
 */
export function openGoogleAuthPopup(apiUrl: string = API_URL) {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return window.open(
    `${apiUrl}/auth/google`,
    "Google Login",
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`,
  );
}

// ============================================
// CHECK-IN API FUNCTIONS
// ============================================

import type {
  CheckInType,
  CheckInResponse,
  BuildingCheckInStats,
  EventAttendanceStats,
} from "@/types/api";

/**
 * Perform check-in (building or session)
 */
export async function performCheckIn(
  token: string,
  qrCode: string,
  checkInType: CheckInType,
  eventId?: string,
): Promise<CheckInResponse> {
  try {
    // Use specific endpoints for building vs session check-in
    const endpoint = checkInType === "building" 
      ? `${API_URL}/api/checkin/building`
      : `${API_URL}/api/checkin/session`;

    const body: { qrCode: string; eventId?: string } = {
      qrCode, // Send raw QR code value
    };

    // Add eventId for session check-in (required)
    if (checkInType === "session" && eventId) {
      body.eventId = eventId;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok && response.status !== 200) {
      return {
        success: false,
        message: data.message || "Check-in failed",
      };
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        message: "Server is offline. Please try again later.",
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Check-in failed",
    };
  }
}

/**
 * Verify QR code without checking in
 */
export async function verifyQRCode(
  token: string,
  qrCode: string,
  eventId?: string,
): Promise<CheckInResponse> {
  try {
    const body: { qrCode: string; eventId?: string } = { qrCode };
    if (eventId) {
      body.eventId = eventId;
    }

    const response = await fetch(`${API_URL}/api/checkin/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        message: "Server is offline. Please try again later.",
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Get building check-in statistics (admin only)
 */
export async function getBuildingCheckInStats(
  token: string,
): Promise<BuildingCheckInStats | null> {
  try {
    const response = await fetch(`${API_URL}/api/checkin/stats/building`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to fetch building stats:", error);
    return null;
  }
}

/**
 * Get event attendance statistics (admin only)
 */
export async function getEventAttendanceStats(
  token: string,
  eventId: string,
): Promise<EventAttendanceStats | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/checkin/stats/event/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to fetch event stats:", error);
    return null;
  }
}

/**
 * Get all events for event team selection
 */
export async function fetchAllEvents(): Promise<import("@/types/api").Event[]> {
  try {
    const response = await fetch(`${API_URL}/api/events`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("SERVER_OFFLINE");
    }
    throw error;
  }
}
