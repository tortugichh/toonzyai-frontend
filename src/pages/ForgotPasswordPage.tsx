import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import logoSrc from '@/assets/logo.svg';
import { apiClient } from '@/services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await apiClient.forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success('Password reset instructions have been sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('An error occurred while sending the email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-3 mb-6 hover:opacity-80">
              <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10" />
              <span className="text-2xl font-bold text-neutral-900">ToonzyAI</span>
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Check Your Email</h1>
            <p className="text-neutral-600">We’ve sent you password reset instructions</p>
          </div>

          <Card className="p-10 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Email Sent!</h2>
              <p className="text-neutral-600">
                We’ve sent password reset instructions to your email address.
                Please check your inbox and follow the instructions in the email.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                className="w-full"
              >
                Back to Login
              </Button>
              
              <p className="text-sm text-neutral-500">
                Didn’t receive the email?{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-brand hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6 hover:opacity-80">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-neutral-900">ToonzyAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Forgot Password?</h1>
          <p className="text-neutral-600">Enter your email to reset your password</p>
        </div>

        <Card className="p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full py-3 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-700"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Instructions'
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Remembered your password?{' '}
              <Link
                to="/login"
                className="text-brand hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-neutral-500 hover:text-neutral-700 inline-flex items-center space-x-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
