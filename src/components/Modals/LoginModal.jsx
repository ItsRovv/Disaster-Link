import { useState } from 'react';
import { X, Shield, User, Building, Landmark, Briefcase, CheckCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_USERS, ROLES } from '../../data/mockData';

const ROLE_INFO = {
  resident: {
    Icon: User,
    label: 'Resident',
    description: 'Community member who can submit reports, view the feed, and receive announcements.',
    features: ['Submit incident reports', 'View community feed', 'View the hazard map', 'Receive announcements'],
    color: 'indigo',
  },
  barangay: {
    Icon: Building,
    label: 'Barangay Official',
    description: 'Barangay captain or official who can verify reports and post local announcements.',
    features: ['All Resident features', 'Verify / reject reports', 'Post barangay announcements', 'Access dashboard'],
    color: 'blue',
  },
  lgu: {
    Icon: Landmark,
    label: 'LGU / MDRRMO',
    description: 'Municipal or city government official with full moderation and broadcast access.',
    features: ['All Barangay features', 'Province-wide reporting overview', 'Post critical alerts', 'Coordinate response'],
    color: 'purple',
  },
  agency: {
    Icon: Briefcase,
    label: 'Government Agency',
    description: 'PAGASA, PHIVOLCS, DSWD, DPWH, Red Cross and other partner agencies.',
    features: ['All LGU features', 'Post official agency advisories', 'Scientific data overlays'],
    color: 'rose',
  },
};

const COLOR_MAP = {
  indigo: { ring: 'ring-indigo-400', bg: 'bg-indigo-700', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  blue:   { ring: 'ring-blue-400',   bg: 'bg-blue-700',   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700'   },
  purple: { ring: 'ring-purple-400', bg: 'bg-purple-700', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  rose:   { ring: 'ring-rose-400',   bg: 'bg-rose-700',   iconBg: 'bg-rose-50',   iconColor: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700'    },
};

export default function LoginModal({ onClose }) {
  const { dispatch } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);
  const [logging, setLogging] = useState(false);

  const handleLogin = () => {
    if (!selectedUser) return;
    setLogging(true);
    setTimeout(() => {
      dispatch({ type: 'LOGIN', payload: selectedUser });
      setLogging(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg 3xl:max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col slide-up">

        {/* Header */}
        <div className="bg-indigo-700 px-5 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold">Sign In to DisasterLink</h2>
                <p className="text-indigo-200 text-xs mt-0.5">Select your account to continue</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Demo notice */}
          <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 text-xs text-indigo-100">
            <span className="font-semibold text-white">Demo Mode</span> — Choose a role to explore DisasterLink features. No real credentials needed.
          </div>
        </div>

        {/* Account selection */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Account</p>

          {DEMO_USERS.map(user => {
            const info = ROLE_INFO[user.role];
            const colors = COLOR_MAP[info.color];
            const Icon = info.Icon;
            const isSelected = selectedUser?.id === user.id;

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? `border-transparent ring-2 ${colors.ring} bg-gray-50`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${colors.iconBg}`}>
                  <Icon className={`w-4.5 h-4.5 ${colors.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                      {info.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{user.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {info.features.map(f => (
                      <span key={f} className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-2.5 h-2.5 text-green-500" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLogin}
            disabled={!selectedUser || logging}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              selectedUser ? COLOR_MAP[ROLE_INFO[selectedUser.role]?.color]?.bg || 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-700'
            }`}
          >
            {logging ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {logging ? 'Signing in...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
