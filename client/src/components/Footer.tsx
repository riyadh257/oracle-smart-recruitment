import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_ADDRESS, APP_LOGO } from "@/const";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1F233E] text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={APP_LOGO} 
                alt={COMPANY_NAME}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-300 text-sm">
              {COMPANY_NAME} - Smart Recruitment Solutions
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#04DBFA]">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#04DBFA] mt-0.5 shrink-0" />
                <a 
                  href={`mailto:${COMPANY_EMAIL}`}
                  className="text-gray-300 hover:text-[#04DBFA] transition-colors text-sm"
                >
                  {COMPANY_EMAIL}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#04DBFA] mt-0.5 shrink-0" />
                <p className="text-gray-300 text-sm">
                  {COMPANY_ADDRESS}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#04DBFA]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/"
                  className="text-gray-300 hover:text-[#04DBFA] transition-colors text-sm"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/candidate-portal"
                  className="text-gray-300 hover:text-[#04DBFA] transition-colors text-sm"
                >
                  Candidate Portal
                </a>
              </li>
              <li>
                <a 
                  href="/dashboard"
                  className="text-gray-300 hover:text-[#04DBFA] transition-colors text-sm"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
