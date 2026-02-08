import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface ImageUploadProps {
  onImageSelect: (base64: string, previewUrl: string) => void;
  previewUrl: string | null;
}

const ImageUpload = ({ onImageSelect, previewUrl }: ImageUploadProps) => {
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

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
            <span className="text-primary font-medium">Click to upload</span> or
            drag & drop
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
