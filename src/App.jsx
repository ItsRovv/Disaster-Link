import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DisasterMap from './components/Map/DisasterMap';
import CommunityFeed from './components/Feed/CommunityFeed';
import AnnouncementPanel from './components/Announcements/AnnouncementPanel';
import GovDashboard from './components/Dashboard/GovDashboard';
import ReportModal from './components/Modals/ReportModal';
import LoginModal from './components/Modals/LoginModal';
import ReportDetailDrawer from './components/Modals/ReportDetailDrawer';
import ToastContainer from './components/Toast/ToastContainer';
import AIChatbot from './components/AI/AIChatbot';
import { useLiveSimulation } from './hooks/useLiveSimulation';

function AppContent() {
  const [activeTab, setActiveTab] = useState('map');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useLiveSimulation();

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReportClick={() => setShowReportModal(true)}
        onLoginClick={() => setShowLoginModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-hidden">
          {activeTab === 'map' && (
            <div className="flex h-full">
              {/* Main map — takes 2/3 of the space */}
              <div className="flex-1 min-w-0">
                <DisasterMap />
              </div>
              {/* Live feed panel — takes 1/3 */}
              <div className="hidden md:flex flex-col w-72 lg:w-80 xl:w-96 3xl:w-[30rem] border-l border-gray-200 bg-white overflow-hidden">
                <CommunityFeed compact />
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="h-full overflow-hidden">
              <CommunityFeed />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="h-full overflow-hidden">
              <AnnouncementPanel />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="h-full overflow-hidden">
              <GovDashboard />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showReportModal && (
        <ReportModal onClose={() => setShowReportModal(false)} />
      )}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Report detail drawer */}
      <ReportDetailDrawer onNavigateToMap={() => setActiveTab('map')} />

      {/* Toast notifications */}
      <ToastContainer />

      {/* AI Chatbot */}
      <AIChatbot />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
