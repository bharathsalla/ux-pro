import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FigmaAnalyzingProps {
  status: "extracting" | "processing";
  frameCount?: number;
}

const analysisSteps = [
  { label: "Extracting design frames", icon: "🖼️" },
  { label: "Parsing layer structure", icon: "📐" },
  { label: "Mapping component hierarchy", icon: "🧩" },
  { label: "Preparing visual analysis", icon: "🔬" },
];

const ruleScanItems = [
  "Nielsen's Heuristics — Visibility of system status",
  "Fitts's Law — Touch target sizing",
  "Hick's Law — Decision complexity",
  "WCAG 2.2 — Contrast ratio (4.5:1)",
  "Gestalt — Proximity & grouping",
  "8pt Grid — Spacing alignment",
  "Typography Scale — Hierarchy check",
  "Color Theory — 60-30-10 rule",
  "Miller's Law — Cognitive load",
  "Atomic Design — Component structure",
  "Jakob's Law — Convention adherence",
  "Doherty Threshold — Response time",
  "Shneiderman's Rules — Consistency",
  "Error Prevention — Input validation",
  "Aesthetic-Usability Effect — Visual polish",
];

const FigmaAnalyzing = ({ status, frameCount }: FigmaAnalyzingProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [scanIndex, setScanIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % analysisSteps.length);
    }, 2000);
    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % ruleScanItems.length);
    }, 800);
    return () => clearInterval(scanInterval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-sm w-full text-center">
        {/* Scanning Animation */}
        <div className="relative w-36 h-36 mx-auto mb-10">
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-border"
          />
          {/* Middle ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 border border-primary/30"
          />
          {/* Inner ring with glow */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-6 border-2 border-primary/40 border-t-primary"
          />
          {/* Center pulse */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-11 bg-primary/10 flex items-center justify-center"
          >
            <span className="text-3xl">{analysisSteps[activeStep].icon}</span>
          </motion.div>
          {/* Orbiting dots */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute w-2.5 h-2.5 bg-primary"
              style={{
                top: `${50 + 45 * Math.sin((i * Math.PI) / 2)}%`,
                left: `${50 + 45 * Math.cos((i * Math.PI) / 2)}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        {/* Status */}
        <h3 className="text-xl font-bold text-foreground mb-1">
          {status === "extracting"
            ? `Extracting${frameCount ? ` ${frameCount} screens` : ""}${dots}`
            : `Processing design${dots}`}
        </h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={activeStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-muted-foreground mb-8"
          >
            {analysisSteps[activeStep].label}
          </motion.p>
        </AnimatePresence>

        {/* Rule Scanner */}
        <div className="bg-card border border-border p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rule Engine Active
            </span>
          </div>
          <div className="space-y-1.5 h-[120px] overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-card to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent z-10" />
            <AnimatePresence mode="popLayout">
              {ruleScanItems
                .slice(scanIndex, scanIndex + 4)
                .concat(
                  ruleScanItems.slice(
                    0,
                    Math.max(0, scanIndex + 4 - ruleScanItems.length)
                  )
                )
                .slice(0, 4)
                .map((rule, idx) => (
                  <motion.div
                    key={`${scanIndex}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: idx === 0 ? 1 : 0.3 + idx * 0.15,
                      x: 0,
                    }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 text-xs py-1.5"
                  >
                    {idx === 0 ? (
                      <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <svg
                        className="w-3.5 h-3.5 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <span
                      className={
                        idx === 0
                          ? "text-foreground font-semibold font-mono text-xs"
                          : "text-muted-foreground font-mono text-xs"
                      }
                    >
                      {rule}
                    </span>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>

        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 text-xs text-muted-foreground font-medium"
        >
          ✨ Powered by 60+ UX/UI principles & standards
        </motion.p>
      </div>
    </div>
  );
};

export default FigmaAnalyzing;
