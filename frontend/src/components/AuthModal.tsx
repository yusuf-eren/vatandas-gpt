import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, User, AlertCircle } from 'lucide-react';
import api from '@/config/api';
import { AxiosError } from 'axios';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/register';
      const body = { 
        email: formData.email, 
        password: formData.password 
      };

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store JWT token in localStorage
      localStorage.setItem('jwt', data.jwt);

      // Close modal
      onClose();

      // Reset form
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      setError(
        (err as Error).message || t('auth.authFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({ name: '', email: '', password: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 md:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 md:w-20 h-16 md:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <User className="w-8 md:w-10 h-8 md:h-10 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Header */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccountModal')}
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {isLogin ? t('auth.signInToContinue') : t('auth.joinToday')}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left"
                  >
                    {t('auth.fullName')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-11 md:h-12"
                    placeholder={t('auth.fullNamePlaceholder')}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left"
                >
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-11 md:h-12"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left"
                >
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-11 md:h-12"
                  placeholder={t('auth.passwordPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl h-11 md:h-12 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isLogin
                      ? t('auth.signingInModal')
                      : t('auth.creatingAccount')}
                  </div>
                ) : isLogin ? (
                  t('auth.signIn')
                ) : (
                  t('auth.createAccount')
                )}
              </button>

              {/* Toggle mode button */}
              <button
                type="button"
                onClick={toggleMode}
                className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl h-11 md:h-12 font-semibold text-sm md:text-base border border-gray-200 dark:border-gray-700 transition-colors"
              >
                {isLogin
                  ? t('auth.dontHaveAccount') + ' ' + t('auth.signUpModal')
                  : t('auth.alreadyHaveAccount') + ' ' + t('auth.signInModal')}
              </button>
            </div>
          </form>

          {/* Privacy note */}
          <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
            {isLogin ? t('auth.signInToContinue') : t('auth.joinToday')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
