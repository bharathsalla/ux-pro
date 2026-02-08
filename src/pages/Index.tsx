import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  type PersonaId,
  type AuditConfig,
  type AuditStep,
  type AuditResult,
  type FigmaFrame,
  type ScreenAuditResult,
} from "@/types/audit";
import PersonaSelect from "@/components/PersonaSelect";
import AuditConfigScreen from "@/components/AuditConfigScreen";
import AuditRunning from "@/components/AuditRunning";
import ImageAuditResults from "@/components/ImageAuditResults";
import MultiScreenResults from "@/components/MultiScreenResults";
import { useAuditDesign } from "@/hooks/useAuditDesign";
import { toast } from "sonner";

const Index = () => {
  const [step, setStep] = useState<AuditStep>('persona');
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Multi-screen state
  const [isMultiScreen, setIsMultiScreen] = useState(false);
  const [figmaFrames, setFigmaFrames] = useState<FigmaFrame[]>([]);
  const [screenResults, setScreenResults] = useState<ScreenAuditResult[]>([]);
  const [completedScreens, setCompletedScreens] = useState(0);

  const { runAudit, runMultiScreenAudit } = useAuditDesign();

  const handlePersonaSelect = useCallback((id: PersonaId) => {
    setSelectedPersona(id);
    setStep('config');
  }, []);

  // Single image audit
  const handleConfigStart = useCallback(async (cfg: AuditConfig, imageBase64: string, previewUrl: string) => {
    if (!selectedPersona) return;
    setIsMultiScreen(false);
    setImagePreviewUrl(previewUrl);
    setStep('running');

    const result = await runAudit(imageBase64, selectedPersona, cfg);

    if (result) {
      setAuditResult(result);
      setStep('results');
    } else {
      toast.error("Audit failed. Please try again.");
      setStep('config');
    }
  }, [selectedPersona, runAudit]);

  // Figma multi-screen audit
  const handleFigmaStart = useCallback(async (cfg: AuditConfig, frames: FigmaFrame[]) => {
    if (!selectedPersona) return;
    setIsMultiScreen(true);
    setFigmaFrames(frames);

    // Initialize screen results with loading state
    const initialResults: ScreenAuditResult[] = frames.map((f) => ({
      screenName: f.name,
      screenImageUrl: f.imageUrl,
      result: null,
      isLoading: true,
    }));
    setScreenResults(initialResults);
    setCompletedScreens(0);
    setStep('results');

    // Run audits sequentially, updating results as they complete
    await runMultiScreenAudit(frames, selectedPersona, cfg, (index, screenResult) => {
      setScreenResults((prev) => {
        const next = [...prev];
        next[index] = { ...screenResult, isLoading: false };
        return next;
      });
      setCompletedScreens((prev) => prev + 1);
    });
  }, [selectedPersona, runMultiScreenAudit]);

  const handleRestart = useCallback(() => {
    setStep('persona');
    setSelectedPersona(null);
    setImagePreviewUrl(null);
    setAuditResult(null);
    setIsMultiScreen(false);
    setFigmaFrames([]);
    setScreenResults([]);
    setCompletedScreens(0);
  }, []);

  const handleBack = useCallback(() => {
    setStep('persona');
    setSelectedPersona(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {step === 'persona' && (
          <PersonaSelect key="persona" onSelect={handlePersonaSelect} />
        )}
        {step === 'config' && selectedPersona && (
          <AuditConfigScreen
            key="config"
            personaId={selectedPersona}
            onStart={handleConfigStart}
            onStartFigma={handleFigmaStart}
            onBack={handleBack}
          />
        )}
        {step === 'running' && selectedPersona && (
          <AuditRunning
            key="running"
            personaId={selectedPersona}
            onComplete={() => {}}
          />
        )}
        {step === 'results' && selectedPersona && !isMultiScreen && auditResult && imagePreviewUrl && (
          <ImageAuditResults
            key="results-single"
            personaId={selectedPersona}
            result={auditResult}
            imageUrl={imagePreviewUrl}
            onRestart={handleRestart}
          />
        )}
        {step === 'results' && selectedPersona && isMultiScreen && (
          <MultiScreenResults
            key="results-multi"
            personaId={selectedPersona}
            screens={screenResults}
            totalScreens={figmaFrames.length}
            completedScreens={completedScreens}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
