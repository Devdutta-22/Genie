import { useState, useEffect } from 'react';
import {
  fetchUsers,
  fetchGigs,
  fetchNotifications,
  markNotificationRead,
  updateUserLocation,
  fetchCurrentUser,
  clearAuthToken
} from './services/api.js';
import { Navbar } from './components/Navbar.jsx';
import { GigFeed } from './components/GigFeed.jsx';
import { CampusMap } from './components/CampusMap.jsx';
import { PostGigModal } from './components/PostGigModal.jsx';
import { GigDetailModal } from './components/GigDetailModal.jsx';
import { ActiveGigWorkspace } from './components/ActiveGigWorkspace.jsx';
import { ProfileView } from './components/ProfileView.jsx';
import { NotificationDrawer } from './components/NotificationDrawer.jsx';
import { AuthScreen } from './components/AuthScreen.jsx';

export function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [gigs, setGigs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');

  // Modals and Drawers
  const [isNewGigModalOpen, setIsNewGigModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Selected Gigs for views
  const [selectedGig, setSelectedGig] = useState(null);
  const [activeWorkspaceGig, setActiveWorkspaceGig] = useState(null);
  const [prefillLocation, setPrefillLocation] = useState(undefined);

  // Live Toast for new requests
  const [liveToast, setLiveToast] = useState(null);

  // Check existing auth token or session on load
  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
        }
      })
      .catch((err) => {
        console.error('Session verify error:', err);
      })
      .finally(() => {
        setIsAuthChecking(false);
        fetchUsers().then(setAllUsers).catch(console.error);
      });
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    fetchUsers().then(setAllUsers).catch(console.error);
  };

  // Load Gigs when currentUser changes
  const reloadGigs = () => {
    fetchGigs({
      userLat: currentUser?.latitude,
      userLon: currentUser?.longitude
    })
      .then((data) => setGigs(data))
      .catch(console.error);
  };

  useEffect(() => {
    if (currentUser) {
      reloadGigs();
      fetchNotifications(currentUser.id)
        .then((notifs) => setNotifications(notifs))
        .catch(console.error);
    }
  }, [currentUser]);

  // WebSocket Live Updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'GIG_CREATED') {
          reloadGigs();
          setLiveToast({
            title: 'NEW CAMPUS REQUEST',
            message: `${payload.data.title} (₹${payload.data.budget})`
          });
          setTimeout(() => setLiveToast(null), 4000);
        } else if (payload.type === 'WAVE_ESCALATED') {
          reloadGigs();
          if (currentUser) {
            fetchNotifications(currentUser.id).then(setNotifications);
          }
        } else if (
          payload.type === 'GIG_ASSIGNED' ||
          payload.type === 'GIG_STATUS_UPDATED' ||
          payload.type === 'GIG_COMPLETED'
        ) {
          reloadGigs();
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentUser]);

  const handleUpdateLocation = async (locationName, lat, lon) => {
    if (!currentUser) return;
    try {
      await updateUserLocation(currentUser.id, locationName, lat, lon);
      setCurrentUser({
        ...currentUser,
        location_name: locationName,
        latitude: lat,
        longitude: lon
      });
      reloadGigs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectGig = (gig) => {
    setSelectedGig(gig);
    setIsDetailModalOpen(true);
  };

  const handleOpenWorkspace = (gig) => {
    setActiveWorkspaceGig(gig);
    setActiveTab('active');
  };

  const handleGigCreated = (newGig) => {
    reloadGigs();
    setSelectedGig(newGig);
    setActiveTab('feed');
  };

  const handleAcceptedGig = (updatedGig) => {
    reloadGigs();
    setActiveWorkspaceGig(updatedGig);
    setActiveTab('active');
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, status: 'READ' } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => n.status === 'UNREAD').length;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Verifying Campus Session...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-700 selection:text-white">
      {/* Top Brutalist Navbar with PWA tabs */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={(u) => {
          setCurrentUser(u);
          reloadGigs();
        }}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenNewGigModal={() => {
          setPrefillLocation(undefined);
          setIsNewGigModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <GigFeed
            gigs={gigs}
            currentUser={currentUser}
            onSelectGig={handleSelectGig}
            onAcceptGig={(gig) => {
              setSelectedGig(gig);
              setIsDetailModalOpen(true);
            }}
            onOpenNewGig={(loc) => {
              setPrefillLocation(loc);
              setIsNewGigModalOpen(true);
            }}
            onLocationFilterChange={handleUpdateLocation}
          />
        )}

        {activeTab === 'map' && (
          <CampusMap
            gigs={gigs.filter((g) => g.status === 'ACTIVE' || g.status === 'NOTIFIED')}
            currentUser={currentUser}
            onSelectGig={handleSelectGig}
            onAcceptGig={(gig) => {
              setSelectedGig(gig);
              setIsDetailModalOpen(true);
            }}
            onUpdateLocation={handleUpdateLocation}
          />
        )}

        {activeTab === 'active' && (
          <ActiveGigWorkspace
            currentUser={currentUser}
            gig={activeWorkspaceGig}
            allGigs={gigs}
            onSelectGig={(g) => setActiveWorkspaceGig(g)}
            onGigUpdated={() => reloadGigs()}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView currentUser={currentUser} />
        )}
      </main>

      {/* Modals & Drawers */}
      <PostGigModal
        currentUser={currentUser}
        isOpen={isNewGigModalOpen}
        onClose={() => setIsNewGigModalOpen(false)}
        onGigCreated={handleGigCreated}
        initialLocation={prefillLocation}
      />

      <GigDetailModal
        gig={selectedGig}
        currentUser={currentUser}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAccepted={handleAcceptedGig}
        onOpenWorkspace={handleOpenWorkspace}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onSelectNotificationGig={(gigId) => {
          const found = gigs.find((g) => g.id === gigId);
          if (found) handleSelectGig(found);
        }}
        onMarkRead={handleMarkNotificationRead}
      />

      {/* Minimal Brutalist Toast in Royal Blue */}
      {liveToast && (
        <div className="fixed bottom-16 md:bottom-5 right-5 z-50 bg-blue-900 text-white p-3.5 border-2 border-white shadow-[4px_4px_0px_#1e3a8a] flex items-center gap-3 animate-in fade-in">
          <div className="w-6 h-6 bg-white text-blue-900 flex items-center justify-center font-black text-xs shrink-0">
            !
          </div>
          <div>
            <h5 className="font-black text-xs uppercase tracking-wider">{liveToast.title}</h5>
            <p className="text-[11px] text-blue-100 font-medium">{liveToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
