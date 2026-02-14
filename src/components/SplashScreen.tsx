import { useState, useEffect } from "react";
import itechLogo from "@/assets/itechlogo.png";
import { Progress } from "@/components/ui/progress";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/80 overflow-hidden">
      {/* Logo */}
      <div className="animate-[bounce_2s_ease-in-out_infinite] mb-4">
        <img
          src={itechLogo}
          alt="I-TECH Logo"
          className="w-28 h-28 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Company Name */}
      <h1 className="text-3xl font-extrabold text-primary-foreground tracking-wider mb-1">
        I-TECH COMPUTERS
      </h1>
      <p className="text-primary-foreground/70 text-sm mb-10 tracking-widest uppercase">
        Service Management
      </p>

      {/* Progress Bar */}
      <div className="w-64 mb-8">
        <Progress value={progress} className="h-2 bg-primary-foreground/20 [&>div]:bg-accent" />
        <p className="text-primary-foreground/60 text-xs text-center mt-2">
          Loading... {progress}%
        </p>
      </div>

      {/* Running Service Guy */}
      <div className="relative w-64 h-16 overflow-hidden">
        <div
          className="absolute bottom-0"
          style={{
            left: `${Math.min(progress, 100)}%`,
            transform: "translateX(-50%)",
            transition: "left 0.05s linear",
          }}
        >
          <div className="relative">
            {/* Service guy SVG - running with toolbox */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={progress < 100 ? "animate-[run_0.4s_steps(2)_infinite]" : ""}
            >
              {/* Head */}
              <circle cx="24" cy="8" r="5" fill="white" />
              {/* Hard hat */}
              <path d="M18 7 H30 Q30 3 24 3 Q18 3 18 7Z" fill="#FFC107" />
              {/* Body */}
              <rect x="21" y="13" width="6" height="12" rx="2" fill="white" />
              {/* Left arm holding toolbox */}
              <line
                x1="21"
                y1="15"
                x2="14"
                y2="22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={progress < 100 ? "animate-[swing_0.4s_ease-in-out_infinite_alternate]" : ""}
              />
              {/* Right arm */}
              <line
                x1="27"
                y1="15"
                x2="34"
                y2="20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={progress < 100 ? "animate-[swing_0.4s_ease-in-out_infinite_alternate-reverse]" : ""}
              />
              {/* Toolbox */}
              <rect x="9" y="20" width="8" height="6" rx="1" fill="#F44336" />
              <line x1="11" y1="20" x2="11" y2="18" stroke="#F44336" strokeWidth="1.5" />
              <line x1="15" y1="20" x2="15" y2="18" stroke="#F44336" strokeWidth="1.5" />
              <line x1="11" y1="18" x2="15" y2="18" stroke="#F44336" strokeWidth="1.5" />
              {/* Left leg */}
              <line
                x1="22"
                y1="25"
                x2="17"
                y2="36"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={progress < 100 ? "animate-[kick_0.4s_ease-in-out_infinite_alternate]" : ""}
              />
              {/* Right leg */}
              <line
                x1="26"
                y1="25"
                x2="31"
                y2="36"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={progress < 100 ? "animate-[kick_0.4s_ease-in-out_infinite_alternate-reverse]" : ""}
              />
              {/* Wrench sticking out of toolbox */}
              <path d="M17 21 L20 18" stroke="#FFEB3B" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="20.5" cy="17.5" r="1.5" stroke="#FFEB3B" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </div>
        {/* Ground line */}
        <div className="absolute bottom-2 left-0 right-0 h-px bg-primary-foreground/30" />
      </div>
    </div>
  );
};

export default SplashScreen;
