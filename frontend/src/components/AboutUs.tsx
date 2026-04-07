import { ArrowLeft } from "lucide-react";
import logo from "../assets/Mascot.svg";

interface AboutUsProps {
  onBack: () => void;
}

export function AboutUs({ onBack }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-[#042830] dark:to-[#042830] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      {/* Sticky top nav with Back to Home */}
      <div className="max-w-3xl w-full mx-auto mt-8">
        <div className="relative z-10 w-full flex items-center bg-white/95 dark:bg-[#042830] px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#053641] dark:text-white hover:opacity-80 transition group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg font-semibold">Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main Card/Content */}
      <div className="max-w-3xl w-full mx-auto mt-8">
        <div
          style={{ backgroundColor: "rgba(216, 154, 118, 0.40)" }}  // translucent in light mode
          className="dark:bg-[#042830] rounded-3xl shadow-2xl p-8 sm:p-12 space-y-8 border border-gray-100 dark:border-gray-700"
        >


          {/* Centered logo in the content */}
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Brand Logo"
              className="h-20 opacity-80"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl text-center text-[#053641] dark:text-white mb-4">
            About Us
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto">
            Welcome to Hricochets! We're passionate about creating personalized products that bring your ideas to life.
            Our team combines creativity with craftsmanship, transforming your vision into one-of-a-kind items made with love and care.
          </p>

          <div
            style={{ backgroundColor: "rgba(103, 78, 44, 0.25)" }} 
            className="dark:bg-[#042830] rounded-xl p-6 text-left mt-4"
          >
            <h2 className="text-2xl text-[#053641] dark:text-white mb-2">Our Mission</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-lg">
              <li>Deliver unique, high-quality custom products for every customer</li>
              <li>Make creativity accessible and enjoyable for all</li>
              <li>Empower you to express yourself through design</li>
              <li>Provide friendly, responsive support throughout the process</li>
            </ul>
          </div>

          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            <p>
              Got an idea? Want to craft something special? <br />
              Reach out to us and let's make it happen!
            </p>
            <p className="mt-4">
              The website was created and designed by <span className="font-semibold">Srilekha Sarkar</span>
            </p>
            <p className="text-sm">
              <a href="mailto:srilakhasarkar@gmail.com" className="text-[#053641] dark:text-[#A3FFC2] hover:underline">
                srilakhasarkar@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
