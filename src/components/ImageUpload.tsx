import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedImage {
  base64: string;
  previewUrl: string;
  file: File;
}

interface ImageUploadProps {
  onImageSelect: (base64: string, previewUrl: string) => void;
  onMultiImageSelect?: (images: UploadedImage[]) => void;
  previewUrl: string | null;
  multiMode?: boolean;
  uploadedImages?: UploadedImage[];
}

const MAX_IMAGES = 5;

const ImageUpload = ({
  onImageSelect,
  onMultiImageSelect,
  previewUrl,
  multiMode = false,
  uploadedImages = [],
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        onImageSelect(base64, result);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const processMultipleFiles = useCallback(
    (files: FileList) => {
      if (!onMultiImageSelect) return;

      const remaining = MAX_IMAGES - uploadedImages.length;
      if (remaining <= 0) return;

      const validFiles = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, remaining);

      const newImages: UploadedImage[] = [];
      let processed = 0;

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          newImages.push({ base64, previewUrl: result, file });
          processed++;
          if (processed === validFiles.length) {
            onMultiImageSelect([...uploadedImages, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [onMultiImageSelect, uploadedImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (multiMode && e.dataTransfer.files.length > 0) {
        processMultipleFiles(e.dataTransfer.files);
      } else {
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
      }
    },
    [processFile, processMultipleFiles, multiMode]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (multiMode) {
      processMultipleFiles(e.target.files);
    } else {
      const file = e.target.files[0];
      if (file) processFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    if (!onMultiImageSelect) return;
    const updated = uploadedImages.filter((_, i) => i !== index);
    onMultiImageSelect(updated);
  };

  // Multi-image mode
  if (multiMode) {
    return (
      <div className="w-full">
        <label className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
          <span>Upload Design Screenshots</span>
          <span className="text-xs text-muted-foreground font-normal">
            {uploadedImages.length}/{MAX_IMAGES} images
          </span>
        </label>

        {/* Image grid */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            <AnimatePresence>
              {uploadedImages.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square border border-border bg-card overflow-hidden"
                >
                  <img
                    src={img.previewUrl}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-1 left-1 text-[10px] bg-foreground/80 text-background px-1.5 py-0.5 font-mono">
                    {idx + 1}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Upload area */}
        {uploadedImages.length < MAX_IMAGES && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <svg
              className="w-8 h-8 text-muted-foreground mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Click</span> or drag up to {MAX_IMAGES - uploadedImages.length} more
            </p>
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
      </div>
    );
  }

  // Single-image mode (original)
  return (
    <div className="w-full">
      <label className="text-sm font-semibold text-foreground mb-3 block">
        Upload Design Screenshot
      </label>

      {previewUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative border border-border overflow-hidden bg-card group cursor-pointer"
          onClick={handleClick}
        >
          <img
            src={previewUrl}
            alt="Design preview"
            className="w-full max-h-64 object-contain"
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-sm text-foreground font-medium px-4 py-2 bg-card border border-border">
              Change Image
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-muted-foreground"
          }`}
        >
          <svg
            className="w-10 h-10 text-muted-foreground mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, or WebP — max 10MB
          </p>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
