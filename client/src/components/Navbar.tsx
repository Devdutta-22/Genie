import React from 'react';
import type { User } from '../types';
import {
  Compass,
  MapPin,
  PlusCircle,
  Briefcase,
  Cpu,
  UserCheck,
  Bell,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'feed' | 'map' | 'post' | 'active' | 'matching' | 'profile';
  setActiveTab: (tab: 'feed' | 'map' | 'post' | 'active' | 'matching' | 'profile') => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenNewGigModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenNotifications,
  onOpenNewGigModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Gully Gigs</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Campus Live
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Hyper-Local Micro-Gig Marketplace</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              Feed
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-500" />
              Campus Map
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-amber-500" />
              My Tasks
            </button>

            <button
              onClick={() => setActiveTab('matching')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'matching'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Inspect algorithm, scoring weights, and wave escalation"
            >
              <Cpu className="w-4 h-4 text-purple-600" />
              Matching Engine
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-sky-500" />
              Reputation
            </button>
          </nav>

          {/* Right Actions & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Post Gig Button */}
            <button
              onClick={onOpenNewGigModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-300 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Post Gig</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications & Proximity Waves"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Active Student Switcher Dropdown */}
            {currentUser && (
              <div className="relative group">
                <div className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition-all">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-2 ring-indigo-500/20"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                      {currentUser.name}
                      <span className="text-[10px] text-amber-600 font-semibold">★{currentUser.rating}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[110px]">{currentUser.course}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:rotate-180" />
                </div>

                {/* Dropdown Menu for quick role switching */}
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 hidden group-hover:block transition-all z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Active Student Persona
                    </p>
                    <p className="text-xs text-slate-600">
                      Test both <b>Poster</b> & <b>Worker</b> perspectives instantly
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => onSelectUser(u)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/60'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold truncate">{u.name}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              ★{u.rating}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">
                            {u.id === 'usr_aman' ? '🎯 Gig Poster (ME 3rd Yr)' : `🛠️ Worker (${u.course})`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center text-xs font-semibold ${
              activeTab === 'feed' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center text-xs font-semibold ${
              activeTab === 'map' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex flex-col items-center text-xs font-semibold ${
              activeTab === 'active' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`flex flex-col items-center text-xs font-semibold ${
              activeTab === 'matching' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Algorithm</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center text-xs font-semibold ${
              activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};
