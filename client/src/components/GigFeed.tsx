import React, { useState } from 'react';
import type { Gig, GigCategory, User } from '../types';
import { CommunitySection, COMMUNITY_LOCATIONS } from './CommunitySection';
import {
  Search,
  MapPin,
  Clock,
  Filter,
  CheckCircle,
  Plus,
  Layers,
  Palette,
  Code,
  BookOpen,
  Truck,
  Calendar,
  Camera,
  X
} from 'lucide-react';

interface GigFeedProps {
  gigs: Gig[];
  currentUser: User | null;
  onSelectGig: (gig: Gig) => void;
  onAcceptGig: (gig: Gig) => void;
  onOpenNewGig: (prefillLocation?: string) => void;
  onLocationFilterChange?: (locationName: string, lat: number, lon: number) => void;
  selectedCommunityLocation?: string;
}

const CATEGORIES: { label: GigCategory; icon: any }[] = [
  { label: 'All', icon: Layers },
  { label: 'Design', icon: Palette },
  { label: 'Tech/Coding', icon: Code },
  { label: 'Academics', icon: BookOpen },
  { label: 'Delivery', icon: Truck },
  { label: 'Events', icon: Calendar },
  { label: 'Media', icon: Camera }
];

export const GigFeed: React.FC<GigFeedProps> = ({
  gigs,
  currentUser,
  onSelectGig,
  onAcceptGig,
  onOpenNewGig,
  onLocationFilterChange,
  selectedCommunityLocation = ''
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GigCategory>('All');
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>(selectedCommunityLocation);

  const handleSelectCommunity = (name: string, lat: number, lon: number) => {
    if (activeLocationFilter === name) {
      setActiveLocationFilter('');
    } else {
      setActiveLocationFilter(name);
      if (onLocationFilterChange) {
        onLocationFilterChange(name, lat, lon);
      }
    }
  };

  // Filter gigs
  const filteredGigs = gigs.filter((gig) => {
    if (selectedCategory !== 'All' && gig.category !== selectedCategory) return false;

    // Filter by community location if active
    if (activeLocationFilter) {
      const match =
        gig.location_name.toLowerCase().includes(activeLocationFilter.toLowerCase()) ||
        COMMUNITY_LOCATIONS.some(
          (c) =>
            c.name.toLowerCase() === activeLocationFilter.toLowerCase() &&
            gig.location_name.toLowerCase().includes(c.alias.toLowerCase())
        );
      if (!match) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = gig.title.toLowerCase().includes(q);
      const matchDesc = gig.description.toLowerCase().includes(q);
      const matchLoc = gig.location_name.toLowerCase().includes(q);
      const matchSkills = gig.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLoc && !matchSkills) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-900">
      {/* Brutalist Hero Banner in Royal Blue & White */}
      <div className="border-2 border-blue-900 bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#1e3a8a]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-block px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-blue-700 text-white border border-blue-900">
              Campus Micro-Gigs Network
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-none text-blue-950">
              Need a hand?<br />Got time to earn?
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md pt-1">
              Connect directly with verified students for design, coding fixes, event help, or notes across Greater Noida campuses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <button
              onClick={() => onOpenNewGig(activeLocationFilter || undefined)}
              className="px-6 py-3.5 bg-blue-700 text-white text-xs font-black uppercase tracking-wider border-2 border-blue-900 shadow-[4px_4px_0px_#1e3a8a] hover:bg-blue-800 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#1e3a8a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#1e3a8a] transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Post a Request
            </button>
            <div className="px-3.5 py-3 border-2 border-blue-900 bg-blue-50 text-[11px] font-bold text-blue-950 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#1e3a8a]">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span>{currentUser?.location_name || 'Galgotias University'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section: 4 Locations with Images */}
      <CommunitySection
        selectedLocation={activeLocationFilter}
        onSelectLocation={handleSelectCommunity}
        gigs={gigs}
        onOpenNewGig={onOpenNewGig}
      />

      {/* Search & Minimal Filters Bar */}
      <div className="border-2 border-blue-900 bg-white p-4 shadow-[4px_4px_0px_#1e3a8a] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-900" />
            <input
              type="text"
              placeholder="Search tasks, skills (Canva, Python, Notes) or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 border-2 border-blue-900 text-xs font-bold text-slate-900 placeholder:text-blue-900/50 placeholder:font-medium focus:outline-none focus:bg-white"
            />
          </div>

          {activeLocationFilter && (
            <button
              onClick={() => setActiveLocationFilter('')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-blue-900 bg-blue-100 text-blue-950 text-xs font-black uppercase tracking-wider hover:bg-blue-200"
            >
              <span>{activeLocationFilter}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {CATEGORIES.map(({ label, icon: Icon }) => {
            const isSelected = selectedCategory === label;
            return (
              <button
                key={label}
                onClick={() => setSelectedCategory(label)}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-black uppercase tracking-wider border-2 border-blue-900 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-[2px_2px_0px_#1e3a8a]'
                    : 'bg-white text-blue-950 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Header */}
      <div className="flex items-center justify-between border-b-2 border-blue-900 pb-2 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-700" />
          <h2 className="text-sm font-black uppercase tracking-wider text-blue-950">
            Active Requests {activeLocationFilter ? `in ${activeLocationFilter}` : 'Across Campus'}
          </h2>
        </div>
        <span className="text-xs font-black px-2.5 py-0.5 border border-blue-900 bg-white text-blue-900">
          {filteredGigs.length} {filteredGigs.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Gigs Grid */}
      {filteredGigs.length === 0 ? (
        <div className="border-2 border-dashed border-blue-900 bg-white p-12 text-center shadow-[4px_4px_0px_#1e3a8a]">
          <p className="text-sm font-black uppercase tracking-wider text-blue-950">
            No requests found {activeLocationFilter ? `in ${activeLocationFilter}` : ''}
          </p>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Be the first student to post a request in this hub!
          </p>
          <button
            onClick={() => onOpenNewGig(activeLocationFilter || undefined)}
            className="mt-4 px-4 py-2 bg-blue-700 text-white text-xs font-black uppercase tracking-wider border-2 border-blue-900 shadow-[3px_3px_0px_#1e3a8a] hover:bg-blue-800 hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Post a Request Here
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGigs.map((gig) => {
            const isMine = currentUser?.id === gig.poster_id;
            const isAssignedToMe = currentUser?.id === gig.assigned_worker_id;

            return (
              <div
                key={gig.id}
                className="border-2 border-blue-900 bg-white shadow-[4px_4px_0px_#1e3a8a] hover:shadow-[6px_6px_0px_#1e3a8a] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex flex-col justify-between"
              >
                <div className="p-4 space-y-2.5">
                  {/* Top Bar: Category & Location Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-blue-900 bg-blue-50 text-blue-900">
                      {gig.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 truncate max-w-[170px]">
                      <MapPin className="w-3 h-3 text-blue-700 shrink-0" />
                      {gig.location_name}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onSelectGig(gig)}
                    className="font-black text-base text-blue-950 hover:underline cursor-pointer leading-tight line-clamp-2"
                  >
                    {gig.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {gig.description}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {gig.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-bold px-1.5 py-0.5 border border-blue-900 bg-white text-blue-900"
                      >
                        {skill}
                      </span>
                    ))}
                    {gig.skills.length > 3 && (
                      <span className="text-[10px] font-bold px-1 py-0.5 text-blue-800">
                        +{gig.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Poster & Deadline info */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={gig.poster_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={gig.poster_name || 'Poster'}
                        className="w-5 h-5 rounded-none border border-blue-900 object-cover"
                      />
                      <span className="truncate max-w-[110px] text-blue-950">{gig.poster_name || 'Student'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock className="w-3 h-3 text-blue-700" />
                      <span>{gig.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-blue-50/50 border-t-2 border-blue-900 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-blue-950 leading-none">
                      ₹{gig.budget}
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold">
                      Payout: ₹{gig.worker_payout}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {gig.status === 'ACTIVE' && !isMine ? (
                      <button
                        onClick={() => onAcceptGig(gig)}
                        className="px-3.5 py-1.5 bg-blue-700 text-white text-xs font-black uppercase tracking-wider border-2 border-blue-900 shadow-[2px_2px_0px_#1e3a8a] hover:bg-blue-800 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-1 border border-blue-900 bg-white text-blue-900 uppercase">
                        {isAssignedToMe ? 'Yours' : isMine ? 'Your Post' : gig.status}
                      </span>
                    )}

                    <button
                      onClick={() => onSelectGig(gig)}
                      className="px-2.5 py-1.5 bg-white text-blue-950 text-xs font-black uppercase tracking-wider border-2 border-blue-900 hover:bg-blue-50 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
