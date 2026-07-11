import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Layout({ children, title, subtitle, action }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* On mobile, we need bottom padding to avoid the content hiding behind the bottom nav. On desktop, pb-0. */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
          </div>
        </header>
        {/* Content */}
        <div className="flex-1 p-4 sm:p-8 animate-fade-in-up overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
