import { useState } from 'react';
import { CheckCircle, Circle, Play, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { PhotoCapture } from './PhotoCapture';
import type { ServiceStep } from '../../types';

interface StepCardProps {
  step: ServiceStep;
  isActive: boolean;
  onUpdateStep: (stepId: number, data: { status?: string; notes?: string }) => Promise<void>;
  onUploadPhoto: (stepId: number, file: File) => Promise<void>;
}

export function StepCard({ step, isActive, onUpdateStep, onUploadPhoto }: StepCardProps) {
  const [notes, setNotes] = useState(step.notes || '');
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try {
      await onUploadPhoto(step.id, file);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onUpdateStep(step.id, { status: 'completed', notes });
    } finally {
      setCompleting(false);
    }
  };

  const statusIcon = {
    completed: <CheckCircle className="w-6 h-6 text-green-500" />,
    in_progress: <Play className="w-6 h-6 text-brand-500" />,
    pending: <Circle className="w-6 h-6 text-gray-300" />,
  }[step.status];

  return (
    <div
      className={clsx(
        'rounded-2xl border-2 p-6 transition-all',
        step.status === 'completed'
          ? 'border-green-200 bg-green-50'
          : isActive
          ? 'border-brand-500 bg-white shadow-lg shadow-brand-500/10'
          : 'border-gray-200 bg-gray-50 opacity-60'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5">{statusIcon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Step {step.step_number}</span>
            {step.status === 'completed' && (
              <span className="text-xs text-green-600 font-semibold">Completed</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{step.description}</p>

          {/* Active step content */}
          {isActive && step.status !== 'completed' && (
            <div className="mt-6 space-y-4">
              {/* Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Photo Documentation
                </label>
                <PhotoCapture
                  currentPhoto={step.photo_url}
                  onCapture={handlePhoto}
                  loading={uploading}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 text-sm"
                  rows={2}
                  placeholder="Any observations or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleComplete}
                loading={completing}
              >
                <CheckCircle className="w-5 h-5" />
                Mark Step Complete
              </Button>
            </div>
          )}

          {/* Completed step photo thumbnail */}
          {step.status === 'completed' && step.photo_url && (
            <div className="mt-3">
              <img
                src={step.photo_url.startsWith('/') ? `http://localhost:5001${step.photo_url}` : step.photo_url}
                alt={step.title}
                className="w-24 h-24 object-cover rounded-lg border border-green-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
