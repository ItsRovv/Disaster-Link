import { Map, MessageSquare, Megaphone, LayoutDashboard, Waves, Mountain, Flame, Zap, Wind, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DISASTER_TYPES } from '../data/mockData';

const NAV_ITEMS = [
  { id: 'map',           label: 'Live Map',       Icon: Map           },
  { id: 'feed',          label: 'Community Feed', Icon: MessageSquare },
  { id: 'announcements', label: 'Announcements',  Icon: Megaphone     },
  { id: 'dashboard',     label: 'Dashboard',      Icon: LayoutDashboard },
];

const TYPE_ICONS = {
  flood:     Waves,
  landslide: Mountain,
  fire:      Flame,
  earthquake: Zap,
  typhoon:   Wind,
  rescue:    AlertCircle,
  volcanic:  Mountain,
};

export default function Sidebar({ activeTab, setActiveTab }) {
  const { stats } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-64 3xl:w-80 bg-white border-r border-gray-200 py-4 3xl:py-6 gap-1 flex-shrink-0">
      {/* Navigation */}
      <div className="px-3 mb-2">
        <p className="text-[10px] 3xl:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-2">Navigation</p>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 3xl:px-4 3xl:py-3 rounded-lg text-sm 3xl:text-base font-medium transition-colors mb-0.5 ${
              activeTab === id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 3xl:w-5 3xl:h-5 flex-shrink-0" />
            <span>{label}</span>
            {id === 'feed' && stats.unverified > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {stats.unverified}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 mx-3 my-1" />

      {/* Hazard summary */}
      <div className="px-3">
        <p className="text-[10px] 3xl:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Active Hazards</p>
        <div className="space-y-1">
          {Object.values(DISASTER_TYPES).map(dt => {
            const count = stats.byType[dt.id] || 0;
            if (count === 0) return null;
            const Icon = TYPE_ICONS[dt.id] || AlertCircle;
            return (
              <div
                key={dt.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-default"
              >
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dt.lightColor }}
                >
                  <Icon className="w-3 h-3" style={{ color: dt.color }} />
                </span>
                <span className="text-xs 3xl:text-sm text-gray-700 flex-1">{dt.label}</span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: dt.lightColor, color: dt.textColor }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100 mx-3 my-1" />

      {/* Quick stats */}
      <div className="px-3">
        <p className="text-[10px] 3xl:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Report Status</p>
        <div className="space-y-1 px-2">
          <div className="flex items-center justify-between text-xs 3xl:text-sm">
            <span className="text-gray-600">Total Reports</span>
            <span className="font-bold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Verified</span>
            </span>
            <span className="font-bold text-green-700">{stats.verified}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Unverified</span>
            </span>
            <span className="font-bold text-red-700">{stats.unverified}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">False Alarm</span>
            </span>
            <span className="font-bold text-gray-500">{stats.falseAlarm}</span>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="mt-auto px-5 pb-2">
        <p className="text-[10px] 3xl:text-xs text-gray-400 leading-relaxed">
          DisasterLink v1.0<br />
          Sorsogon Province DRRM System
        </p>
      </div>
    </aside>
  );
}
