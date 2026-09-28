import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { fetchUserProfile } from '../services/api';
import {
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  MessageSquare
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser }) => {
  const [profile, setProfile] = useState<User | null>(currentUser);

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserProfile(currentUser.id)
        .then((data) => setProfile(data))
        .catch(console.error);
    }
  }, [currentUser?.id]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{profile.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified Student
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {profile.course} • {profile.year} ({profile.department})
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {profile.location_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  {profile.college}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Rating Badge */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl text-center min-w-[130px] shadow-sm">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
              <span className="text-2xl font-black text-white">{profile.rating}</span>
              <span className="text-xs text-slate-400">/5</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Reputation Score
            </p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Reputation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{profile.completed_gigs}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified Campus Gigs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completion</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {Math.round(profile.completion_rate * 100)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Successful Delivery Rate</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Response</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-600 mt-2">
            {Math.round(profile.response_rate * 100)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Under 5 Min Response</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Availability</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2 truncate">{profile.availability}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active schedule</p>
        </div>
      </div>

      {/* Skills & Capabilities */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
          Verified Student Skills (For Algorithm Matching)
        </h3>
        <div className="flex flex-wrap gap-2 pt-1">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold"
              >
                <span>{s.skill}</span>
                <span className="text-[10px] text-indigo-500 font-normal">({s.level})</span>
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-400">No skills added yet.</p>
          )}
        </div>
      </div>

      {/* Reviews & Peer Feedback */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Peer Reviews & Feedback
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {profile.reviews?.length || 0} reviews
          </span>
        </div>

        <div className="space-y-3">
          {profile.reviews && profile.reviews.length > 0 ? (
            profile.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.reviewer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={rev.reviewer_name || 'Reviewer'}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-800">{rev.reviewer_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    ★ {rev.rating}
                  </div>
                </div>
                {rev.review && <p className="text-xs text-slate-600 leading-relaxed">{rev.review}</p>}
                <div className="flex gap-4 text-[10px] text-slate-400 pt-1">
                  <span>Comm: ★{rev.communication_rating}</span>
                  <span>Quality: ★{rev.quality_rating}</span>
                  <span>Reliability: ★{rev.reliability_rating}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Complete campus gigs to earn ratings from peers!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
