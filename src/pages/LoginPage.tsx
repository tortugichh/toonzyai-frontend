import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/api';
import { toast } from 'react-hot-toast';
import logoSrc from '@/assets/logo.svg';

const loginSchema = z.object({
  login: z.string()
    .min(1, 'Username or Email is required')
    .max(100, 'Username or Email is too long'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password is too long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const watchedLogin = watch('login', '');
  const watchedPassword = watch('password', '');

  const getSpecificErrorMessage = (error: any): string => {
    const errorMessage = getErrorMessage(error);
    
    // Email verification errors
    if (errorMessage.includes('verify your email') || errorMessage.includes('email verification')) {
      return 'Please verify your email before logging in. Check your inbox or request a new verification email.';
    }
    
    // Invalid credentials
    if (errorMessage.includes('invalid') && (errorMessage.includes('password') || errorMessage.includes('credentials'))) {
      return 'Invalid username/email or password. Please check your credentials and try again.';
    }
    
    // Account not found
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return 'Account not found. Please check your username/email or create a new account.';
    }
    
    // Account locked/suspended
    if (errorMessage.includes('locked') || errorMessage.includes('suspended') || errorMessage.includes('disabled')) {
      return 'Your account has been temporarily suspended. Please contact support for assistance.';
    }
    
    // Network/connection errors
    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment before trying again.';
    }
    
    // Server errors
    if (errorMessage.includes('server error') || errorMessage.includes('internal error')) {
      return 'Server error. Please try again later.';
    }
    
    return errorMessage;
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Sending login data:', data);
      setLoginAttempts(prev => prev + 1);
      await loginMutation.mutateAsync(data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const specificError = getSpecificErrorMessage(error);
      
      // Show different messages based on error type
      if (specificError.includes('verify your email')) {
        toast.error(specificError, {
          duration: 6000,
          icon: '📧',
        });
      } else if (specificError.includes('Invalid username/email or password')) {
        toast.error(specificError, {
          duration: 4000,
          icon: '🔒',
        });
      } else {
        toast.error(specificError, {
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6 hover:opacity-80">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-neutral-900">ToonzyAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Log In</h1>
          <p className="text-neutral-600">Enter your account details</p>
        </div>

        <Card className="p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Login Field */}
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-neutral-700 mb-2">
                Username or Email
              </label>
              <Input
                id="login"
                type="text"
                placeholder="username or email"
                {...register('login')}
                className={`${errors.login ? 'border-red-500 focus:border-red-500' : watchedLogin.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
              />
              {errors.login && (
                <p className="text-red-500 text-sm mt-1">{errors.login.message}</p>
              )}
              {watchedLogin.length > 0 && !errors.login && (
                <p className="text-green-500 text-xs mt-1">✓ Valid format</p>
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
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`w-full pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : watchedPassword.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700"
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
                <p className="text-green-500 text-xs mt-1">✓ Password format is valid</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-brand hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Attempts Warning */}
            {loginAttempts >= 3 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-yellow-700 text-sm font-medium">Multiple Login Attempts</p>
                    <p className="text-yellow-600 text-sm mt-1">
                      You've made several login attempts. If you're having trouble, try resetting your password.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending || !isValid}
              size="lg"
              className="w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-700"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Log In'
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

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
