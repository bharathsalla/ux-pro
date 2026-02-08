import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface FunctionalityResult {
  verdict: "good" | "bad" | "mixed";
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface FunctionalityFeedbackProps {
  imageBase64?: string;
  imageUrl?: string;
  screenName?: string;
}

const verdictConfig = {
  good: {
    icon: "✅",
    label: "Good Functionality",
    bg: "bg-score-high/10",
    border: "border-score-high/30",
    text: "text-score-high",
  },
  mixed: {
    icon: "⚠️",
    label: "Needs Improvement",
    bg: "bg-score-medium/10",
    border: "border-score-medium/30",
    text: "text-score-medium",
  },
  bad: {
    icon: "❌",
    label: "Poor Functionality",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
  },
};

const FunctionalityFeedback = ({ imageBase64, imageUrl, screenName }: FunctionalityFeedbackProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FunctionalityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    if (!imageBase64 && !imageUrl) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "audit-functionality",
        {
          body: {
            imageBase64,
            imageUrl,
            screenName,
          },
        }
      );

      if (fnError) throw new Error(fnError.message || "Check failed");
      if (data?.error) throw new Error(data.error);

      setResult(data as FunctionalityResult);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      console.error("Functionality check error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!result && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="text-lg">⚡</span>
              Functionality Check
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Evaluate if this screen's functionality is well-designed for users.
            </p>
          </div>
          <button
            onClick={runCheck}
            disabled={!imageBase64 && !imageUrl}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Check
          </button>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border p-5">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Analyzing functionality...</span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const config = verdictConfig[result.verdict];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border overflow-hidden"
    >
      {/* Verdict header */}
      <div className={`px-5 py-3 ${config.bg} border-b ${config.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <h4 className={`text-sm font-bold ${config.text}`}>{config.label}</h4>
            <p className="text-xs text-muted-foreground">
              Functionality Score: {result.score}/100
            </p>
          </div>
        </div>
        <button
          onClick={runCheck}
          className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1 bg-card transition-colors"
        >
          Re-check
        </button>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>

        {/* Strengths */}
        {result.strengths.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-score-high uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-score-high" />
              Strengths
            </h5>
            <ul className="space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-score-high mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {result.weaknesses.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-destructive" />
              Weaknesses
            </h5>
            <ul className="space-y-1.5">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-0.5 shrink-0">✗</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="bg-surface-2 border border-border p-3">
            <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Recommendations
            </h5>
            <ul className="space-y-1.5">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FunctionalityFeedback;
