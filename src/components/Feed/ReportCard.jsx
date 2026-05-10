import { formatDistanceToNow } from 'date-fns';
import {
  MapPin, Clock, User, ThumbsUp, CheckCircle, XCircle, AlertCircle,
  ShieldCheck, ShieldX, Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISASTER_TYPES, STATUSES, ROLES } from '../../data/mockData';

function TypeBadge({ type }) {
  const dt = DISASTER_TYPES[type];
  if (!dt) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: dt.lightColor, color: dt.textColor }}
    >
      {dt.icon} {dt.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUSES[status];
  if (!s) return null;
  const Icon =
    status === 'verified' ? CheckCircle :
    status === 'false_alarm' ? XCircle :
    AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.tailwind.bg} ${s.tailwind.text} ${s.tailwind.border}`}
    >
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function RoleBadge({ role }) {
  const r = ROLES[role];
  if (!r) return null;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${r.bg} ${r.color}`}>
      {r.label}
    </span>
  );
}

export default function ReportCard({ report, compact = false, showActions = false }) {
  const { dispatch, state } = useApp();
  const { currentUser } = state;
  const canModerate = currentUser && ['lgu', 'barangay', 'agency'].includes(currentUser.role);

  const dt = DISASTER_TYPES[report.type];
  const leftBorderColor = dt?.color || '#6b7280';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden fade-in card-hover ${compact ? 'text-xs' : ''}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: leftBorderColor }}
    >
      <div className={compact ? 'p-3' : 'p-4'}>
        {/* Top row: badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <TypeBadge type={report.type} />
          <StatusBadge status={report.status} />
        </div>

        {/* Title */}
        <h3 className={`font-bold text-gray-900 leading-snug mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
          {report.title}
        </h3>

        {/* Description */}
        {!compact && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
            {report.description}
          </p>
        )}

        {/* Meta info */}
        <div className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {report.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 flex-shrink-0" /> {report.reportedBy}
            <RoleBadge role={report.reporterRole} />
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
          {/* Upvote */}
          <button
            onClick={() => dispatch({ type: 'UPVOTE_REPORT', payload: report.id })}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="font-medium">{report.upvotes}</span>
            <span>confirm</span>
          </button>

          {/* Government moderation actions */}
          {(showActions || canModerate) && report.status === 'unverified' && (
            <div className="flex gap-1.5">
              <button
                onClick={() => dispatch({ type: 'VERIFY_REPORT', payload: report.id })}
                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-lg transition-colors border border-green-200"
              >
                <ShieldCheck className="w-3 h-3" /> Verify
              </button>
              <button
                onClick={() => dispatch({ type: 'REJECT_REPORT', payload: report.id })}
                className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-lg transition-colors border border-gray-200"
              >
                <ShieldX className="w-3 h-3" /> False Alarm
              </button>
            </div>
          )}

          {/* Show verified badge if already verified — only on full cards */}
          {!compact && report.status === 'verified' && (
            <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Verified</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
