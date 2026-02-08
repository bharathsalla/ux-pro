import { useState } from "react";
import { motion } from "framer-motion";
import { type PersonaId, type AuditResult, type AuditIssue, personas } from "@/types/audit";
import ScoreRing from "./ScoreRing";
import IssueOverlay from "./IssueOverlay";
import FunctionalityFeedback from "./FunctionalityFeedback";

interface ImageAuditResultsProps {
  personaId: PersonaId;
  result: AuditResult;
  imageUrl: string;
  imageBase64?: string;
  onRestart: () => void;
}

const ImageAuditResults = ({
  personaId,
  result,
  imageUrl,
  imageBase64,
  onRestart,
}: ImageAuditResultsProps) => {
  const persona = personas.find((p) => p.id === personaId)!;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);

  const allIssues = result.categories.flatMap((cat) => cat.issues);
  const filteredIssues = activeCategory
    ? allIssues.filter((i) => i.category === activeCategory)
    : allIssues;
  const criticalCount = allIssues.filter((i) => i.severity === "critical").length;

  const scrollToIssue = (issueId: string) => {
    setActiveIssueId(issueId);
    const el = document.getElementById(`issue-${issueId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Top Bar */}
      <div className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{persona.icon}</span>
            <div>
              <h2 className="text-base font-bold text-foreground">{persona.title} Audit</h2>
              <p className="text-xs text-muted-foreground">AI-powered analysis complete</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRestart}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border hover:bg-accent"
            >
              New Audit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Score Dashboard */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ScoreRing score={result.overallScore} size={120} strokeWidth={8} label="/100" />
            <div className="flex-1 text-center md:text-left">
              <p className="text-foreground text-base leading-relaxed mb-3">{result.summary}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium ${
                    result.riskLevel === "High"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : result.riskLevel === "Medium"
                      ? "bg-score-medium/10 text-score-medium border border-score-medium/20"
                      : "bg-score-high/10 text-score-high border border-score-high/20"
                  }`}
                >
                  Risk: {result.riskLevel}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-surface-2 text-muted-foreground border border-border">
                  {allIssues.length} issues
                </span>
                {criticalCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-destructive/10 text-destructive border border-destructive/20">
                    {criticalCount} critical
                  </span>
                )}
              </div>
            </div>
            {/* Category mini-scores */}
            <div className="flex gap-3 flex-wrap justify-center">
              {result.categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  className={`flex flex-col items-center gap-1 p-1.5 transition-all ${
                    activeCategory === cat.name
                      ? "bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <ScoreRing score={cat.score} size={48} strokeWidth={3} />
                  <span className="text-[10px] text-muted-foreground font-medium max-w-[60px] text-center truncate">
                    {cat.icon} {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Image with interactive issue overlay */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <IssueOverlay issues={filteredIssues} imageUrl={imageUrl} />
        </motion.div>

        {/* Functionality Feedback */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <FunctionalityFeedback
            imageBase64={imageBase64}
            imageUrl={imageUrl}
            screenName="Single screen audit"
          />
        </motion.div>

        {/* Issues list */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-2.5 mb-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {activeCategory ? `${activeCategory} Issues` : "All Issues"} ({filteredIssues.length})
            </h3>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="text-xs text-primary hover:underline">
                Show all
              </button>
            )}
          </div>
          {filteredIssues.map((issue, idx) => {
            const severityClass =
              issue.severity === "critical"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : issue.severity === "warning"
                ? "bg-score-medium/10 text-score-medium border border-score-medium/20"
                : "bg-primary/10 text-primary border border-primary/20";

            const isHighlighted = activeIssueId === issue.id;

            return (
              <motion.div
                key={issue.id}
                id={`issue-${issue.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-card border p-4 flex items-start gap-3 transition-all ${
                  isHighlighted
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                <span className="w-6 h-6 bg-surface-2 flex items-center justify-center text-xs font-bold text-foreground shrink-0 border border-border">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium ${severityClass}`}>
                      {issue.severity}
                    </span>
                    {issue.ruleId && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-surface-2 text-muted-foreground border border-border">
                        {issue.ruleId}
                      </span>
                    )}
                    {issue.principle && (
                      <span className="text-xs text-muted-foreground">{issue.principle}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{issue.category}</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground">{issue.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                  <div className="mt-2 p-2.5 bg-primary/5 border border-primary/20">
                    <p className="text-xs text-foreground">💡 {issue.suggestion}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* New audit button */}
        <div className="text-center pb-8">
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
          >
            Run Another Audit
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageAuditResults;
