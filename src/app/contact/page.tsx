"use client";
import { useState, useEffect } from "react";
import Lanyard from "@/components/ui/Lanyard";
import Chatbot from "@/components/ui/Chatbot";
import { motion } from "framer-motion";
import TiltedCard from "@/components/ui/TiltedCard";
import { ParticleCard } from "@/components/ui/MagicBento";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isMounted, setIsMounted] = useState(false);
  // Simplified animation state just for content fade
  const [animationState, setAnimationState] = useState<"initial" | "finished">(
    "initial",
  );

  useEffect(() => {
    setIsMounted(true);
    // Fade in content after drop (2.5s)
    const timer = setTimeout(() => {
      setAnimationState("finished");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent! (Simulation)");
  };

  return (
    <div className="container mx-auto px-4 py-16 relative min-h-screen md:h-screen overflow-y-auto md:overflow-hidden">
      {/* Lanyard Background - Constrained to Right Half */}
      <motion.div
        className="absolute top-0 right-0 w-full md:w-1/2 h-full pointer-events-none md:pointer-events-auto z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Fixed center of the right container, zoomed in */}
        {isMounted && <Lanyard position={[-10, 0, 20]} gravity={[0, -40, 0]} />}
      </motion.div>

      <motion.div
        className="relative z-10 h-full flex items-center pointer-events-none mt-10 md:mt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: animationState === "finished" ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-6xl mx-auto pointer-events-auto mt-[4vh] md:mt-0">
          {/* Contact Form */}
          {/* Contact Form */}
          <div className="h-full">
            <TiltedCard
              captionText="Send Transmission"
              rotateAmplitude={10}
              scaleOnHover={1.02}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={false}
            >
              <ParticleCard
                className="bg-card/50 p-4 md:p-8 border border-primary/20 backdrop-blur-sm h-full rounded-lg"
                enableTilt={false} // TiltedCard handles the main tilt
                glowColor="0, 240, 255" // Cyan glow to match theme
                particleCount={15}
                clickEffect={true}
              >
                <h1 className="text-2xl md:text-4xl font-bold text-primary mb-6 md:mb-8 glitch-text">
                  CONTACT US
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-mono text-primary mb-2">
                      NAME
                    </label>
                    <input
                      type="text"
                      className="w-full bg-black/50 border border-gray-800 focus:border-primary text-white p-3 outline-none transition-colors"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-primary mb-2">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      className="w-full bg-black/50 border border-gray-800 focus:border-primary text-white p-3 outline-none transition-colors"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-primary mb-2">
                      MESSAGE
                    </label>
                    <textarea
                      rows={4}
                      className="w-full bg-black/50 border border-gray-800 focus:border-primary text-white p-3 outline-none transition-colors"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-black font-bold hover:bg-white transition-colors"
                  >
                    TRANSMIT MESSAGE
                  </button>
                </form>
              </ParticleCard>
            </TiltedCard>
          </div>

          {/* Map / Info - Only visible when content fades in */}
          <div className="space-y-8 flex flex-col justify-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Location</h3>
              <p className="text-gray-400">
                Chennai Institute of Technology,
                <br />
                Sarathy Nagar, Kundrathur,
                <br />
                Chennai - 600069
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Direct Line</h3>
              <div className="space-y-2">
                <p className="text-gray-400">
                  President:{" "}
                  <span className="text-primary">+91 87789 10145</span>
                </p>
                <p className="text-gray-400">
                  Vice President:{" "}
                  <span className="text-primary">+91 87783 44532</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Chatbot - Floating Bottom Right */}
      <motion.div
        initial={{ opacity: 0, x: "-40vw", y: "-50vh", scale: 0.2 }} // Start from roughly Center-Top (ID Card position)
        animate={{
          opacity: animationState === "finished" ? 1 : 0,
          x: animationState === "finished" ? 0 : "-40vw",
          y: animationState === "finished" ? 0 : "-50vh",
          scale: animationState === "finished" ? 1 : 0.2,
        }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 15,
          delay: 1.5, // Drop sooner
        }}
        className="md:hidden fixed bottom-4 right-4 z-50"
      >
        <Chatbot />
      </motion.div>
    </div>
  );
}
