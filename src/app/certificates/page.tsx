"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchUserWithRegistrations } from "@/lib/api";
import {
  UserWithRegistrations,
  EventRegistration,
  TeamMember,
} from "@/types/api";
import Link from "next/link";

interface CertificateData {
  name: string;
  college: string;
  eventName: string;
  registrationId: string;
  isTeamMember?: boolean;
}

export default function CertificatesPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateData | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [expandedRegistration, setExpandedRegistration] = useState<
    string | null
  >(null);

  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await fetchUserWithRegistrations(token);
        setUserData(data);
      } catch (err) {
        const error = err as Error;
        console.error("Fetch error:", error.message);
        if (error.message === "UNAUTHORIZED") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter registrations that have session check-in completed
  const getEligibleRegistrations = (): EventRegistration[] => {
    if (!userData?.registrations) return [];
    return userData.registrations.filter(
      (reg) => reg.sessionCheckIn?.status === true,
    );
  };

  const generateCertificate = async (data: CertificateData) => {
    setGenerating(true);
    setSelectedCertificate(data);
    setShowCertificate(true);

    // Wait for DOM to render
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (certificateRef.current) {
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: 841,
          height: 594,
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [841, 594],
        });

        pdf.addImage(imgData, "JPEG", 0, 0, 841, 594);
        const fileName = `${data.name.replace(/\s+/g, "_")}-${data.eventName.replace(/\s+/g, "_")}-certificate.pdf`;
        pdf.save(fileName);
      } catch (error) {
        console.error("PDF generation error:", error);
      }
    }

    setShowCertificate(false);
    setSelectedCertificate(null);
    setGenerating(false);
  };

  const handleDownloadMyCertificate = (reg: EventRegistration) => {
    const data: CertificateData = {
      name: userData?.user.name || "",
      college: reg.college || userData?.user.name || "",
      eventName: reg.event.title,
      registrationId: reg._id,
    };
    generateCertificate(data);
  };

  const handleDownloadTeamMemberCertificate = (
    reg: EventRegistration,
    member: TeamMember,
  ) => {
    const data: CertificateData = {
      name: member.name,
      college: member.college,
      eventName: reg.event.title,
      registrationId: reg._id,
      isTeamMember: true,
    };
    generateCertificate(data);
  };

  const eligibleRegistrations = getEligibleRegistrations();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-primary font-mono animate-pulse">
        LOADING CERTIFICATES...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <p className="text-gray-400 mb-6">
          You need to be logged in to access your certificates.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-black font-bold rounded hover:bg-white transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 bg-black pb-12">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            href="/dashboard"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex justify-center mb-6">
            <img src="/revil_icon.png" alt="ReVil 2026" className="h-20 w-20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            REVIL 2026
          </h1>
          <h2 className="text-2xl md:text-3xl text-primary font-orbitron mb-4">
            CERTIFICATES
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Download participation certificates for events you have attended.
            Certificates are only available for events where your session
            check-in has been completed.
          </p>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {userData.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {userData.user.name}
              </h3>
              <p className="text-gray-400">{userData.user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Eligible Registrations */}
        {eligibleRegistrations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black border border-yellow-500/30 p-8 rounded-lg text-center"
          >
            <div className="text-yellow-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Certificates Available
            </h3>
            <p className="text-gray-400 mb-4">
              You don&apos;t have any certificates available yet. Certificates
              become available after your session check-in is completed at each
              event.
            </p>
            <div className="text-sm text-gray-500">
              <p>To get your certificate:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Attend the event/workshop you registered for</li>
                <li>Get your QR code scanned by the event team</li>
                <li>
                  Once session check-in is complete, return here to download
                  your certificate
                </li>
              </ol>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-primary mb-4">
              Available Certificates ({eligibleRegistrations.length})
            </h3>

            {eligibleRegistrations.map((reg, index) => (
              <motion.div
                key={reg._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-black border border-primary/20 rounded-lg overflow-hidden"
              >
                {/* Event Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() =>
                    setExpandedRegistration(
                      expandedRegistration === reg._id ? null : reg._id,
                    )
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-white">
                          {reg.event.title}
                        </h4>
                        {reg.isTeamRegistration && (
                          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                            TEAM
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                          ✓ ATTENDED
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {reg.event.venue && <span>📍 {reg.event.venue}</span>}
                        {reg.event.eventType && (
                          <span className="capitalize">
                            🎯 {reg.event.eventType}
                          </span>
                        )}
                        {reg.sessionCheckIn?.timestamp && (
                          <span>
                            ✅ Attended on{" "}
                            {new Date(
                              reg.sessionCheckIn.timestamp,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Download My Certificate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadMyCertificate(reg);
                        }}
                        disabled={generating}
                        className="px-4 py-2 bg-primary text-black font-bold text-sm rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generating ? "Generating..." : "📜 My Certificate"}
                      </button>
                      {/* Expand arrow for team registrations */}
                      {reg.isTeamRegistration &&
                        reg.teamMembers &&
                        reg.teamMembers.length > 0 && (
                          <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${
                              expandedRegistration === reg._id
                                ? "rotate-180"
                                : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                    </div>
                  </div>
                </div>

                {/* Team Members Section */}
                <AnimatePresence>
                  {expandedRegistration === reg._id &&
                    reg.isTeamRegistration &&
                    reg.teamMembers &&
                    reg.teamMembers.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-primary/10 overflow-hidden"
                      >
                        <div className="p-6 bg-gray-900/30">
                          <h5 className="text-sm font-bold text-primary mb-4">
                            Team: {reg.teamName || "Unnamed Team"} (
                            {reg.teamMembers.length} members)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reg.teamMembers.map((member, memberIndex) => (
                              <div
                                key={memberIndex}
                                className="bg-black border border-gray-700 p-4 rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold">
                                      {member.name}
                                    </span>
                                    {member.isLeader && (
                                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                        LEADER
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    {member.college}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {member.email}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleDownloadTeamMemberCertificate(
                                      reg,
                                      member,
                                    )
                                  }
                                  disabled={generating}
                                  className="px-3 py-2 bg-primary/20 text-primary border border-primary/50 text-xs font-bold rounded hover:bg-primary/30 transition-colors disabled:opacity-50"
                                >
                                  📜 Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 border border-gray-700 rounded-lg"
        >
          <h4 className="text-lg font-bold text-white mb-3">
            ℹ️ About Certificates
          </h4>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>
              • Certificates are generated as PDF files and will download
              automatically
            </li>
            <li>
              • For team events, team leaders can download certificates for all
              team members
            </li>
            <li>
              • Make sure your session check-in was completed at the event to
              access your certificate
            </li>
            <li>
              • If you attended an event but don&apos;t see your certificate,
              please contact the event organizers
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Hidden Certificate Template for PDF Generation */}
      {showCertificate && selectedCertificate && (
        <div
          ref={certificateRef}
          style={{
            position: "fixed",
            top: "100vh",
            left: "0",
            width: "841px",
            height: "594px",
            backgroundColor: "#ffffff",
            zIndex: 9999,
          }}
        >
          <img
            src="/revil_2026_certificate.png"
            alt="Certificate"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "841px",
              height: "594px",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              zIndex: 10,
            }}
          >
            {/* Name field - aligned with the blank after "Mr./Ms." */}
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#000000",
                marginTop: "280px",
                marginLeft: "350px",
                width: "280px",
                textAlign: "center",
                fontFamily: "serif",
              }}
            >
              {selectedCertificate.name}
            </div>
            {/* College field - aligned with the blank before "has participated" */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#000000",
                marginTop: "7px",
                marginLeft: "168px",
                width: "280px",
                textAlign: "center",
                fontFamily: "serif",
              }}
            >
              {selectedCertificate.college}
            </div>
            {/* Event field - aligned with the blank before "(Event / Workshop)" */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#000000",
                marginTop: "7   px",
                marginLeft: "95px",
                width: "310px",
                textAlign: "center",
                fontFamily: "serif",
              }}
            >
              {selectedCertificate.eventName}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-white font-bold text-lg">
                Generating Certificate...
              </p>
              <p className="text-gray-400 text-sm">
                Please wait, this may take a few seconds
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
