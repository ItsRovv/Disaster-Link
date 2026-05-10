import { Shield, Bell, Plus, LogIn, LogOut, ChevronDown, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLES } from '../data/mockData';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';

const NAV_TABS = [
  { id: 'map',           label: 'Live Map'      },
  { id: 'feed',          label: 'Community Feed' },
  { id: 'announcements', label: 'Announcements'  },
  { id: 'dashboard',     label: 'Dashboard'      },
];

export default function Header({ activeTab, setActiveTab, onReportClick, onLoginClick }) {
  const { state, dispatch, stats } = useApp();
  const { currentUser } = state;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleInfo = currentUser ? ROLES[currentUser.role] : null;

  const unverifiedCount = stats.unverified;
  const criticalAlertCount = state.announcements.filter(a => a.priority === 'critical').length + stats.verified;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-50 relative">
      {/* Top emergency bar */}
      {stats.unverified > 0 && (
        <div className="bg-red-600 text-white text-center text-xs 3xl:text-sm font-semibold py-1 3xl:py-2 px-4 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          {unverifiedCount} unverified incident report{unverifiedCount !== 1 ? 's' : ''} awaiting review
          &nbsp;·&nbsp;
          <span>{stats.verified} verified active hazard{stats.verified !== 1 ? 's' : ''} in Sorsogon Province</span>
        </div>
      )}

      <div className="flex items-center justify-between px-4 3xl:px-8 h-14 3xl:h-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex items-center justify-center w-9 h-9 3xl:w-12 3xl:h-12 rounded-lg bg-indigo-700">
            <Shield className="w-5 h-5 3xl:w-7 3xl:h-7 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-base 3xl:text-xl text-gray-900 tracking-tight">DisasterLink</span>
            <span className="block text-[10px] 3xl:text-sm text-gray-400 font-medium -mt-0.5">Sorsogon Province</span>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-center gap-1 3xl:gap-2">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 3xl:px-5 3xl:py-2.5 rounded-md text-sm 3xl:text-base font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.id === 'feed' && stats.unverified > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {stats.unverified > 9 ? '9+' : stats.unverified}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Report incident button */}
          {currentUser && (
            <button
              onClick={onReportClick}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm 3xl:text-base font-semibold px-3 py-1.5 3xl:px-5 3xl:py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Report Incident</span>
            </button>
          )}

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(v => !v); setShowUserMenu(false); }}
              className={`relative p-2 3xl:p-3 rounded-lg transition-colors ${
                showNotifications
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5 3xl:w-7 3xl:h-7" />
              {criticalAlertCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
            {showNotifications && (
              <NotificationPanel
                onClose={() => setShowNotifications(false)}
                onNavigate={(tab) => { setActiveTab(tab); }}
              />
            )}
          </div>

          {/* User menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${roleInfo?.bg} ${roleInfo?.color}`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-semibold text-gray-900">{currentUser.name}</p>
                  <p className={`text-[10px] font-medium ${roleInfo?.color}`}>{roleInfo?.label}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 slide-down">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.municipality}</p>
                  </div>
                  <button
                    onClick={() => { dispatch({ type: 'LOGOUT' }); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-gray-100 overflow-x-auto">
        {NAV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Click-outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
