/**
 * Optimized API functions with batching and parallel requests
 */

import {
  fetchUserWithRegistrations,
  fetchEvents,
  fetchWorkshops,
  fetchAllEvents,
  getBuildingCheckInStats,
  getEventAttendanceStats,
} from "./api";
import type {
  BuildingCheckInStats,
  EventAttendanceStats,
  Event,
} from "@/types/api";

/**
 * Batch fetch all dashboard data in parallel
 * Reduces sequential API calls and improves load time
 */
export async function fetchDashboardData(token: string) {
  try {
    const [userData, events, workshops] = await Promise.all([
      fetchUserWithRegistrations(token).catch(() => null),
      fetchEvents().catch(() => []),
      fetchWorkshops().catch(() => []),
    ]);

    return { userData, events, workshops };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    throw error;
  }
}

/**
 * Batch fetch all stats data in parallel (admin only)
 */
export async function fetchAllStats(token: string) {
  try {
    const [buildingStats] = await Promise.all([
      getBuildingCheckInStats(token).catch(() => null),
    ]);

    return { buildingStats };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { buildingStats: null };
  }
}

/**
 * Batch fetch event stats for multiple events in parallel
 */
export async function fetchMultipleEventStats(
  token: string,
  eventIds: string[],
): Promise<Map<string, EventAttendanceStats | null>> {
  try {
    const statsPromises = eventIds.map((id) =>
      getEventAttendanceStats(token, id).catch(() => null),
    );

    const stats = await Promise.all(statsPromises);

    const statsMap = new Map<string, EventAttendanceStats | null>();
    eventIds.forEach((id, index) => {
      statsMap.set(id, stats[index]);
    });

    return statsMap;
  } catch (error) {
    console.error("Failed to fetch multiple event stats:", error);
    return new Map();
  }
}

/**
 * Fetch all event types in parallel
 */
export async function fetchAllEventTypes(): Promise<{
  events: Event[];
  workshops: Event[];
  all: Event[];
}> {
  try {
    const [events, workshops, all] = await Promise.all([
      fetchEvents().catch(() => []),
      fetchWorkshops().catch(() => []),
      fetchAllEvents().catch(() => []),
    ]);

    return { events, workshops, all };
  } catch (error) {
    console.error("Failed to fetch all event types:", error);
    return { events: [], workshops: [], all: [] };
  }
}

/**
 * Prefetch commonly used data
 */
export async function prefetchCommonData() {
  try {
    await Promise.all([fetchEvents(), fetchWorkshops()]);
  } catch (error) {
    console.error("Prefetch failed:", error);
  }
}
