import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useAppData } from '../../context/AppDataContext';
import { NotificationsBell } from './NotificationsBell';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Layout({ children, title, subtitle, action }: LayoutProps) {
  const { globalNotification } = useAppData();
  
  return (
    <div className="flex min-h-screen bg-zinc-50 relative">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 pr-4 pl-14 sm:px-8 py-3 sm:py-4 md:pl-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
              {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              {action && <div className="flex items-center gap-3">{action}</div>}
              <NotificationsBell />
            </div>
          </div>
        </header>
        {/* Content */}
        <div className="flex-1 p-4 sm:p-8 animate-fade-in-up overflow-x-hidden">
          {children}
        </div>
      </main>
      
      {/* Global Notification Toast */}
      {globalNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wide">{globalNotification}</span>
          </div>
        </div>
      )}
    </div>
  );
}
