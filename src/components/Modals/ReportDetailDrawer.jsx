import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  X, MapPin, Clock, User, ThumbsUp, CheckCircle, XCircle, AlertCircle,
  ShieldCheck, ShieldX, Navigation,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISASTER_TYPES, STATUSES, ROLES, PRIORITY_LEVELS } from '../../data/mockData';

export default function ReportDetailDrawer({ onNavigateToMap }) {
  const { state, dispatch } = useApp();
  const { detailReportId, currentUser } = state;

  const report = detailReportId
    ? state.reports.find(r => r.id === detailReportId)
    : null;

  const isOpen = !!report;
  const canModerate = currentUser && ['lgu', 'barangay', 'agency'].includes(currentUser.role);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dispatch({ type: 'CLOSE_DETAIL' }); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const dt = DISASTER_TYPES[report.type];
  const s = STATUSES[report.status];
  const p = PRIORITY_LEVELS[report.priority];
  const roleInfo = ROLES[report.reporterRole];

  const handleViewOnMap = () => {
    dispatch({ type: 'SELECT_REPORT', payload: report });
    dispatch({ type: 'CLOSE_DETAIL' });
    onNavigateToMap?.();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 modal-backdrop"
        onClick={() => dispatch({ type: 'CLOSE_DETAIL' })}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col drawer-slide-in overflow-hidden">

        {/* Colored header */}
        <div
          className="flex items-start justify-between px-4 py-4 flex-shrink-0"
          style={{ backgroundColor: dt?.lightColor || '#f3f4f6' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl flex-shrink-0"
              style={{ backgroundColor: (dt?.color || '#6b7280') + '22' }}
            >
              {dt?.icon || '⚠️'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm" style={{ color: dt?.textColor || '#374151' }}>
                {dt?.label || 'Incident'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s?.tailwind.bg} ${s?.tailwind.text} ${s?.tailwind.border}`}
                >
                  {report.status === 'verified'
                    ? <CheckCircle className="w-2.5 h-2.5" />
                    : report.status === 'false_alarm'
                    ? <XCircle className="w-2.5 h-2.5" />
                    : <AlertCircle className="w-2.5 h-2.5" />}
                  {s?.label}
                </span>
                {p && (
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${p.tailwind.bg} ${p.tailwind.text}`}>
                    {p.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLOSE_DETAIL' })}
            className="p-1.5 rounded-lg hover:bg-black/10 text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {report.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {report.description}
            </p>

            <div className="border-t border-gray-100" />

            {/* Meta info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">{report.location}</p>
                  {(report.barangay || report.municipality) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {report.barangay ? `Brgy. ${report.barangay}, ` : ''}{report.municipality}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm text-gray-700">{report.reportedBy}</span>
                  {roleInfo && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${roleInfo.bg} ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ThumbsUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {report.upvotes} confirmation{report.upvotes !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'UPVOTE_REPORT', payload: report.id })}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors border border-indigo-100"
                  >
                    <ThumbsUp className="w-3 h-3" /> Confirm
                  </button>
                </div>
              </div>

              {report.coordinates && (
                <div className="flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-mono">
                    {report.coordinates[0].toFixed(4)}°N, {report.coordinates[1].toFixed(4)}°E
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* View on Map */}
            <button
              onClick={handleViewOnMap}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm py-2.5 rounded-xl transition-colors border border-indigo-100"
            >
              <Navigation className="w-4 h-4" />
              View on Map
            </button>

            {/* Moderation actions */}
            {canModerate && report.status === 'unverified' && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Moderation</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      dispatch({ type: 'VERIFY_REPORT', payload: report.id });
                      dispatch({ type: 'CLOSE_DETAIL' });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-sm py-2.5 rounded-xl transition-colors border border-green-200"
                  >
                    <ShieldCheck className="w-4 h-4" /> Verify
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'REJECT_REPORT', payload: report.id });
                      dispatch({ type: 'CLOSE_DETAIL' });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-sm py-2.5 rounded-xl transition-colors border border-gray-200"
                  >
                    <ShieldX className="w-4 h-4" /> False Alarm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
