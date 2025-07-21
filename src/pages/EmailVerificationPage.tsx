import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api';
import { getErrorMessage } from '@/services/api';
import { toastSuccess, toastError } from '@/utils/toast';
import logoSrc from '@/assets/logo.svg';

function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    setError('');
    
    try {
      const result = await apiClient.verifyEmail(verificationToken);
      setIsVerified(true);
      toastSuccess('Email успешно подтвержден!');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Email verification error:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError('Пожалуйста, введите ваш email');
      return;
    }

    setIsResending(true);
    setError('');
    
    try {
      await apiClient.resendVerificationEmail(email);
      toastSuccess('Письмо с подтверждением отправлено!');
    } catch (error) {
      console.error('Resend verification error:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-3 mb-6 hover:opacity-80">
              <img src={logoSrc} alt="ToonzyAI logo" className="w-9 h-9" />
              <span className="text-xl font-bold text-neutral-900">ToonzyAI</span>
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Email подтвержден!</h1>
            <p className="text-neutral-600">Ваш аккаунт успешно активирован</p>
          </div>

          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Подтверждение успешно!</h2>
              <p className="text-neutral-600">Теперь вы можете войти в свой аккаунт</p>
            </div>
            
            <Button
              onClick={() => navigate('/login')}
              className="w-full py-3 text-lg"
            >
              Перейти к входу
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6 hover:opacity-80">
            <img src={logoSrc} alt="ToonzyAI logo" className="w-9 h-9" />
            <span className="text-xl font-bold text-neutral-900">ToonzyAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Подтверждение Email</h1>
          <p className="text-neutral-600">Подтвердите ваш email для завершения регистрации</p>
        </div>

        <Card className="p-8">
          {isVerifying ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Проверяем ваш email...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-700 text-sm font-medium">
                    Ошибка подтверждения
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    {error}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-neutral-600 mb-4">
                  Мы отправили письмо с подтверждением на ваш email. 
                  Если вы не получили письмо, введите ваш email ниже и мы отправим его снова.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                      Email адрес
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <Button
                    onClick={resendVerification}
                    disabled={isResending}
                    className="w-full py-3 text-lg"
                  >
                    {isResending ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Отправка...</span>
                      </div>
                    ) : (
                      'Отправить письмо снова'
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-neutral-600">
                  Уже подтвердили email?{' '}
                  <Link
                    to="/login"
                    className="text-purple-600 hover:text-purple-500 font-medium transition-colors"
                  >
                    Войти
                  </Link>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default EmailVerificationPage; 