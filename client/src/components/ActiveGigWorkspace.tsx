import React, { useState, useEffect, useRef } from 'react';
import type { Gig, User, ChatMessage } from '../types';
import {
  fetchMessages,
  sendMessage,
  updateGigStatus,
  approveGig,
  submitRating
} from '../services/api';
import {
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Star,
  Check,
  RefreshCw,
  FileCheck
} from 'lucide-react';

interface ActiveGigWorkspaceProps {
  currentUser: User | null;
  gig: Gig | null;
  allGigs: Gig[];
  onSelectGig: (gig: Gig) => void;
  onGigUpdated: (updatedGig: Gig) => void;
}

export const ActiveGigWorkspace: React.FC<ActiveGigWorkspaceProps> = ({
  currentUser,
  gig,
  allGigs,
  onSelectGig,
  onGigUpdated
}) => {
  // Filter gigs where currentUser is either poster or assigned worker
  const myGigs = allGigs.filter(
    (g) =>
      g.poster_id === currentUser?.id ||
      g.assigned_worker_id === currentUser?.id
  );

  const activeGig = gig || myGigs[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState('');
  const [submittingLink, setSubmittingLink] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Rating state
  const [commRating, setCommRating] = useState(5);
  const [qualRating, setQualRating] = useState(5);
  const [relRating, setRelRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (gigId: string) => {
    try {
      const msgs = await fetchMessages(gigId);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeGig?.id) {
      loadMessages(activeGig.id);
    }
  }, [activeGig?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeGig || !currentUser) return;
    const text = newMsg.trim();
    setNewMsg('');

    const receiverId =
      currentUser.id === activeGig.poster_id
        ? activeGig.assigned_worker_id || ''
        : activeGig.poster_id;

    try {
      const msg = await sendMessage(activeGig.id, currentUser.id, receiverId, text);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeGig) return;
    try {
      const updated = await updateGigStatus(
        activeGig.id,
        newStatus,
        submittingNotes,
        submittingLink
      );
      onGigUpdated(updated);
      setIsSubmittingWork(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    if (!activeGig) return;
    try {
      const res = await approveGig(activeGig.id);
      onGigUpdated(res.gig);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGig || !currentUser) return;
    setRatingSubmitting(true);
    const targetUserId =
      currentUser.id === activeGig.poster_id
        ? activeGig.assigned_worker_id!
        : activeGig.poster_id;

    try {
      await submitRating(activeGig.id, {
        from_user_id: currentUser.id,
        to_user_id: targetUserId,
        communication_rating: commRating,
        quality_rating: qualRating,
        reliability_rating: relRating,
        review: ratingComment
      });
      setIsRatingOpen(false);
      const updated = { ...activeGig, status: 'CLOSED' as const };
      onGigUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (!activeGig) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
        <Sparkles className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Active Tasks Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Accept a gig from the Feed or post your own task to start collaborating with nearby students.
        </p>
      </div>
    );
  }

  const isPoster = currentUser?.id === activeGig.poster_id;
  const isWorker = currentUser?.id === activeGig.assigned_worker_id;

  const STEPS = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CLOSED'];
  const currentStepIdx = STEPS.indexOf(activeGig.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Active Gig Selector Pills if multiple tasks */}
      {myGigs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap pl-1">
            Switch Task:
          </span>
          {myGigs.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGig(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                g.id === activeGig.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {g.title.slice(0, 24)}... (₹{g.budget})
            </button>
          ))}
        </div>
      )}

      {/* Task Summary Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                {activeGig.category}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {isPoster ? '👑 You are the Poster' : isWorker ? '🛠️ You are the Worker' : 'Auditor'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{activeGig.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Location: <b>{activeGig.location_name}</b> • Budget: <b>₹{activeGig.budget}</b> (Worker gets ₹{activeGig.worker_payout})
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-900 text-white">
              Status: {activeGig.status}
            </span>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 max-w-2xl mx-auto">
            {STEPS.map((st, i) => {
              const isDone = currentStepIdx > i;
              const isCurrent = currentStepIdx === i;
              return (
                <div key={st} className="flex flex-col items-center gap-1.5 flex-1 text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] ${isCurrent ? 'font-bold text-indigo-600' : 'text-slate-500'}`}>
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workspace Grid: In-app Chat (Left) & Actions/Deliverable (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Chat between Poster & Worker */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Task Chat & Coordination</h3>
            </div>
            <button
              onClick={() => loadMessages(activeGig.id)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No messages yet. Say hi and align on the deliverables!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                      <span>{m.sender_name || (isMe ? 'You' : 'Peer')}</span>
                      <span>•</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply chips */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-slate-400 font-semibold shrink-0">Quick:</span>
            {[
              "I'm starting on it now!",
              "Draft link shared above.",
              "Can we meet near Block B?",
              "Task is done! Please approve."
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setNewMsg(chip)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Type message to coordinate task..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={!newMsg.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right Column: Task Actions, Submission & Payments */}
        <div className="space-y-5">
          {/* Worker Actions Box */}
          {isWorker && activeGig.status !== 'COMPLETED' && activeGig.status !== 'CLOSED' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Worker Action Center
              </h3>

              {activeGig.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Mark Task as Started (In Progress)
                </button>
              )}

              {(activeGig.status === 'ASSIGNED' || activeGig.status === 'IN_PROGRESS') && (
                <div>
                  {!isSubmittingWork ? (
                    <button
                      onClick={() => setIsSubmittingWork(true)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      Submit Completed Deliverable
                    </button>
                  ) : (
                    <div className="space-y-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                      <h4 className="text-xs font-bold text-emerald-900">Submit Deliverable</h4>
                      <input
                        type="text"
                        placeholder="Link (Google Drive, Canva, GitHub, etc.)"
                        value={submittingLink}
                        onChange={(e) => setSubmittingLink(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs"
                      />
                      <textarea
                        rows={2}
                        placeholder="Notes or handover instructions..."
                        value={submittingNotes}
                        onChange={(e) => setSubmittingNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange('SUBMITTED')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                        >
                          Confirm Submission
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSubmittingWork(false)}
                          className="px-3 py-2 bg-white text-slate-600 text-xs font-semibold rounded-xl border border-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submission Review Box (if submitted) */}
          {activeGig.status === 'SUBMITTED' && (
            <div className="bg-white rounded-3xl p-5 border border-indigo-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Deliverable Submitted
                </span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>

              {activeGig.submission_link && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-500 block text-[10px]">Deliverable Link:</span>
                  <a
                    href={activeGig.submission_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-bold flex items-center gap-1 mt-0.5 truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    {activeGig.submission_link}
                  </a>
                </div>
              )}

              {activeGig.submission_notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {activeGig.submission_notes}
                </p>
              )}

              {isPoster && (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleApprove}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Work & Release ₹{activeGig.worker_payout}
                  </button>
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Request Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Receipt Banner if completed */}
          {(activeGig.status === 'COMPLETED' || activeGig.status === 'CLOSED') && (
            <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm">Escrow Payment Released!</h4>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Task Budget:</span>
                  <b className="text-slate-800">₹{activeGig.budget}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Commission (5%):</span>
                  <b className="text-slate-800">₹{activeGig.platform_fee}</b>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 text-emerald-700 font-extrabold">
                  <span>Student Worker Payout:</span>
                  <span>₹{activeGig.worker_payout}</span>
                </div>
              </div>

              {activeGig.status !== 'CLOSED' && (
                <button
                  onClick={() => setIsRatingOpen(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Star className="w-3.5 h-3.5 text-yellow-300" />
                  Leave Peer Rating & Review
                </button>
              )}
            </div>
          )}

          {/* Rating Modal */}
          {isRatingOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-base font-bold text-slate-900">
                  Rate Peer & Update Campus Reputation
                </h3>
                <p className="text-xs text-slate-500">
                  Your feedback helps maintain a trusted, reliable campus community.
                </p>

                <form onSubmit={handleSubmitRating} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Communication (1 - 5 Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCommRating(s)}
                          className={`flex-1 py-1.5 rounded-xl border text-xs font-bold ${
                            commRating >= s
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          ★{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Work Quality (1 - 5 Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setQualRating(s)}
                          className={`flex-1 py-1.5 rounded-xl border text-xs font-bold ${
                            qualRating >= s
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          ★{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reliability & Punctuality (1 - 5 Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRelRating(s)}
                          className={`flex-1 py-1.5 rounded-xl border text-xs font-bold ${
                            relRating >= s
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          ★{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Comment / Review
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Delivered on time and followed instructions perfectly!"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={ratingSubmitting}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                    >
                      {ratingSubmitting ? 'Recording...' : 'Submit Rating'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRatingOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
