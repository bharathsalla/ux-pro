import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { type PersonaId, type AuditConfig, type InputMode, type FigmaFrame, personas } from "@/types/audit";
import ImageUpload from "./ImageUpload";
import FigmaUrlInput from "./FigmaUrlInput";
import { useFigmaFrames } from "@/hooks/useFigmaFrames";

interface UploadedImage {
  base64: string;
  previewUrl: string;
  file: File;
}

interface AuditConfigScreenProps {
  personaId: PersonaId;
  onStart: (config: AuditConfig, imageBase64: string, imagePreviewUrl: string) => void;
  onStartMultiImage?: (config: AuditConfig, images: UploadedImage[]) => void;
  onStartFigma: (config: AuditConfig, frames: FigmaFrame[]) => void;
  onBack: () => void;
}

const fidelityOptions = [
  { value: 'wireframe' as const, label: 'Wireframe', desc: 'Low-fidelity sketch' },
  { value: 'mvp' as const, label: 'MVP', desc: 'Functional prototype' },
  { value: 'high-fidelity' as const, label: 'High-Fidelity', desc: 'Production-ready' },
];

const purposeOptions: Record<PersonaId, { value: AuditConfig['purpose']; label: string }[]> = {
  solo: [
    { value: 'pre-handoff', label: 'Pre-Handoff Check' },
    { value: 'portfolio', label: 'Portfolio Polish' },
    { value: 'review', label: 'Self Review' },
  ],
  lead: [
    { value: 'review', label: 'Team Review' },
    { value: 'pre-handoff', label: 'Pre-Handoff Gate' },
    { value: 'stakeholder', label: 'Quality Report' },
  ],
  a11y: [
    { value: 'review', label: 'Compliance Check' },
    { value: 'pre-handoff', label: 'Pre-Launch Audit' },
    { value: 'stakeholder', label: 'Accessibility Report' },
  ],
  founder: [
    { value: 'stakeholder', label: 'Stakeholder Review' },
    { value: 'pre-handoff', label: 'Dev Readiness' },
    { value: 'review', label: 'Quick Check' },
  ],
  consultant: [
    { value: 'stakeholder', label: 'Client Report' },
    { value: 'review', label: 'Heuristic Evaluation' },
    { value: 'pre-handoff', label: 'Formal Audit' },
  ],
};

type ExtInputMode = 'single' | 'multi' | 'figma';

const AuditConfigScreen = ({ personaId, onStart, onStartMultiImage, onStartFigma, onBack }: AuditConfigScreenProps) => {
  const persona = personas.find(p => p.id === personaId)!;
  const [inputMode, setInputMode] = useState<ExtInputMode>('single');
  const [fidelity, setFidelity] = useState<AuditConfig['fidelity']>('high-fidelity');
  const [purpose, setPurpose] = useState<AuditConfig['purpose']>(purposeOptions[personaId][0].value);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const { isLoading: figmaLoading, error: figmaError, frames, fileName, fetchFrames, reset: resetFigma } = useFigmaFrames();

  const handleImageSelect = (base64: string, previewUrl: string) => {
    setImageBase64(base64);
    setImagePreviewUrl(previewUrl);
  };

  const handleFigmaFetch = useCallback(async (url: string) => {
    await fetchFrames(url);
  }, [fetchFrames]);

  const canStartSingle = inputMode === 'single' && !!imageBase64;
  const canStartMulti = inputMode === 'multi' && uploadedImages.length > 0;
  const canStartFigma = inputMode === 'figma' && frames.length > 0;
  const canStart = canStartSingle || canStartMulti || canStartFigma;

  const handleStart = () => {
    const config: AuditConfig = {
      fidelity,
      purpose,
      frameCount: inputMode === 'figma' ? frames.length : inputMode === 'multi' ? uploadedImages.length : 1,
    };

    if (canStartSingle && imagePreviewUrl) {
      onStart(config, imageBase64!, imagePreviewUrl);
    } else if (canStartMulti && onStartMultiImage) {
      onStartMultiImage(config, uploadedImages);
    } else if (canStartFigma) {
      onStartFigma(config, frames);
    }
  };

  const getButtonLabel = () => {
    if (!canStart) {
      if (inputMode === 'figma') return 'Paste a Figma link to start';
      if (inputMode === 'multi') return 'Upload images to start';
      return 'Upload a design to start';
    }
    if (inputMode === 'figma') return `Audit ${frames.length} Screen${frames.length > 1 ? 's' : ''} →`;
    if (inputMode === 'multi') return `Audit ${uploadedImages.length} Image${uploadedImages.length > 1 ? 's' : ''} →`;
    return 'Run AI Audit →';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
    >
      <div className="max-w-lg w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Change persona
        </button>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">{persona.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{persona.title} Mode</h2>
            <p className="text-sm text-muted-foreground">{persona.subtitle}</p>
          </div>
        </div>

        {/* Input Mode Toggle - 3 modes */}
        <div className="mb-6">
          <div className="flex border border-border bg-card p-1 gap-1">
            <button
              onClick={() => setInputMode('single')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'single'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📸 Single
            </button>
            <button
              onClick={() => setInputMode('multi')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'multi'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🖼️ Multi (5)
            </button>
            <button
              onClick={() => setInputMode('figma')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'figma'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🎨 Figma
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="mb-8">
          {inputMode === 'single' ? (
            <ImageUpload
              onImageSelect={handleImageSelect}
              previewUrl={imagePreviewUrl}
            />
          ) : inputMode === 'multi' ? (
            <ImageUpload
              onImageSelect={() => {}}
              onMultiImageSelect={setUploadedImages}
              previewUrl={null}
              multiMode={true}
              uploadedImages={uploadedImages}
            />
          ) : (
            <FigmaUrlInput
              onFramesFetched={() => {}}
              isLoading={figmaLoading}
              error={figmaError}
              frames={frames}
              fileName={fileName}
              onFetch={handleFigmaFetch}
              onReset={resetFigma}
            />
          )}
        </div>

        {/* Fidelity */}
        <div className="mb-8">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Design Fidelity
          </label>
          <div className="grid grid-cols-3 gap-3">
            {fidelityOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFidelity(opt.value)}
                className={`p-3 border text-left transition-all ${
                  fidelity === opt.value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-8">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Audit Purpose
          </label>
          <div className="flex flex-wrap gap-2">
            {purposeOptions[personaId].map(opt => (
              <button
                key={opt.value}
                onClick={() => setPurpose(opt.value)}
                className={`px-4 py-2 text-sm border transition-all ${
                  purpose === opt.value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <motion.button
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.98 } : undefined}
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 font-semibold text-lg transition-all ${
            canStart
              ? 'bg-primary text-primary-foreground glow-primary hover:brightness-110'
              : 'bg-surface-3 text-muted-foreground cursor-not-allowed'
          }`}
        >
          {getButtonLabel()}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AuditConfigScreen;
