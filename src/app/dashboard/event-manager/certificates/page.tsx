"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

interface ManagedEvent {
  _id: string;
  title: string;
}

interface TeamMember {
  name: string;
  email: string;
  phoneNumber: string;
  college: string;
  department?: string;
  year?: string;
  isLeader?: boolean;
}

interface Registration {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    college?: string;
  };
  event: {
    _id: string;
    title: string;
  };
  college?: string;
  isTeamRegistration: boolean;
  teamName?: string;
  teamMembers?: TeamMember[];
  sessionCheckIn: {
    status: boolean;
    timestamp?: string;
  };
}

interface CertificateData {
  name: string;
  college: string;
  eventName: string;
  email?: string;
}

export default function EventManagerCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [managedEvents, setManagedEvents] = useState<ManagedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  
  // Manual certificate generation
  const [manualName, setManualName] = useState("");
  const [manualCollege, setManualCollege] = useState("");
  
  // Certificate generation state
  const [generating, setGenerating] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  // Email sending state
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailProgress, setBulkEmailProgress] = useState({ sent: 0, total: 0 });
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  useEffect(() => {
    fetchManagedEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchRegistrations();
    } else {
      setRegistrations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const fetchManagedEvents = async () => {
    try {
      const response = await api.get("/event-manager/events");
      setManagedEvents(response.data.data || []);
      // Auto-select first event if only one
      if (response.data.data?.length === 1) {
        setSelectedEvent(response.data.data[0]._id);
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load managed events");
      if (error.response?.status === 403) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const response = await api.get(`/event-manager/events/${selectedEvent}/registrations`);
      // Filter only session checked-in registrations
      const checkedIn = response.data.data.filter(
        (reg: Registration) => reg.sessionCheckIn?.status === true
      );
      setRegistrations(checkedIn);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const getSelectedEventTitle = () => {
    return managedEvents.find((e) => e._id === selectedEvent)?.title || "";
  };

  const generateCertificate = async (data: CertificateData): Promise<string | null> => {
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

        setShowCertificate(false);
        setSelectedCertificate(null);
        setGenerating(false);
        
        return imgData;
      } catch (error) {
        console.error("PDF generation error:", error);
        setShowCertificate(false);
        setSelectedCertificate(null);
        setGenerating(false);
        return null;
      }
    }
    
    setGenerating(false);
    return null;
  };

  const generateCertificateImage = async (data: CertificateData): Promise<string | null> => {
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

        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        setShowCertificate(false);
        setSelectedCertificate(null);
        return imgData;
      } catch (error) {
        console.error("Certificate image generation error:", error);
        setShowCertificate(false);
        setSelectedCertificate(null);
        return null;
      }
    }
    
    return null;
  };

  const handleManualGenerate = () => {
    if (!manualName.trim() || !manualCollege.trim()) {
      toast.error("Please enter both name and college");
      return;
    }
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }

    generateCertificate({
      name: manualName.trim(),
      college: manualCollege.trim(),
      eventName: getSelectedEventTitle(),
    });
  };

  const handleDownloadForRegistration = (reg: Registration) => {
    generateCertificate({
      name: reg.user.name,
      college: reg.college || reg.user.college || "N/A",
      eventName: reg.event.title,
      email: reg.user.email,
    });
  };

  const handleDownloadForTeamMember = (reg: Registration, member: TeamMember) => {
    generateCertificate({
      name: member.name,
      college: member.college,
      eventName: reg.event.title,
      email: member.email,
    });
  };

  const handleSendCertificateEmail = async (reg: Registration) => {
    setSendingEmail(reg._id);
    
    try {
      // Prepare recipients with their individual certificate images
      const recipients: Array<{
        name: string;
        email: string;
        college: string;
        certificateImage: string;
      }> = [];

      // Generate certificate for leader
      const leaderCertImage = await generateCertificateImage({
        name: reg.user.name,
        college: reg.college || reg.user.college || "N/A",
        eventName: reg.event.title,
      });
      
      if (!leaderCertImage) {
        toast.error("Failed to generate certificate for leader");
        setSendingEmail(null);
        return;
      }

      recipients.push({
        name: reg.user.name,
        email: reg.user.email,
        college: reg.college || reg.user.college || "N/A",
        certificateImage: leaderCertImage,
      });

      // Generate certificates for team members if it's a team registration
      if (reg.isTeamRegistration && reg.teamMembers) {
        for (const member of reg.teamMembers) {
          const memberCertImage = await generateCertificateImage({
            name: member.name,
            college: member.college,
            eventName: reg.event.title,
          });
          
          if (memberCertImage) {
            recipients.push({
              name: member.name,
              email: member.email,
              college: member.college,
              certificateImage: memberCertImage,
            });
          }
        }
      }

      // Send certificates via API
      await api.post("/event-manager/send-certificates", {
        eventId: reg.event._id,
        eventTitle: reg.event.title,
        recipients,
      });

      toast.success(
        `Certificate${recipients.length > 1 ? "s" : ""} sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`
      );
    } catch (error: any) {
      console.error("Error sending certificate:", error);
      toast.error(error.response?.data?.message || "Failed to send certificate");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleBulkSendCertificates = async () => {
    if (registrations.length === 0) {
      toast.error("No attended registrations to send certificates to");
      return;
    }

    setIsSendingBulk(true);
    setBulkEmailProgress({ sent: 0, total: registrations.length });

    try {
      for (let i = 0; i < registrations.length; i++) {
        const reg = registrations[i];
        
        try {
          // Generate certificate images for each recipient
          const recipients: Array<{
            name: string;
            email: string;
            college: string;
            certificateImage: string;
          }> = [];

          // Generate for leader
          const leaderCertImage = await generateCertificateImage({
            name: reg.user.name,
            college: reg.college || reg.user.college || "N/A",
            eventName: reg.event.title,
          });
          
          if (leaderCertImage) {
            recipients.push({
              name: reg.user.name,
              email: reg.user.email,
              college: reg.college || reg.user.college || "N/A",
              certificateImage: leaderCertImage,
            });
          }

          // Generate for team members
          if (reg.isTeamRegistration && reg.teamMembers) {
            for (const member of reg.teamMembers) {
              const memberCertImage = await generateCertificateImage({
                name: member.name,
                college: member.college,
                eventName: reg.event.title,
              });
              
              if (memberCertImage) {
                recipients.push({
                  name: member.name,
                  email: member.email,
                  college: member.college,
                  certificateImage: memberCertImage,
                });
              }
            }
          }

          if (recipients.length > 0) {
            await api.post("/event-manager/send-certificates", {
              eventId: reg.event._id,
              eventTitle: reg.event.title,
              recipients,
            });
          }

          setBulkEmailProgress({ sent: i + 1, total: registrations.length });
        } catch (error) {
          console.error(`Failed to send certificate for ${reg.user.email}:`, error);
        }

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast.success(`Bulk certificates sent successfully!`);
    } catch (error: any) {
      console.error("Bulk send error:", error);
      toast.error("Some certificates may have failed to send");
    } finally {
      setIsSendingBulk(false);
      setShowBulkEmailModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING CERTIFICATES...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 bg-black pb-12">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard/event-manager"
            className="text-primary hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Event Manager Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            CERTIFICATE
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            GENERATOR
          </h2>
          <p className="text-gray-400">
            Generate and send participation certificates for your managed events.
          </p>
        </motion.div>

        {/* Event Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black border border-primary/20 p-6 rounded-lg mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">Select Event</h3>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-primary focus:outline-none"
          >
            <option value="">-- Select an Event --</option>
            {managedEvents.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        </motion.div>

        {selectedEvent && (
          <>
            {/* Manual Certificate Generation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black border border-orange-500/20 p-6 rounded-lg mb-8"
            >
              <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Manual Certificate Generation
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Enter participant details to generate a certificate. Event is automatically set to:{" "}
                <span className="text-primary font-bold">{getSelectedEventTitle()}</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    Participant Name *
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    College *
                  </label>
                  <input
                    type="text"
                    value={manualCollege}
                    onChange={(e) => setManualCollege(e.target.value)}
                    placeholder="Enter college name"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleManualGenerate}
                disabled={generating || !manualName.trim() || !manualCollege.trim()}
                className="px-6 py-3 bg-orange-500 text-black font-bold uppercase text-sm rounded hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Generating..." : "📜 Generate & Download Certificate"}
              </button>
            </motion.div>

            {/* Attended Registrations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black border border-green-500/20 p-6 rounded-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  Attended Participants ({registrations.length})
                </h3>
                {registrations.length > 0 && (
                  <button
                    onClick={() => setShowBulkEmailModal(true)}
                    disabled={isSendingBulk}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    📧 Send All Certificates
                  </button>
                )}
              </div>

              {loadingRegistrations ? (
                <div className="text-center py-12 text-gray-400">
                  Loading registrations...
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-4xl mb-4">📋</div>
                  <p className="text-gray-400">
                    No attended participants yet for this event.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Participants will appear here after their session check-in is completed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {registrations.map((reg) => (
                    <div
                      key={reg._id}
                      className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{reg.user.name}</span>
                            {reg.isTeamRegistration && (
                              <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                                TEAM: {reg.teamName || "Unnamed"}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{reg.user.email}</p>
                          <p className="text-gray-500 text-xs">
                            {reg.college || reg.user.college || "N/A"}
                          </p>
                          {reg.isTeamRegistration && reg.teamMembers && (
                            <p className="text-gray-500 text-xs mt-1">
                              +{reg.teamMembers.length} team member{reg.teamMembers.length !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadForRegistration(reg)}
                            disabled={generating}
                            className="px-3 py-2 bg-primary/20 text-primary border border-primary/50 text-xs font-bold rounded hover:bg-primary/30 transition-colors disabled:opacity-50"
                          >
                            📜 Download
                          </button>
                          <button
                            onClick={() => handleSendCertificateEmail(reg)}
                            disabled={sendingEmail === reg._id}
                            className="px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs font-bold rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                          >
                            {sendingEmail === reg._id ? "Sending..." : "📧 Email"}
                          </button>
                        </div>
                      </div>

                      {/* Team Members */}
                      {reg.isTeamRegistration && reg.teamMembers && reg.teamMembers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <p className="text-xs text-gray-500 mb-2">Team Members:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {reg.teamMembers.map((member, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-black/50 p-2 rounded"
                              >
                                <div>
                                  <span className="text-white text-sm">{member.name}</span>
                                  <span className="text-gray-500 text-xs ml-2">
                                    ({member.college})
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownloadForTeamMember(reg, member)}
                                  disabled={generating}
                                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                  📜
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
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
            {/* Name field */}
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
            {/* College field */}
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
            {/* Event field */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#000000",
                marginTop: "7px",
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
              <p className="text-white font-bold text-lg">Generating Certificate...</p>
              <p className="text-gray-400 text-sm">Please wait, this may take a few seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Email Confirmation Modal */}
      <AnimatePresence>
        {showBulkEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isSendingBulk && setShowBulkEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-blue-500/30 p-8 rounded-lg max-w-md w-full"
            >
              {!isSendingBulk ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Send Certificates to All Attendees?
                  </h3>
                  <p className="text-gray-400 mb-6">
                    This will send participation certificates to{" "}
                    <span className="text-primary font-bold">{registrations.length}</span>{" "}
                    registration{registrations.length !== 1 ? "s" : ""} (including team members).
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowBulkEmailModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkSendCertificates}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition-colors"
                    >
                      📧 Send All
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white font-bold text-lg mb-2">
                    Sending Certificates...
                  </p>
                  <p className="text-gray-400">
                    {bulkEmailProgress.sent} / {bulkEmailProgress.total} sent
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(bulkEmailProgress.sent / bulkEmailProgress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
