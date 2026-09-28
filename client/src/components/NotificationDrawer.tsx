import React from 'react';
import type { NotificationItem } from '../types';
import {
  Bell,
  X,
  Radio,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onSelectNotificationGig: (gigId: string) => void;
  onMarkRead: (notifId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotificationGig,
  onMarkRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Alerts & Proximity Waves</h3>
              <p className="text-[11px] text-slate-500">Live matching alerts within walking distance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-24 text-slate-400 space-y-2">
              <Radio className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold">No notifications right now.</p>
              <p className="text-[11px] text-slate-400">
                You will be alerted when a relevant gig is posted within your radius wave!
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = n.status === 'UNREAD';
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    onMarkRead(n.id);
                    onSelectNotificationGig(n.gig_id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isUnread
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-xs hover:border-indigo-300'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        Wave {n.wave}
                      </span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {n.gig_title || 'New Campus Gig'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {n.match_score}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {Math.round(n.distance_meters)}m away ({n.gig_location || 'Campus'})
                    </span>
                    <b className="text-slate-900 font-bold">₹{n.gig_budget}</b>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                      View Task <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
