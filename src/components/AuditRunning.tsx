import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type PersonaId, personas } from "@/types/audit";

interface AuditRunningProps {
  personaId: PersonaId;
  onComplete: () => void;
}

const checksByPersona: Record<PersonaId, string[]> = {
  solo: [
    "Checking auto layout usage...",
    "Analyzing 8pt grid alignment...",
    "Validating font size hierarchy...",
    "Checking button consistency...",
    "Measuring contrast ratios...",
    "Verifying grid alignment...",
    "Detecting spacing misalignments...",
    "Scanning component detachment...",
  ],
  lead: [
    "Scanning naming conventions...",
    "Checking component detachment...",
    "Analyzing padding consistency...",
    "Validating typography scale...",
    "Auditing design token usage...",
    "Cross-frame consistency check...",
    "Generating quality breakdown...",
    "Building feedback report...",
  ],
  a11y: [
    "WCAG 2.1 contrast check (4.5:1)...",
    "Touch target validation (44px)...",
    "Scanning text under 12px...",
    "Color-only meaning detection...",
    "Focus state verification...",
    "Screen reader compatibility...",
    "Motion sensitivity check...",
    "Alt text coverage scan...",
  ],
  founder: [
    "Scanning visual consistency...",
    "Mobile compatibility check...",
    "Readability assessment...",
    "User flow clarity check...",
    "Risk level calculation...",
    "Generating business summary...",
    "Stakeholder report prep...",
    "Final recommendation build...",
  ],
  consultant: [
    "Nielsen's heuristic #1: Visibility...",
    "Error prevention analysis...",
    "Cognitive load estimation...",
    "Visual hierarchy mapping...",
    "Conversion clarity check...",
    "Interaction consistency audit...",
    "Business impact scoring...",
    "Generating formal report...",
  ],
};

const AuditRunning = ({ personaId, onComplete }: AuditRunningProps) => {
  const persona = personas.find(p => p.id === personaId)!;
  const checks = checksByPersona[personaId];
  const [currentCheck, setCurrentCheck] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCheck(prev => {
        if (prev >= checks.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [checks.length, onComplete]);

  useEffect(() => {
    setProgress(((currentCheck + 1) / checks.length) * 100);
  }, [currentCheck, checks.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-8 border-2 border-border border-t-primary"
        />

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Running {persona.title} Audit
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          Analyzing your design frames...
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surface-3 mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Check list */}
        <div className="space-y-2 text-left">
          <AnimatePresence mode="popLayout">
            {checks.slice(Math.max(0, currentCheck - 3), currentCheck + 1).map((check, idx) => {
              const isActive = idx === Math.min(currentCheck, 3);
              return (
                <motion.div
                  key={check}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isActive ? 1 : 0.4, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {isActive ? (
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}>{check}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-xs text-muted-foreground font-mono"
        >
          {Math.round(progress)}% complete
        </motion.p>
      </div>
    </motion.div>
  );
};

export default AuditRunning;
