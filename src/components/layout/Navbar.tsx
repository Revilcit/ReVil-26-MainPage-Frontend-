"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import PillNav from "@/components/ui/PillNav";

const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Events", href: "/events" },
    { label: "Workshops", href: "/workshops" },
    { label: "Contact", href: "/contact" },
    { label: "Register", href: "/register" },
];

export function Navbar() {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    return (
        <motion.div
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: -100, opacity: 0 },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-4 left-0 w-full z-50 md:top-8 md:left-1/2 md:-translate-x-1/2 md:w-max pointer-events-none px-4 md:px-0"
        >
            <div className="pointer-events-auto w-full md:w-auto">
                <PillNav
                    logo="/revil_icon.png"
                    logoAlt="REVIL"
                    items={navItems}
                    className="!relative !top-0 !left-0 !translate-x-0 !w-full md:!w-max rounded-full shadow-lg"
                    ease="power2.easeOut"
                    baseColor="transparent"
                    pillColor="#333"
                    pillTextColor="#ffffff"
                    hoveredPillTextColor="#00f0ff"
                />
            </div>
        </motion.div>
    );
}
