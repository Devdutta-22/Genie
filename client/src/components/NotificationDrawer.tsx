import React from 'react';
import type { NotificationItem } from '../types';
import { Bell, X, MapPin } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 flex justify-end">
      <div className="w-full max-w-md bg-white border-l-3 border-black h-full shadow-[8px_0px_0px_#000000] flex flex-col animate-in slide-in-from-right duration-150">
        {/* Header */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-black text-xs">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-black">
                Campus Alerts
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fbfbfa]">
          {notifications.length === 0 ? (
            <div className="text-center py-24 text-neutral-500 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider">No alerts yet</p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                You will be notified when requests are published in your campus community hub.
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
                  className={`p-3.5 border-2 border-black transition-all cursor-pointer space-y-1.5 ${
                    isUnread
                      ? 'bg-white shadow-[3px_3px_0px_#000000]'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.2 border border-black bg-neutral-50 text-black">
                      {n.gig_category || 'Gig Alert'}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-black uppercase text-black line-clamp-1">
                    {n.gig_title || 'New Campus Task'}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-neutral-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-black" />
                      {n.gig_location || 'Campus'}
                    </span>
                    <span className="text-black font-black">₹{n.gig_budget || 0}</span>
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
