// Prueba de color amarillo para Git
import React, { type ReactNode } from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

type AlertType = 'note' | 'warning' | 'critical';

interface AlertBoxProps {
  type: AlertType;
  title: string;
  children: ReactNode;
  className?: string;
}

const config: Record<AlertType, { border: string; bg: string; icon: ReactNode; titleColor: string; textColor: string }> = {
  note: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    icon: <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />,
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
  },
  warning: {
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    icon: <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />,
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
  },
  critical: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    icon: <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />,
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
  },
};

export function AlertBox({ type, title, children, className = '' }: AlertBoxProps) {
  const c = config[type];
  return (
    <div className={`border-l-4 ${c.border} ${c.bg} rounded-r-lg p-4 ${className}`}>
      <div className="flex gap-3">
        {c.icon}
        <div>
          <p className={`text-sm font-semibold ${c.titleColor}`}>{title}</p>
          <div className={`text-sm ${c.textColor} mt-0.5`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
