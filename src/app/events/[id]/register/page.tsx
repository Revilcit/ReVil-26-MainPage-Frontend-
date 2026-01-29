"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { fetchEvents, registerForEvent } from "@/lib/api";
import { Event, TeamMember, RegistrationData } from "@/types/api";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Individual registration fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  // Terms acceptance
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Limited seats modal
  const [showLimitedSeatsModal, setShowLimitedSeatsModal] = useState(false);

  // CTF full modal
  const [showCtfFullModal, setShowCtfFullModal] = useState(false);

  // Team registration fields
  const [isTeamRegistration, setIsTeamRegistration] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: "",
      email: "",
      phoneNumber: "",
      college: "",
      department: "",
      year: "",
      isLeader: true,
    },
  ]);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const events = await fetchEvents();
        const foundEvent = events.find((e) => e._id === eventId);
        if (foundEvent) {
          // console.log(foundEvent);
          setEvent(foundEvent);
          setIsTeamRegistration(foundEvent.isTeamEvent || false);

          // Check if CTF is full and show alternative suggestion
          if (
            (foundEvent.title.toLowerCase().includes("ctf") ||
              foundEvent.slug?.includes("ctf")) &&
            (foundEvent.currentRegistrations || 0) >= foundEvent.capacity
          ) {
            setShowCtfFullModal(true);
          }
          // Show limited seats modal for specific events
          else if (
            foundEvent.slug === "ctf-trial-of-the-creed" ||
            foundEvent.slug === "project-sherlocks"
          ) {
            setShowLimitedSeatsModal(true);
          }
        } else {
          setError("Event not found");
        }
      } catch (err) {
        setError("Failed to load event");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const addTeamMember = () => {
    if (!event?.teamSize) return;
    if (teamMembers.length >= event.teamSize.max) {
      setError(`Maximum ${event.teamSize.max} team members allowed`);
      return;
    }
    setTeamMembers([
      ...teamMembers,
      {
        name: "",
        email: "",
        phoneNumber: "",
        college: "",
        department: "",
        year: "",
        isLeader: false,
      },
    ]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers[index].isLeader) {
      setError("Cannot remove team leader");
      return;
    }
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (
    index: number,
    field: keyof TeamMember,
    value: string | boolean,
  ) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const setTeamLeader = (index: number) => {
    const updated = teamMembers.map((member, i) => ({
      ...member,
      isLeader: i === index,
    }));
    setTeamMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Validate terms acceptance
      if (!acceptedTerms) {
        throw new Error("You must accept the terms and conditions to register");
      }

      let registrationData: RegistrationData;

      if (isTeamRegistration) {
        // Validate team registration
        if (!teamName.trim()) {
          throw new Error("Team name is required");
        }
        if (teamMembers.length < (event?.teamSize?.min || 1)) {
          throw new Error(
            `Minimum ${event?.teamSize?.min} team members required`,
          );
        }
        if (teamMembers.length > (event?.teamSize?.max || 1)) {
          throw new Error(
            `Maximum ${event?.teamSize?.max} team members allowed`,
          );
        }
        for (let i = 0; i < teamMembers.length; i++) {
          const member = teamMembers[i];

          // Validate required fields
          if (!member.name || !member.name.trim()) {
            throw new Error(`Team member ${i + 1}: Name is required`);
          }
          if (!member.email || !member.email.trim()) {
            throw new Error(`Team member ${i + 1}: Email is required`);
          }
          if (!member.phoneNumber || !member.phoneNumber.trim()) {
            throw new Error(`Team member ${i + 1}: Phone number is required`);
          }
          if (!member.college || !member.college.trim()) {
            throw new Error(`Team member ${i + 1}: College is required`);
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(member.email)) {
            throw new Error(`Team member ${i + 1}: Invalid email format`);
          }

          // Block @citchennai.net domain
          if (member.email.toLowerCase().endsWith("@citchennai.net")) {
            throw new Error(
              `Team member ${i + 1}: Registrations from @citchennai.net domain are not allowed. Please use a different email address.`,
            );
          }

          // Validate phone number (10 digits)
          const phoneRegex = /^[0-9]{10}$/;
          if (!phoneRegex.test(member.phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
            throw new Error(
              `Team member ${i + 1}: Phone number must be 10 digits`,
            );
          }
        }

        registrationData = {
          eventId,
          isTeamRegistration: true,
          teamName,
          teamMembers,
        };
      } else {
        // Validate individual registration
        if (!phoneNumber || !phoneNumber.trim()) {
          throw new Error("Phone number is required");
        }
        if (!college || !college.trim()) {
          throw new Error("College is required");
        }

        // Validate phone number (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
          throw new Error("Phone number must be 10 digits");
        }

        registrationData = {
          eventId,
          isTeamRegistration: false,
          phoneNumber,
          college,
          department,
          year,
        };
      }

      await registerForEvent(token, registrationData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING EVENT...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 font-mono text-xl mb-4">
            EVENT NOT FOUND
          </div>
          <button
            onClick={() => router.push("/events")}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-black border border-green-500/30 rounded-lg max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-500 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-400 mb-4">
            You have successfully registered for{" "}
            <span className="text-primary">{event?.title}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Your QR code will be available in your dashboard. Please show it at
            the venue for check-in.
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Redirecting to dashboard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 bg-black pb-12">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-2">
            REGISTER FOR
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-4">
            {event.title}
          </h2>

          {/* Registration Capacity Display */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {event.isTeamEvent && event.teamSize && (
              <div className="text-gray-400 font-mono">
                👥 Team Size: {event.teamSize.min}-{event.teamSize.max} members
              </div>
            )}
            {/* Show seats left for CTF and Project Sherlocks */}
            {(event.slug === "ctf-trial-of-the-creed" ||
              event.slug === "project-sherlocks" ||
              event.title.toLowerCase().includes("ctf") ||
              event.slug?.includes("ctf")) && (
              <div className="flex items-center gap-2">
                <div
                  className={`px-4 py-2 rounded border font-mono ${
                    (event.currentRegistrations || 0) >= event.capacity
                      ? "bg-red-500/10 border-red-500/50 text-red-400"
                      : event.capacity - (event.currentRegistrations || 0) <= 20
                        ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                        : "bg-primary/10 border-primary/50 text-primary"
                  }`}
                >
                  🎫 {event.capacity - (event.currentRegistrations || 0)} seats
                  left
                </div>
                {event.capacity - (event.currentRegistrations || 0) <= 20 && (
                  <div className="text-sm text-gray-400">
                    <p>
                      Please note: This event has limited seating capacity.
                      Register early to secure your spot!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Event Contacts / Coordinators */}
          {event.contacts && event.contacts.length > 0 && (
            <div className="mt-2 mb-4 p-4 bg-gray-900/40 border border-gray-800 rounded">
              <h3 className="text-sm text-primary font-semibold mb-2">
                Event Coordinators
              </h3>
              <ul className="space-y-2">
                {event.contacts.map(
                  (
                    c: { name: string; phone?: string; email?: string },
                    idx: number,
                  ) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-300 flex flex-col md:flex-row md:items-center md:gap-4"
                    >
                      <div className="font-medium text-white">{c.name}</div>
                      <div className="text-gray-400 flex flex-col sm:flex-row sm:gap-3 break-words">
                        <a
                          href={`tel:${c.phone?.replace(/\s+/g, "")}`}
                          className="hover:underline"
                        >
                          {c.phone}
                        </a>
                        <a
                          href={`mailto:${c.email}`}
                          className="text-primary hover:underline break-all"
                        >
                          {c.email}
                        </a>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {/* Event Rules */}
          {event.rules && event.rules.length > 0 && (
            <div className="mt-6 p-4 bg-gray-900/50 border border-primary/30 rounded-lg">
              <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                EVENT RULES
              </h3>
              <ul className="space-y-2">
                {event.rules.map((rule, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-300 text-sm"
                  >
                    <span className="text-primary font-bold">{index + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Paper Presentation Topics */}
          {(event.slug === "paper-presentation" ||
            event.title?.toLowerCase().includes("paper presentation")) && (
            <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/40 rounded-lg">
              <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                AVAILABLE TOPICS
              </h3>
              <p className="text-gray-300 text-sm mb-3">
                Choose one of the following topics for your presentation:
              </p>
              <ol className="space-y-2">
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    1.
                  </span>
                  <span>
                    AI Agents as Emerging Security Liabilities in Autonomous
                    Software Systems
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    2.
                  </span>
                  <span>
                    The Disappearance of Physical Interfaces in Future Digital
                    Systems
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    3.
                  </span>
                  <span>
                    Cyber Warfare and the Vulnerability of Modern Armed Forces
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    4.
                  </span>
                  <span>
                    Ransomware in Cloud Environments Backup Recovery and
                    Resilience Planning
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    5.
                  </span>
                  <span>
                    Lateral Movement Risks in Multi-Tenant Cloud Infrastructure
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    6.
                  </span>
                  <span>
                    Challenges of Digital Forensics in Encrypted and Anonymous
                    Environments
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    7.
                  </span>
                  <span>
                    DevSecOps in Modern Software Teams: Integrating Security
                    Into CI/CD Pipelines
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    8.
                  </span>
                  <span>
                    The Relevance of Learning Multiple Programming Languages in
                    an AI Driven Era
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    9.
                  </span>
                  <span>
                    DevOps as a Core Requirement in Contemporary Software
                    Development
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-primary font-bold min-w-[1.5rem]">
                    10.
                  </span>
                  <span>Secure Boot Mechanisms in Hardware Platforms</span>
                </li>
              </ol>
            </div>
          )}
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-black border border-primary/20 p-6 md:p-8 rounded-lg"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded">
              {error}
            </div>
          )}

          {isTeamRegistration ? (
            <>
              {/* Team Registration */}
              <div className="mb-6">
                <label className="block text-white font-bold mb-2">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                  placeholder="Enter your team name"
                  required
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white font-orbitron">
                    TEAM MEMBERS ({teamMembers.length}/{event.teamSize?.max})
                  </h3>
                  {teamMembers.length < (event.teamSize?.max || 1) && (
                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded hover:bg-primary/30 transition-colors text-sm"
                    >
                      + Add Member
                    </button>
                  )}
                </div>

                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-bold text-primary">
                        Member {index + 1} {member.isLeader && "(Leader)"}
                      </h4>
                      <div className="flex gap-2">
                        {!member.isLeader && (
                          <button
                            type="button"
                            onClick={() => setTeamLeader(index)}
                            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                          >
                            Set as Leader
                          </button>
                        )}
                        {teamMembers.length > 1 && !member.isLeader && (
                          <button
                            type="button"
                            onClick={() => removeTeamMember(index)}
                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            updateTeamMember(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateTeamMember(index, "email", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={member.phoneNumber}
                          onChange={(e) =>
                            updateTeamMember(
                              index,
                              "phoneNumber",
                              e.target.value,
                            )
                          }
                          pattern="[0-9]{10}"
                          title="Phone number must be 10 digits"
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                          placeholder="10-digit number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          College <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={member.college}
                          onChange={(e) =>
                            updateTeamMember(index, "college", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={member.department}
                          onChange={(e) =>
                            updateTeamMember(
                              index,
                              "department",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">
                          Year
                        </label>
                        <select
                          value={member.year}
                          onChange={(e) =>
                            updateTeamMember(index, "year", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Individual Registration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-bold mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    pattern="[0-9]{10}"
                    title="Phone number must be 10 digits"
                    className="w-full px-4 py-3 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                    placeholder="10-digit phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">
                    College <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                    placeholder="Enter your college name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                    placeholder="Enter your department"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Terms and Conditions */}
          <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700 rounded">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) {
                    console.log(
                      "%c🎉 Welcome to ReVil 2026! 🎉",
                      "color: #00ff88; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,255,136,0.5);",
                    );
                    console.log(
                      "%cYou're about to embark on an epic journey! 🚀",
                      "color: #00ff88; font-size: 16px;",
                    );
                    console.log(
                      "%cPro tip: Keep your energy levels high and your code cleaner! 💻✨",
                      "color: #ffffff; font-size: 14px; font-style: italic;",
                    );
                  }
                }}
                className="mt-1 w-5 h-5 rounded border-gray-600 bg-black text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-gray-300 text-sm leading-relaxed">
                I agree to the{" "}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Terms and Conditions
                </span>{" "}
                and understand that my registration information will be used for
                event management purposes. I confirm that all information
                provided is accurate.
              </span>
            </label>
          </div>

          {/* Terms and Conditions Modal */}
          {showTermsModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowTermsModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-primary/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-primary font-orbitron">
                    TERMS AND CONDITIONS
                  </h2>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-6 text-gray-300">
                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        1. Registration & Participation
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          All participants must provide accurate and complete
                          information during registration.
                        </li>
                        <li>
                          Participants must be students with valid college
                          identification.
                        </li>
                        <li>
                          Team registrations must include all team members at
                          the time of registration.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        2. Event Rules & Conduct
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          All participants must adhere to the specific rules of
                          each event.
                        </li>
                        <li>
                          Any form of cheating, plagiarism, or unfair means will
                          lead to immediate disqualification.
                        </li>
                        <li>
                          Participants must maintain professional and respectful
                          behavior throughout the event.
                        </li>
                        <li>
                          The organizers reserve the right to modify event rules
                          if necessary.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        3. Data & Privacy
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          Your personal information will be used solely for
                          event management purposes.
                        </li>
                        <li>
                          We may contact you via email or phone regarding event
                          updates and notifications.
                        </li>
                        <li>
                          Event photographs and videos may be used for
                          promotional purposes.
                        </li>
                        <li>
                          We do not share your personal information with third
                          parties without consent.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        4. Liability & Safety
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>Participants attend events at their own risk.</li>
                        <li>
                          The organizers are not liable for any injury, loss, or
                          damage to personal property.
                        </li>
                        <li>
                          Participants must follow all safety guidelines and
                          venue regulations.
                        </li>
                        <li>
                          Emergency contact information should be accurate and
                          up-to-date.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        5. Cancellation & Refunds
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          The organizers reserve the right to cancel or
                          reschedule events due to unforeseen circumstances.
                        </li>
                        <li>
                          Registration fees, if any, are non-refundable except
                          in cases of event cancellation.
                        </li>
                        <li>
                          Participants who fail to attend without prior notice
                          will not be eligible for refunds.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        6. Intellectual Property
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                          All projects and submissions become the property of
                          the participants.
                        </li>
                        <li>
                          However, organizers may showcase winning projects for
                          promotional purposes.
                        </li>
                        <li>
                          Participants must not infringe on any copyrights or
                          intellectual property rights.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">
                        7. Contact & Support
                      </h3>
                      <p className="text-sm">
                        For any queries or concerns regarding these terms,
                        please contact the event coordinators listed on the
                        event page.
                      </p>
                    </section>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-4">
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:border-primary hover:text-primary transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setAcceptedTerms(true);
                      setShowTermsModal(false);
                      console.log(
                        "%c🎉 Welcome to ReVil 2026! 🎉",
                        "color: #00ff88; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,255,136,0.5);",
                      );
                      console.log(
                        "%cYou're about to embark on an epic journey! 🚀",
                        "color: #00ff88; font-size: 16px;",
                      );
                      console.log(
                        "%cPro tip: Keep your energy levels high and your code cleaner! 💻✨",
                        "color: #ffffff; font-size: 14px; font-style: italic;",
                      );
                    }}
                    className="px-6 py-2 bg-primary text-black font-bold rounded hover:bg-white transition-colors"
                  >
                    Accept & Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={
                submitting ||
                !acceptedTerms ||
                (event.currentRegistrations || 0) >= event.capacity
              }
              className="flex-1 px-6 py-4 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "REGISTERING..."
                : (event.currentRegistrations || 0) >= event.capacity
                  ? "EVENT FULL"
                  : "COMPLETE REGISTRATION"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/events")}
              className="px-6 py-4 border border-gray-600 text-gray-300 font-bold uppercase text-sm hover:border-primary hover:text-primary transition-colors"
            >
              CANCEL
            </button>
          </div>
        </motion.form>

        {/* Limited Seats Modal */}
        {showLimitedSeatsModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black border border-yellow-500/50 p-8 max-w-md w-full"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="text-yellow-500 text-4xl">⚠️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold font-orbitron text-yellow-500 mb-3">
                    LIMITED SEATS AVAILABLE
                  </h2>
                  <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                    Please note: This event has limited seating capacity.
                  </p>
                  <p className="text-primary font-mono text-sm leading-relaxed">
                    Register early to secure your spot! Seats are filling up
                    fast.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-yellow-500/30 pt-6">
                <div className="text-gray-400 font-mono text-xs">
                  {event.capacity - (event.currentRegistrations || 0)} seats
                  left
                </div>
                <button
                  onClick={() => setShowLimitedSeatsModal(false)}
                  className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors font-mono"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CTF Full Modal - Suggest Project Sherlocks */}
        {showCtfFullModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-red-950/50 to-black border border-red-500/50 p-8 max-w-lg w-full rounded-lg"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="text-red-500 text-5xl">🔒</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold font-orbitron text-red-500 mb-2">
                    CTF EVENT FULL
                  </h2>
                  <p className="text-gray-400 font-mono text-sm leading-relaxed mb-4">
                    Unfortunately, this CTF event has reached maximum capacity.
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/50 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-primary text-3xl">🕵️</div>
                  <h3 className="text-xl font-bold font-orbitron text-primary">
                    Try Project Sherlocks!
                  </h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  Don't miss out!{" "}
                  <strong className="text-white">Project Sherlocks</strong> is
                  an exciting new cybersecurity event that offers an immersive
                  detective-style challenge experience.
                </p>
                <ul className="space-y-2 text-sm text-gray-300 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">🔍</span>
                    <span>Solve intricate cybersecurity mysteries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">🧩</span>
                    <span>Test your forensics and analysis skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">🏆</span>
                    <span>Compete for amazing prizes</span>
                  </li>
                </ul>
                <button
                  onClick={async () => {
                    setShowCtfFullModal(false);
                    try {
                      // Find Project Sherlocks event
                      const events = await fetchEvents();
                      const projectSherlocksEvent = events.find(
                        (e) =>
                          e.slug === "project-sherlocks" ||
                          e.title.toLowerCase().includes("project sherlocks"),
                      );

                      if (projectSherlocksEvent) {
                        router.push(
                          `/events/${projectSherlocksEvent._id}/register`,
                        );
                      } else {
                        router.push("/events");
                      }
                    } catch (error) {
                      console.error("Error finding Project Sherlocks:", error);
                      router.push("/events");
                    }
                  }}
                  className="w-full px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors font-mono rounded"
                >
                  View Project Sherlocks
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowCtfFullModal(false);
                    router.push("/events");
                  }}
                  className="text-gray-400 hover:text-white transition-colors text-sm font-mono underline"
                >
                  Back to All Events
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
