"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Dither from "@/components/ui/Dither";
import DecryptedText from "@/components/ui/DecryptedText";
import TrueFocus from "@/components/ui/TrueFocus";
import CountdownTimer from "@/components/ui/CountdownTimer";

const hasScrambled = { value: false }; // Use object ref pattern or simple let if outside

export function Hero() {
  const [showText, setShowText] = React.useState(false);
  const [showPresents, setShowPresents] = React.useState(false);
  const [isButtonHovered, setIsButtonHovered] = React.useState(false);

  React.useEffect(() => {
    // Check if fresh load for delay
    const isFresh =
      !hasScrambled.value &&
      typeof window !== "undefined" &&
      performance.now() < 8000;

    if (!hasScrambled.value) hasScrambled.value = true;

    const delay = isFresh ? 9000 : 0;

    const timer = setTimeout(() => {
      setShowText(true);
      // Start "Presents" after the first line finishes (approx 3s)
      setTimeout(() => {
        setShowPresents(true);
      }, 3000);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black">
      {/* Dynamic Background: Dither */}
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={[0.5, 0.5, 0.5]} // Lighter grey as requested
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.15}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* Glitch Overlay (Optional - kept for vibe, reduced opacity) */}
      <div className="absolute inset-0 bg-black/30 z-0"></div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto w-full mt-20 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 flex flex-col items-center gap-3 justify-center mt-8 sm:mt-12 md:mt-16 lg:mt-20">
            <div className="mb-6 flex flex-col items-center gap-3">
              {/* First Line */}
              {showText ? (
                <DecryptedText
                  text="Department of Cyber Security"
                  speed={100}
                  maxIterations={20}
                  sequential={true} // Enable sequential reveal
                  characters="!@#$%^&*()_+"
                  className="text-white font-bold text-xs md:text-xl font-mono tracking-[0.3em] uppercase"
                  encryptedClassName="text-[#00f0ff] font-bold text-xs md:text-xl font-mono tracking-[0.3em] uppercase"
                  animateOn="view"
                  revealDirection="start" // Start from left
                />
              ) : (
                <span className="text-white font-bold text-xs md:text-xl font-mono tracking-[0.3em] uppercase opacity-0">
                  Department of Cyber Security
                </span>
              )}

              {/* Second Line */}
              {showPresents ? (
                <DecryptedText
                  text="Presents"
                  speed={100}
                  maxIterations={20}
                  sequential={true} // Enable sequential reveal
                  characters="!@#$%^&*()_+"
                  className="text-white font-bold text-xs md:text-xl font-mono tracking-[0.5em] uppercase"
                  encryptedClassName="text-[#00f0ff] font-bold text-xs md:text-xl font-mono tracking-[0.5em] uppercase"
                  animateOn="view"
                  revealDirection="start" // Start from left
                />
              ) : (
                <span className="text-white font-bold text-xs md:text-xl font-mono tracking-[0.5em] uppercase opacity-0">
                  Presents
                </span>
              )}
            </div>
          </div>
          <div className="mb-6">
            <TrueFocus
              sentence="REVIL 2026"
              manualMode={true}
              blurAmount={1.5}
              borderColor="#00f0ff"
              animationDuration={0.5}
              pauseBetweenAnimations={0.5}
              className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white font-orbitron cursor-target"
              gap="gap-8 md:gap-12"
              layoutIdPrefix="revil-main"
            />
          </div>

          <div className="mb-10">
            <CountdownTimer targetDate="2026-02-03T09:00:00" />
          </div>

          <p className="text-gray-300 font-bold text-sm sm:text-lg md:text-2xl mb-10 max-w-md sm:max-w-2xl mx-auto leading-relaxed px-4">
            Unveiling the dark side of the digital realm. Join the elite. Break
            the code. Secure the future.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto px-4">
            <Link
              href="/login"
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              className={`w-full sm:w-auto px-8 py-4 font-bold text-lg transition-all duration-300 rounded-none border text-center border-white ${isButtonHovered ? "bg-transparent text-white" : "bg-white text-black"}`}
            >
              REGISTER NOW
            </Link>
            <Link
              href="/events"
              onMouseEnter={() => setIsButtonHovered(false)}
              onMouseLeave={() => setIsButtonHovered(false)}
              className={`w-full sm:w-auto px-8 py-4 font-bold text-lg transition-all duration-300 rounded-none border text-center border-white ${isButtonHovered ? "bg-white text-black" : "bg-transparent text-white"}`}
            >
              EXPLORE EVENTS
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-[1px] h-20 bg-gradient-to-b from-primary to-transparent"></div>
      </motion.div>
    </div>
  );
}
