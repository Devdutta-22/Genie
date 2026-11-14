import React, { useState } from 'react';
import type { Gig, User } from '../types';
import { acceptGig } from '../services/api';
import {
  X,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface GigDetailModalProps {
  gig: Gig | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onAccepted: (updatedGig: Gig) => void;
  onOpenWorkspace: (gig: Gig) => void;
}

export const GigDetailModal: React.FC<GigDetailModalProps> = ({
  gig,
  currentUser,
  isOpen,
  onClose,
  onAccepted,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border-3 border-black shadow-[8px_8px_0px_#000000] max-w-lg w-full overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-black text-white flex items-center justify-between border-b-2 border-black">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300">
              {gig.category}
            </span>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug">
              {gig.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-neutral-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {gig.location_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {gig.deadline}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 border border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Race Condition Guard */}
          {raceConditionError && (
            <div className="p-3 border-2 border-black bg-rose-50 text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-black" />
              <span>{raceConditionError}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-black mb-1">
              Description
            </h4>
            <div className="p-3 border-2 border-black bg-neutral-50 text-xs font-medium leading-relaxed">
              {gig.description}
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-black mb-1.5">
              Required Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {gig.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs font-bold px-2 py-0.5 border-2 border-black bg-white"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Payout & Poster Details */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 border-2 border-black bg-neutral-50">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">
                Total Budget
              </span>
              <div className="text-xl font-black text-black">₹{gig.budget}</div>
              <span className="text-[10px] font-bold text-neutral-600">
                Worker Payout: ₹{gig.worker_payout}
              </span>
            </div>

            <div className="p-3 border-2 border-black bg-neutral-50">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">
                Posted By
              </span>
              <div className="text-sm font-black truncate">{gig.poster_name || 'Student'}</div>
              <span className="text-[10px] font-bold text-neutral-600 truncate block">
                {gig.location_name}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t-2 border-black space-y-2">
            {canAccept && (
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Accepting...' : 'Accept This Request'}
              </button>
            )}

            {(isWorker || isPoster) &&
              (gig.status === 'ASSIGNED' ||
                gig.status === 'IN_PROGRESS' ||
                gig.status === 'SUBMITTED') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenWorkspace(gig);
                  }}
                  className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center gap-1.5"
                >
                  Open Task Workspace & Chat
                </button>
              )}

            <button
              onClick={onClose}
              className="w-full py-2 bg-white text-black text-xs font-black uppercase tracking-wider border-2 border-black hover:bg-neutral-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
