import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ClipboardList, CheckCircle, XCircle, AlertCircle, Megaphone,
  ShieldCheck, ShieldX, Send, Lock, MapPin, Clock, User,
  TrendingUp, Activity, FileText, Bell,
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

function AnnouncementComposer({ onPost }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('high');
  const [areas, setAreas] = useState([]);
  const [areaInput, setAreaInput] = useState('');
  const [sending, setSending] = useState(false);

  const handlePost = () => {
    if (!title.trim() || !content.trim()) return;
    setSending(true);
    setTimeout(() => {
      onPost({ title, content, priority, affectedAreas: areas });
      setTitle('');
      setContent('');
      setPriority('high');
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
              { id: 'overview',    label: 'Overview',   Icon: Activity    },
              { id: 'verify',      label: 'Verify',     Icon: ShieldCheck },
              { id: 'announce',    label: 'Announce',   Icon: Bell        },
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
          { id: 'overview', label: 'Overview', Icon: Activity    },
          { id: 'verify',   label: 'Verify',   Icon: ShieldCheck },
          { id: 'announce', label: 'Announce', Icon: Bell        },
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
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 ${p?.tailwind.bg} ${p?.tailwind.text}`}>
                          {p?.label}
                        </span>
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
