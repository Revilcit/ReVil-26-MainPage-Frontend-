import Link from "next/link";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-black border-t border-primary/20 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              <span className="text-primary">REV</span>IL
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              National Level Technical Symposium presented by the Department of
              Cyber Security. Exploring the frontiers of digital defense and
              ethical hacking.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {["About", "Events", "Workshops", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Department of Cyber Security</li>
              <li>Chennai Institute of Technology</li>
              <li>Sarathy Nagar, Kundrathur</li>
              <li>Chennai - 600069</li>
              <li>
                <a
                  href="mailto:revil@citchennai.net"
                  className="hover:text-primary"
                >
                  revil@citchennai.net
                </a>
              </li>
            </ul>
          </div>

          {/* Socials / Legal */}
          <div>
            <h3 className="text-white font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4 mb-6">
              {/* Instagram */}
              <Link
                href="https://www.instagram.com/revil_cit"
                target="_blank"
                aria-label="Instagram"
                className="w-8 h-8 bg-gray-800 rounded-full 
                                           flex items-center justify-center 
                                           text-primary border border-primary/30
                                           hover:bg-primary hover:text-black
                                           transition-all"
              >
                <FaInstagram size={16} />
              </Link>
              <Link
                href="https://www.linkedin.com/company/revilcit/"
                target="_blank"
                aria-label="Linked In"
                className="w-8 h-8 bg-gray-800 rounded-full 
                                           flex items-center justify-center 
                                           text-primary border border-primary/30
                                           hover:bg-primary hover:text-black
                                           transition-all"
              >
                <FaLinkedinIn size={16} />
              </Link>
              {/* LinkedIn (unchanged) */}
            </div>

            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} REVIL Symposium.
              <br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
