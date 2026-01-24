"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import EventBackground from "@/components/ui/EventBackground";
import { fetchEvents } from "@/lib/api";
import { Event as ApiEvent } from "@/types/api";
import toast, { Toaster } from "react-hot-toast";

interface EventViewModel {
  id: string;
  title: string;
  image: string;
  description: string;
  type: string;
}

const AUTO_PLAY_INTERVAL = 4000;
const INACTIVITY_DELAY = 10000;

// Performance optimization: Detect device capabilities
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth < 768
  );
};

const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [visibleGridItems, setVisibleGridItems] = useState<Set<number>>(
    new Set(),
  );

  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);
  const navigationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Detect device capabilities on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setReduceMotion(prefersReducedMotion());

    // Optimize initial grid render - show first 4-8 items immediately
    const initialVisible = new Set<number>();
    const initialCount = isMobileDevice() ? 4 : 8;
    for (let i = 0; i < initialCount; i++) {
      initialVisible.add(i);
    }
    setVisibleGridItems(initialVisible);
  }, []);

  // Fetch events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const apiEvents = await fetchEvents();

        const transformedEvents: EventViewModel[] = apiEvents.map(
          (event: ApiEvent, idx: number) => ({
            id:
              event._id ||
              (event.title
                ? event.title.toLowerCase().replace(/\s+/g, "-")
                : `event-${idx}`),
            title: event.title,
            image: event.image || "/events/default.jpg",
            description: event.description,
            type: event.type || event.eventType,
          }),
        );
        setEvents(transformedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Setup Intersection Observer for lazy loading grid items
  useEffect(() => {
    if (typeof window === "undefined" || events.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              entry.target.getAttribute("data-index") || "0",
            );
            setVisibleGridItems((prev) => new Set([...prev, idx]));
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [events.length]);

  const current = events[index];

  const upcoming = useMemo(
    () => [...events.slice(index), ...events.slice(0, index)],
    [index, events],
  );

  const clearTimers = useCallback(() => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
  }, []);

  const pauseAutoplay = useCallback(() => {
    setPaused(true);
    clearTimers();
    inactivityRef.current = setTimeout(
      () => setPaused(false),
      INACTIVITY_DELAY,
    );
  }, [clearTimers]);

  useEffect(() => {
    // Disable autoplay on mobile devices for better performance
    if (paused || events.length === 0 || isMobile) return;

    autoplayRef.current = setTimeout(() => {
      setHasStarted(true);
      setIndex((i) => (i + 1) % events.length);
    }, AUTO_PLAY_INTERVAL);

    return clearTimers;
  }, [paused, index, clearTimers, events.length, isMobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (events.length === 0) return;

      if (e.key === "ArrowRight") {
        pauseAutoplay();
        setIndex((i) => (i + 1) % events.length);
      }
      if (e.key === "ArrowLeft") {
        pauseAutoplay();
        setIndex((i) => (i === 0 ? events.length - 1 : i - 1));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pauseAutoplay, events.length]);

  const handleNext = useCallback(() => {
    if (navigationDebounceRef.current) return; // Prevent rapid clicks

    pauseAutoplay();
    setIndex((i) => (i + 1) % events.length);

    // Debounce navigation
    navigationDebounceRef.current = setTimeout(() => {
      navigationDebounceRef.current = null;
    }, 300);
  }, [pauseAutoplay, events.length]);

  const handlePrev = useCallback(() => {
    if (navigationDebounceRef.current) return; // Prevent rapid clicks

    pauseAutoplay();
    setIndex((i) => (i === 0 ? events.length - 1 : i - 1));

    // Debounce navigation
    navigationDebounceRef.current = setTimeout(() => {
      navigationDebounceRef.current = null;
    }, 300);
  }, [pauseAutoplay, events.length]);

  const handleRegisterClick = (eventId?: string) => {
    // Check if user is logged in
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      toast("Please login to register for events", {
        icon: "🔐",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      router.push("/login");
      return;
    }

    // Use provided eventId or current event from carousel

    const targetEventId = eventId || current?.id;

    if (targetEventId) {
      router.push(`/events/${targetEventId}/register`);
    }

    // comment the above to close registrations

    // vishal

    // comment the below if you want registrations to be open

    // toast("Registrations are coming soon!", {
    //   style: {
    //     borderRadius: "10px",
    //     background: "#333",
    //     color: "#fff",
    //   },
    // });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <LazyMotion features={domAnimation} strict>
        <div className="min-h-screen py-24 bg-black flex items-center justify-center relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center max-w-2xl mx-auto px-4"
          >
            <m.h1
              className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 mb-6"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Houston, We Have a Problem!
            </m.h1>

            <m.p
              className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              The <span className="text-[#00E5FF] font-bold">Backend Team</span>{" "}
              forgot to add events... again.
            </m.p>

            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <p className="text-gray-400 text-lg">
                They&apos;re probably debugging their coffee machine or arguing
                about
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    toast(
                      "Calling backend team... Just kidding! Check back soon!",
                      {
                        icon: "🔧",
                        duration: 3000,
                        style: {
                          borderRadius: "10px",
                          background: "#333",
                          color: "#fff",
                        },
                      },
                    );
                  }}
                  className="px-8 py-4 bg-black text-white font-bold rounded-lg text-lg border border-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  Blame Backend Team
                </m.button>

                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 bg-white text-black font-bold rounded-lg text-lg hover:bg-gray-200 transition-all"
                >
                  Retry
                </m.button>
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 text-sm text-gray-500 space-y-2 border-l-2 border-[#00E5FF]/30 pl-6"
            >
              <p className="text-[#00E5FF]/70 font-mono">
                Error Code: BACKEND_TEAM_SLEEPING
              </p>
              <p className="text-gray-400">
                Possible solutions: Coffee | Pizza | More Coffee
              </p>
            </m.div>
          </m.div>
          <Toaster position="bottom-right" />
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="relative min-h-screen bg-black overflow-hidden isolate pt-28">
        {!hasStarted && <EventBackground />}

        {/* --- FULL SCREEN BACKGROUND --- */}
        {current && (
          <AnimatePresence mode="wait">
            <m.div
              key={current.id}
              className="absolute inset-0 z-0 pointer-events-none"
              initial={reduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? {} : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5 }}
            >
              <Image
                src={current.image}
                alt={current.title}
                fill
                priority={!isMobile}
                quality={isMobile ? 40 : 60}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
              {/* Remove expensive backdrop-blur on mobile */}
              {!isMobile && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
              )}
              {isMobile && <div className="absolute inset-0 bg-black/50" />}
            </m.div>
          </AnimatePresence>
        )}

        {/* --- NAVIGATION ARROWS --- */}
        {/* --- NAVIGATION ARROWS (Moved ~10cm Down) --- */}
        {/* hidden on mobile (hidden), shown on desktop (md:flex) */}
        <div className="hidden md:flex absolute md:top-[400px] left-0 right-0 z-30 items-center justify-between pointer-events-none px-4 md:px-8">
          {" "}
          <button
            onClick={handlePrev}
            aria-label="Previous Event"
            className="pointer-events-auto w-12 h-12 flex items-center justify-center
      bg-black/50 backdrop-blur-md border border-white/10 rounded-full
      hover:bg-white/10 hover:border-primary/50 transition-all active:scale-95"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Event"
            className="pointer-events-auto w-12 h-12 flex items-center justify-center
      bg-black/50 backdrop-blur-md border border-white/10 rounded-full
      hover:bg-white/10 hover:border-primary/50 transition-all active:scale-95"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* --- MAIN CONTENT CONTAINER --- */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 mb-8 md:mb-12 glitch-text uppercase tracking-tighter">
            Events
          </h1>

          {/* === MOBILE VIEW === */}
          {current && (
            <div className="md:hidden flex flex-col items-center space-y-6 pb-20">
              <AnimatePresence mode="wait">
                <m.div
                  key={current.id}
                  initial={reduceMotion ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? {} : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                  className="w-full"
                >
                  {/* Container for Image + Buttons */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6">
                    <Image
                      src={current.image}
                      alt={current.title}
                      fill
                      className="object-cover"
                      quality={40}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />

                    {/* MOBILE NAVIGATION BUTTONS (Centered on sides of image) */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 z-30"></div>
                  </div>

                  {/* Content below image */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                      <span className="text-[#00E5FF] font-mono text-sm tracking-widest uppercase">
                        {current.type}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white leading-tight">
                      {current.title}
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      {current.description}
                    </p>

                    {/* Your new White Button */}
                    <button
                      onClick={() => handleRegisterClick(current.id)}
                      className="px-6 py-2 mt-4 text-sm bg-white text-black hover:bg-black hover:text-white border border-white font-bold tracking-wider transition-all transform hover:-translate-y-1 uppercase"
                    >
                      Initialize Registration
                    </button>
                  </div>
                </m.div>
              </AnimatePresence>
            </div>
          )}
          {/* === DESKTOP VIEW === */}
          {current && (
            <div className="hidden md:flex min-h-[460px] items-center">
              {/* Left: Active Event Details */}
              <div className="w-[40%] pr-8">
                <AnimatePresence>
                  <m.div
                    key={current.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                      {current.title}
                    </h2>

                    {/* removed description */}

                    <div className="flex items-center gap-4">
                      {/* Added h-[42px] and inline-flex to both elements to lock their height */}
                      <span className="inline-flex items-center h-[42px] text-[#00E5FF] font-bold border border-[#00E5FF]/30 px-4 rounded uppercase text-sm">
                        {current.type}
                      </span>
                      <button
                        onClick={() => handleRegisterClick(current.id)}
                        className="h-[42px] px-6 text-sm bg-white text-black hover:bg-black hover:text-white border border-white font-bold tracking-wider transition-all uppercase shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                      >
                        INITIALIZE REGISTRATION
                      </button>
                    </div>
                  </m.div>
                </AnimatePresence>
              </div>

              {/* Right: Carousel Strip */}
              <div className="w-[60%] h-[350px] relative pl-4">
                <div className="flex gap-6 absolute left-0 h-full py-4 pl-2">
                  <AnimatePresence initial={false} mode="popLayout">
                    {upcoming.slice(0, 3).map((event, idx) => (
                      <m.div
                        layout={!reduceMotion}
                        key={idx}
                        initial={reduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: idx === 0 ? 1 : 0.9,
                          opacity: 1,
                          filter:
                            idx === 0
                              ? "brightness(1.1) blur(0px)"
                              : "brightness(0.6) blur(1px)",
                          zIndex: idx === 0 ? 10 : 0,
                        }}
                        whileHover={
                          reduceMotion
                            ? {}
                            : {
                                scale: idx === 0 ? 1.02 : 0.98,
                                filter: "brightness(1.1) blur(0px)",
                                zIndex: 20,
                                transition: { duration: 0.2 },
                              }
                        }
                        exit={reduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                              }
                        }
                        onClick={() => {
                          pauseAutoplay();
                          const originalIndex = events.findIndex(
                            (e) => e.id === event.id,
                          );
                          setIndex(originalIndex);
                        }}
                        className={`relative rounded-xl overflow-hidden border transition-all duration-300
                        cursor-grab active:cursor-grabbing
                        hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]
                        ${
                          idx === 0
                            ? "w-[280px] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                            : "w-[200px] border-white/10"
                        }
                      `}
                      >
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                          quality={50}
                          sizes="(max-width: 768px) 50vw, 280px"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                        <div className="absolute bottom-0 left-0 p-4 w-full">
                          <h3
                            className={`font-bold text-white truncate ${
                              idx === 0 ? "text-xl" : "text-base"
                            }`}
                          >
                            {event.title}
                          </h3>
                        </div>
                      </m.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === STATIC GRID UNDER EVERYTHING === */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 mt-24 pb-32">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-10 tracking-tight">
            Explore All Events
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {events.map((ev, idx) => (
              <div
                key={ev.id}
                data-index={idx}
                ref={(el) => {
                  if (el && observerRef.current && !visibleGridItems.has(idx)) {
                    observerRef.current.observe(el);
                  }
                }}
                className="group bg-black/40 rounded-2xl border border-white/10 overflow-hidden hover:border-blue-500/40 transition-all flex flex-col"
              >
                <div className="relative w-full aspect-video overflow-hidden bg-gray-900">
                  {visibleGridItems.has(idx) ? (
                    <Image
                      src={ev.image}
                      alt={ev.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      quality={isMobile ? 40 : 60}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 animate-pulse" />
                  )}
                </div>
                <div className="p-5 flex flex-col grow">
                  <span className="text-[#00E5FF] font-mono text-xs tracking-widest uppercase">
                    {ev.type}
                  </span>

                  <h3 className="text-white font-bold text-xl mt-3">
                    {ev.title}
                  </h3>

                  {/* Description restored */}
                  <p className="text-gray-300 text-sm leading-relaxed mt-3 grow">
                    {ev.description}
                  </p>

                  {/* Register button */}
                  <button
                    onClick={() => handleRegisterClick(ev.id)}
                    className="w-full mt-4 px-4 py-2 text-sm bg-white text-black hover:bg-black hover:text-white border border-white font-bold tracking-wider transition-all uppercase"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </LazyMotion>
  );
}
