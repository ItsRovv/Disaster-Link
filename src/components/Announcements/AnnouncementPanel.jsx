import { formatDistanceToNow, format } from 'date-fns';
import { Megaphone, AlertTriangle, Info, MapPin, Clock, Building2, Inbox } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRIORITY_LEVELS, ROLES, DISASTER_TYPES } from '../../data/mockData';

const PRIORITY_ICONS = {
  critical: <AlertTriangle className="w-4 h-4" />,
  high:     <AlertTriangle className="w-4 h-4" />,
  medium:   <Info className="w-4 h-4" />,
  low:      <Info className="w-4 h-4" />,
};

const PRIORITY_BORDER = {
  critical: 'border-l-red-600',
  high:     'border-l-orange-500',
  medium:   'border-l-yellow-500',
  low:      'border-l-green-500',
};

function AnnouncementCard({ announcement }) {
  const priority = PRIORITY_LEVELS[announcement.priority] || PRIORITY_LEVELS.medium;
  const roleInfo = ROLES[announcement.role] || ROLES.agency;
  const borderClass = PRIORITY_BORDER[announcement.priority] || 'border-l-gray-400';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderClass} overflow-hidden hover:shadow-md transition-shadow fade-in`}>
      <div className="p-4">
        {/* Priority + role + calamity badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${priority.tailwind.bg} ${priority.tailwind.text}`}
          >
            {PRIORITY_ICONS[announcement.priority]}
            {priority.label}
          </span>
          {announcement.calamityType && DISASTER_TYPES[announcement.calamityType] && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                DISASTER_TYPES[announcement.calamityType].tailwind.bg
              } ${
                DISASTER_TYPES[announcement.calamityType].tailwind.text
              }`}
            >
              <span>{DISASTER_TYPES[announcement.calamityType].icon}</span>
              {DISASTER_TYPES[announcement.calamityType].label}
            </span>
          )}
          {announcement.calamityType === 'typhoon' && announcement.typhoonSignal && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-600 text-white">
              🌀 Signal No. {announcement.typhoonSignal}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleInfo.bg} ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">
          {announcement.title}
        </h3>

        {/* Content */}
        <p className="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-line">
          {announcement.content}
        </p>

        {/* Affected areas */}
        {announcement.affectedAreas && announcement.affectedAreas.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Affected Areas</p>
            <div className="flex flex-wrap gap-1">
              {announcement.affectedAreas.map(area => (
                <span
                  key={area}
                  className="inline-flex items-center gap-0.5 text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-100"
                >
                  <MapPin className="w-2.5 h-2.5" /> {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {announcement.postedBy}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(announcement.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementPanel() {
  const { state } = useApp();
  const sorted = [...state.announcements].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const criticalCount = sorted.filter(a => a.priority === 'critical').length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 bg-indigo-50 rounded-lg">
              <Megaphone className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
              <p className="text-xs text-gray-500">{sorted.length} announcement{sorted.length !== 1 ? 's' : ''} · {criticalCount} critical</p>
            </div>
          </div>
        </div>

        {/* Critical alert banner */}
        {criticalCount > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">
                {criticalCount} Critical Alert{criticalCount !== 1 ? 's' : ''} Active
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Mandatory evacuation and/or emergency warnings are in effect for parts of Sorsogon Province. Please read all announcements carefully.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Announcements list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Inbox className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No announcements yet</p>
          </div>
        ) : (
          <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
            {/* Critical first */}
            {sorted.filter(a => a.priority === 'critical').map(a => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
            {/* Then high */}
            {sorted.filter(a => a.priority === 'high').map(a => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
            {/* Then the rest */}
            {sorted.filter(a => a.priority !== 'critical' && a.priority !== 'high').map(a => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
