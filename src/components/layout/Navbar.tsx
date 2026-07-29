'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  const getInitials = () => {
    if (!user) return '';
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-surface-200 shadow-sm">
        <div className="container-safe flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg gradient-primary text-white font-bold text-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h-6m0 0H0"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-surface-900">Orinoco</span>
              <span className="text-xs text-brand-500 font-medium">Invest</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive('/dashboard')
                      ? 'text-brand-primary border-b-2 border-brand-primary'
                      : 'text-surface-600 hover:text-brand-primary'
                  )}
                >
                  Panel
                </Link>
                <Link
                  href="/depositar"
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive('/depositar')
                      ? 'text-brand-primary border-b-2 border-brand-primary'
                      : 'text-surface-600 hover:text-brand-primary'
                  )}
                >
                  Depositar
                </Link>
                <Link
                  href="/retirar"
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive('/retirar')
                      ? 'text-brand-primary border-b-2 border-brand-primary'
                      : 'text-surface-600 hover:text-brand-primary'
                  )}
                >
                  Retirar
                </Link>
                <Link
                  href="/historial"
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive('/historial')
                      ? 'text-brand-primary border-b-2 border-brand-primary'
                      : 'text-surface-600 hover:text-brand-primary'
                  )}
                >
                  Historial
                </Link>
                <Link
                  href="/perfil"
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive('/perfil')
                      ? 'text-brand-primary border-b-2 border-brand-primary'
                      : 'text-surface-600 hover:text-brand-primary'
                  )}
                >
                  Perfil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive('/') ? 'text-brand-primary' : 'text-surface-600 hover:text-brand-primary'
                  )}
                >
                  Inicio
                </Link>
                <Link href="/" className="btn-primary">
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>

          {/* User Avatar / Hamburger Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center font-bold text-sm">
                  {getInitials()}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-surface-100 transition-colors"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6 text-surface-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-surface-200 bg-white animate-slide-up">
            <div className="container-safe py-4 flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b border-surface-200">
                    <div className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center font-bold">
                      {getInitials()}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="text-xs text-surface-500">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-brand-primary transition-colors"
                  >
                    Panel
                  </Link>
                  <Link
                    href="/depositar"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-brand-primary transition-colors"
                  >
                    Depositar
                  </Link>
                  <Link
                    href="/retirar"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-brand-primary transition-colors"
                  >
                    Retirar
                  </Link>
                  <Link
                    href="/historial"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-brand-primary transition-colors"
                  >
                    Historial
                  </Link>
                  <Link
                    href="/perfil"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-brand-primary transition-colors"
                  >
                    Perfil
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="mt-4 px-4 py-3 rounded-lg text-danger hover:bg-red-50 transition-colors font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-brand-primary transition-colors"
                  >
                    Inicio
                  </Link>
                  <Link href="/" onClick={closeMenu} className="btn-primary text-center">
                    Iniciar Sesión
                  </Link>
                  <Link href="/registro" onClick={closeMenu} className="btn-secondary text-center">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile menu backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 z-30 bg-black bg-opacity-30"
          onClick={closeMenu}
        />
      )}
    </>
  );
};

export default Navbar;
