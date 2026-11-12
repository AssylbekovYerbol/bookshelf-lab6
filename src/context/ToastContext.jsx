import { createContext, useContext, useEffect, useState } from 'react';
import Toast from '../components/Toast.jsx';

const ToastContext = createContext(null);

/** Lives in the layout, so a toast survives navigation (e.g. "book deleted" after leaving the detail page). */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // A new toast object restarts the timer; cleanup clears the previous one.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message, tone = 'success') {
    setToast({ message, tone });
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
