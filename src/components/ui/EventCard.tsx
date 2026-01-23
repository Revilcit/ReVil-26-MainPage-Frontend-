/**
 * Optimized Event Card Component with React.memo
 * Only re-renders when event data actually changes
 */

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/types/api";

interface EventCardProps {
  event: Event;
}

export const EventCard = memo(
  ({ event }: EventCardProps) => {
    return (
      <Link href={`/events/${event._id}`}>
        <div className="event-card group cursor-pointer">
          {/* Lazy-loaded optimized image */}
          {event.image && (
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
              <Image
                src={event.image}
                alt={event.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                quality={75}
              />
            </div>
          )}

          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">{event.title}</h3>

            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-sm">
              {event.startTime && (
                <span className="text-blue-600 dark:text-blue-400">
                  📅 {event.startTime}
                </span>
              )}

              {event.venue && (
                <span className="text-gray-600 dark:text-gray-400">
                  📍 {event.venue}
                </span>
              )}
            </div>

            {event.capacity && (
              <div className="mt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {event.currentRegistrations || 0} / {event.capacity}{" "}
                  registered
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if event ID or key data changes
    return (
      prevProps.event._id === nextProps.event._id &&
      prevProps.event.currentRegistrations ===
        nextProps.event.currentRegistrations &&
      prevProps.event.status === nextProps.event.status
    );
  },
);

EventCard.displayName = "EventCard";
