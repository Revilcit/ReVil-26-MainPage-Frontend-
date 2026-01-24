"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: string; // ISO string or any valid date string
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!hasMounted) return null;

  return (
    <div className="flex gap-4 sm:gap-8 font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
      <TimeUnit value={timeLeft.days} label="DAYS" />
      <div className="text-2xl sm:text-4xl font-bold pt-1">:</div>
      <TimeUnit value={timeLeft.hours} label="HOURS" />
      <div className="text-2xl sm:text-4xl font-bold pt-1">:</div>
      <TimeUnit value={timeLeft.minutes} label="MINS" />
      <div className="text-2xl sm:text-4xl font-bold pt-1">:</div>
      <TimeUnit value={timeLeft.seconds} label="SECS" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden h-12 sm:h-20 w-12 sm:w-20 bg-black/50 border border-cyan-500/30 rounded-md flex items-center justify-center cursor-target">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute text-2xl sm:text-4xl font-bold font-orbitron"
          >
            {value.toString().padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] sm:text-xs mt-2 tracking-widest text-cyan-300/70">
        {label}
      </span>
    </div>
  );
}
