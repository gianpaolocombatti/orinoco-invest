'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn, validateEmail, validatePassword } from '@/lib/utils';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
    } catch (error: any) {
      setLoginError(
        error?.message || 'Error al iniciar sesión. Por favor intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-brand-primary to-brand-600 text-white px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Illustration/Graphic Area */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg
                className="w-12 h-12 md:w-16 md:h-16 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3a1 1 0 000 2h1.692L5 7v1a1 1 0 11-2 0V7a1 1 0 000-2H3zM16 16a2 2 0 11-4 0 2 2 0 014 0zM4 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Invierte desde $5
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Tu dinero, tu futuro. Accede a inversiones en dólares desde Venezuela.
            </p>
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="max-w-md mx-auto px-4 py-8 md:py-12">
        <Card className="bg-white shadow-lg">
          <h2 className="text-2xl font-bold text-surface-900 mb-6">
            Inicia sesión
          </h2>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 font-medium">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              error={errors.email}
              required
            />

            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                error={errors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-brand-primary hover:text-brand-700 font-medium mt-2"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              size="md"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-200">
            <p className="text-sm text-surface-600 text-center mb-4">
              ¿No tienes cuenta?{' '}
              <Link
                href="/registro"
                className="text-brand-primary hover:text-brand-700 font-semibold"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* Trust Indicators Section */}
      <div className="bg-white py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-surface-900 mb-10">
            ¿Por qué elegir Orinoco Invest?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inversiones en USD */}
            <Card className="bg-surface-50 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-brand-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.16 5a.75.75 0 00-.712 1.153l1.023 2.049h-1.539a.75.75 0 000 1.5h1.928a.75.75 0 00.712-1.153L8.627 6.5h1.539a.75.75 0 000-1.5H8.16z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-surface-900 mb-2">
                Inversiones en USD
              </h4>
              <p className="text-sm text-surface-600">
                Invierte en dólares estadounidenses con seguridad y confianza.
              </p>
            </Card>

            {/* Desde $5 dólares */}
            <Card className="bg-surface-50 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-brand-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.5 1.5H5.75A2.75 2.75 0 003 4.25v11.5A2.75 2.75 0 005.75 18.5h8.5A2.75 2.75 0 0017 15.75V4.25A2.75 2.75 0 0014.25 1.5h-3.75a.75.75 0 000 1.5h3.75c.69 0 1.25.56 1.25 1.25v11.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25V4.25c0-.69.56-1.25 1.25-1.25h3.75a.75.75 0 000-1.5z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-surface-900 mb-2">
                Desde $5 dólares
              </h4>
              <p className="text-sm text-surface-600">
                Comienza con inversiones pequeñas y accesibles para todos.
              </p>
            </Card>

            {/* Regulado en Panamá */}
            <Card className="bg-surface-50 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-brand-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 00-4.404 5.973c-.591.425-.982 1.145-.982 1.977 0 1.105.895 2 2 2h.75a.75.75 0 000-1.5H6.25a.5.5 0 010-1h10.5a.5.5 0 010 1h-.75a.75.75 0 000 1.5h.75a2 2 0 002-2c0-.832-.39-1.552-.982-1.977A4.5 4.5 0 0010 1zM5.5 13a3 3 0 01-3-3H2a4 4 0 004 4v-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-surface-900 mb-2">
                Regulado en Panamá
              </h4>
              <p className="text-sm text-surface-600">
                Cumplimos con todos los estándares regulatorios internacionales.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-900 text-white py-6 px-4 text-center text-sm">
        <p>© 2025 Orinoco Invest. Tu dinero va directo a un corredor regulado estadounidense.</p>
      </footer>
    </div>
  );
}
