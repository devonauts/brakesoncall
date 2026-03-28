import { useRef, useState } from 'react';
import { Camera, Upload, X, Image } from 'lucide-react';
import { Button } from '../ui/Button';

interface PhotoCaptureProps {
  currentPhoto: string | null;
  onCapture: (file: File) => void;
  loading?: boolean;
}

export function PhotoCapture({ currentPhoto, onCapture, loading }: PhotoCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onCapture(file);
    }
  };

  const displayUrl = preview || currentPhoto;

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative group">
          <img
            src={displayUrl.startsWith('/') ? `http://localhost:5001${displayUrl}` : displayUrl}
            alt="Step photo"
            className="w-full h-48 object-cover rounded-xl border border-gray-200"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </div>
          <span className="text-sm font-medium">Take Photo or Upload</span>
        </button>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => fileRef.current?.click()}
          loading={loading}
        >
          <Camera className="w-4 h-4" />
          {currentPhoto ? 'Retake' : 'Capture'}
        </Button>
      </div>
    </div>
  );
}
