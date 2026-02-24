import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, Clock, Check } from 'lucide-react';
import { ToastType } from './Toast';

export interface Notification {
    id: string;
    type: ToastType;
    message: string;
    timestamp: Date;
}

interface NotificationCenterProps {
    notifications: Notification[];
    unreadCount: number;
    onClearUnread: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    unreadCount,
    onClearUnread
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            onClearUnread();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const icons = {
        success: <CheckCircle className="text-green-500" size={16} />,
        warning: <AlertTriangle className="text-amber-500" size={16} />,
        error: <XCircle className="text-red-500" size={16} />,
        info: <Info className="text-blue-500" size={16} />,
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`p-2 rounded-full transition-all relative ${isOpen ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
                    }`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[120] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">Notificações Recentes</h3>
                        {unreadCount === 0 && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Check size={10} /> Em dia
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="text-slate-300" size={20} />
                                </div>
                                <p className="text-xs text-slate-500">Nenhuma notificação por aqui.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3">
                                        <div className="shrink-0 mt-0.5">{icons[notif.type]}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                                                <Clock size={10} />
                                                {notif.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                Exibindo as últimas {notifications.length}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
