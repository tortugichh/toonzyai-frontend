import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

const createAvatarSchema = z.object({
  prompt: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description is too long (maximum 500 characters)')
    .refine((val) => val.trim().length >= 10, {
      message: 'Description cannot be only spaces'
    })
    .refine((val) => !/^\s*$/.test(val), {
      message: 'Please provide a meaningful description'
    })
    .refine((val) => {
      const words = val.trim().split(/\s+/).length;
      return words >= 3;
    }, {
      message: 'Description should contain at least 3 words'
    }),
});

type CreateAvatarFormData = z.infer<typeof createAvatarSchema>;

interface CreateAvatarFormProps {
  onSubmit: (data: CreateAvatarFormData) => void;
  onCancel: () => void;
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
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreateAvatarFormData>({
    resolver: zodResolver(createAvatarSchema),
    mode: 'onChange',
  });

  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [contentPolicyModalOpen, setContentPolicyModalOpen] = useState(false);
  const [contentPolicyError, setContentPolicyError] = useState<string>('');

  const watchedPrompt = watch('prompt', '');
  const characterCount = watchedPrompt.length;
  const wordCount = watchedPrompt.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleFormSubmit = (data: CreateAvatarFormData) => {
    onSubmit(data);
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  // Enhanced error handling
  const getErrorMessage = (error: string | null) => {
    if (!error) return null;

    // Content policy violations
    if (error.includes('content_policy_violation') || error.includes('inappropriate')) {
      setContentPolicyError(error);
      setContentPolicyModalOpen(true);
      return null;
    }

    // Generation limit
    if (error.includes('Only one avatar generation is available') || error.includes('limit')) {
      setLimitModalOpen(true);
      return null;
    }

    // Network/server errors
    if (error.includes('network') || error.includes('connection') || error.includes('timeout')) {
      return 'Connection error. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (error.includes('unauthorized') || error.includes('authentication')) {
      return 'Please log in again to continue.';
    }

    // Rate limiting
    if (error.includes('rate limit') || error.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Generic error
    return error;
  };

  const displayError = getErrorMessage(error);

  return (
    <>
      <Card className="mb-8 p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a New Avatar</h2>
        
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
              className={`w-full ${errors.prompt ? 'border-red-500 focus:border-red-500' : characterCount > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
            />
            
            {/* Character and word count */}
            <div className="flex justify-between items-center mt-1">
              <div className="flex space-x-4 text-xs">
                <span className={`${characterCount < 10 ? 'text-red-500' : characterCount >= 50 ? 'text-green-500' : 'text-gray-500'}`}>
                  {characterCount}/500 characters
                </span>
                <span className={`${wordCount < 3 ? 'text-red-500' : wordCount >= 10 ? 'text-green-500' : 'text-gray-500'}`}>
                  {wordCount} words
                </span>
              </div>
              {characterCount > 0 && (
                <span className={`text-xs ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                  {isValid ? '✓ Valid' : '✗ Invalid'}
                </span>
              )}
            </div>

            {errors.prompt && (
              <p className="text-red-500 text-sm mt-1">{errors.prompt.message}</p>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              The more detailed the description, the better the result. Include details like appearance, style, mood, and clothing.
            </p>
          </div>

          {/* Enhanced error display */}
          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 text-sm font-medium">Error</p>
                  <p className="text-red-600 text-sm mt-1">{displayError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Avatar'
              )}
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              disabled={isLoading}
              className="px-6 py-3"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Generation Limit Modal */}
      <Modal
        open={limitModalOpen}
        title="Avatar Generation Limit"
        description="You have reached the limit for avatar generation. You can still create unlimited stories and videos."
        onClose={() => setLimitModalOpen(false)}
        confirmText="Got it"
      />

      {/* Content Policy Modal */}
      <Modal
        open={contentPolicyModalOpen}
        title="Content Policy Violation"
        description={contentPolicyError || "Your description contains content that violates our community guidelines. Please revise your description to be more appropriate."}
        onClose={() => setContentPolicyModalOpen(false)}
        confirmText="I understand"
      />
    </>
  );
}
