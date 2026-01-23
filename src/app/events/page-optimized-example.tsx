/**
 * Example: Optimized Events Page
 * Demonstrates best practices for performance
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { fetchEvents } from '@/lib/api';
import { PaginatedEvents } from '@/components/ui/PaginatedEvents';
import { EventListSkeleton } from '@/components/ui/LoadingSkeleton';
import { DebouncedSearch } from '@/components/ui/DebouncedSearch';
import type { Event } from '@/types/api';

export default function OptimizedEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events once on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true);
        const data = await fetchEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);

  // Handle search with debounced input
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredEvents(events);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowercaseQuery) ||
        event.description?.toLowerCase().includes(lowercaseQuery) ||
        event.venue?.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredEvents(filtered);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">Events</h1>
        
        {/* Debounced Search */}
        <DebouncedSearch
          onSearch={handleSearch}
          placeholder="Search events by name, description, or venue..."
          className="max-w-md"
        />
      </div>

      {/* Events List with Loading State */}
      {isLoading ? (
        <EventListSkeleton count={6} />
      ) : (
        <Suspense fallback={<EventListSkeleton count={6} />}>
          <PaginatedEvents events={filteredEvents} itemsPerPage={12} />
        </Suspense>
      )}
    </div>
  );
}
