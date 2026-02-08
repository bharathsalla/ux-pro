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

interface UploadedImage {
  base64: string;
  previewUrl: string;
  file: File;
}

const Index = () => {
  const [step, setStep] = useState<AuditStep>('persona');
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
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
  const handleConfigStart = useCallback(async (cfg: AuditConfig, base64: string, previewUrl: string) => {
    if (!selectedPersona) return;
    setIsMultiScreen(false);
    setImagePreviewUrl(previewUrl);
    setImageBase64(base64);
    setStep('running');

    const result = await runAudit(base64, selectedPersona, cfg);

    if (result) {
      setAuditResult(result);
      setStep('results');
    } else {
      toast.error("Audit failed. Please try again.");
      setStep('config');
    }
  }, [selectedPersona, runAudit]);

  // Multi-image audit (up to 5 images)
  const handleMultiImageStart = useCallback(async (cfg: AuditConfig, images: UploadedImage[]) => {
    if (!selectedPersona) return;
    setIsMultiScreen(true);

    // Convert uploaded images to FigmaFrame-like format for multi-screen results
    const frames: FigmaFrame[] = images.map((img, idx) => ({
      id: `upload-${idx}`,
      name: `Image ${idx + 1}`,
      nodeId: `upload-${idx}`,
      imageUrl: img.previewUrl,
    }));
    setFigmaFrames(frames);

    const initialResults: ScreenAuditResult[] = images.map((img, idx) => ({
      screenName: `Image ${idx + 1}`,
      screenImageUrl: img.previewUrl,
      result: null,
      isLoading: true,
    }));
    setScreenResults(initialResults);
    setCompletedScreens(0);
    setStep('results');

    // Audit each image sequentially
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await runAudit(images[i].base64, selectedPersona, cfg);
        setScreenResults((prev) => {
          const next = [...prev];
          next[i] = {
            screenName: `Image ${i + 1}`,
            screenImageUrl: images[i].previewUrl,
            result: result,
            isLoading: false,
            error: result ? null : "Audit failed",
          };
          return next;
        });
      } catch (e) {
        setScreenResults((prev) => {
          const next = [...prev];
          next[i] = {
            screenName: `Image ${i + 1}`,
            screenImageUrl: images[i].previewUrl,
            result: null,
            isLoading: false,
            error: e instanceof Error ? e.message : "Failed",
          };
          return next;
        });
      }
      setCompletedScreens((prev) => prev + 1);
    }
  }, [selectedPersona, runAudit]);

  // Figma multi-screen audit
  const handleFigmaStart = useCallback(async (cfg: AuditConfig, frames: FigmaFrame[]) => {
    if (!selectedPersona) return;
    setIsMultiScreen(true);
    setFigmaFrames(frames);

    const initialResults: ScreenAuditResult[] = frames.map((f) => ({
      screenName: f.name,
      screenImageUrl: f.imageUrl,
      result: null,
      isLoading: true,
    }));
    setScreenResults(initialResults);
    setCompletedScreens(0);
    setStep('results');

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
    setImageBase64(null);
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
            onStartMultiImage={handleMultiImageStart}
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
            imageBase64={imageBase64 || undefined}
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
