/**
 * API Utility Functions for ReVil 2026
 */

import { UserProfile, UserWithRegistrations, ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  token: string
): Promise<UserWithRegistrations> {
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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
  registrationData: import("@/types/api").RegistrationData
): Promise<import("@/types/api").Registration> {
  try {
    const response = await fetch(`${API_URL}/api/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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
    const response = await fetch(`${API_URL}/api/events?eventType=event`, {
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

/**
 * Fetch all workshops
 */
export async function fetchWorkshops(): Promise<import("@/types/api").Event[]> {
  try {
    const response = await fetch(`${API_URL}/api/events?eventType=workshop`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workshops: ${response.statusText}`);
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
    }
  ) => void,
  _onError?: (error: Error) => void
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
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
  );
}
