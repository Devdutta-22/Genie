import React, { useState } from 'react';
import type { User } from '../types';
import {
  Home,
  Flame,
  Map,
  Plus,
  Bell,
  ChevronDown,
  X,
  Briefcase
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  activeTab: 'feed' | 'map' | 'active' | 'profile';
  setActiveTab: (tab: 'feed' | 'map' | 'active' | 'profile') => void;
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      {/* Top Brutalist Navbar (Royal Blue & Pure White) */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-blue-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo - Royal Blue Brutalism */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none group"
              onClick={() => setActiveTab('feed')}
            >
              <div className="w-9 h-9 bg-blue-700 text-white border-2 border-blue-900 shadow-[2px_2px_0px_#1e3a8a] flex items-center justify-center font-black text-sm tracking-tighter group-hover:bg-blue-800 transition-colors">
                GG
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg sm:text-xl tracking-tight uppercase leading-none text-blue-950">
                    Gully Gigs
                  </span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 border border-blue-900 bg-blue-50 text-blue-800">
                    Campus Live
                  </span>
                </div>
              </div>
            </div>

            {/* PWA-Style Main Navigation Icons (Fixed in Header on Desktop) */}
            <nav className="hidden md:flex items-center gap-2 bg-blue-50/70 p-1 border-2 border-blue-900 shadow-[2px_2px_0px_#1e3a8a]">
              {/* 1 - Home */}
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  activeTab === 'feed'
                    ? 'bg-blue-700 text-white border-blue-900 shadow-[2px_2px_0px_#1e3a8a]'
                    : 'bg-white text-blue-950 border-transparent hover:border-blue-900 hover:bg-white'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>1. Home</span>
              </button>

              {/* 2 - Active Gigs Around You */}
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  activeTab === 'feed'
                    ? 'bg-blue-700 text-white border-blue-900 shadow-[2px_2px_0px_#1e3a8a]'
                    : 'bg-white text-blue-950 border-transparent hover:border-blue-900 hover:bg-white'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>2. Active Gigs</span>
              </button>

              {/* 3 - Map View */}
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  activeTab === 'map'
                    ? 'bg-blue-700 text-white border-blue-900 shadow-[2px_2px_0px_#1e3a8a]'
                    : 'bg-white text-blue-950 border-transparent hover:border-blue-900 hover:bg-white'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>3. Live Map</span>
              </button>

              {/* Secondary: My Tasks Workspace */}
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  activeTab === 'active'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-[2px_2px_0px_#1e3a8a]'
                    : 'bg-white text-blue-950 border-transparent hover:border-blue-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Tasks</span>
              </button>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Post Gig CTA Button */}
              <button
                onClick={onOpenNewGigModal}
                className="px-3.5 py-2 bg-blue-700 text-white text-xs font-black uppercase tracking-wider border-2 border-blue-900 shadow-[3px_3px_0px_#1e3a8a] hover:bg-blue-800 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Post Request</span>
                <span className="sm:hidden">Post</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 border-2 border-blue-900 bg-white hover:bg-blue-50 transition-colors shadow-[2px_2px_0px_#1e3a8a]"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-blue-950" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 bg-red-600 text-white text-[9px] font-black border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Persona Switcher Dropdown */}
              {currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 border-2 border-blue-900 bg-white hover:bg-blue-50 transition-colors shadow-[2px_2px_0px_#1e3a8a]"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 border border-blue-900 object-cover"
                    />
                    <span className="text-xs font-black text-blue-950 hidden sm:inline max-w-[90px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-blue-900" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border-2 border-blue-900 shadow-[4px_4px_0px_#1e3a8a] p-2 z-50 animate-in fade-in">
                      <div className="px-2 py-1.5 border-b-2 border-blue-900 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                          Switch Student Profile
                        </span>
                        <button
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-xs font-black text-blue-900 hover:opacity-60"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {allUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSelectUser(u);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2 border transition-all flex items-center gap-2 text-xs font-bold ${
                              u.id === currentUser.id
                                ? 'bg-blue-700 text-white border-blue-900'
                                : 'bg-white text-slate-900 border-transparent hover:border-blue-900 hover:bg-blue-50'
                            }`}
                          >
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-6 h-6 border border-current object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black leading-none">{u.name}</p>
                              <p className="text-[10px] opacity-75 truncate pt-0.5">{u.location_name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed PWA Navigation Bar at Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-blue-900 shadow-[0_-4px_10px_rgba(30,58,138,0.15)] flex items-center justify-around py-1.5 px-2">
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'feed'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 font-bold hover:text-blue-900'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'feed' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">1. Home</span>
        </button>

        {/* Tab 2: Active Gigs */}
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'feed'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 font-bold hover:text-blue-900'
          }`}
        >
          <Flame className={`w-5 h-5 text-amber-500 fill-amber-500 ${activeTab === 'feed' ? 'scale-110' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">2. Gigs</span>
        </button>

        {/* Post Quick Icon */}
        <button
          onClick={onOpenNewGigModal}
          className="w-10 h-10 -mt-4 bg-blue-700 text-white rounded-none border-2 border-blue-950 shadow-[2px_2px_0px_#1e3a8a] flex items-center justify-center active:scale-95 transition-transform"
          title="Post a Gig"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Tab 3: Live Map */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'map'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 font-bold hover:text-blue-900'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">3. Map</span>
        </button>

        {/* Tab: Tasks */}
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'active'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 font-bold hover:text-blue-900'
          }`}
        >
          <Briefcase className={`w-5 h-5 ${activeTab === 'active' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] uppercase tracking-tight">Tasks</span>
        </button>
      </nav>
    </>
  );
};
