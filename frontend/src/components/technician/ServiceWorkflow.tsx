import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { servicesApi } from '../../api/services';
import client from '../../api/client';
import { StepCard } from './StepCard';
import { PageSpinner } from '../ui/Spinner';

interface ServiceWorkflowProps {
  bookingId: number;
}

export function ServiceWorkflow({ bookingId }: ServiceWorkflowProps) {
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ['service-record', bookingId],
    queryFn: () => servicesApi.getRecord(bookingId),
  });

  const steps = record?.steps || [];
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const activeStep = steps.find((s) => s.status !== 'completed');
  const allCompleted = steps.length > 0 && completedCount === steps.length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  const handleUpdateStep = async (stepId: number, data: { status?: string; notes?: string }) => {
    await client.put(`/service-steps/${stepId}`, data);
    queryClient.invalidateQueries({ queryKey: ['service-record', bookingId] });
  };

  const handleUploadPhoto = async (stepId: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    await client.post(`/service-steps/${stepId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    queryClient.invalidateQueries({ queryKey: ['service-record', bookingId] });
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Service Progress</h2>
          <span className="text-sm font-semibold text-gray-500">
            {completedCount} / {steps.length} steps
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {allCompleted && (
          <div className="mt-4 flex items-center gap-2 text-green-600 font-semibold">
            <CheckCircle className="w-5 h-5" />
            All steps completed! Service is done.
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            isActive={activeStep?.id === step.id}
            onUpdateStep={handleUpdateStep}
            onUploadPhoto={handleUploadPhoto}
          />
        ))}
      </div>
    </div>
  );
}
