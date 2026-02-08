import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type FigmaFrame } from "@/types/audit";

interface FigmaResponse {
  fileName: string;
  fileKey: string;
  frames: FigmaFrame[];
  totalFrames: number;
  exportedFrames: number;
}

interface UseFigmaFramesReturn {
  isLoading: boolean;
  error: string | null;
  frames: FigmaFrame[];
  fileName: string | null;
  fetchFrames: (figmaUrl: string) => Promise<FigmaFrame[]>;
  reset: () => void;
}

export function useFigmaFrames(): UseFigmaFramesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<FigmaFrame[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const fetchFrames = async (figmaUrl: string): Promise<FigmaFrame[]> => {
    setIsLoading(true);
    setError(null);
    setFrames([]);
    setFileName(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "fetch-figma-frames",
        {
          body: { figmaUrl },
        }
      );

      if (fnError) throw new Error(fnError.message || "Failed to fetch Figma frames");
      if (data?.error) throw new Error(data.error);

      const response = data as FigmaResponse;
      setFrames(response.frames);
      setFileName(response.fileName);
      return response.frames;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      console.error("Figma fetch error:", e);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFrames([]);
    setFileName(null);
    setError(null);
  };

  return { isLoading, error, frames, fileName, fetchFrames, reset };
}
