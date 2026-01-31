"use client";

import { useEffect, useState, Fragment, useCallback } from "react";
import TextType from "@/components/ui/TextType";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Dither from "@/components/ui/Dither";
import TrueFocus from "@/components/ui/TrueFocus";

export function SplashScreen() {
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showRevil, setShowRevil] = useState(false);
  const [hideTextType, setHideTextType] = useState(false);

  const messages = [
    "Join the elite, Break the code, Secure the future ...",
    "WELCOME TO",
  ];

  // Skip function to immediately hide splash screen
  const skipSplash = useCallback(() => {
    setIsVisible(false);
    sessionStorage.setItem("splashShown", "true");
  }, []);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const splashShown = sessionStorage.getItem("splashShown");

    if (!splashShown) {
      // First visit in this session - show splash
      setShouldShow(true);
      setIsVisible(true);
      sessionStorage.setItem("splashShown", "true");
    }
  }, []);

  // Listen for any key press or click to skip
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip on any key press
      skipSplash();
    };

    const handleClick = () => {
      // Skip on click/tap
      skipSplash();
    };

    const handleTouch = () => {
      // Skip on touch (mobile)
      skipSplash();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);
    window.addEventListener("touchstart", handleTouch);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("touchstart", handleTouch);
    };
  }, [isVisible, skipSplash]);

  useEffect(() => {
    // Prevent scrolling while splash screen is visible
    if (isVisible) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isVisible]);

  // This callback is called when a sentence completes typing
  const handleSentenceComplete = (sentence: string, index: number) => {
    // If we finished "WELCOME TO"
    if (index === messages.length - 1) {
      setTimeout(() => {
        setHideTextType(true);
        setShowRevil(true);

        // Fade out after showing REVIL (no redirect)
        setTimeout(() => {
          setIsVisible(false);
        }, 2000); // Display REVIL for 2s
      }, 800); // Pause after "WELCOME TO" before clearing
    }
  };

  // Don't render anything if splash shouldn't show
  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <Fragment>
          {/* Background Layer - Fades Out */}
          <motion.div
            key="splash-bg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[99998] bg-black"
          >
            {/* Dynamic Background: Dither (Matches Home) */}
            <div className="absolute inset-0 z-0 opacity-50">
              <Dither
                waveColor={[0.5, 0.5, 0.5]}
                disableAnimation={false}
                enableMouseInteraction={false}
                mouseRadius={0.15}
                colorNum={4}
                waveAmplitude={0.3}
                waveFrequency={3}
                waveSpeed={0.05}
              />
            </div>
            {/* Glitch Overlay */}
            <div className="absolute inset-0 bg-black/40 z-0"></div>
          </motion.div>

          {/* Content Layer - Persistent for Layout Animation */}
          <motion.div
            key="splash-content"
            className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
          >
            <div className="relative z-10 max-w-4xl px-8 text-center flex flex-col items-center justify-center h-full pointer-events-auto">
              {!hideTextType && (
                <TextType
                  text={messages}
                  typingSpeed={50}
                  deletingSpeed={30}
                  pauseDuration={1000}
                  loop={false}
                  showCursor={true}
                  cursorCharacter="|"
                  className="text-2xl md:text-5xl font-orbitron font-bold text-primary tracking-wider leading-relaxed"
                  onSentenceComplete={handleSentenceComplete}
                />
              )}

              {showRevil && (
                <div className="mb-6">
                  <TrueFocus
                    sentence="REVIL"
                    manualMode={true}
                    blurAmount={1.5}
                    borderColor="#00f0ff"
                    animationDuration={0.8}
                    pauseBetweenAnimations={0.5}
                    layoutIdPrefix="revil-main"
                    className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white font-orbitron"
                  />
                </div>
              )}
            </div>

            {/* Skip hint at bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute bottom-8 left-0 right-0 text-center pointer-events-auto"
            >
              <p className="text-gray-500 text-sm font-mono animate-pulse">
                Press any key or tap to skip
              </p>
            </motion.div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
