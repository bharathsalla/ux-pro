import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type FigmaFrame } from "@/types/audit";

interface FigmaUrlInputProps {
  onFramesFetched: (frames: FigmaFrame[], fileName: string) => void;
  isLoading: boolean;
  error: string | null;
  frames: FigmaFrame[];
  fileName: string | null;
  onFetch: (url: string) => void;
  onReset: () => void;
}

const FigmaUrlInput = ({
  onFramesFetched,
  isLoading,
  error,
  frames,
  fileName,
  onFetch,
  onReset,
}: FigmaUrlInputProps) => {
  const [url, setUrl] = useState("");

  const isValidUrl = /figma\.com\/(file|design)\//.test(url);

  const handleFetch = () => {
    if (isValidUrl) {
      onFetch(url);
    }
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-muted-foreground mb-3 block">
        Figma Design Link
      </label>

      {frames.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.5 3.5A2.5 2.5 0 003 6v1.5A2.5 2.5 0 005.5 10h2A2.5 2.5 0 0010 7.5V6a2.5 2.5 0 00-2.5-2.5h-2zM5.5 10A2.5 2.5 0 003 12.5v1A2.5 2.5 0 005.5 16h2A2.5 2.5 0 0010 13.5v-1A2.5 2.5 0 007.5 10h-2zM14 6a2.5 2.5 0 012.5-2.5h2A2.5 2.5 0 0121 6v1.5A2.5 2.5 0 0118.5 10h-2A2.5 2.5 0 0114 7.5V6zM14 12.5A2.5 2.5 0 0116.5 10h2a2.5 2.5 0 012.5 2.5v1a2.5 2.5 0 01-2.5 2.5h-2a2.5 2.5 0 01-2.5-2.5v-1z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{frames.length} screens extracted</p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
            >
              Change
            </button>
          </div>

          {/* Frame thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto rounded-xl border border-border p-2 bg-card">
            {frames.map((frame, idx) => (
              <motion.div
                key={frame.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-border bg-surface-2">
                  <img
                    src={frame.imageUrl}
                    alt={frame.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {frame.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.figma.com/design/..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleFetch}
              disabled={!isValidUrl || isLoading}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                isValidUrl && !isLoading
                  ? "bg-primary text-primary-foreground hover:brightness-110"
                  : "bg-surface-3 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Extracting...
                </span>
              ) : (
                "Extract"
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground">
            Paste a Figma file or design link. We'll extract all screens for analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default FigmaUrlInput;
