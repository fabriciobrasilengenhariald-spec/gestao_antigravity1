import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <CheckCircle className="text-green-600" size={20} />,
        warning: <AlertTriangle className="text-amber-600" size={20} />,
        error: <XCircle className="text-red-600" size={20} />,
        info: <Info className="text-blue-600" size={20} />,
    };

    const colors = {
        success: 'bg-white border-green-200 shadow-green-100',
        warning: 'bg-white border-amber-200 shadow-amber-100',
        error: 'bg-white border-red-200 shadow-red-100',
        info: 'bg-white border-blue-200 shadow-blue-100',
    };

    return (
        <div className={`
      flex items-center gap-3 p-4 rounded-2xl border shadow-xl 
      animate-toast-in pointer-events-auto min-w-[300px]
      ${colors[type]}
    `}>
            <div className="shrink-0">{icons[type]}</div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
