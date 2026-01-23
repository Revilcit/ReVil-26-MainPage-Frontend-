"use client";
import { Hero } from "@/components/home/Hero";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // ASCII Art Console Message
    console.log(
      "%c" +
      `
██████╗ ███████╗██╗   ██╗██╗██╗     
██╔══██╗██╔════╝██║   ██║██║██║     
██████╔╝█████╗  ██║   ██║██║██║     
██╔══██╗██╔══╝  ╚██╗ ██╔╝██║██║     
██║  ██║███████╗ ╚████╔╝ ██║███████╗
╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝
      `,
      "color: #00ff41; font-weight: bold; font-family: monospace;"
    );
    
    console.log(
      "%cSECURITY ALERT!",
      "color: #ff0000; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #ff0000;"
    );
    
    console.log(
      "%cWhat are you doing here, hackersss?",
      "color: #ffff00; font-size: 16px; font-weight: bold;"
    );
    
    console.log(
      "%cDon't try to steal our data! or our name!\n" +
      "We're watching you...\n" +
      "Just kidding! Feel free to explore.\n\n" +
      "But seriously, if you find any bugs, let us know!\n" +
      "We might even give you a cookie.",
      "color: #00ffff; font-size: 14px; line-height: 1.8;"
    );
    
    console.log(
      "%cHappy Hacking! - Revil Payaluga",
      "color: #ff00ff; font-size: 12px; font-style: italic;"
    );
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      {/* Sections to be added: About Snippet, Highlights */}
    </div>
  );
}
