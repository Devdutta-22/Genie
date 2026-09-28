import React, { useState } from 'react';
import type { Gig, User } from '../types';
import { acceptGig } from '../services/api';
import {
  X,
  MapPin,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface GigDetailModalProps {
  gig: Gig | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onAccepted: (updatedGig: Gig) => void;
  onOpenMatching: (gig: Gig) => void;
  onOpenWorkspace: (gig: Gig) => void;
}

export const GigDetailModal: React.FC<GigDetailModalProps> = ({
  gig,
  currentUser,
  isOpen,
  onClose,
  onAccepted,
  onOpenMatching,
  onOpenWorkspace
}) => {
  const [loading, setLoading] = useState(false);
  const [raceConditionError, setRaceConditionError] = useState<string | null>(null);

  if (!isOpen || !gig) return null;

  const isPoster = currentUser?.id === gig.poster_id;
  const isWorker = currentUser?.id === gig.assigned_worker_id;
  const canAccept = !isPoster && gig.status === 'ACTIVE';

  const handleAccept = async () => {
    if (!currentUser) return;
    setLoading(true);
    setRaceConditionError(null);
    try {
      const res = await acceptGig(gig.id, currentUser.id);
      onAccepted(res.gig);
      onClose();
    } catch (err: any) {
      setRaceConditionError(err.message || 'Acceptance failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo tool to deliberately demonstrate race condition rejection
  const handleSimulateConflict = async () => {
    setLoading(true);
    setRaceConditionError(null);
    try {
      // First simulate student A accepting
      await acceptGig(gig.id, 'usr_sneha');
      // Then simulate current user attempting to accept
      await acceptGig(gig.id, currentUser?.id || 'usr_rahul');
    } catch (err: any) {
      setRaceConditionError(`[Simulated Race Condition Guard]: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {gig.category}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold mt-2 text-white">{gig.title}</h2>

          <div className="flex items-center gap-3 mt-2 text-xs text-indigo-200">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {gig.location_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              {gig.deadline}
            </span>
            {gig.urgency === 'Urgent' && (
              <span className="flex items-center gap-1 text-rose-300 font-bold">
                <Zap className="w-3.5 h-3.5 fill-rose-400" /> Urgent
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Race Condition Error Banner */}
          {raceConditionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Atomic Guard: Conflict Prevented</span>
              </div>
              <p>{raceConditionError}</p>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Task Description
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {gig.description}
            </p>
          </div>

          {/* Skills Required */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Required Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {gig.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs font-semibold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Poster Profile */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={gig.poster_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={gig.poster_name || 'Poster'}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/20"
              />
              <div>
                <p className="text-xs text-slate-400 font-semibold">Posted by</p>
                <h5 className="font-bold text-slate-900 text-sm">{gig.poster_name}</h5>
                <p className="text-xs text-slate-500">{gig.poster_course || 'Delhi Tech Campus'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ★ {gig.poster_rating || 5.0} Rating
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Verified Campus Poster</p>
            </div>
          </div>

          {/* Pricing & Escrow Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 text-white text-center">
            <div>
              <p className="text-[11px] text-slate-400">Total Budget</p>
              <p className="text-lg font-black text-white mt-0.5">₹{gig.budget}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Fee (5%)</p>
              <p className="text-lg font-bold text-slate-400 mt-0.5">₹{gig.platform_fee}</p>
            </div>
            <div className="bg-emerald-950/60 rounded-xl p-1 border border-emerald-500/30">
              <p className="text-[11px] text-emerald-300 font-semibold">You Receive</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">₹{gig.worker_payout}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {canAccept && (
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-300 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Securing Gig Atomically...' : 'Accept This Gig'}
              </button>
            )}

            {(isWorker || isPoster) && (gig.status === 'ASSIGNED' || gig.status === 'IN_PROGRESS' || gig.status === 'SUBMITTED') && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWorkspace(gig);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Open Task Workspace & Chat
              </button>
            )}

            {isPoster && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMatching(gig);
                }}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-2xl font-bold text-xs border border-purple-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                View Matching Candidates & Wave Radius
              </button>
            )}

            {/* Test Simulation Button for Race Conditions */}
            {canAccept && (
              <button
                type="button"
                onClick={handleSimulateConflict}
                disabled={loading}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                title="Tests the backend lock preventing double assignment"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Simulate Double-Acceptance Race Condition</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
