'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      href: '/dashboard',
      icon: (active) => (
        <svg
          className={cn('w-6 h-6', active ? 'text-brand-primary' : 'text-surface-500')}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 4v4m0 0H9m3 0h3"
          />
        </svg>
      ),
    },
    {
      id: 'depositar',
      label: 'Depositar',
      href: '/depositar',
      icon: (active) => (
        <svg
          className={cn('w-6 h-6', active ? 'text-brand-primary' : 'text-surface-500')}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    {
      id: 'portafolios',
      label: 'Portafolio',
      href: '/portafolios',
      icon: (active) => (
        <svg
          className={cn('w-6 h-6', active ? 'text-brand-primary' : 'text-surface-500')}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'historial',
      label: 'Historial',
      href: '/historial',
      icon: (active) => (
        <svg
          className={cn('w-6 h-6', active ? 'text-brand-primary' : 'text-surface-500')}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'perfil',
      label: 'Perfil',
      href: '/perfil',
      icon: (active) => (
        <svg
          className={cn('w-6 h-6', active ? 'text-brand-primary' : 'text-surface-500')}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 shadow-up z-30">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-surface-50"
              title={item.label}
            >
              {item.icon(active)}
              <span
                className={cn(
                  'text-xs font-medium',
                  active ? 'text-brand-primary' : 'text-surface-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
