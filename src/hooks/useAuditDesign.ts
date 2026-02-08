import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type PersonaId, type AuditConfig, type AuditResult, type FigmaFrame, type ScreenAuditResult } from "@/types/audit";

interface UseAuditDesignReturn {
  isLoading: boolean;
  error: string | null;
  result: AuditResult | null;
  runAudit: (imageBase64: string, personaId: PersonaId, config: AuditConfig) => Promise<AuditResult | null>;
  runMultiScreenAudit: (
    frames: FigmaFrame[],
    personaId: PersonaId,
    config: AuditConfig,
    onScreenComplete: (index: number, result: ScreenAuditResult) => void
  ) => Promise<void>;
}

export function useAuditDesign(): UseAuditDesignReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const runAudit = async (
    imageBase64: string,
    personaId: PersonaId,
    config: AuditConfig
  ): Promise<AuditResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "audit-design",
        {
          body: {
            imageBase64,
            personaId,
            fidelity: config.fidelity,
            purpose: config.purpose,
          },
        }
      );

      if (fnError) throw new Error(fnError.message || "Audit failed");
      if (data?.error) throw new Error(data.error);

      const auditResult = data as AuditResult;
      setResult(auditResult);
      return auditResult;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      console.error("Audit error:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const runMultiScreenAudit = async (
    frames: FigmaFrame[],
    personaId: PersonaId,
    config: AuditConfig,
    onScreenComplete: (index: number, result: ScreenAuditResult) => void
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Process frames sequentially to avoid rate limits
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "audit-design",
          {
            body: {
              imageUrl: frame.imageUrl,
              personaId,
              fidelity: config.fidelity,
              purpose: config.purpose,
              screenName: frame.name,
            },
          }
        );

        if (fnError) throw new Error(fnError.message || "Audit failed");
        if (data?.error) throw new Error(data.error);

        onScreenComplete(i, {
          screenName: frame.name,
          screenImageUrl: frame.imageUrl,
          result: data as AuditResult,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to audit screen";
        console.error(`Audit error for frame "${frame.name}":`, e);
        onScreenComplete(i, {
          screenName: frame.name,
          screenImageUrl: frame.imageUrl,
          result: null,
          error: message,
        });
      }
    }

    setIsLoading(false);
  };

  return { isLoading, error, result, runAudit, runMultiScreenAudit };
}
