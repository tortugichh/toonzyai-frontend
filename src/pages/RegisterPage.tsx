import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRegister } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/api';
import { toastSuccess } from '@/utils/toast';
import { trackSignUp } from '@/utils/analytics';
import { toast } from 'react-hot-toast';
import logoSrc from '@/assets/logo.svg';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .refine((val) => !val.includes(' '), {
      message: 'Username cannot contain spaces'
    }),
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
    .min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const watchedUsername = watch('username', '');
  const watchedEmail = watch('email', '');
  const watchedPassword = watch('password', '');
  const watchedConfirmPassword = watch('confirmPassword', '');

  const getSpecificErrorMessage = (error: any): string => {
    const errorMessage = getErrorMessage(error);
    
    // Username already exists
    if (errorMessage.includes('username') && errorMessage.includes('already exists')) {
      return 'This username is already taken. Please choose a different username.';
    }
    
    // Email already exists
    if (errorMessage.includes('email') && errorMessage.includes('already exists')) {
      return 'This email is already registered. Please use a different email or try logging in.';
    }
    
    // Weak password
    if (errorMessage.includes('password') && errorMessage.includes('weak')) {
      return 'Password is too weak. Please choose a stronger password with uppercase, lowercase, and numbers.';
    }
    
    // Invalid email format
    if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
      return 'Please enter a valid email address.';
    }
    
    // Network/connection errors
    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'Too many registration attempts. Please wait a moment before trying again.';
    }
    
    // Server errors
    if (errorMessage.includes('server error') || errorMessage.includes('internal error')) {
      return 'Server error. Please try again later.';
    }
    
    return errorMessage;
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      console.log('Sending registration data:', registerData);

      await registerMutation.mutateAsync(registerData);

      trackSignUp('email');

      toastSuccess('Registration successful! Please check your email to verify your account.');
      navigate('/verify-email');
    } catch (error) {
      console.error('Registration error:', error);
      const specificError = getSpecificErrorMessage(error);
      
      // Show different toast messages based on error type
      if (specificError.includes('username') && specificError.includes('already taken')) {
        toast.error(specificError, {
          duration: 5000,
          icon: '👤',
        });
      } else if (specificError.includes('email') && specificError.includes('already registered')) {
        toast.error(specificError, {
          duration: 5000,
          icon: '📧',
        });
      } else {
        toast.error(specificError, {
          duration: 5000,
        });
      }
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 8) return { strength: 'Weak', color: 'text-red-500' };
    if (password.length < 12) return { strength: 'Fair', color: 'text-yellow-500' };
    if (password.length < 16) return { strength: 'Good', color: 'text-blue-500' };
    return { strength: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(watchedPassword);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6 hover:opacity-80">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-neutral-900">ToonzyAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
          <p className="text-neutral-600">Join ToonzyAI to start creating amazing content</p>
        </div>

        <Card className="p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                {...register('username')}
                className={`${errors.username ? 'border-red-500 focus:border-red-500' : watchedUsername.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
              {watchedUsername.length > 0 && !errors.username && (
                <p className="text-green-500 text-xs mt-1">✓ Username format is valid</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Username can contain letters, numbers, underscores, and hyphens
              </p>
            </div>

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
                className={`${errors.email ? 'border-red-500 focus:border-red-500' : watchedEmail.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
              {watchedEmail.length > 0 && !errors.email && (
                <p className="text-green-500 text-xs mt-1">✓ Valid email format</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  className={`w-full pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : watchedPassword.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L9.878 9.878m4.242 4.242L12 12m2.121-2.122l2.122-2.122M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
              {watchedPassword.length > 0 && !errors.password && (
                <div className="flex items-center space-x-2 mt-1">
                  <p className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.strength}
                  </p>
                  <p className="text-green-500 text-xs">✓ Password meets requirements</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must contain at least 8 characters, including uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  {...register('confirmPassword')}
                  className={`w-full pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : watchedConfirmPassword.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L9.878 9.878m4.242 4.242L12 12m2.121-2.122l2.122-2.122M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
              {watchedConfirmPassword.length > 0 && !errors.confirmPassword && watchedPassword === watchedConfirmPassword && (
                <p className="text-green-500 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Error Message */}
            {registerMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">
                  Registration Error
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {getErrorMessage(registerMutation.error)}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={registerMutation.isPending || !isValid}
              className="w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-700"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">or</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="text-brand hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors inline-flex items-center space-x-1"
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

export default RegisterPage;
