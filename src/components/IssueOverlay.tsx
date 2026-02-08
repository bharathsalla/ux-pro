import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type AuditIssue } from "@/types/audit";

interface IssueOverlayProps {
  issues: AuditIssue[];
  imageUrl: string;
  imageAlt?: string;
}

const severityConfig: Record<string, { bg: string; ring: string; text: string; label: string }> = {
  critical: {
    bg: "bg-destructive",
    ring: "ring-destructive/30",
    text: "text-destructive",
    label: "CRITICAL",
  },
  warning: {
    bg: "bg-score-medium",
    ring: "ring-score-medium/30",
    text: "text-score-medium",
    label: "WARNING",
  },
  info: {
    bg: "bg-primary",
    ring: "ring-primary/30",
    text: "text-primary",
    label: "INFO",
  },
};

const IssueOverlay = ({ issues, imageUrl, imageAlt = "Design screenshot" }: IssueOverlayProps) => {
  const [activeIssue, setActiveIssue] = useState<string | null>(null);

  const handlePinClick = (issueId: string) => {
    setActiveIssue(activeIssue === issueId ? null : issueId);
  };

  return (
    <div className="relative bg-card border border-border overflow-hidden group">
      <img
        src={imageUrl}
        alt={imageAlt}
        className="w-full h-auto block"
      />

      {/* Issue pins */}
      {issues.map((issue, idx) => {
        const x = issue.x ?? 50;
        const y = issue.y ?? 50;
        const config = severityConfig[issue.severity] || severityConfig.info;
        const isActive = activeIssue === issue.id;

        return (
          <motion.div
            key={issue.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="absolute z-10"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
              className={`absolute inset-0 ${config.bg} rounded-full`}
            />

            {/* Pin button */}
            <button
              onClick={() => handlePinClick(issue.id)}
              className={`relative w-8 h-8 rounded-full ${config.bg} border-2 border-card shadow-lg flex items-center justify-center text-xs font-bold text-card cursor-pointer transition-transform hover:scale-125 ring-4 ${config.ring}`}
            >
              {idx + 1}
            </button>

            {/* Issue detail card */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute z-50 top-10 left-1/2 -translate-x-1/2 w-72 bg-card border border-border shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Severity header */}
                  <div className={`px-4 py-2 ${config.bg} flex items-center justify-between`}>
                    <span className="text-xs font-bold text-card tracking-wide">
                      {config.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {issue.ruleId && (
                        <span className="text-[10px] font-mono text-card/80 bg-card/20 px-1.5 py-0.5">
                          {issue.ruleId}
                        </span>
                      )}
                      <button
                        onClick={() => setActiveIssue(null)}
                        className="text-card/60 hover:text-card transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-foreground mb-1.5 leading-tight">
                      {issue.title}
                    </h4>
                    {issue.principle && (
                      <span className="inline-block text-[10px] text-muted-foreground bg-surface-2 border border-border px-1.5 py-0.5 mb-2 font-mono">
                        {issue.principle}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {issue.description}
                    </p>

                    {/* Fix suggestion */}
                    <div className="bg-primary/5 border border-primary/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          How to fix
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {issue.suggestion}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Issue count badge */}
      {issues.length > 0 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border px-3 py-1.5">
          <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs font-bold text-foreground">
            {issues.length} issue{issues.length !== 1 ? "s" : ""} found
          </span>
        </div>
      )}
    </div>
  );
};

export default IssueOverlay;
