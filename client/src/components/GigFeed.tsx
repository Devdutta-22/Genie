import React, { useState } from 'react';
import type { Gig, GigCategory, User } from '../types';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  Zap,
  Filter,
  CheckCircle,
  Cpu,
  Layers,
  Palette,
  Code,
  BookOpen,
  Truck,
  Calendar,
  Camera
} from 'lucide-react';

interface GigFeedProps {
  gigs: Gig[];
  currentUser: User | null;
  onSelectGig: (gig: Gig) => void;
  onAcceptGig: (gig: Gig) => void;
  onInspectMatching: (gig: Gig) => void;
  onOpenNewGig: () => void;
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
  onInspectMatching,
  onOpenNewGig
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GigCategory>('All');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Filter gigs
  const filteredGigs = gigs.filter((gig) => {
    if (selectedCategory !== 'All' && gig.category !== selectedCategory) return false;
    if (urgentOnly && gig.urgency !== 'Urgent') return false;
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
    <div className="space-y-6 pb-12">
      {/* Campus Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Hyper-Local Campus Micro-Gig Network
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Need a hand? Or got 30 mins to earn?
          </h1>
          <p className="text-sm sm:text-base text-indigo-200 leading-relaxed">
            Connect with verified students within 500m for poster design, coding fixes, event help, or notes.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenNewGig}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-sm shadow-md hover:bg-indigo-50 transition-all active:scale-95"
            >
              Post a Gig (from ₹100)
            </button>
            <div className="flex items-center gap-2 text-xs text-indigo-300 bg-white/5 px-3 py-2 rounded-xl backdrop-blur-xs">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Current Campus: <b>{currentUser?.location_name || 'Delhi Tech Campus'}</b></span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-60 h-60 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search gigs, skills ('Canva', 'Python', 'Notes'), or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Urgent Filter Toggle */}
          <button
            onClick={() => setUrgentOnly(!urgentOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              urgentOnly
                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${urgentOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
            Urgent Tasks Only
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3" /> Categories:
          </span>
          {CATEGORIES.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setSelectedCategory(label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === label
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Gigs List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            📍 Gigs Near You
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredGigs.length} available
            </span>
          </h2>
          <span className="text-xs text-slate-500">Sorted by hyper-local distance</span>
        </div>

        {filteredGigs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No gigs matching your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or be the first to post a campus micro-gig!
            </p>
            <button
              onClick={onOpenNewGig}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Post a Gig Now
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
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    {/* Header Row: Category, Urgency, Distance */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {gig.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {gig.urgency === 'Urgent' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                            <Zap className="w-3 h-3 fill-rose-500" /> Urgent
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          {gig.distanceMeters !== undefined && gig.distanceMeters !== null
                            ? gig.distanceMeters < 50
                              ? 'Right here'
                              : `${gig.distanceMeters}m away`
                            : gig.location_name}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectGig(gig)}
                      className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer text-base line-clamp-1"
                    >
                      {gig.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {gig.description}
                    </p>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {gig.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                      {gig.skills.length > 3 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400">
                          +{gig.skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Poster row & Deadline */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <img
                          src={gig.poster_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={gig.poster_name || 'Poster'}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                          {gig.poster_name || 'Student'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{gig.deadline}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Row: Budget, Payout & Actions */}
                  <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-slate-900">₹{gig.budget}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Worker gets ₹{gig.worker_payout})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        At: {gig.location_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMine ? (
                        <button
                          onClick={() => onInspectMatching(gig)}
                          className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="View algorithm candidate ranking"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Matching</span>
                        </button>
                      ) : gig.status === 'ACTIVE' ? (
                        <button
                          onClick={() => onAcceptGig(gig)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                          {isAssignedToMe ? 'Assigned to You' : gig.status}
                        </span>
                      )}

                      <button
                        onClick={() => onSelectGig(gig)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
