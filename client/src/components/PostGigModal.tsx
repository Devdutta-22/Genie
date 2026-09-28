import React, { useState } from 'react';
import type { User, GigCategory } from '../types';
import { extractGigWithAi, createGig } from '../services/api';
import {
  Sparkles,
  X,
  MapPin,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Tag,
  Zap,
  Loader2
} from 'lucide-react';

interface PostGigModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onGigCreated: (gig: any) => void;
}

const CATEGORIES: GigCategory[] = [
  'Design',
  'Tech/Coding',
  'Academics',
  'Delivery',
  'Events',
  'Media'
];

const CAMPUS_LOCATIONS = [
  { name: 'Block B (Tech Hub)', lat: 28.5448, lon: 77.1935 },
  { name: 'Central Library', lat: 28.5435, lon: 77.1940 },
  { name: 'SAC & Canteen', lat: 28.5440, lon: 77.1918 },
  { name: 'Hostel 4 (Block D)', lat: 28.5420, lon: 77.1905 },
  { name: 'Block A (CSE & Xerox)', lat: 28.5455, lon: 77.1920 },
  { name: 'Block C (Science Labs)', lat: 28.5470, lon: 77.1915 },
  { name: 'Sports Complex', lat: 28.5480, lon: 77.1950 }
];

export const PostGigModal: React.FC<PostGigModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onGigCreated
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GigCategory>('Design');
  const [budget, setBudget] = useState(300);
  const [locationName, setLocationName] = useState(CAMPUS_LOCATIONS[0].name);
  const [deadline, setDeadline] = useState('Tomorrow, 6:00 PM');
  const [urgency, setUrgency] = useState<'Low' | 'Normal' | 'Urgent'>('Normal');
  const [skills, setSkills] = useState<string[]>(['Canva', 'Photoshop']);
  const [skillInput, setSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAiExtract = async () => {
    if (!aiPrompt.trim()) return;
    setIsExtracting(true);
    setError(null);
    try {
      const res = await extractGigWithAi(aiPrompt);
      if (res.title) setTitle(res.title);
      if (res.category) setCategory(res.category as GigCategory);
      if (res.budget) setBudget(res.budget);
      if (res.deadline) setDeadline(res.deadline);
      if (res.urgency) setUrgency(res.urgency);
      if (res.skills && Array.isArray(res.skills)) setSkills(res.skills);
      if (res.locationName) setLocationName(res.locationName);
      setDescription(aiPrompt);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 4000);
    } catch (e: any) {
      setError('AI extraction could not process this prompt. Please fill fields manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in as a student to post a gig');
      return;
    }
    if (!title.trim() || !budget) {
      setError('Title and budget are required');
      return;
    }

    setLoading(true);
    setError(null);

    const locObj = CAMPUS_LOCATIONS.find((l) => l.name === locationName) || CAMPUS_LOCATIONS[0];

    try {
      const newGig = await createGig({
        poster_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        location_name: locObj.name,
        latitude: locObj.lat,
        longitude: locObj.lon,
        deadline,
        urgency,
        skills
      });

      onGigCreated(newGig);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  };

  const platformFee = Math.round(budget * 0.05);
  const workerPayout = budget - platformFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-indigo-100">
                Post a Micro-Gig
              </span>
              <span className="text-xs text-indigo-300">Delhi Tech Campus</span>
            </div>
            <h2 className="text-xl font-bold mt-1">What do you need help with?</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* AI Quick Fill Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Smart Extraction (Describe your task naturally)
              </label>
              <span className="text-[10px] text-indigo-500 font-semibold">Gemini / NLP Assisted</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder='e.g., "Need someone nearby who knows Canva to make a poster by tomorrow. Budget ₹300 at Block B"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAiExtract}
                disabled={isExtracting || !aiPrompt.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Extract with AI</span>
                  </>
                )}
              </button>
            </div>

            {aiSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Extracted Title, Category, Skills, Budget, and Campus Location!
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Gig Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Design Instagram Poster for Tech Fest"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GigCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description & Requirements *</label>
            <textarea
              rows={3}
              required
              placeholder="Explain the task clearly so nearby students know what deliverables are expected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Skills Required */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                Required Skills (Used by the Matching Algorithm)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Press Enter or Add</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Canva, Python, DBMS, Stall Setup..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-600 transition-colors ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Campus Location & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Campus Task Location *
              </label>
              <select
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Deadline *
              </label>
              <input
                type="text"
                placeholder="e.g. Tomorrow, 6:00 PM or Today 4 PM"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Budget, Urgency & Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-600" />
                Total Budget (₹) *
              </label>
              <input
                type="number"
                min="50"
                step="10"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500">Min ₹50 for college micro-tasks</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Urgency Priority
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent (Needs immediate attention)</option>
                <option value="Low">Low (Flexible deadline)</option>
              </select>
            </div>
          </div>

          {/* Transparent Escrow / Fee Breakdown Box */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700">Platform Commission (5%):</span>
              <span className="ml-1 text-slate-500">₹{platformFee}</span>
            </div>
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <span>Student Worker Receives:</span>
              <span className="text-sm font-extrabold text-emerald-600">₹{workerPayout}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              {loading ? 'Publishing & Matching...' : 'Publish Gig & Find Students'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
