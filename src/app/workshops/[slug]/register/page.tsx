"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  fetchWorkshopBySlug,
  createPaymentOrder,
  fetchUserProfile,
} from "@/lib/api";
import { Event as ApiEvent, UserProfile } from "@/types/api";
import toast, { Toaster } from "react-hot-toast";
import { load } from "@cashfreepayments/cashfree-js";

export default function WorkshopRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [workshop, setWorkshop] = useState<ApiEvent | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emailBlocked, setEmailBlocked] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    college: "",
    year: "",
    branch: "",
    additionalInfo: "",
  });
  const [errors, setErrors] = useState({
    phone: "",
    college: "",
    year: "",
    branch: "",
  });
  const [touched, setTouched] = useState({
    phone: false,
    college: false,
    year: false,
    branch: false,
  });

  useEffect(() => {
    const loadWorkshopAndUser = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to register for workshops");
          router.push("/login");
          return;
        }

        // Fetch user profile to get OAuth email
        const userProfile = await fetchUserProfile(token);
        setUser(userProfile);

        // Check if user's email is from blocked domain
        if (
          userProfile.email &&
          userProfile.email.toLowerCase().includes("@citchennai")
        ) {
          setEmailBlocked(true);
          toast.error("Registrations from citchennai domain are not allowed");
        }

        // Try to fetch workshop by slug first
        let data;
        try {
          data = await fetchWorkshopBySlug(slug);
        } catch (slugError) {
          console.warn("Failed to fetch by slug, trying by ID:", slugError);
          // If slug fetch fails, try fetching by ID
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/workshops/${slug}`,
            {
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Workshop not found");
          }

          const result = await response.json();
          data = result.data;
        }

        setWorkshop(data);
      } catch (error: any) {
        console.error("Failed to load workshop:", error);
        toast.error(error.message || "Failed to load workshop details");
        router.push("/workshops");
      } finally {
        setLoading(false);
      }
    };

    loadWorkshopAndUser();
  }, [slug, router]);

  // Validation functions
  const validatePhone = (phone: string): string => {
    if (!phone) return "Phone number is required";
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return "Please enter a valid 10-digit Indian mobile number";
    }
    return "";
  };

  const validateCollege = (college: string): string => {
    if (!college) return "College/Institution name is required";
    if (college.length < 3) {
      return "College name must be at least 3 characters";
    }
    if (college.length > 100) {
      return "College name must not exceed 100 characters";
    }
    if (!/^[a-zA-Z0-9\s.,()-]+$/.test(college)) {
      return "College name contains invalid characters";
    }
    return "";
  };

  const validateYear = (year: string): string => {
    if (!year) return "Year is required";
    return "";
  };

  const validateBranch = (branch: string): string => {
    if (!branch) return "Branch is required";
    if (branch.length < 2) {
      return "Branch must be at least 2 characters";
    }
    if (branch.length > 50) {
      return "Branch must not exceed 50 characters";
    }
    if (!/^[a-zA-Z0-9\s&()-]+$/.test(branch)) {
      return "Branch contains invalid characters";
    }
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors = {
      phone: validatePhone(formData.phone),
      college: validateCollege(formData.college),
      year: validateYear(formData.year),
      branch: validateBranch(formData.branch),
    };

    setErrors(newErrors);
    setTouched({
      phone: true,
      college: true,
      year: true,
      branch: true,
    });

    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email is blocked
    if (emailBlocked) {
      toast.error("Registrations from citchennai domain are not allowed");
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting");
      return;
    }

    setSubmitting(true);

    try {
      if (!workshop?._id) {
        toast.error("Workshop ID not found");
        return;
      }

      // Create payment order
      const { orderId, paymentSessionId } = await createPaymentOrder(
        workshop._id,
        formData,
      );

      // Initialize Cashfree SDK using official package
      const cashfreeMode =
        process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
          ? "production"
          : "sandbox";

      const cashfree = await load({
        mode: cashfreeMode,
      });

      if (!cashfree) {
        throw new Error("Failed to load Cashfree SDK");
      }

      // Open Cashfree payment modal
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        returnUrl: `${window.location.origin}/workshops/${slug}/payment-callback?order_id=${orderId}`,
      };

      await cashfree.checkout(checkoutOptions);
    } catch (error: any) {
      console.error("Payment initiation error:", error);

      if (error.message === "UNAUTHORIZED") {
        toast.error("Please login to register");
        router.push("/login");
      } else {
        toast.error(error.message || "Failed to initiate payment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate field on change if it has been touched
    if (touched[name as keyof typeof touched]) {
      let error = "";
      switch (name) {
        case "phone":
          error = validatePhone(value);
          break;
        case "college":
          error = validateCollege(value);
          break;
        case "year":
          error = validateYear(value);
          break;
        case "branch":
          error = validateBranch(value);
          break;
      }
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });

    // Validate on blur
    let error = "";
    switch (field) {
      case "phone":
        error = validatePhone(formData.phone);
        break;
      case "college":
        error = validateCollege(formData.college);
        break;
      case "year":
        error = validateYear(formData.year);
        break;
      case "branch":
        error = validateBranch(formData.branch);
        break;
    }
    setErrors({ ...errors, [field]: error });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-primary font-mono text-xl animate-pulse">
          LOADING WORKSHOP...
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-red-500 font-mono text-xl mb-4">
            WORKSHOP NOT FOUND
          </div>
          <button
            onClick={() => router.push("/workshops")}
            className="px-6 py-3 bg-primary text-black font-bold uppercase text-sm hover:bg-white transition-colors"
          >
            Back to Workshops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Workshop Header */}
        <div className="mb-10">
          <button
            onClick={() => router.push("/workshops")}
            className="text-primary hover:text-primary/80 mb-6 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Workshops
          </button>

          <h1 className="text-4xl md:text-5xl font-bold text-white font-orbitron mb-3 tracking-tight">
            REGISTER FOR
          </h1>
          <h2 className="text-3xl md:text-4xl text-primary font-orbitron mb-6 tracking-tight">
            {workshop.title}
          </h2>

          <div className="relative w-full h-72 md:h-80 rounded-xl overflow-hidden mb-8 border border-primary/20">
            <Image
              src={workshop.image || "/events/default.jpg"}
              alt={workshop.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block px-3 py-1 bg-primary/20 border border-primary/50 text-primary text-xs uppercase tracking-wider font-semibold rounded mb-3">
                {workshop.type || "Workshop"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Workshop Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-black border border-primary/20 rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-primary mb-5 font-orbitron tracking-tight">
                About This Workshop
              </h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-base">
                {workshop.fullDescription || workshop.description}
              </p>
            </div>

            {/* Offensive Security Topics */}
            {(workshop.title.toLowerCase().includes("offensive security") ||
              workshop.description
                ?.toLowerCase()
                .includes("offensive security") ||
              workshop.type?.toLowerCase().includes("offensive security")) && (
              <div className="bg-gradient-to-br from-red-950/30 to-black border border-red-500/30 rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-red-500 mb-5 font-orbitron tracking-tight">
                  How to Hack a Mobile/System
                </h2>
                <p className="text-red-400 text-sm font-semibold mb-4 uppercase tracking-wider">
                  - Offensive System Security -
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <span className="text-white font-semibold text-base">
                        1. Control Camera Access
                      </span>
                      <p className="text-gray-400 text-sm mt-1">
                        Learn techniques to gain unauthorized camera access
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    <div>
                      <span className="text-white font-semibold text-base">
                        2. Voice Recording
                      </span>
                      <p className="text-gray-400 text-sm mt-1">
                        Methods to capture and analyze voice data
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div>
                      <span className="text-white font-semibold text-base">
                        3. Hack Login IDs
                      </span>
                      <p className="text-gray-400 text-sm mt-1">
                        Understanding authentication vulnerabilities
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                    <div>
                      <span className="text-white font-semibold text-base">
                        4. Collect Website Data
                      </span>
                      <p className="text-gray-400 text-sm mt-1">
                        Web scraping and data extraction techniques
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-red-950/50 border border-red-500/30 rounded">
                  <p className="text-red-400 text-xs leading-relaxed">
                    ⚠️ <strong>Ethical Note:</strong> This workshop is for
                    educational purposes only. All techniques taught are
                    intended to help you understand security vulnerabilities to
                    better protect systems. Unauthorized hacking is illegal.
                  </p>
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {workshop.prerequisites && workshop.prerequisites.length > 0 && (
              <div className="bg-black border border-primary/20 rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-primary mb-5 font-orbitron tracking-tight">
                  Prerequisites
                </h2>
                <ul className="space-y-3">
                  {workshop.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-primary mt-1 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-300 text-base leading-relaxed">
                        {prereq}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Speakers */}
            {workshop.speakers && workshop.speakers.length > 0 && (
              <div className="bg-black border border-primary/20 rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-primary mb-5 font-orbitron tracking-tight">
                  Speakers
                </h2>
                <div className="space-y-5">
                  {workshop.speakers.map((speaker, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800/50"
                    >
                      {speaker.photo && (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/30">
                          <Image
                            src={speaker.photo}
                            alt={speaker.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {speaker.name}
                        </h3>
                        {speaker.bio && (
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {speaker.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Registration Form */}
          <div className="lg:col-span-1">
            <div className="bg-black border border-primary/20 rounded-lg p-6 md:p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-primary mb-6 font-orbitron tracking-tight">
                Register Now
              </h2>

              {/* Workshop Info */}
              <div className="space-y-4 mb-8 pb-6 border-b border-gray-700">
                {workshop.duration && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">{workshop.duration}</span>
                  </div>
                )}
                {workshop.fee && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-lg font-bold text-primary">
                      ₹{workshop.fee}
                    </span>
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur("phone")}
                    required
                    maxLength={10}
                    className={`w-full px-4 py-3 bg-black border rounded text-white focus:outline-none transition-colors ${
                      touched.phone && errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-primary"
                    }`}
                    placeholder="10-digit mobile number"
                  />
                  {touched.phone && errors.phone && (
                    <p className="mt-2 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="college"
                    className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide"
                  >
                    College/Institution *
                  </label>
                  <input
                    type="text"
                    id="college"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    onBlur={() => handleBlur("college")}
                    required
                    maxLength={100}
                    className={`w-full px-4 py-3 bg-black border rounded text-white focus:outline-none transition-colors ${
                      touched.college && errors.college
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-600 focus:border-primary"
                    }`}
                    placeholder="Your college name"
                  />
                  {touched.college && errors.college && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.college}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="year"
                      className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide"
                    >
                      Year *
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      onBlur={() => handleBlur("year")}
                      required
                      className={`w-full px-4 py-3 bg-black border rounded text-white focus:outline-none transition-colors ${
                        touched.year && errors.year
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-600 focus:border-primary"
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="other">Other</option>
                    </select>
                    {touched.year && errors.year && (
                      <p className="mt-2 text-sm text-red-500">{errors.year}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="branch"
                      className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide"
                    >
                      Branch *
                    </label>
                    <input
                      type="text"
                      id="branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      onBlur={() => handleBlur("branch")}
                      required
                      maxLength={50}
                      className={`w-full px-4 py-3 bg-black border rounded text-white focus:outline-none transition-colors ${
                        touched.branch && errors.branch
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-600 focus:border-primary"
                      }`}
                      placeholder="e.g., CSE, ECE, Mechanical"
                    />
                    {touched.branch && errors.branch && (
                      <p className="mt-2 text-sm text-red-500">
                        {errors.branch}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="additionalInfo"
                    className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide"
                  >
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-black border border-gray-600 rounded text-white focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Any questions or special requirements?"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.additionalInfo.length}/500 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    emailBlocked ||
                    (workshop.currentRegistrations || 0) >=
                      (workshop.capacity || 0)
                  }
                  className="w-full px-6 py-4 bg-primary text-black font-bold uppercase text-sm tracking-wider hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {submitting
                    ? "Registering..."
                    : (workshop.currentRegistrations || 0) >=
                        (workshop.capacity || 0)
                      ? "Workshop Full"
                      : "Complete Registration"}
                </button>

                {/* Policy Links - Required for Cashfree Production */}
                <div className="mt-6 pt-6 border-t border-gray-700 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Important Information
                  </h3>
                  <div className="space-y-2 text-xs text-gray-400">
                    <p className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Service: {workshop.title}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-primary mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Price: ₹{workshop.fee || 0} INR</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <a
                      href="/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-white transition-colors underline"
                    >
                      Contact Us
                    </a>
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-white transition-colors underline"
                    >
                      Terms & Conditions
                    </a>
                    <a
                      href="/refunds"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-white transition-colors underline"
                    >
                      Refunds & Cancellations
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                    By registering, you agree to our Terms & Conditions and
                    Refunds & Cancellations policy. Secure payment powered by
                    Cashfree.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
