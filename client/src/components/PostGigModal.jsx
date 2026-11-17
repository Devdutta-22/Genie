import React, { useState, useEffect } from 'react';
import { extractGigWithAi, createGig } from '../services/api.js';
import {
  X,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';



const CATEGORIES = [
  'Design',
  'Tech/Coding',
  'Academics',
  'Delivery',
  'Events',
  'Media'
];

export const CAMPUS_LOCATIONS = [
  { name: 'Galgotias University', lat: 28.3664, lon: 77.5404 },
  { name: 'Gaur Yamuna City', lat: 28.3496, lon: 77.5312 },
  { name: 'Knowledge Park 3', lat: 28.4682, lon: 77.4921 },
  { name: 'Supertech', lat: 28.4735, lon: 77.5036 }
];

export const PostGigModal = ({
  currentUser,
  isOpen,
  onClose,
  onGigCreated,
  initialLocation
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Design');
  const [budget, setBudget] = useState(300);
  const [locationName, setLocationName] = useState(initialLocation || CAMPUS_LOCATIONS[0].name);
  const [deadline, setDeadline] = useState('Tomorrow, 6:00 PM');
  const [urgency, setUrgency] = useState('Normal');
  const [skills, setSkills] = useState(['Canva', 'Photoshop']);
  const [skillInput, setSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialLocation) {
      setLocationName(initialLocation);
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  const handleAiExtract = async () => {
    if (!aiPrompt.trim()) return;
    setIsExtracting(true);
    setError(null);
    try {
      const res = await extractGigWithAi(aiPrompt);
      if (res.title) setTitle(res.title);
      if (res.category) setCategory(res.category);
      if (res.budget) setBudget(res.budget);
      if (res.deadline) setDeadline(res.deadline);
      if (res.urgency) setUrgency(res.urgency);
      if (res.skills && Array.isArray(res.skills)) setSkills(res.skills);

      // Match extracted location to one of the 4 communities if possible
      if (res.locationName) {
        const found = CAMPUS_LOCATIONS.find((loc) =>
          res.locationName.toLowerCase().includes(loc.name.toLowerCase())
        );
        if (found) setLocationName(found.name);
      }

      setDescription(aiPrompt);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
    } catch (e) {
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

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) {
      setError('Please provide a task title');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your task requirement');
      return;
    }
    if (budget < 50) {
      setError('Minimum budget is ₹50');
      return;
    }

    setLoading(true);
    setError(null);

    const locObj =
      CAMPUS_LOCATIONS.find((l) => l.name === locationName) || CAMPUS_LOCATIONS[0];

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
    } catch (err) {
      setError(err.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  };

  const platformFee = Math.round(budget * 0.05);
  const workerPayout = budget - platformFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border-3 border-black shadow-[8px_8px_0px_#000000] max-w-xl w-full overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-black text-white flex items-center justify-between border-b-2 border-black">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300">
              New Request
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight">Post a Task</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* AI Quick Input */}
          <div className="p-3 border-2 border-black bg-neutral-50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Quick AI Fill
              </label>
              {aiSuccess && (
                <span className="text-[10px] font-bold text-emerald-700">Extracted!</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder='e.g., "Need a Canva poster by tomorrow, budget 300 at Galgotias University"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-black focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAiExtract}
                disabled={isExtracting || !aiPrompt.trim()}
                className="px-3 py-1.5 bg-black text-white text-[11px] font-black uppercase border border-black hover:bg-neutral-800 disabled:opacity-50"
              >
                {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Auto-Fill'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 border-2 border-black bg-rose-50 text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Design a fresh club recruitment poster"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border-2 border-black focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
              Task Details *
            </label>
            <textarea
              rows={3}
              placeholder="Describe deliverables, format, guidelines, or delivery expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border-2 border-black focus:outline-none"
              required
            />
          </div>

          {/* Community Location (4 Locations) & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
                Community Hub *
              </label>
              <select
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-black bg-white focus:outline-none"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-black bg-white focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
                Budget (₹) *
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-black focus:outline-none"
                required
              />
              <span className="text-[10px] text-neutral-500 font-bold block mt-1">
                Worker receives: ₹{workerPayout} (Fee: ₹{platformFee})
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
                Deadline
              </label>
              <input
                type="text"
                placeholder="e.g., Today, 8:00 PM"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
              Required Skills
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill (e.g., Canva, Python, DBMS, Xerox)..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border-2 border-black focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-neutral-100 border-2 border-black text-xs font-black uppercase hover:bg-neutral-200"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 border border-black bg-white"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 border-t-2 border-black flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-black bg-white text-xs font-black uppercase tracking-wider hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
