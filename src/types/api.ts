/**
 * TypeScript interfaces for ReVil 2026 Backend API
 * Profile Picture & User Data
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  phoneNumber?: string;
  college?: string;
  department?: string;
  checkedIn: boolean;
  checkInTime: Date | null;
  role: "user" | "superadmin" | "event_manager" | "registration_team";
  qrCode?: string; // User's unique QR code for check-ins
  managedEvents?: string[]; // Event IDs that event managers can access
  lastLogin: Date;
  createdAt: Date;
}

export interface UserBasic {
  id: string;
  name: string;
  email: string;
  picture: string;
  checkedIn: boolean;
  checkInTime: Date | null;
  role: "user" | "superadmin" | "event_manager" | "registration_team";
  qrCode?: string; // User's unique QR code for check-ins
}

export interface Event {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  fullDescription?: string;
  image?: string;
  type?: string;
  host?: string;
  duration?: string;
  prerequisites?: string[];
  startTime?: string;
  endTime?: string;
  venue?: string;
  capacity: number;
  currentRegistrations?: number;
  fee?: number;
  eventType: "workshop" | "talk" | "panel" | "networking" | "event";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  speakers?: Array<{
    name: string;
    bio: string;
    photo?: string;
  }>;
  // Event coordinators / contacts
  contacts?: Array<{
    name: string;
    phone?: string;
    email?: string;
  }>;
  rules?: string[];
  registeredCount?: number;
  isTeamEvent?: boolean;
  teamSize?: {
    min: number;
    max: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeamMember {
  name: string;
  email: string;
  phoneNumber: string;
  college: string;
  department?: string;
  year?: string;
  isLeader: boolean;
}

export interface RegistrationData {
  eventId: string;
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  phoneNumber?: string;
  college?: string;
  department?: string;
  year?: string;
}

export interface Registration {
  _id: string;
  user: string;
  event: Event;
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  phoneNumber?: string;
  college?: string;
  department?: string;
  year?: string;
  qrCode: string;
  qrCodeImage: string;
  registrationStatus: "registered" | "confirmed" | "attended" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface EventRegistration {
  _id: string;
  event: {
    _id: string;
    title: string;
    date: string;
    startTime: string;
    venue: string;
  };
  isTeamRegistration?: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  qrCode?: string;
  qrCodeImage?: string;
  registrationStatus: "registered" | "confirmed" | "attended" | "cancelled";
  createdAt: Date;
}

export interface UserWithRegistrations {
  user: UserBasic;
  registrations: EventRegistration[];
}

export interface AuthSuccessMessage {
  type: "AUTH_SUCCESS";
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    picture: string;
    role: "user" | "superadmin" | "event_manager" | "registration_team";
    checkedIn: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ApiResponse<T> = { success: true; data: T } | ApiErrorResponse;

// Check-in Types
export type CheckInType = "building" | "session";

export interface CheckInRequest {
  qrCode: string;
  checkInType: CheckInType;
}

export interface CheckInUserData {
  name: string;
  email: string;
  picture?: string;
}

export interface CheckInEventData {
  _id?: string;
  title: string;
  date?: string;
  venue?: string;
}

export interface CheckInResponseData {
  user: CheckInUserData;
  event?: CheckInEventData;
  timestamp?: string;
}

export interface CheckInResponse {
  success: boolean;
  alreadyCheckedIn?: boolean;
  message: string;
  data?: CheckInResponseData;
}

export interface BuildingCheckInStats {
  totalUsers: number;
  checkedInUsers: number;
  notCheckedIn: number;
  checkInRate: number;
}

export interface EventAttendanceStats {
  eventTitle: string;
  totalRegistrations: number;
  attendedCount: number;
  notAttendedCount: number;
  attendanceRate: number;
}
