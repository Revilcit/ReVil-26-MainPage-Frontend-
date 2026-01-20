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
          setEvent(foundEvent);
          setIsTeamRegistration(foundEvent.isTeamEvent || false);
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
    value: string | boolean
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
            `Minimum ${event?.teamSize?.min} team members required`
          );
        }
        if (teamMembers.length > (event?.teamSize?.max || 1)) {
          throw new Error(
            `Maximum ${event?.teamSize?.max} team members allowed`
          );
        }
        for (const member of teamMembers) {
          if (
            !member.name ||
            !member.email ||
            !member.phoneNumber ||
            !member.college
          ) {
            throw new Error(
              "All team members must have name, email, phone, and college"
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
        if (!phoneNumber || !college) {
          throw new Error("Phone number and college are required");
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
    } catch (err: any) {
      setError(err.message || "Failed to register");
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
          {event.isTeamEvent && event.teamSize && (
            <div className="text-gray-400 font-mono mb-4">
              👥 Team Size: {event.teamSize.min}-{event.teamSize.max} members
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
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none text-sm"
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
                              e.target.value
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
                    className="w-full px-4 py-3 bg-black border border-gray-600 text-white rounded focus:border-primary focus:outline-none"
                    placeholder="Enter your phone number"
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
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-600 bg-black text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-gray-300 text-sm leading-relaxed">
                I agree to the{" "}
                <span className="text-primary hover:underline cursor-pointer">
                  Terms and Conditions
                </span>{" "}
                and understand that my registration information will be used for
                event management purposes. I confirm that all information
                provided is accurate.
              </span>
            </label>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={submitting || !acceptedTerms}
              className="flex-1 px-6 py-4 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "REGISTERING..." : "COMPLETE REGISTRATION"}
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
      </div>
    </div>
  );
}
