# ReVil 2026 Frontend API Documentation

## Overview

This document provides comprehensive documentation for the ReVil 2026 frontend API client library. The API client provides type-safe functions for interacting with the ReVil 2026 backend server.

**Base URL Configuration:**
- Environment Variable: `NEXT_PUBLIC_API_URL`
- Default: `http://localhost:5000`

**All requests include:**
- `Content-Type: application/json`
- `ngrok-skip-browser-warning: true` (for development)
- `credentials: include` (for authenticated requests)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Events & Workshops](#events--workshops)
4. [Registration](#registration)
5. [Check-In System](#check-in-system)
6. [Utilities](#utilities)
7. [Types](#types)
8. [Error Handling](#error-handling)

---

## Authentication

### OAuth Flow

#### `openGoogleAuthPopup(apiUrl?: string): Window | null`

Opens a popup window for Google OAuth authentication.

**Parameters:**
- `apiUrl` (optional): API base URL. Defaults to `API_URL`

**Returns:** `Window | null` - Popup window reference

**Example:**
```typescript
import { openGoogleAuthPopup } from '@/lib/api';

const popup = openGoogleAuthPopup();
```

**Popup Configuration:**
- Dimensions: 500x600px
- Centered on screen
- Opens: `/auth/google` endpoint

---

#### `setupAuthListener(onSuccess, onError?): () => void`

Sets up a message listener for OAuth callback.

**Parameters:**
- `onSuccess`: Callback function receiving token and user data
  ```typescript
  (token: string, user: {
    id: string;
    name: string;
    email: string;
    picture: string;
    role: string;
    checkedIn: boolean;
  }) => void
  ```
- `onError` (optional): Error callback function

**Returns:** Cleanup function to remove event listener

**Example:**
```typescript
import { setupAuthListener } from '@/lib/api';

const cleanup = setupAuthListener(
  (token, user) => {
    localStorage.setItem('token', token);
    console.log('User logged in:', user);
  },
  (error) => console.error('Auth error:', error)
);

// Clean up when component unmounts
return cleanup;
```

**Message Format:**
```typescript
{
  type: "AUTH_SUCCESS",
  token: string,
  user: UserProfile
}
```

---

## User Management

### `fetchUserProfile(token: string): Promise<UserProfile>`

Fetches the current user's profile information.

**Endpoint:** `GET /api/users/profile`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `token`: JWT authentication token

**Returns:** `Promise<UserProfile>`

**Example:**
```typescript
import { fetchUserProfile } from '@/lib/api';

const profile = await fetchUserProfile(token);
console.log(profile.name, profile.email);
```

**Response Structure:**
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  phoneNumber?: string;
  college?: string;
  department?: string;
  checkedIn: boolean;
  checkInTime: Date | null;
  role: "user" | "admin" | "registration-team" | "event-team";
  lastLogin: Date;
  createdAt: Date;
}
```

**Error Cases:**
- `401`: Throws `"UNAUTHORIZED"` - Token invalid or expired
- Network error: Throws `"SERVER_OFFLINE"`
- Other errors: Throws descriptive error message

---

### `fetchUserWithRegistrations(token: string): Promise<UserWithRegistrations>`

Fetches user profile with all event registrations.

**Endpoint:** `GET /api/users/me`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `token`: JWT authentication token

**Returns:** `Promise<UserWithRegistrations>`

**Example:**
```typescript
import { fetchUserWithRegistrations } from '@/lib/api';

const userData = await fetchUserWithRegistrations(token);
console.log(`User: ${userData.user.name}`);
console.log(`Registrations: ${userData.registrations.length}`);
```

**Response Structure:**
```typescript
interface UserWithRegistrations {
  user: UserBasic;
  registrations: EventRegistration[];
}
```

**Error Cases:**
- `401`: Throws `"UNAUTHORIZED"`
- Network error: Throws `"SERVER_OFFLINE"`

---

## Events & Workshops

### `fetchEvents(): Promise<Event[]>`

Fetches all regular events (excludes workshops).

**Endpoint:** `GET /api/events?eventType=event`

**Authentication:** Not required

**Returns:** `Promise<Event[]>`

**Example:**
```typescript
import { fetchEvents } from '@/lib/api';

const events = await fetchEvents();
events.forEach(event => {
  console.log(`${event.title} - ${event.date}`);
});
```

**Query Parameters:**
- `eventType`: Automatically set to `"event"`

---

### `fetchWorkshops(): Promise<Event[]>`

Fetches all workshops.

**Endpoint:** `GET /api/events?eventType=workshop`

**Authentication:** Not required

**Returns:** `Promise<Event[]>`

**Example:**
```typescript
import { fetchWorkshops } from '@/lib/api';

const workshops = await fetchWorkshops();
console.log(`Found ${workshops.length} workshops`);
```

**Query Parameters:**
- `eventType`: Automatically set to `"workshop"`

---

### `fetchAllEvents(): Promise<Event[]>`

Fetches all events (both events and workshops).

**Endpoint:** `GET /api/events`

**Authentication:** Not required

**Returns:** `Promise<Event[]>`

**Example:**
```typescript
import { fetchAllEvents } from '@/lib/api';

const allEvents = await fetchAllEvents();
```

**Event Structure:**
```typescript
interface Event {
  _id: string;
  title: string;
  description: string;
  image?: string;
  type?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  capacity: number;
  currentRegistrations?: number;
  eventType: "workshop" | "talk" | "panel" | "networking";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  speakers?: Array<{
    name: string;
    bio: string;
    photo: string;
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
```

---

## Registration

### `registerForEvent(token: string, registrationData: RegistrationData): Promise<Registration>`

Registers a user for an event (individual or team).

**Endpoint:** `POST /api/registrations`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `token`: JWT authentication token
- `registrationData`: Registration details

**Returns:** `Promise<Registration>`

**Example - Individual Registration:**
```typescript
import { registerForEvent } from '@/lib/api';

const registration = await registerForEvent(token, {
  eventId: "event123",
  isTeamRegistration: false,
  phoneNumber: "1234567890",
  college: "MIT",
  department: "Computer Science",
  year: "3"
});
```

**Example - Team Registration:**
```typescript
const registration = await registerForEvent(token, {
  eventId: "event456",
  isTeamRegistration: true,
  teamName: "Code Warriors",
  teamMembers: [
    {
      name: "John Doe",
      email: "john@example.com",
      phoneNumber: "1234567890",
      college: "MIT",
      department: "CS",
      year: "3",
      isLeader: true
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      phoneNumber: "0987654321",
      college: "MIT",
      department: "CS",
      year: "2",
      isLeader: false
    }
  ],
  phoneNumber: "1234567890",
  college: "MIT",
  department: "Computer Science",
  year: "3"
});
```

**Registration Data Structure:**
```typescript
interface RegistrationData {
  eventId: string;
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  phoneNumber?: string;
  college?: string;
  department?: string;
  year?: string;
}

interface TeamMember {
  name: string;
  email: string;
  phoneNumber: string;
  college: string;
  department?: string;
  year?: string;
  isLeader: boolean;
}
```

**Response Structure:**
```typescript
interface Registration {
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
```

**Error Cases:**
- `401`: Throws `"UNAUTHORIZED"`
- Network error: Throws `"SERVER_OFFLINE"`
- Other errors: Throws server error message

---

## Check-In System

### `performCheckIn(token: string, qrCode: string, checkInType: CheckInType): Promise<CheckInResponse>`

Performs user check-in (building entry or event session).

**Endpoint:** `POST /api/checkin`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `token`: JWT authentication token
- `qrCode`: QR code data string
- `checkInType`: `"building"` or `"session"`

**Returns:** `Promise<CheckInResponse>`

**Example - Building Check-In:**
```typescript
import { performCheckIn } from '@/lib/api';

const result = await performCheckIn(token, qrCodeData, "building");
if (result.success) {
  console.log(`Welcome ${result.data?.user.name}!`);
}
```

**Example - Session Check-In:**
```typescript
const result = await performCheckIn(token, qrCodeData, "session");
if (result.success) {
  console.log(`Checked in to ${result.data?.event?.title}`);
} else if (result.alreadyCheckedIn) {
  console.log("Already checked in!");
}
```

**Check-In Types:**
```typescript
type CheckInType = "building" | "session";
```

**Response Structure:**
```typescript
interface CheckInResponse {
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
      _id?: string;
      title: string;
      date?: string;
      venue?: string;
    };
    timestamp?: string;
  };
}
```

**Response Examples:**

Success:
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "picture": "https://..."
    },
    "event": {
      "_id": "event123",
      "title": "Tech Talk",
      "date": "2026-01-25",
      "venue": "Main Hall"
    },
    "timestamp": "2026-01-25T14:30:00Z"
  }
}
```

Already Checked In:
```json
{
  "success": true,
  "alreadyCheckedIn": true,
  "message": "Already checked in",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Invalid QR code"
}
```

---

### `verifyQRCode(token: string, qrCode: string): Promise<CheckInResponse>`

Verifies a QR code without performing check-in (preview mode).

**Endpoint:** `GET /api/checkin/verify/:qrCode`

**Authentication:** Required (Bearer Token)

**Parameters:**
- `token`: JWT authentication token
- `qrCode`: QR code data string (URL encoded)

**Returns:** `Promise<CheckInResponse>`

**Example:**
```typescript
import { verifyQRCode } from '@/lib/api';

const verification = await verifyQRCode(token, qrCodeData);
if (verification.success) {
  console.log(`QR code valid for: ${verification.data?.user.name}`);
} else {
  console.log(`Invalid QR code: ${verification.message}`);
}
```

**Use Cases:**
- Preview check-in data before confirming
- Validate QR codes during testing
- Display user info before check-in

---

### `getBuildingCheckInStats(token: string): Promise<BuildingCheckInStats | null>`

Fetches building check-in statistics (admin only).

**Endpoint:** `GET /api/checkin/stats/building`

**Authentication:** Required (Admin Role)

**Parameters:**
- `token`: JWT authentication token

**Returns:** `Promise<BuildingCheckInStats | null>`

**Example:**
```typescript
import { getBuildingCheckInStats } from '@/lib/api';

const stats = await getBuildingCheckInStats(token);
if (stats) {
  console.log(`Check-in Rate: ${stats.checkInRate}%`);
  console.log(`${stats.checkedInUsers}/${stats.totalUsers} checked in`);
}
```

**Response Structure:**
```typescript
interface BuildingCheckInStats {
  totalUsers: number;
  checkedInUsers: number;
  notCheckedIn: number;
  checkInRate: number; // Percentage (0-100)
}
```

**Example Response:**
```json
{
  "totalUsers": 250,
  "checkedInUsers": 180,
  "notCheckedIn": 70,
  "checkInRate": 72
}
```

---

### `getEventAttendanceStats(token: string, eventId: string): Promise<EventAttendanceStats | null>`

Fetches event-specific attendance statistics (admin only).

**Endpoint:** `GET /api/checkin/stats/event/:eventId`

**Authentication:** Required (Admin Role)

**Parameters:**
- `token`: JWT authentication token
- `eventId`: Event ID

**Returns:** `Promise<EventAttendanceStats | null>`

**Example:**
```typescript
import { getEventAttendanceStats } from '@/lib/api';

const stats = await getEventAttendanceStats(token, "event123");
if (stats) {
  console.log(`Event: ${stats.eventTitle}`);
  console.log(`Attendance: ${stats.attendanceRate}%`);
}
```

**Response Structure:**
```typescript
interface EventAttendanceStats {
  eventTitle: string;
  totalRegistrations: number;
  attendedCount: number;
  notAttendedCount: number;
  attendanceRate: number; // Percentage (0-100)
}
```

**Example Response:**
```json
{
  "eventTitle": "AI Workshop",
  "totalRegistrations": 50,
  "attendedCount": 42,
  "notAttendedCount": 8,
  "attendanceRate": 84
}
```

---

## Utilities

### Profile Picture Helpers

#### `getDefaultAvatarUrl(name: string): string`

Generates a default avatar URL using UI Avatars service.

**Parameters:**
- `name`: User's full name

**Returns:** Avatar URL string

**Example:**
```typescript
import { getDefaultAvatarUrl } from '@/lib/api';

const avatarUrl = getDefaultAvatarUrl("John Doe");
// Returns: "https://ui-avatars.com/api/?name=John%20Doe&background=667eea&color=fff&size=200"
```

**Configuration:**
- Background color: `#667eea` (purple)
- Text color: `#fff` (white)
- Size: 200x200px

---

#### `getProfilePicture(user: { picture?: string; name: string }): string`

Gets user profile picture with fallback to default avatar.

**Parameters:**
- `user`: Object containing picture URL and name

**Returns:** Profile picture URL

**Example:**
```typescript
import { getProfilePicture } from '@/lib/api';

const user = { name: "John Doe", picture: "" };
const imageUrl = getProfilePicture(user);
// Returns default avatar if picture is empty
```

**Logic:**
- Returns `user.picture` if not empty
- Falls back to `getDefaultAvatarUrl(user.name)` if empty or missing

---

#### `handleImageError(userName: string): (e: SyntheticEvent) => void`

Creates an error handler for image loading failures.

**Parameters:**
- `userName`: User's name for fallback avatar

**Returns:** Event handler function

**Example:**
```typescript
import { handleImageError } from '@/lib/api';

<img
  src={user.picture}
  alt={user.name}
  onError={handleImageError(user.name)}
/>
```

**Behavior:**
- Replaces failed image with default avatar
- Automatically called when image fails to load

---

## Types

### Core Types

All TypeScript interfaces are available in `/src/types/api.ts`:

```typescript
import type {
  UserProfile,
  UserBasic,
  Event,
  Registration,
  RegistrationData,
  CheckInResponse,
  ApiResponse,
  // ... more types
} from '@/types/api';
```

### API Response Format

All API responses follow this structure:

**Success:**
```typescript
{
  success: true;
  data: T; // Typed response data
}
```

**Error:**
```typescript
{
  success: false;
  message: string;
  error?: string; // Optional error details
}
```

### Generic Response Type

```typescript
type ApiResponse<T> = 
  | { success: true; data: T } 
  | { success: false; message: string; error?: string };
```

---

## Error Handling

### Common Error Patterns

All API functions follow consistent error handling:

#### 1. Unauthorized (401)

```typescript
try {
  const data = await fetchUserProfile(token);
} catch (error) {
  if (error.message === "UNAUTHORIZED") {
    // Token expired or invalid
    // Redirect to login
  }
}
```

#### 2. Server Offline

```typescript
try {
  const events = await fetchEvents();
} catch (error) {
  if (error.message === "SERVER_OFFLINE") {
    // Network error or server down
    // Show offline message
  }
}
```

#### 3. API Errors

```typescript
try {
  const registration = await registerForEvent(token, data);
} catch (error) {
  // Server returned error message
  console.error(error.message);
  // Display user-friendly error
}
```

### Error Handling Best Practices

```typescript
import { fetchUserProfile } from '@/lib/api';

async function loadUserProfile(token: string) {
  try {
    const profile = await fetchUserProfile(token);
    return profile;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    switch (message) {
      case 'UNAUTHORIZED':
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
        
      case 'SERVER_OFFLINE':
        // Show offline banner
        showNotification('Server is offline. Please try again later.');
        break;
        
      default:
        // Show generic error
        showNotification(`Error: ${message}`);
    }
    
    return null;
  }
}
```

### HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Process data normally |
| 401 | Unauthorized | Clear token, redirect to login |
| 404 | Not Found | Show "not found" message |
| 500 | Server Error | Show error, retry later |

---

## Usage Examples

### Complete Authentication Flow

```typescript
'use client';
import { useState, useEffect } from 'react';
import { setupAuthListener, openGoogleAuthPopup, fetchUserProfile } from '@/lib/api';

export default function LoginPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Setup auth listener
    const cleanup = setupAuthListener(
      async (token, userData) => {
        // Save token
        localStorage.setItem('token', token);
        
        // Fetch full profile
        try {
          const profile = await fetchUserProfile(token);
          setUser(profile);
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      },
      (error) => console.error('Auth error:', error)
    );

    return cleanup;
  }, []);

  const handleLogin = () => {
    openGoogleAuthPopup();
  };

  return (
    <button onClick={handleLogin}>
      Login with Google
    </button>
  );
}
```

### Event Registration Flow

```typescript
import { fetchEvents, registerForEvent } from '@/lib/api';

async function registerUserForEvent(eventId: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    return;
  }

  try {
    const registration = await registerForEvent(token, {
      eventId,
      isTeamRegistration: false,
      phoneNumber: '1234567890',
      college: 'MIT',
      department: 'CS',
      year: '3'
    });

    console.log('Registration successful!');
    console.log('QR Code:', registration.qrCode);
    console.log('QR Image:', registration.qrCodeImage);
    
    return registration;
  } catch (error) {
    console.error('Registration failed:', error.message);
    return null;
  }
}
```

### Check-In Scanner

```typescript
import { performCheckIn, verifyQRCode } from '@/lib/api';

async function handleQRScan(qrCode: string, checkInType: 'building' | 'session') {
  const token = localStorage.getItem('token');
  if (!token) return;

  // First verify the QR code
  const verification = await verifyQRCode(token, qrCode);
  if (!verification.success) {
    alert('Invalid QR code');
    return;
  }

  // Show preview
  const userName = verification.data?.user.name;
  const confirmed = confirm(`Check in ${userName}?`);
  
  if (confirmed) {
    // Perform actual check-in
    const result = await performCheckIn(token, qrCode, checkInType);
    
    if (result.success) {
      if (result.alreadyCheckedIn) {
        alert('User already checked in');
      } else {
        alert('Check-in successful!');
      }
    } else {
      alert(`Error: ${result.message}`);
    }
  }
}
```

### Dashboard with Statistics

```typescript
import { 
  fetchUserWithRegistrations,
  getBuildingCheckInStats,
  getEventAttendanceStats 
} from '@/lib/api';

async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    // Load user data with registrations
    const userData = await fetchUserWithRegistrations(token);
    
    // Load building stats (if admin)
    const buildingStats = await getBuildingCheckInStats(token);
    
    // Load event stats for each registered event
    const eventStats = await Promise.all(
      userData.registrations.map(reg =>
        getEventAttendanceStats(token, reg.event._id)
      )
    );

    return {
      user: userData.user,
      registrations: userData.registrations,
      buildingStats,
      eventStats
    };
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    return null;
  }
}
```

---

## Environment Setup

### Required Environment Variables

Create a `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.revil.example.com

# Development (optional)
# NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Configuration Tips

**Development:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://api.revil.com
```

**Ngrok (Testing):**
```bash
NEXT_PUBLIC_API_URL=https://abcd1234.ngrok.io
```

---

## Security Best Practices

### Token Management

✅ **DO:**
- Store tokens in `localStorage` or secure cookies
- Clear tokens on logout
- Validate token before making requests
- Handle token expiration gracefully

❌ **DON'T:**
- Store tokens in URL parameters
- Expose tokens in console logs
- Share tokens between users

### Request Security

```typescript
// ✅ Good: Always use HTTPS in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ✅ Good: Include credentials for auth
fetch(url, {
  credentials: 'include',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// ❌ Bad: Hardcoded tokens
const token = 'hardcoded-token-123';
```

### Error Information

```typescript
// ✅ Good: Don't expose sensitive error details to users
catch (error) {
  console.error('[Internal]', error); // Log for developers
  showToUser('An error occurred'); // Generic message for users
}

// ❌ Bad: Exposing internal errors
catch (error) {
  alert(error.message); // May contain sensitive info
}
```

---

## Testing

### Mock API Responses

```typescript
// Mock fetchEvents for testing
jest.mock('@/lib/api', () => ({
  fetchEvents: jest.fn(() => Promise.resolve([
    {
      _id: 'event1',
      title: 'Test Event',
      date: '2026-01-25',
      capacity: 100
    }
  ]))
}));
```

### Test Utilities

```typescript
// Create test token
const testToken = 'test-jwt-token-12345';

// Mock user data
const mockUser: UserProfile = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/pic.jpg',
  checkedIn: false,
  checkInTime: null,
  role: 'user',
  lastLogin: new Date(),
  createdAt: new Date()
};
```

---

## Migration Guide

### From v1 to v2 (Current)

If migrating from an older API version:

**Breaking Changes:**
- `fetchUserProfile` now requires authentication token
- Check-in endpoints split into `building` and `session` types
- Event type filtering required for `fetchEvents` vs `fetchWorkshops`

**Migration Example:**

```typescript
// ❌ Old (v1)
const events = await fetchEvents(); // Returns all events

// ✅ New (v2)
const events = await fetchEvents(); // Returns only events
const workshops = await fetchWorkshops(); // Returns only workshops
const all = await fetchAllEvents(); // Returns everything
```

---

## Support & Troubleshooting

### Common Issues

**Issue: "UNAUTHORIZED" error**
- Cause: Invalid or expired token
- Solution: Re-authenticate user, obtain new token

**Issue: "SERVER_OFFLINE" error**
- Cause: Backend server not responding
- Solution: Check backend status, verify `NEXT_PUBLIC_API_URL`

**Issue: CORS errors**
- Cause: Backend not configured for frontend origin
- Solution: Configure CORS in backend to allow frontend domain

### Debug Mode

Enable detailed logging:

```typescript
// In api.ts, uncomment console.log statements
console.log('Fetching events from API_URL:', API_URL);
console.log('Response received:', response);
```

### Contact

For API issues or questions:
- Email: dev@revil.example.com
- GitHub: github.com/revil/frontend/issues
- Docs: docs.revil.example.com

---

## Changelog

### v2.0 (Current)
- Added check-in system with building/session types
- Added event attendance statistics
- Improved error handling
- Added TypeScript type safety

### v1.0
- Initial API implementation
- Basic authentication
- Event and workshop management
- User registration system

---

**Last Updated:** January 22, 2026  
**API Version:** 2.0  
**Frontend Version:** Next.js 14+
