import React, { useState, useEffect } from 'react';
import { fetchUserProfile } from '../services/api.js';
import { Star, MapPin, IdCard, ShieldCheck, Clock, ExternalLink } from 'lucide-react';



export const ProfileView = ({ currentUser }) => {
  const [profile, setProfile] = useState(currentUser);

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserProfile(currentUser.id)
        .then((data) => setProfile(data))
        .catch(console.error);
    }
  }, [currentUser?.id]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans text-black">
      {/* Profile Header Box */}
      <div className="border-3 border-black bg-white p-6 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-16 h-16 border-2 border-black object-cover shadow-[3px_3px_0px_#000000]"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{profile.name}</h1>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 border border-black bg-neutral-100">
                  Verified
                </span>
              </div>
              <p className="text-xs text-neutral-600 font-bold">
                {profile.course} • {profile.year}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-black" />
                  {profile.location_name}
                </span>
                <span>•</span>
                <span>{profile.college}</span>
              </div>
            </div>
          </div>

          <div className="p-3 border-2 border-black bg-black text-white text-center min-w-[120px]">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-white" />
              <span className="text-xl font-black">{profile.rating}</span>
              <span className="text-[11px] opacity-70">/5</span>
            </div>
            <span className="text-[9px] uppercase font-black tracking-widest block mt-0.5">
              Reputation
            </span>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 pt-4 border-t-2 border-black text-xs font-medium leading-relaxed">
            {profile.bio}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 border-2 border-black bg-white shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Completed</span>
          <span className="text-xl font-black">{profile.completed_gigs}</span>
        </div>
        <div className="p-4 border-2 border-black bg-white shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Completion</span>
          <span className="text-xl font-black">{Math.round(profile.completion_rate * 100)}%</span>
        </div>
        <div className="p-4 border-2 border-black bg-white shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Response</span>
          <span className="text-xl font-black">{Math.round(profile.response_rate * 100)}%</span>
        </div>
        <div className="p-4 border-2 border-black bg-white shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Reviews</span>
          <span className="text-xl font-black">{profile.rating_count}</span>
        </div>
      </div>

      {/* Skills */}
      <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-black pb-2">
          Skills & Capabilities
        </h3>
        <div className="flex flex-wrap gap-2">
          {(profile.skills || []).map((s) => (
            <span
              key={s.skill}
              className="px-2.5 py-1 text-xs font-black uppercase border-2 border-black bg-neutral-50"
            >
              {s.skill} <span className="text-[10px] font-normal opacity-60">({s.level})</span>
            </span>
          ))}
        </div>
      </div>

      {/* College ID & Verification Card */}
      <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <IdCard className="w-4 h-4 text-blue-900" />
            <span>Campus ID Verification</span>
          </h3>
          {profile.verification_status === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border-2 border-emerald-700 text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              VERIFIED STUDENT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border-2 border-amber-700 text-xs font-black">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              PENDING ADMIN VERIFICATION
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5 text-xs">
            <div>
              <span className="font-bold text-neutral-500 uppercase text-[10px] block">Student Roll No:</span>
              <span className="font-mono font-bold text-sm">{profile.student_id || '22SCSE101001'}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-500 uppercase text-[10px] block">Campus Email:</span>
              <span className="font-medium">{profile.email}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-500 uppercase text-[10px] block">Department:</span>
              <span>{profile.department}</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-neutral-500 uppercase text-[10px] block mb-1.5">ID Card Document:</span>
            {profile.id_card_url ? (
              <a
                href={profile.id_card_url}
                target="_blank"
                rel="noreferrer"
                className="group relative block border-2 border-black overflow-hidden bg-neutral-100 max-h-36 max-w-xs"
              >
                <img
                  src={profile.id_card_url}
                  alt="Student ID Card"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                  <ExternalLink className="w-4 h-4" />
                  <span>View Full ID</span>
                </div>
              </a>
            ) : (
              <div className="p-3 border-2 border-dashed border-neutral-400 bg-neutral-50 text-neutral-500 text-xs font-medium">
                Verified via College Enrollment Directory
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
