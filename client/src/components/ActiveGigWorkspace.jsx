import React, { useState, useEffect, useRef } from 'react';
import {
  fetchMessages,
  sendMessage,
  updateGigStatus,
  approveGig,
  submitRating
} from '../services/api.js';
import {
  Send
} from 'lucide-react';



export const ActiveGigWorkspace = ({
  currentUser,
  gig,
  allGigs,
  onSelectGig,
  onGigUpdated
}) => {
  const myGigs = allGigs.filter(
    (g) =>
      g.poster_id === currentUser?.id ||
      g.assigned_worker_id === currentUser?.id
  );

  const activeGig = gig || myGigs[0];

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState('');
  const [submittingLink, setSubmittingLink] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Rating state
  const [qualRating, setQualRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const messagesEndRef = useRef(null);

  const loadMessages = async (gigId) => {
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

      // Connect to WebSocket for instant live chat synchronization
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_CHAT_MESSAGE' && payload.data?.gigId === activeGig.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.data.message.id)) return prev;
              return [...prev, payload.data.message];
            });
          }
        } catch (e) {
          console.error('Chat WS error:', e);
        }
      };

      return () => {
        ws.close();
      };
    }
  }, [activeGig?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
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

  const handleStatusChange = async (newStatus) => {
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

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!activeGig || !currentUser) return;
    setRatingSubmitting(true);
    const targetUserId =
      currentUser.id === activeGig.poster_id
        ? activeGig.assigned_worker_id
        : activeGig.poster_id;

    try {
      await submitRating(activeGig.id, {
        from_user_id: currentUser.id,
        to_user_id: targetUserId,
        communication_rating: qualRating,
        quality_rating: qualRating,
        reliability_rating: qualRating,
        review: ratingComment
      });
      setIsRatingOpen(false);
      const updated = { ...activeGig, status: 'CLOSED' };
      onGigUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (!activeGig) {
    return (
      <div className="border-3 border-black bg-white p-12 text-center shadow-[6px_6px_0px_#000000]">
        <h3 className="text-base font-black uppercase tracking-wider text-black">
          No Active Tasks
        </h3>
        <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
          Accept a request from the Feed or post your own task to collaborate with nearby students.
        </p>
      </div>
    );
  }

  const isPoster = currentUser?.id === activeGig.poster_id;
  const isWorker = currentUser?.id === activeGig.assigned_worker_id;

  const STEPS = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CLOSED'];
  const currentStepIdx = STEPS.indexOf(activeGig.status);

  return (
    <div className="space-y-6 pb-12 font-sans text-black">
      {/* Switcher if multiple tasks */}
      {myGigs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-black uppercase text-neutral-500 shrink-0">
            Switch:
          </span>
          {myGigs.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGig(g)}
              className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 border-black whitespace-nowrap transition-all ${
                g.id === activeGig.id
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              {g.title.slice(0, 20)}... (₹{g.budget})
            </button>
          ))}
        </div>
      )}

      {/* Task Summary Banner */}
      <div className="border-3 border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_#000000] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 border border-black bg-neutral-100">
                {activeGig.category}
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
                {isPoster ? 'Role: Poster' : isWorker ? 'Role: Worker' : 'Viewer'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase mt-1 leading-tight">
              {activeGig.title}
            </h1>
            <p className="text-xs text-neutral-600 font-bold mt-0.5">
              Hub: {activeGig.location_name} • Total: ₹{activeGig.budget} (Payout: ₹{activeGig.worker_payout})
            </p>
          </div>

          <div className="px-3 py-1.5 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black">
            {activeGig.status}
          </div>
        </div>

        {/* Minimal Progress Steps */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1">
          {STEPS.map((st, i) => {
            const isDone = currentStepIdx > i;
            const isCurrent = currentStepIdx === i;
            return (
              <div
                key={st}
                className={`flex-1 p-2 text-center border-2 border-black text-[10px] font-black uppercase tracking-wider transition-all ${
                  isCurrent
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000000]'
                    : isDone
                    ? 'bg-neutral-100 text-black line-through'
                    : 'bg-white text-neutral-400'
                }`}
              >
                {st.replace('_', ' ')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Live Chat & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Box (2 Columns) */}
        <div className="lg:col-span-2 border-3 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col h-[520px]">
          <div className="px-4 py-3 bg-neutral-50 border-b-2 border-black flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider">
              Coordination Chat
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase">
              Live WebSocket Sync
            </span>
          </div>

          {/* Messages scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fbfbfa]">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-neutral-500 uppercase tracking-wider">
                No messages yet. Send a message to coordinate!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] font-bold text-neutral-500 uppercase mb-0.5">
                      {m.sender_name || (isMe ? 'You' : 'Peer')}
                    </span>
                    <div
                      className={`max-w-[80%] p-2.5 text-xs font-medium border-2 border-black ${
                        isMe
                          ? 'bg-black text-white shadow-[2px_2px_0px_#000000]'
                          : 'bg-white text-black shadow-[2px_2px_0px_#000000]'
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

          {/* Chat Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t-2 border-black flex gap-2">
            <input
              type="text"
              placeholder="Type message to coordinate..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="flex-1 px-3 py-2 bg-neutral-50 border-2 border-black text-xs font-bold focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newMsg.trim()}
              className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Action Panel (1 Column) */}
        <div className="space-y-4">
          {/* Worker Actions */}
          {isWorker && activeGig.status !== 'COMPLETED' && activeGig.status !== 'CLOSED' && (
            <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-black pb-2">
                Worker Actions
              </h3>

              {activeGig.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="w-full py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                >
                  Mark Progress
                </button>
              )}

              {(activeGig.status === 'ASSIGNED' || activeGig.status === 'IN_PROGRESS') && (
                <div>
                  {!isSubmittingWork ? (
                    <button
                      onClick={() => setIsSubmittingWork(true)}
                      className="w-full py-2.5 bg-white text-black text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-neutral-100"
                    >
                      Submit Deliverable
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 border-2 border-black bg-neutral-50">
                      <input
                        type="text"
                        placeholder="Link (Drive, Canva, Github...)"
                        value={submittingLink}
                        onChange={(e) => setSubmittingLink(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border-2 border-black focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="Notes or handoff info..."
                        value={submittingNotes}
                        onChange={(e) => setSubmittingNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border-2 border-black focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange('SUBMITTED')}
                          className="flex-1 py-1.5 bg-black text-white text-xs font-black uppercase tracking-wider border border-black"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSubmittingWork(false)}
                          className="px-2.5 py-1.5 bg-white text-black text-xs font-bold border border-black"
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

          {/* Poster Review & Approval */}
          {activeGig.status === 'SUBMITTED' && isPoster && (
            <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-3">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-black text-white">
                Deliverable Ready
              </span>
              {activeGig.submission_link && (
                <a
                  href={activeGig.submission_link}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-2 border-2 border-black bg-neutral-50 text-xs font-bold hover:underline"
                >
                  View Link: {activeGig.submission_link}
                </a>
              )}
              {activeGig.submission_notes && (
                <p className="text-xs text-neutral-700 font-medium">
                  "{activeGig.submission_notes}"
                </p>
              )}
              <button
                onClick={handleApprove}
                className="w-full py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000]"
              >
                Approve & Release ₹{activeGig.worker_payout}
              </button>
            </div>
          )}

          {/* Rating Prompt */}
          {activeGig.status === 'COMPLETED' && (
            <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider">
                Task Completed!
              </h4>
              <p className="text-xs text-neutral-600">
                Mutual review helps verified students build campus reputation.
              </p>
              {!isRatingOpen ? (
                <button
                  onClick={() => setIsRatingOpen(true)}
                  className="w-full py-2 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000]"
                >
                  Leave Rating
                </button>
              ) : (
                <form onSubmit={handleSubmitRating} className="space-y-3 border-t-2 border-black pt-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Quality (1-5):</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={qualRating}
                      onChange={(e) => setQualRating(Number(e.target.value))}
                      className="w-12 px-1.5 py-0.5 border-2 border-black text-center font-black"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Short review comment..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full px-2 py-1 text-xs border-2 border-black focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={ratingSubmitting}
                    className="w-full py-2 bg-black text-white text-xs font-black uppercase tracking-wider border border-black disabled:opacity-50"
                  >
                    {ratingSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeGig.status === 'CLOSED' && (
            <div className="border-2 border-black bg-neutral-100 p-4 text-center">
              <span className="text-xs font-black uppercase tracking-wider">
                ✓ Task Closed & Verified
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
