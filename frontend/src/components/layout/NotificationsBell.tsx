import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationsBell() {
  const { appNotifications, markNotificationsAsRead, clearNotifications } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = appNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden z-50 animate-fade-in-up origin-top-right">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900">Notificaciones</h3>
            {appNotifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="text-xs text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {appNotifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-50">
                {appNotifications.map(notification => (
                  <li key={notification.id} className={`p-4 transition-colors hover:bg-zinc-50 ${!notification.read ? 'bg-amber-50/30' : ''}`}>
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!notification.read ? 'bg-amber-500' : 'bg-transparent'}`} />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 leading-none mb-1">{notification.title}</p>
                        <p className="text-sm text-zinc-600 leading-relaxed mb-2">{notification.message}</p>
                        <p className="text-xs text-zinc-400 font-medium">
                          {formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
