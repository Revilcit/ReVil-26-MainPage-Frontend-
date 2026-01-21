"use client";
import Link from "next/link";
import { motion } from "framer-motion";

import Image from "next/image";
import MagicBento, { ParticleCard } from "@/components/ui/MagicBento";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-24 min-h-screen flex flex-col justify-start relative">
      {/* Background Element - Subtle Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>

      <div className="relative mb-24 flex flex-col items-center gap-0 max-w-[90%] mx-auto mt-10 z-50">
        <div className="w-full relative flex justify-center">
          <div className="relative w-full max-w-[400px]">
            <img
              src="/Revil_logo_white_outline.png"
              alt="REVIL"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed border-l-4 border-primary pl-6"
        >
          REVIL is the flagship National Level Technical Symposium organized by
          the{" "}
          <span className="text-white font-bold">
            Department of Cyber Security
          </span>{" "}
          at{" "}
          <span className="text-white font-bold">
            Chennai Institute of Technology
          </span>
          .
        </motion.p>

        <div className="my-16">
          <MagicBento
            glowColor="0, 240, 255"
            enableStars={true}
            enableTilt={true}
            enableSpotlight={true}
            textAutoHide={false}
            gridClassName="grid-cols-1 md:grid-cols-2"
          >
            {/* Vision Card */}
            <ParticleCard
              className="card flex flex-col justify-between relative min-h-[300px] w-full max-w-full p-8 rounded-[20px] border border-solid border-white/20 font-light overflow-hidden bg-card/10 backdrop-blur-sm card--border-glow"
              glowColor="0, 240, 255"
              enableMagnetism={true}
              enableTilt={true}
            >
              <div className="card__content flex flex-col relative text-white mt-4">
                <h3 className="card__title font-bold text-2xl m-0 mb-3">
                  OUR VISION
                </h3>
                <div className="card__description text-base text-gray-300 leading-relaxed opacity-90">
                  To be a center of excellence in Cyber Security education and
                  research, producing globally competent professionals capable
                  of addressing the evolving challenges in the digital domain.
                </div>
              </div>
            </ParticleCard>

            {/* Mission Card */}
            <ParticleCard
              className="card flex flex-col justify-between relative min-h-[300px] w-full max-w-full p-8 rounded-[20px] border border-solid border-white/20 font-light overflow-hidden bg-card/10 backdrop-blur-sm card--border-glow"
              glowColor="0, 240, 255"
              enableMagnetism={true}
              enableTilt={true}
            >
              <div className="card__content flex flex-col relative text-white mt-4">
                <h3 className="card__title font-bold text-2xl m-0 mb-3">
                  OUR MISSION
                </h3>
                <div className="card__description text-base text-gray-300 leading-relaxed opacity-90">
                  <ul className="list-none space-y-2 mt-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">▹</span>
                      To provide a strong theoretical foundation and practical
                      skills in Cyber Security.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">▹</span>
                      To foster a culture of research and innovation in securing
                      digital infrastructure.
                    </li>
                  </ul>
                </div>
              </div>
            </ParticleCard>
          </MagicBento>
        </div>

        {/* Join Section - Centered and Down */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mt-12 mb-12 w-full"
        >
          <Link href="/register" className="w-full max-w-2xl">
            <ParticleCard
              className="px-10 py-8 bg-black hover:bg-white/10 transition-colors border border-white/20 rounded-[20px] relative overflow-hidden group text-center uppercase tracking-widest card--border-glow flex flex-col items-center justify-center min-h-[150px]"
              glowColor="0, 240, 255"
              enableMagnetism={true}
              enableTilt={true}
              clickEffect={true}
              particleCount={12}
            >
              <div className="relative z-10 flex flex-col items-center gap-4">
                <span className="font-bold text-2xl md:text-3xl text-white group-hover:text-black transition-colors duration-300">
                  Join The Revolution
                </span>
                <span className="text-sm md:text-base text-gray-400 group-hover:text-black/70 transition-colors">
                  Click to Register
                </span>
              </div>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left z-0"></div>
            </ParticleCard>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
