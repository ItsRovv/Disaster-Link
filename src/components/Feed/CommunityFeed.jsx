import { useState } from 'react';
import { Search, SlidersHorizontal, X, ArrowUpDown, Inbox } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISASTER_TYPES, STATUSES, MUNICIPALITIES } from '../../data/mockData';
import ReportCard from './ReportCard';

const SORT_OPTIONS = [
  { id: 'newest',   label: 'Newest First' },
  { id: 'oldest',   label: 'Oldest First' },
  { id: 'upvotes',  label: 'Most Confirmed' },
  { id: 'verified', label: 'Verified First' },
];

export default function CommunityFeed({ compact = false }) {
  const { filteredReports, state, dispatch, stats } = useApp();
  const { activeFilters } = state;
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest')   return new Date(b.timestamp) - new Date(a.timestamp);
    if (sortBy === 'oldest')   return new Date(a.timestamp) - new Date(b.timestamp);
    if (sortBy === 'upvotes')  return b.upvotes - a.upvotes;
    if (sortBy === 'verified') {
      const order = { verified: 0, unverified: 1, false_alarm: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    }
    return 0;
  });

  const toggleType = (id) => {
    const curr = activeFilters.types;
    dispatch({ type: 'SET_FILTER', payload: { types: curr.includes(id) ? curr.filter(t => t !== id) : [...curr, id] } });
  };

  const toggleStatus = (id) => {
    const curr = activeFilters.statuses;
    dispatch({ type: 'SET_FILTER', payload: { statuses: curr.includes(id) ? curr.filter(s => s !== id) : [...curr, id] } });
  };

  const hasFilters = activeFilters.types.length > 0 || activeFilters.statuses.length > 0 || activeFilters.municipality || activeFilters.searchQuery;

  if (compact) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Live Feed</p>
            <p className="text-[10px] text-gray-400">{sortedReports.length} incident{sortedReports.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full">
            {stats.unverified}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">No reports found</div>
          ) : (
            sortedReports.map(r => <ReportCard key={r.id} report={r} compact />)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Community Feed</h2>
            <p className="text-xs text-gray-500">
              {sortedReports.length} report{sortedReports.length !== 1 ? 's' : ''} · {stats.verified} verified · {stats.unverified} unverified
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs text-gray-700 bg-transparent border-none outline-none font-medium"
              >
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showFilters || hasFilters
                  ? 'bg-indigo-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasFilters && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-indigo-700 text-[9px] font-bold">
                  {activeFilters.types.length + activeFilters.statuses.length + (activeFilters.municipality ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by title, description, or location..."
            value={activeFilters.searchQuery}
            onChange={e => dispatch({ type: 'SET_FILTER', payload: { searchQuery: e.target.value } })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          />
          {activeFilters.searchQuery && (
            <button
              onClick={() => dispatch({ type: 'SET_FILTER', payload: { searchQuery: '' } })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Type filters */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Hazard Type</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(DISASTER_TYPES).map(dt => (
                  <button
                    key={dt.id}
                    onClick={() => toggleType(dt.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    style={
                      activeFilters.types.includes(dt.id)
                        ? { backgroundColor: dt.color, color: '#fff', borderColor: dt.color }
                        : { backgroundColor: '#fff', color: '#374151', borderColor: '#e5e7eb' }
                    }
                  >
                    {dt.icon} {dt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Status filter */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</p>
                <div className="flex gap-1.5">
                  {Object.values(STATUSES).map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleStatus(s.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        activeFilters.statuses.includes(s.id)
                          ? `${s.tailwind.bg} ${s.tailwind.text} ${s.tailwind.border}`
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Municipality filter */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Municipality</p>
                <select
                  value={activeFilters.municipality}
                  onChange={e => dispatch({ type: 'SET_FILTER', payload: { municipality: e.target.value } })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">All</option>
                  {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
                className="mt-2 text-xs text-red-600 font-medium hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report list */}
      <div className="flex-1 overflow-y-auto">
        {sortedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Inbox className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No reports found</p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
            {sortedReports.map(r => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
