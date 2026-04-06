import {Mail, Phone } from "lucide-react";
import whatsappIcon from "../assets/whatsapp.svg";
import instagramIcon from "../assets/instagram.svg";

interface FooterProps {
  onGoAbout: () => void;
  onGoProducts: () => void;
  onGoCollections: () => void;
}

export function Footer({ onGoAbout, onGoProducts, onGoCollections }: FooterProps) {
  return (
    <footer className="bg-[#053641] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl">Hricochets</h3>
            <p className="text-gray-300 leading-relaxed">
              Artfully crocheted creations that inspire, delight, and endure. 
              Quality meets artistry in every crochet.
            </p>

            <div className="flex gap-4 pt-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/hricochets?igsh=MWJndHlkMGhvNWlzNQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#25D366] flex items-center justify-center transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <img src={instagramIcon} alt="Instagram" className="h-5 w-5" />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/917439494766"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#25D366] flex items-center justify-center transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg">Quick Links</h4>
            <ul className="space-y-3">

              <li
                onClick={onGoAbout}
                className="cursor-pointer text-gray-300 hover:text-[#A3FFC2] transition-colors block hover:translate-x-1 transform duration-200"
              >
                About Us
              </li>

              <li
                onClick={onGoProducts}
                className="cursor-pointer text-gray-300 hover:text-[#A3FFC2] transition-colors block hover:translate-x-1 transform duration-200"
              >
                Custom Products
              </li>

              <li
                onClick={onGoCollections}
                className="cursor-pointer text-gray-300 hover:text-[#A3FFC2] transition-colors block hover:translate-x-1 transform duration-200"
              >
                Collections
              </li>

            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg">Get In Touch</h4>
            <ul className="space-y-3">

              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="h-5 w-5 flex-shrink-0 text-[#A3FFC2]" />
                <a href="mailto:banerjeehrishika@gmail.com" className="hover:text-[#A3FFC2] transition-colors">
                  banerjeehrishika@gmail.com
                </a>
              </li>

              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="h-5 w-5 flex-shrink-0 text-[#A3FFC2]" />
                <a href="mailto:srilakhasarkar@gmail.com" className="hover:text-[#A3FFC2] transition-colors">
                  srilakhasarkar@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
          <p>
            © {new Date().getFullYear()} Hricochets. All rights reserved. All strings attached!
          </p>
        </div>
      </div>
    </footer>
  );
}
