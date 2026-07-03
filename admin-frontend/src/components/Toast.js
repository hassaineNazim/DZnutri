import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

// Système de toasts minimaliste (remplace les `alert()` bloquants).
// Usage : const toast = useToast(); toast.success("Fait !");

const ToastContext = createContext(null);

const STYLES = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-gray-800',
};

const ICONS = {
    success: CheckCircle,
    error: AlertTriangle,
    info: Info,
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((type, message) => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => dismiss(id), 4500);
    }, [dismiss]);

    const value = {
        success: (msg) => push('success', msg),
        error: (msg) => push('error', msg),
        info: (msg) => push('info', msg),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
                {toasts.map((t) => {
                    const Icon = ICONS[t.type] || Info;
                    return (
                        <div
                            key={t.id}
                            className={`${STYLES[t.type] || STYLES.info} text-white rounded-lg shadow-lg px-4 py-3 flex items-start text-sm animate-[fadeIn_.2s_ease-out]`}
                        >
                            <Icon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="flex-1">{t.message}</span>
                            <button onClick={() => dismiss(t.id)} className="ml-2 opacity-70 hover:opacity-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Filet de sécurité si un composant est rendu hors provider.
        return { success: () => {}, error: () => {}, info: () => {} };
    }
    return ctx;
};
