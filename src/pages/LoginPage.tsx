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
  username: z.string().min(1, 'Имя пользователя обязательно'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Sending login data:', data);
      await loginMutation.mutateAsync(data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check if the error is about email verification
      if (errorMessage.includes('verify your email')) {
        toast.error('Пожалуйста, подтвердите ваш email перед входом. Проверьте вашу почту или запросите новое письмо с подтверждением.');
      } else {
        console.error('Detailed error:', errorMessage);
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Вход</h1>
          <p className="text-neutral-600">Введите данные аккаунта</p>
        </div>

        <Card className="p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                Имя пользователя
              </label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                {...register('username')}
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  {...register('password')}
                  className={`w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
            </div>

            {/* Error Message */}
            {loginMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">
                  Ошибка входа
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {getErrorMessage(loginMutation.error)}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              size="lg"
              className="w-full py-3 text-lg"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-700"></div>
                  <span>Вход...</span>
                </div>
              ) : (
                'Войти'
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
                <span className="px-2 bg-white text-neutral-500">или</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Нет аккаунта?{' '}
              <Link
                to="/register"
                className="text-brand hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
            <p className="text-neutral-600 mt-2">
              Не получили письмо с подтверждением?{' '}
              <Link
                to="/verify-email"
                className="text-brand hover:underline"
              >
                Проверить статус
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
            <span>На главную</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 