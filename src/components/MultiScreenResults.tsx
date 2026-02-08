import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type PersonaId, type ScreenAuditResult, type AuditIssue, personas } from "@/types/audit";
import ScoreRing from "./ScoreRing";
import IssueOverlay from "./IssueOverlay";
import FunctionalityFeedback from "./FunctionalityFeedback";
import FigmaAnalyzing from "./FigmaAnalyzing";

interface MultiScreenResultsProps {
  personaId: PersonaId;
  screens: ScreenAuditResult[];
  totalScreens: number;
  completedScreens: number;
  onRestart: () => void;
}

const MultiScreenResults = ({
  personaId,
  screens,
  totalScreens,
  completedScreens,
  onRestart,
}: MultiScreenResultsProps) => {
  const persona = personas.find((p) => p.id === personaId)!;
  const [selectedScreen, setSelectedScreen] = useState(0);
  const isComplete = completedScreens >= totalScreens;

  const overallScore = useMemo(() => {
    const completedResults = screens.filter((s) => s.result);
    if (completedResults.length === 0) return 0;
    const sum = completedResults.reduce((acc, s) => acc + (s.result?.overallScore || 0), 0);
    return Math.round(sum / completedResults.length);
  }, [screens]);

  const totalIssues = useMemo(() => {
    return screens.reduce((acc, s) => {
      if (!s.result) return acc;
      return acc + s.result.categories.reduce((sum, cat) => sum + cat.issues.length, 0);
    }, 0);
  }, [screens]);

  const criticalIssues = useMemo(() => {
    return screens.reduce((acc, s) => {
      if (!s.result) return acc;
      return (
        acc +
        s.result.categories.reduce(
          (sum, cat) => sum + cat.issues.filter((i) => i.severity === "critical").length,
          0
        )
      );
    }, 0);
  }, [screens]);

  const currentScreen = screens[selectedScreen];
  const currentIssues: AuditIssue[] = currentScreen?.result
    ? currentScreen.result.categories.flatMap((cat) => cat.issues)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      {/* Top Bar */}
      <div className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{persona.icon}</span>
            <div>
              <h2 className="text-base font-bold text-foreground">{persona.title} Audit</h2>
              <p className="text-xs text-muted-foreground">
                {isComplete
                  ? `${screens.length} screens analyzed`
                  : `Analyzing ${completedScreens}/${totalScreens} screens...`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <ScoreRing score={overallScore} size={44} strokeWidth={3} />
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="text-sm font-bold text-foreground">{overallScore}/100</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs bg-surface-2 text-muted-foreground border border-border">
                {totalIssues} issues
              </span>
              {criticalIssues > 0 && (
                <span className="px-2.5 py-1 text-xs bg-destructive/10 text-destructive border border-destructive/20">
                  {criticalIssues} critical
                </span>
              )}
            </div>
            <button
              onClick={onRestart}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border hover:bg-accent"
            >
              New Audit
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar */}
        <div className="w-48 lg:w-56 border-r border-border bg-card shrink-0 overflow-y-auto">
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 mb-2">
              Screens ({screens.length})
            </p>
            {screens.map((screen, idx) => {
              const score = screen.result?.overallScore;
              const isActive = idx === selectedScreen;
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedScreen(idx)}
                  className={`w-full text-left p-2 transition-all group border ${
                    isActive ? "bg-primary/5 border-primary/30" : "hover:bg-accent border-transparent"
                  }`}
                >
                  <div className="aspect-[3/4] overflow-hidden border border-border bg-surface-2 mb-2">
                    <img
                      src={screen.screenImageUrl}
                      alt={screen.screenName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground truncate flex-1 mr-2">
                      {screen.screenName}
                    </span>
                    {screen.isLoading ? (
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    ) : screen.error ? (
                      <span className="text-[10px] text-destructive">Error</span>
                    ) : score !== undefined ? (
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          score >= 80 ? "text-score-high" : score >= 60 ? "text-score-medium" : "text-score-low"
                        }`}
                      >
                        {score}
                      </span>
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentScreen && (
              <motion.div
                key={selectedScreen}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 lg:p-6"
              >
                {currentScreen.isLoading ? (
                  <FigmaAnalyzing status="processing" frameCount={totalScreens} />
                ) : currentScreen.error ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <p className="text-destructive text-sm mb-2">Failed to audit this screen</p>
                    <p className="text-xs text-muted-foreground">{currentScreen.error}</p>
                  </div>
                ) : currentScreen.result ? (
                  <>
                    {/* Screen Score Bar */}
                    <div className="bg-card border border-border p-5 mb-5">
                      <div className="flex flex-col md:flex-row items-center gap-5">
                        <ScoreRing
                          score={currentScreen.result.overallScore}
                          size={100}
                          strokeWidth={6}
                          label="/100"
                        />
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            {currentScreen.screenName}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {currentScreen.result.summary}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium ${
                                currentScreen.result.riskLevel === "High"
                                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                                  : currentScreen.result.riskLevel === "Medium"
                                  ? "bg-score-medium/10 text-score-medium border border-score-medium/20"
                                  : "bg-score-high/10 text-score-high border border-score-high/20"
                              }`}
                            >
                              Risk: {currentScreen.result.riskLevel}
                            </span>
                            <span className="px-2.5 py-1 text-xs bg-surface-2 text-muted-foreground border border-border">
                              {currentIssues.length} issues
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          {currentScreen.result.categories.map((cat) => (
                            <div key={cat.name} className="flex flex-col items-center gap-1">
                              <ScoreRing score={cat.score} size={40} strokeWidth={3} />
                              <span className="text-[9px] text-muted-foreground font-medium max-w-[50px] text-center truncate">
                                {cat.icon} {cat.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Annotated Image with IssueOverlay */}
                    <div className="mb-5">
                      <IssueOverlay
                        issues={currentIssues}
                        imageUrl={currentScreen.screenImageUrl}
                        imageAlt={currentScreen.screenName}
                      />
                    </div>

                    {/* Functionality Feedback */}
                    <div className="mb-5">
                      <FunctionalityFeedback
                        imageUrl={currentScreen.screenImageUrl}
                        screenName={currentScreen.screenName}
                      />
                    </div>

                    {/* Issues List */}
                    <div className="space-y-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        Issues ({currentIssues.length})
                      </h3>
                      {currentIssues.map((issue, idx) => {
                        const severityClass =
                          issue.severity === "critical"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : issue.severity === "warning"
                            ? "bg-score-medium/10 text-score-medium border border-score-medium/20"
                            : "bg-primary/10 text-primary border border-primary/20";

                        return (
                          <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-card border border-border p-4 flex items-start gap-3"
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
                    </div>
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MultiScreenResults;
