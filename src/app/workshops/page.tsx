"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchWorkshops } from "@/lib/api";
import { Event as ApiEvent } from "@/types/api";
import toast, { Toaster } from "react-hot-toast";
import { LazyMotion, domAnimation, m } from "framer-motion";
import TiltedCard from "@/components/ui/TiltedCard";

interface Workshop extends ApiEvent {
  learningOutcomes?: string[];
  prerequisites?: string[];
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(
    null
  );

  useEffect(() => {
    const loadWorkshops = async () => {
      try {
        const workshopEvents = await fetchWorkshops();
        setWorkshops(workshopEvents);
      } catch (error) {
        console.error("Failed to fetch workshops:", error);
        toast.error("Failed to load workshops");
      } finally {
        setLoading(false);
      }
    };

    loadWorkshops();
  }, []);

  const handleRegisterClick = () => {
    toast("Coming Soon! 🚀", {
      icon: "⏳",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#00E5FF] text-2xl font-mono animate-pulse">
          LOADING WORKSHOPS...
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-black py-24 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          {/* Header Section */}
          <m.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 mb-4 glitch-text uppercase tracking-tighter"
          >
            WORKSHOPS
          </m.h1>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-xl mb-16 max-w-3xl border-l-4 border-[#00E5FF]/30 pl-6"
          >
            Hands-on training sessions led by industry experts. Level up your
            skills with practical, immersive learning experiences.
          </m.p>

          {/* Workshops Grid - 2x2 layout for 4 workshops */}
          {workshops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {workshops.map((workshop, index) => (
                <m.div
                  key={workshop._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <TiltedCard
                    containerHeight="100%"
                    containerWidth="100%"
                    scaleOnHover={1.02}
                    rotateAmplitude={8}
                  >
                    <div className="relative w-full h-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden hover:border-[#00E5FF]/40 transition-all flex flex-col">
                      {/* Image Section */}
                      <div className="relative w-full aspect-video overflow-hidden">
                        <Image
                          src={workshop.image || "/events/default.jpg"}
                          alt={workshop.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                        {/* Type Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-3 py-1 bg-[#00E5FF] text-black text-xs font-bold uppercase tracking-wider">
                            {workshop.type}
                          </span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h2 className="text-white font-bold text-xl mb-3 leading-tight">
                          {workshop.title}
                        </h2>

                        <p className="text-gray-300 text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                          {workshop.description}
                        </p>

                        {/* Action Button */}
                        <button
                          onClick={handleRegisterClick}
                          className="w-full px-4 py-2 text-sm bg-white text-black hover:bg-black hover:text-white border border-white font-bold tracking-wider transition-all uppercase"
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  </TiltedCard>
                </m.div>
              ))}
            </div>
          ) : (
            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                No Workshops Yet!
              </h2>
              <p className="text-gray-400 text-xl">
                Check back soon for exciting hands-on training sessions.
              </p>
            </m.div>
          )}
        </div>
      </div>
      <Toaster position="top-center" />
    </LazyMotion>
  );
}
