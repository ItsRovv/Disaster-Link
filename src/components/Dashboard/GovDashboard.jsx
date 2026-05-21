import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
  ClipboardList, CheckCircle, XCircle, AlertCircle, Megaphone,
  ShieldCheck, ShieldX, Send, Lock, MapPin, Clock, User,
  TrendingUp, Activity, FileText, Bell, BarChart2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISASTER_TYPES, STATUSES, ROLES, PRIORITY_LEVELS, MUNICIPALITIES } from '../../data/mockData';
import ReportCard from '../Feed/ReportCard';

function StatCard({ label, value, Icon, color, bgColor, subLabel }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm`}>
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${bgColor}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
        {subLabel && <p className="text-[10px] text-gray-400">{subLabel}</p>}
      </div>
    </div>
  );
}

function toPST(utcMs) {
  return new Date(utcMs + 8 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 16) + ' PST';
}

function EarthquakeMonitor() {
  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQuakes = async () => {
    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson' +
        '&minlatitude=4&maxlatitude=21&minlongitude=116&maxlongitude=127' +
        '&minmagnitude=2.0&limit=15&orderby=time'
      );
      const data = await res.json();
      setQuakes(data.features || []);
      setLastUpdated(new Date());
    } catch { /* silently ignore network errors */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQuakes();
    const interval = setInterval(fetchQuakes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const magColor = (mag) => {
    if (mag >= 6.0) return 'bg-red-600 text-white';
    if (mag >= 5.0) return 'bg-orange-500 text-white';
    if (mag >= 4.0) return 'bg-yellow-400 text-gray-900';
    if (mag >= 3.0) return 'bg-blue-400 text-white';
    return 'bg-green-500 text-white';
  };

  const magLabel = (mag) => {
    if (mag >= 6.0) return { text: 'DESTRUCTIVE', cls: 'text-red-600 bg-red-50 border-red-200' };
    if (mag >= 5.0) return { text: 'STRONG', cls: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (mag >= 4.0) return { text: 'MODERATE', cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header — PHIVOLCS style */}
      <div className="bg-[#1a3a6b] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📳</span>
          <div>
            <p className="text-white font-bold text-sm leading-tight">PHIVOLCS Latest Earthquake Information</p>
            <p className="text-blue-200 text-[10px]">Philippine Seismic Network · Date-Time in PST (UTC+8)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-blue-200">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={() => { setLoading(true); fetchQuakes(); }}
            className="text-[10px] text-white font-semibold bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Column headers — mirrors PHIVOLCS table */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px_56px_52px] gap-2 px-4 py-1.5 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        <span>Location</span>
        <span className="text-center">Date-Time (PST)</span>
        <span className="text-right">Lat / Lon</span>
        <span className="text-right">Depth</span>
        <span className="text-right">Mag</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
          <span className="animate-spin text-xl">📳</span> Fetching seismic data…
        </div>
      ) : quakes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No recent earthquakes recorded in the Philippines.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {quakes.map(q => {
            const mag   = q.properties.mag;
            const place = q.properties.place;
            const time  = q.properties.time;
            const geo   = q.geometry?.coordinates;
            const lon   = geo?.[0]?.toFixed(2);
            const lat   = geo?.[1]?.toFixed(2);
            const depth = geo?.[2]?.toFixed(0);
            const label = magLabel(mag);
            return (
              <div key={q.id} className="flex sm:grid sm:grid-cols-[1fr_80px_80px_56px_52px] items-start sm:items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                {/* Location + time (mobile stacked) */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 leading-snug">{place}</p>
                  <p className="text-[10px] text-gray-400 sm:hidden mt-0.5">{toPST(time)}</p>
                  {label && (
                    <span className={`inline-flex mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${label.cls}`}>
                      {label.text}
                    </span>
                  )}
                </div>
                {/* PST time (desktop) */}
                <p className="hidden sm:block text-[10px] text-gray-500 text-center leading-tight">{toPST(time)}</p>
                {/* Lat / Lon */}
                <p className="hidden sm:block text-[10px] text-gray-500 text-right leading-tight">{lat}°N<br />{lon}°E</p>
                {/* Depth */}
                <p className="hidden sm:block text-[11px] text-gray-600 font-medium text-right">{depth} km</p>
                {/* Magnitude badge */}
                <span className={`text-xs font-black px-2 py-1 rounded-lg min-w-[44px] text-center flex-shrink-0 ${magColor(mag)}`}>
                  M{mag?.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to official PHIVOLCS page */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">Data sourced from USGS · Aligned with PHIVOLCS PSN</p>
        <a
          href="https://phivolcs.dost.gov.ph/earthquake-information/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold text-[#1a3a6b] hover:underline"
        >
          View Official PHIVOLCS Bulletin →
        </a>
      </div>
    </div>
  );
}

const TYPHOON_SIGNAL_COLORS = ['', 'bg-cyan-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-600', 'bg-red-900'];
const TYPHOON_SIGNAL_DESCS = [
  '',
  'Winds 60–89 km/h expected within 36 hrs',
  'Winds 60–119 km/h expected within 24 hrs',
  'Winds 120–184 km/h expected within 18 hrs',
  'Winds 185–220 km/h expected within 12 hrs',
  'Winds exceeding 220 km/h expected within 12 hrs',
];

function AnnouncementComposer({ onPost }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('high');
  const [calamityType, setCalamityType] = useState('');
  const [typhoonSignal, setTyphoonSignal] = useState(1);
  const [areas, setAreas] = useState([]);
  const [areaInput, setAreaInput] = useState('');
  const [sending, setSending] = useState(false);

  const handlePost = () => {
    if (!title.trim() || !content.trim()) return;
    setSending(true);
    setTimeout(() => {
      onPost({
        title, content, priority, affectedAreas: areas,
        calamityType,
        ...(calamityType === 'typhoon' ? { typhoonSignal } : {}),
      });
      setTitle('');
      setContent('');
      setPriority('high');
      setCalamityType('');
      setTyphoonSignal(1);
      setAreas([]);
      setSending(false);
    }, 600);
  };

  const addArea = () => {
    const trimmed = areaInput.trim();
    if (trimmed && !areas.includes(trimmed)) {
      setAreas(prev => [...prev, trimmed]);
    }
    setAreaInput('');
  };

  const removeArea = (a) => setAreas(prev => prev.filter(x => x !== a));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-4 h-4 text-indigo-600" />
        <h3 className="font-bold text-gray-900 text-sm">Post Announcement</h3>
      </div>

      {/* Calamity Type */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Calamity Type</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCalamityType('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
              calamityType === '' ? 'bg-gray-700 text-white border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            General
          </button>
          {Object.entries(DISASTER_TYPES)
            .filter(([key]) => key !== 'earthquake')
            .map(([key, dt]) => (
            <button
              key={key}
              onClick={() => setCalamityType(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                calamityType === key
                  ? `${dt.tailwind.bg} ${dt.tailwind.text} border-transparent`
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              <span>{dt.icon}</span> {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Typhoon Signal — shown only when calamity = typhoon */}
      {calamityType === 'typhoon' && (
        <div className="mb-3 bg-cyan-50 border border-cyan-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wider mb-2">🌀 Typhoon Signal Number</p>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setTyphoonSignal(n)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  typhoonSignal === n
                    ? `${TYPHOON_SIGNAL_COLORS[n]} text-white border-transparent shadow`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                #{n}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-cyan-800 font-medium">
            Signal No. {typhoonSignal} — {TYPHOON_SIGNAL_DESCS[typhoonSignal]}
          </p>
        </div>
      )}

      {/* Priority */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Priority Level</p>
        <div className="flex gap-2">
          {Object.entries(PRIORITY_LEVELS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPriority(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                priority === key ? `${p.tailwind.bg} ${p.tailwind.text} border-transparent` : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Announcement title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
        />
      </div>

      {/* Content */}
      <div className="mb-3">
        <textarea
          placeholder="Write the full announcement content here..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder-gray-400"
        />
      </div>

      {/* Affected areas */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Affected Areas (optional)</p>
        <div className="flex gap-2 mb-2">
          <select
            value={areaInput}
            onChange={e => setAreaInput(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Select municipality...</option>
            <option value="All Municipalities of Sorsogon Province">All Municipalities</option>
            {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            onClick={addArea}
            disabled={!areaInput}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {areas.map(a => (
              <span key={a} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                <MapPin className="w-2.5 h-2.5" /> {a}
                <button onClick={() => removeArea(a)} className="text-indigo-400 hover:text-red-500 ml-0.5 font-bold text-sm leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handlePost}
        disabled={!title.trim() || !content.trim() || sending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
      >
        {sending ? (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {sending ? 'Posting...' : 'Post Announcement'}
      </button>
    </div>
  );
}

export default function GovDashboard() {
  const { state, dispatch, stats, filteredReports } = useApp();
  const { currentUser } = state;
  const [activeSection, setActiveSection] = useState('overview');

  const isAuthorized = currentUser && ['lgu', 'barangay', 'agency'].includes(currentUser.role);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Sign In Required</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            The Government Dashboard is only accessible to authorized LGU, Barangay, and Agency accounts. Please sign in to continue.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            The Dashboard is only available to Barangay Officials, LGU, and Government Agencies.
          </p>
        </div>
      </div>
    );
  }

  const now = Date.now();

  const byTypeData = Object.values(DISASTER_TYPES)
    .map(dt => ({ name: `${dt.icon} ${dt.label}`, count: stats.byType[dt.id] || 0, fill: dt.color }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  const statusData = [
    { name: 'Verified',    value: stats.verified,   fill: '#16a34a' },
    { name: 'Unverified',  value: stats.unverified,  fill: '#dc2626' },
    { name: 'False Alarm', value: stats.falseAlarm,  fill: '#9ca3af' },
  ].filter(d => d.value > 0);

  const byMunicipalityData = MUNICIPALITIES
    .map(m => ({ name: m.replace('Sorsogon City', 'Sor. City'), count: state.reports.filter(r => r.municipality === m).length }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  const timelineData = [
    { label: '4h+',   count: state.reports.filter(r => (now - new Date(r.timestamp)) > 4 * 3600000).length },
    { label: '2–4h',  count: state.reports.filter(r => { const d = now - new Date(r.timestamp); return d > 2 * 3600000 && d <= 4 * 3600000; }).length },
    { label: '1–2h',  count: state.reports.filter(r => { const d = now - new Date(r.timestamp); return d > 3600000 && d <= 2 * 3600000; }).length },
    { label: '30–60m',count: state.reports.filter(r => { const d = now - new Date(r.timestamp); return d > 1800000 && d <= 3600000; }).length },
    { label: '15–30m',count: state.reports.filter(r => { const d = now - new Date(r.timestamp); return d > 900000 && d <= 1800000; }).length },
    { label: '<15m',  count: state.reports.filter(r => (now - new Date(r.timestamp)) <= 900000).length },
  ];

  const unverifiedReports = state.reports.filter(r => r.status === 'unverified')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const verifiedReports = state.reports.filter(r => r.status === 'verified')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const recentActivity = [...state.reports]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);

  const roleInfo = ROLES[currentUser.role];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Dashboard header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Government Dashboard</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${roleInfo?.bg} ${roleInfo?.color}`}>
                {roleInfo?.label}
              </span>
              Signed in as {currentUser.name}
              {currentUser.municipality && ` · ${currentUser.municipality}`}
            </p>
          </div>

          {/* Sub-navigation */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview',   label: 'Overview',   Icon: Activity    },
              { id: 'verify',     label: 'Verify',     Icon: ShieldCheck },
              { id: 'analytics',  label: 'Analytics',  Icon: BarChart2   },
              { id: 'announce',   label: 'Announce',   Icon: Bell        },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeSection === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
                {id === 'verify' && unverifiedReports.length > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {unverifiedReports.length > 9 ? '9+' : unverifiedReports.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile section navigation */}
      <div className="md:hidden bg-white border-b border-gray-100 flex flex-shrink-0">
        {[
          { id: 'overview',  label: 'Overview',  Icon: Activity    },
          { id: 'verify',    label: 'Verify',    Icon: ShieldCheck },
          { id: 'analytics', label: 'Analytics', Icon: BarChart2   },
          { id: 'announce',  label: 'Announce',  Icon: Bell        },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs font-medium transition-colors relative ${
              activeSection === id
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-gray-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === 'verify' && unverifiedReports.length > 0 && (
              <span className="absolute top-1.5 right-3 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold">
                {unverifiedReports.length > 9 ? '9+' : unverifiedReports.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* ─── OVERVIEW ─── */}
        {activeSection === 'overview' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Reports"    value={stats.total}     Icon={ClipboardList} color="text-indigo-600"  bgColor="bg-indigo-50" />
              <StatCard label="Verified"         value={stats.verified}  Icon={CheckCircle}   color="text-green-600"  bgColor="bg-green-50"  />
              <StatCard label="Needs Review"     value={stats.unverified} Icon={AlertCircle}   color="text-red-600"    bgColor="bg-red-50"   subLabel="Awaiting action" />
              <StatCard label="False Alarms"     value={stats.falseAlarm} Icon={XCircle}       color="text-gray-500"   bgColor="bg-gray-100"  />
            </div>

            {/* Hazard type breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Incident Breakdown by Type
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.values(DISASTER_TYPES).map(dt => {
                  const count = stats.byType[dt.id] || 0;
                  return (
                    <div
                      key={dt.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ backgroundColor: dt.lightColor }}
                    >
                      <span className="text-lg">{dt.icon}</span>
                      <div>
                        <p className="text-lg font-bold leading-none" style={{ color: dt.textColor }}>{count}</p>
                        <p className="text-[11px] font-medium text-gray-600">{dt.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Earthquake Monitor */}
            <EarthquakeMonitor />

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" /> Recent Activity
              </h3>
              <div className="space-y-2">
                {recentActivity.map(r => {
                  const dt = DISASTER_TYPES[r.type];
                  const s  = STATUSES[r.status];
                  return (
                    <div key={r.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-base mt-0.5">{dt?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {r.location}
                          <span className="mx-1">·</span>
                          <Clock className="w-2.5 h-2.5" />
                          {formatDistanceToNow(new Date(r.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${s?.tailwind.bg} ${s?.tailwind.text} ${s?.tailwind.border}`}>
                        {s?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── ANALYTICS ─── */}
        {activeSection === 'analytics' && (
          <div className="space-y-5 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Incidents by type */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> Incidents by Hazard Type
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byTypeData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v) => [v, 'Reports']} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {byTypeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" /> Status Distribution
                </h3>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="45%" innerRadius={54} outerRadius={84} paddingAngle={3} dataKey="value">
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No data</div>
                )}
              </div>
            </div>

            {/* By municipality */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> Incidents by Municipality
              </h3>
              {byMunicipalityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={byMunicipalityData} margin={{ bottom: 34, left: 4, right: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, angle: -30, textAnchor: 'end' }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Reports']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {byMunicipalityData.map((_, i) => <Cell key={i} fill={`hsl(${240 - i * 14}, 62%, ${56 - i * 2}%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[190px] text-gray-400 text-sm">No data</div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Report Volume by Time Window
              </h3>
              <p className="text-xs text-gray-400 mb-4">Number of reports per time bucket (oldest → most recent)</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={timelineData} margin={{ left: 4, right: 8 }}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Reports']} />
                  <Area type="monotone" dataKey="count" stroke="#4338ca" fill="url(#incGrad)" strokeWidth={2} dot={{ r: 3, fill: '#4338ca' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── VERIFY REPORTS ─── */}
        {activeSection === 'verify' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Reports Pending Verification</h3>
              {unverifiedReports.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unverifiedReports.length}
                </span>
              )}
            </div>

            {unverifiedReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-green-500" />
                <p className="font-semibold text-gray-600">All reports verified!</p>
                <p className="text-xs mt-1">No pending reports at this time.</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {unverifiedReports.map(r => <ReportCard key={r.id} report={r} showActions />)}
              </div>
            )}

            {verifiedReports.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" /> Recently Verified
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {verifiedReports.map(r => <ReportCard key={r.id} report={r} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ANNOUNCE ─── */}
        {activeSection === 'announce' && (
          <div className="max-w-3xl mx-auto">
            <AnnouncementComposer
              onPost={(data) => dispatch({ type: 'POST_ANNOUNCEMENT', payload: data })}
            />

            {/* Recent announcements */}
            <div className="mt-6">
              <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Posted Announcements
              </h4>
              <div className="space-y-3">
                {[...state.announcements]
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 5)
                  .map(a => {
                    const p = PRIORITY_LEVELS[a.priority];
                    return (
                      <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3">
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p?.tailwind.bg} ${p?.tailwind.text}`}>
                            {p?.label}
                          </span>
                          {a.calamityType && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              DISASTER_TYPES[a.calamityType]?.tailwind.bg
                            } ${
                              DISASTER_TYPES[a.calamityType]?.tailwind.text
                            }`}>
                              {DISASTER_TYPES[a.calamityType]?.icon} {DISASTER_TYPES[a.calamityType]?.label}
                              {a.calamityType === 'typhoon' && a.typhoonSignal && ` · Signal #${a.typhoonSignal}`}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" /> {a.postedBy}
                            <span className="mx-1">·</span>
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
