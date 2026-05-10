import { createContext, useContext, useReducer } from 'react';
import { initialReports, initialAnnouncements, CRITICAL_DISASTER_TYPES, HIGH_DISASTER_TYPES } from '../data/mockData';

const AppContext = createContext(null);

const initialState = {
  reports: initialReports,
  announcements: initialAnnouncements,
  currentUser: null,
  activeFilters: {
    types: [],
    statuses: [],
    municipality: '',
    searchQuery: '',
  },
  selectedReport: null,
};

function appReducer(state, action) {
  switch (action.type) {

    case 'LOGIN':
      return { ...state, currentUser: action.payload };

    case 'LOGOUT':
      return { ...state, currentUser: null };

    case 'ADD_REPORT': {
      const derivedPriority = CRITICAL_DISASTER_TYPES.has(action.payload.type)
        ? 'critical'
        : HIGH_DISASTER_TYPES.has(action.payload.type)
        ? 'high'
        : 'medium';
      const newReport = {
        ...action.payload,
        id: Date.now(),
        status: 'unverified',
        priority: action.payload.priority || derivedPriority,
        timestamp: new Date().toISOString(),
        upvotes: 0,
      };
      return { ...state, reports: [newReport, ...state.reports] };
    }

    case 'VERIFY_REPORT':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.payload ? { ...r, status: 'verified' } : r
        ),
      };

    case 'REJECT_REPORT':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.payload ? { ...r, status: 'false_alarm' } : r
        ),
      };

    case 'UPVOTE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.payload ? { ...r, upvotes: r.upvotes + 1 } : r
        ),
      };

    case 'POST_ANNOUNCEMENT': {
      const newAnnouncement = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        postedBy: state.currentUser?.name || 'Unknown',
        role: state.currentUser?.role || 'lgu',
      };
      return {
        ...state,
        announcements: [newAnnouncement, ...state.announcements],
      };
    }

    case 'SET_FILTER':
      return {
        ...state,
        activeFilters: { ...state.activeFilters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        activeFilters: { types: [], statuses: [], municipality: '', searchQuery: '' },
      };

    case 'SELECT_REPORT':
      return { ...state, selectedReport: action.payload };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const filteredReports = state.reports.filter(report => {
    const { types, statuses, municipality, searchQuery } = state.activeFilters;

    if (types.length > 0 && !types.includes(report.type)) return false;
    if (statuses.length > 0 && !statuses.includes(report.status)) return false;
    if (municipality && report.municipality !== municipality) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !report.title.toLowerCase().includes(q) &&
        !report.description.toLowerCase().includes(q) &&
        !report.location.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const stats = {
    total: state.reports.length,
    verified: state.reports.filter(r => r.status === 'verified').length,
    unverified: state.reports.filter(r => r.status === 'unverified').length,
    falseAlarm: state.reports.filter(r => r.status === 'false_alarm').length,
    byType: Object.fromEntries(
      ['flood', 'landslide', 'fire', 'earthquake', 'typhoon', 'rescue', 'volcanic'].map(t => [
        t,
        state.reports.filter(r => r.type === t).length,
      ])
    ),
  };

  return (
    <AppContext.Provider value={{ state, dispatch, filteredReports, stats }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
