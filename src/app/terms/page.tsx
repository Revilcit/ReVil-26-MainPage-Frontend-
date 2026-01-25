export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-8 font-orbitron">
          Terms & Conditions
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Introduction
            </h2>
            <p className="leading-relaxed">
              Welcome to REVIL 2026. By registering for our events, workshops,
              or using our services, you agree to be bound by these Terms and
              Conditions. Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Event Registration
            </h2>
            <p className="leading-relaxed mb-4">
              When you register for any REVIL 2026 event or workshop:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must provide accurate and complete information</li>
              <li>
                Registration is subject to availability and capacity limits
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account
              </li>
              <li>
                One registration per person unless explicitly stated otherwise
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. Products & Services
            </h2>
            <p className="leading-relaxed mb-4">
              REVIL 2026 offers the following services and events:
            </p>

            <h3 className="text-xl font-semibold text-primary mb-3 mt-6">
              Technical Workshops (Paid)
            </h3>
            <div className="space-y-3 ml-4">
              <div className="border-l-2 border-primary pl-4">
                <p className="text-white font-semibold">Embedded Systems 101</p>
                <p className="text-gray-400 text-sm">
                  Firmware, PCB Design, and Application Layer Integration
                </p>
                <p className="text-primary font-bold">
                  ₹100 INR per participant
                </p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="text-white font-semibold">
                  From Noise to Knowledge
                </p>
                <p className="text-gray-400 text-sm">
                  Turning Threats into Defense - Threat Intelligence Workshop
                </p>
                <p className="text-primary font-bold">
                  ₹100 INR per participant
                </p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="text-white font-semibold">Offensive Security</p>
                <p className="text-gray-400 text-sm">
                  Ethical Hacking and Penetration Testing Workshop
                </p>
                <p className="text-primary font-bold">
                  ₹100 INR per participant
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-green-400 mb-3 mt-6">
              All Technical Events (100% FREE)
            </h3>
            <p className="text-gray-300 mb-4">
              Registration for all technical events is completely free. Only
              workshops require a nominal fee.
            </p>
            <div className="space-y-2 ml-4">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  Beneath the Mask - Solo cybersecurity challenge
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  Escape Room - Online technical puzzle challenge
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  CTF – Trial of the Creed - Capture the Flag competition
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  OH-SIN-T - OSINT-based investigation challenge
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  Project Sherlock: Log Trace - Cybersecurity investigation
                  challenge
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  Crime Chronicles - Crime scene reconstruction (Non-technical)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  Paper Presentation - Technical research presentation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-white">
                  Pixel Palette – Poster Design - Creative visual design
                  challenge
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Payment Terms
            </h2>
            <p className="leading-relaxed mb-4">
              For paid workshops and events:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All fees are listed in Indian Rupees (INR)</li>
              <li>
                Payment must be completed through our secure payment gateway
                (Cashfree)
              </li>
              <li>Registration is confirmed only upon successful payment</li>
              <li>Prices are subject to change without prior notice</li>
              <li>
                Workshop fees include access to materials, certificate of
                participation, and hands-on lab exercises
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Participant Conduct
            </h2>
            <p className="leading-relaxed mb-4">
              All participants are expected to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain professional and respectful behavior</li>
              <li>Follow all event rules and guidelines</li>
              <li>
                Not engage in any illegal, harmful, or disruptive activities
              </li>
              <li>
                Respect intellectual property rights of speakers and organizers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Event Changes & Cancellations
            </h2>
            <p className="leading-relaxed mb-4">
              REVIL 2026 reserves the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify event schedules, venues, or content</li>
              <li>Cancel events due to unforeseen circumstances</li>
              <li>Replace speakers or facilitators if necessary</li>
              <li>Refuse admission or remove participants who violate terms</li>
            </ul>
            <p className="leading-relaxed mt-4">
              In case of event cancellation by organizers, participants will be
              notified and refunds will be processed as per our Refunds &
              Cancellations policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Intellectual Property
            </h2>
            <p className="leading-relaxed">
              All content, materials, and resources provided during REVIL 2026
              events are protected by copyright and intellectual property laws.
              Unauthorized recording, distribution, or reproduction is strictly
              prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              8. Privacy & Data Protection
            </h2>
            <p className="leading-relaxed">
              We collect and process personal information in accordance with
              applicable data protection laws. By registering, you consent to
              the collection and use of your information for event management,
              communication, and improvement of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              9. Liability & Disclaimer
            </h2>
            <p className="leading-relaxed mb-4">
              REVIL 2026 and its organizers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Are not liable for any personal injury or property damage during
                events
              </li>
              <li>
                Do not guarantee specific outcomes from attending events or
                workshops
              </li>
              <li>
                Are not responsible for technical issues or service
                interruptions
              </li>
              <li>Participants attend events at their own risk</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              10. Contact Information
            </h2>
            <p className="leading-relaxed">
              For questions about these Terms & Conditions, please contact us
              through our{" "}
              <a
                href="/contact"
                className="text-primary hover:text-white underline"
              >
                Contact Page
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              11. Changes to Terms
            </h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms & Conditions at any
              time. Changes will be effective immediately upon posting to this
              page. Continued use of our services constitutes acceptance of
              modified terms.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Last Updated: January 24, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
