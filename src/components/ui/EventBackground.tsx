"use client";

import dynamic from "next/dynamic";

const Dither = dynamic(() => import("./Dither"), {
  ssr: false,
});

export default function EventBackground() {
  return (
    <div className="absolute inset-0 z-0">
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
  );
}