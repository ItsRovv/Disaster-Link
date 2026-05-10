import { X, Siren, Users, Megaphone, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DISASTER_TYPES, PRIORITY_LEVELS } from '../data/mockData';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-green-100 text-green-700 border-green-200',
};

/* Shared card — same circle size for every item */
function AlertCard({ circleContent, circleBg, ping, title, sub, location, badgeLabel, badgeStyle, time, reporter, onClick, critical }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left group shadow-sm hover:shadow-md ${
        critical
          ? 'border-red-400 bg-red-50 hover:border-red-500'
          : 'border-gray-200 bg-white hover:border-indigo-300'
      }`}
    >
      {/* Circle — identical size for every card */}
      <div className="relative flex-shrink-0 w-12 h-12">
        {ping && <span className="absolute inset-0 rounded-full opacity-40 animate-ping" style={{ backgroundColor: circleBg }} />}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl leading-none shadow-sm"
          style={{ backgroundColor: circleBg + '33' /* 20% tint */ }}
        >
          {circleContent}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{title}</p>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 flex-shrink-0 mt-0.5 transition-colors" />
        </div>
        {sub && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{sub}</p>}
        {location && <p className="text-[11px] text-gray-500 mt-0.5">{location}</p>}
        <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide ${badgeStyle}`}>
            {badgeLabel}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Clock className="w-2.5 h-2.5" />
            {time}
          </span>
          {reporter && <span className="text-[10px] text-gray-400 truncate">· {reporter}</span>}
        </div>
      </div>
    </button>
  );
}

export default function NotificationPanel({ onClose, onNavigate }) {
  const { state } = useApp();

  const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  const verifiedHazards  = state.reports
    .filter(r => r.status === 'verified')
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
  const allAnnouncements = state.announcements;
  const totalItems       = verifiedHazards.length + allAnnouncements.length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-[22rem] sm:w-[26rem] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[85vh] overflow-hidden slide-down">

        {/* Header */}
        <div className="bg-red-600 px-4 py-3 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-white animate-pulse" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Emergency Alerts</p>
              <p className="text-red-200 text-[10px]">Sorsogon Province · Live Updates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-red-500 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-red-700 text-xs font-semibold flex-1">
            {totalItems} active alert{totalItems !== 1 ? 's' : ''} across Sorsogon Province
          </p>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">

          {/* ── SECTION 1: SEEKING HELP (incident reports) ── */}
          {verifiedHazards.length > 0 && (
            <section>
              <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 border-b border-gray-100">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Seeking Help</p>
                <span className="ml-auto text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded-full">
                  {verifiedHazards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                {verifiedHazards.map(r => {
                  const dtype = DISASTER_TYPES[r.type];
                  const isCritical = r.priority === 'critical';
                  return (
                    <AlertCard
                      key={r.id}
                      circleContent={dtype?.icon || '⚠️'}
                      circleBg={dtype?.color || '#dc2626'}
                      ping={isCritical}
                      title={r.title}
                      location={`${r.location} · ${r.municipality}`}
                      badgeLabel={dtype?.label || r.type}
                      badgeStyle={isCritical ? 'bg-red-600 text-white border-red-700' : `${dtype?.tailwind.bg} ${dtype?.tailwind.text} ${dtype?.tailwind.border}`}
                      critical={isCritical}
                      time={timeAgo(r.timestamp)}
                      reporter={r.reportedBy}
                      onClick={() => { onNavigate('map'); onClose(); }}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* ── SECTION 2: SENDING HELP (official announcements) ── */}
          {allAnnouncements.length > 0 && (
            <section className="border-t border-gray-100">
              <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 border-b border-gray-100">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Official Alerts</p>
                <span className="ml-auto text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                  {allAnnouncements.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                {allAnnouncements.map(a => {
                  const isCritical = a.priority === 'critical';
                  const isProvinceWide = a.affectedAreas?.some(
                    area => area.toLowerCase().includes('all municipalities') || area.toLowerCase().includes('sorsogon province')
                  );
                  /* Pick an emoji that reflects the announcement topic */
                  const emoji = isCritical ? '🚨' : isProvinceWide ? '📢' : '📋';
                  const circleBg = isCritical ? '#dc2626' : isProvinceWide ? '#7c3aed' : '#2563eb';
                  return (
                    <AlertCard
                      key={a.id}
                      circleContent={emoji}
                      circleBg={circleBg}
                      ping={isCritical}
                      title={a.title}
                      sub={a.affectedAreas?.join(', ')}
                      badgeLabel={PRIORITY_LEVELS[a.priority]?.label || a.priority}
                      badgeStyle={PRIORITY_BADGE[a.priority] || PRIORITY_BADGE.medium}
                      time={timeAgo(a.timestamp)}
                      reporter={a.postedBy}
                      onClick={() => { onNavigate('announcements'); onClose(); }}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {totalItems === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <span className="text-4xl mb-2">✅</span>
              <p className="text-sm font-medium">No active alerts</p>
              <p className="text-xs">Sorsogon Province is currently clear</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2.5 flex gap-2 flex-shrink-0">
          <button
            onClick={() => { onNavigate('announcements'); onClose(); }}
            className="flex-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors"
          >
            All Announcements
          </button>
          <div className="w-px bg-gray-200" />
          <button
            onClick={() => { onNavigate('map'); onClose(); }}
            className="flex-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors"
          >
            View on Map
          </button>
        </div>
      </div>
    </>
  );
}
