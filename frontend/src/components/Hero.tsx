import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import logoImage from "../assets/Hero-logo.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

interface HeroProps {
  onShowAbout: () => void;
  onExploreCollection: () => void;
}

export function Hero({ onShowAbout, onExploreCollection }: HeroProps) {
  const { theme } = useTheme();
  const lightBg = "#c7e7ff";
  const darkBg = "rgba(164, 255, 194, 0.35)";
  const bgColor = theme === "dark" ? darkBg : lightBg;
  // Generate cute floating pixel elements
  const pixels = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      color:
        i % 2 === 0 ? "#FF92C4" : i % 3 === 0 ? "#A3FFC2" : "#D79A7B",
      size: Math.random() * 12 + 8,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
    }));
  }, []);

  return (
  <section className="relative w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#053641] transition-colors duration-500 overflow-visible pt-20">

      {/* Soft background blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#FF92C4]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#A3FFC2]/10 rounded-full blur-3xl" />

      {/* Floating Pixel Elements */}
      {pixels.map((pixel) => (
        <motion.div
          key={pixel.id}
          className="absolute z-0"
          style={{
            width: pixel.size,
            height: pixel.size,
            backgroundColor: pixel.color,
            boxShadow: `4px 4px 0px rgba(0,0,0,0.1)`,
            borderRadius: "2px",
          }}
          initial={{ opacity: 0, x: `${pixel.x}vw`, y: `${pixel.y}vh` }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            y: [`${pixel.y}vh`, `${pixel.y - 5}vh`, `${pixel.y}vh`],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: pixel.duration,
            repeat: Infinity,
            ease: "linear",
            delay: pixel.delay,
          }}
        />
      ))}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center relative z-20 w-full min-h-[calc(150vh-96px)]">

        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
          className="w-full flex flex-col items-center mt-2 mb-20"
        >
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="flex justify-center cursor-default mb-4 relative"
          >
            {/* Shadow offset */}
            <div className="absolute inset-0 translate-x-4 translate-y-4 -z-10 rounded-full" style={{ background: bgColor }} />

            <div className="w-[24rem] h-[24rem] sm:w-[30rem] sm:h-[30rem] md:w-[38rem] md:h-[38rem] lg:w-[46rem] lg:h-[46rem] relative flex items-center justify-center overflow-visible isolate">

              {/* Outer Halo */}
              <div
                className="absolute inset-0 rounded-full opacity-50 z-0 "
                style={{
                  background: bgColor,
                  transform: "scale(1.22) translateX(15px) translateY(10px)",
                }}
              />

              {/* Rotating Dashed Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full opacity-80 z-10"
                style={{
                  border: "2px dashed #FF92C4",
                  boxSizing: "border-box",
                  scale: 1.24,
                }}
              />

              {/* Rotating Dotted Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full opacity-70 z-8"
                style={{
                  border: "2px dashed #053641",
                  boxSizing: "border-box",
                  scale: 0.99,
                }}
              />

            <div className="relative w-full h-full flex items-center justify-center">

              {/* Scaled Wrapper */}
              <div
                className="relative flex items-center justify-center rounded-full overflow-hidden z-10"
                style={{
                  background: bgColor,
                  border: "3px solid #173b23",
                  boxShadow: "12px 12px 0px #D79A7B",
                  transform: "scale(0.74)",
                  width: "100%",
                  height: "100%",
                }}
                >
                <ImageWithFallback
                  src={logoImage}
                  alt="Simplistic Circular Logo"
                  className="w-[40px] h-[40px] object-contain z-10"
                  style={{ transform: "translateY(34px)" }}
                />
              </div>

              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-24 md:mt-32 pt-8">
          <Button
            onClick={onExploreCollection}
            size="lg"
            className="bg-[#053641] dark:bg-white hover:bg-[#053641]/90 dark:hover:bg-gray-100 text-white dark:text-[#053641] px-8 py-6 rounded-full group transition-all hover:scale-105 shadow-lg"
          >
            Explore Collection
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            onClick={onShowAbout}
            size="lg"
            variant="outline"
            className="border-2 border-[#D79A7B] text-[#053641] dark:text-white dark:border-white hover:bg-[#D79A7B]/10 dark:hover:bg-white/10 px-8 py-6 rounded-full transition-all hover:scale-105"
          >
            About Us
          </Button>
        </div>
      </div>
    </section>
  );
}