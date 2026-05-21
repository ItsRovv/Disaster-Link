import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISASTER_TYPES, PRIORITY_LEVELS } from '../../data/mockData';

function Toast({ toast }) {
  const { dispatch } = useApp();
  const dt = DISASTER_TYPES[toast.type];
  const p = PRIORITY_LEVELS[toast.priority];

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div className="flex items-start gap-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-[300px] toast-enter">
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: dt?.lightColor || '#f3f4f6' }}
      >
        {dt?.icon || '⚠️'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide animate-pulse">
            ● New Incident
          </span>
          {p && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.tailwind.bg} ${p.tailwind.text}`}>
              {p.label}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{toast.title}</p>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{toast.location}</p>
      </div>

      <button
        onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
        className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { state } = useApp();
  const toasts = state.toasts || [];

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[5.5rem] right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
