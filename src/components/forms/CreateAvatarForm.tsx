import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toastError } from '@/utils/toast';
import { useCreateAvatar } from '@/hooks/useAvatars';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

const createAvatarSchema = z.object({
  prompt: z.string().min(10, 'Description must contain at least 10 characters'),
});

type CreateAvatarFormData = z.infer<typeof createAvatarSchema>;

interface CreateAvatarFormProps {
  onSubmit: (data: CreateAvatarFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CreateAvatarForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  error = null 
}: CreateAvatarFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAvatarFormData>({
    resolver: zodResolver(createAvatarSchema),
  });

  const createAvatarMutation = useCreateAvatar();
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const handleFormSubmit = async (data: CreateAvatarFormData) => {
    try {
      await createAvatarMutation.mutateAsync({ prompt: data.prompt });
      onSubmit(data);
    } catch (error: any) {
      // Show modal if error 403
      if (error?.message?.includes('limit')) {
        setLimitModalOpen(true);
      } else {
        toastError(error.message || 'Error creating avatar');
      }
    }
  };

  const isLimitError = error?.includes('limit') || error?.includes('Limit');

  return (
    <>
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Avatar</h2>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Character Description
            </label>
            <Input
              id="prompt"
              type="text"
              placeholder="For example: Cute girl with long hair, anime style, smiling"
              {...register('prompt')}
              className={`w-full ${errors.prompt ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.prompt && (
              <p className="text-red-500 text-sm mt-1">{errors.prompt.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              The more detailed the description, the better the result
            </p>
          </div>

          {error && !isLimitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading || createAvatarMutation.isPending}
              className="flex-1 bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] hover:opacity-90 text-white py-3"
            >
              {isLoading || createAvatarMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Avatar'
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                disabled={isLoading || createAvatarMutation.isPending}
                className="px-6 py-3"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Modal
        open={limitModalOpen}
        title="Avatar Creation Limit"
        description="You have reached the limit for creating avatars. Please upgrade your plan to create more avatars."
        onClose={() => setLimitModalOpen(false)}
        confirmText="Got it"
      />
    </>
  );
} 