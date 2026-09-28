import React, { useState, useEffect } from 'react';
import type { Gig, MatchingResult } from '../types';
import { fetchGigMatching, notifyWave } from '../services/api';
import {
  Cpu,
  Sparkles,
  MapPin,
  Radio,
  CheckCircle,
  Filter,
  Layers,
  Send,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface MatchingInspectorProps {
  selectedGig: Gig | null;
  allGigs: Gig[];
  onSelectGig: (gig: Gig) => void;
}

export const MatchingInspector: React.FC<MatchingInspectorProps> = ({
  selectedGig,
  allGigs,
  onSelectGig
}) => {
  const activeGigs = allGigs.filter((g) => g.status === 'ACTIVE' || g.status === 'NOTIFIED' || g.status === 'MATCHING');
  const currentGig = selectedGig || activeGigs[0] || allGigs[0];

  const [matchingData, setMatchingData] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [escalatingWave, setEscalatingWave] = useState<number | null>(null);
  const [escalatedWaves, setEscalatedWaves] = useState<number[]>([1]);
  const [activeTab, setActiveTab] = useState<'candidates' | 'formula' | 'waves'>('candidates');

  const loadMatching = async (gigId: string) => {
    setLoading(true);
    try {
      const data = await fetchGigMatching(gigId);
      setMatchingData(data);
    } catch (err) {
      console.error('Failed to load matching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentGig?.id) {
      loadMatching(currentGig.id);
    }
  }, [currentGig?.id]);

  const handleEscalateWave = async (wave: number) => {
    if (!currentGig) return;
    setEscalatingWave(wave);
    try {
      await notifyWave(currentGig.id, wave);
      if (!escalatedWaves.includes(wave)) {
        setEscalatedWaves([...escalatedWaves, wave]);
      }
      await loadMatching(currentGig.id);
    } catch (err) {
      console.error(err);
    } finally {
      setEscalatingWave(null);
    }
  };

  if (!currentGig) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
        <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Gigs Available to Inspect</h3>
        <p className="text-xs text-slate-500 mt-1">Please create or post a gig first to test the matching engine.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-purple-300" />
            Matching Engine & Proximity Wave Engine
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hybrid Algorithm & Candidate Ranker
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Inspect candidate discovery filters, exact mathematical scoring weights, and progressive notification radius waves in real time.
          </p>
        </div>

        {/* Gig Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20">
          <span className="text-xs text-slate-300 font-semibold pl-2">Inspecting:</span>
          <select
            value={currentGig.id}
            onChange={(e) => {
              const found = allGigs.find((g) => g.id === e.target.value);
              if (found) onSelectGig(found);
            }}
            className="bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 focus:outline-hidden"
          >
            {allGigs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title.slice(0, 32)}... (₹{g.budget})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadMatching(currentGig.id)}
            disabled={loading}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh calculation"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gig Overview Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              {currentGig.category}
            </span>
            <span className="text-xs font-semibold text-slate-500">Status: {currentGig.status}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{currentGig.title}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              {currentGig.location_name}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-900">Budget: ₹{currentGig.budget}</span>
            <span>•</span>
            <span>Due: {currentGig.deadline}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1 self-center">Required Skills:</span>
          {currentGig.skills.map((s) => (
            <span key={s} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Discovery Funnel Stats */}
      {matchingData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Students</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{matchingData.summary.totalStudents}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Active on campus network</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Hard Filter Pass</span>
              <Filter className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-indigo-600 mt-2">{matchingData.summary.eligibleCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Matched skill threshold &gt; 20%</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Wave 1 Eligible</span>
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{matchingData.summary.wave1Count}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Within 500m proximity</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Top Match Score</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-2">
              {matchingData.candidates[0]?.matchScore || 0}%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Leading: {matchingData.candidates[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs: Candidates / Formula / Proximity Waves */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'candidates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Ranked Candidates ({matchingData?.candidates.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('waves')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'waves'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Proximity Escalation Waves (0-500m → 1km → 2km)
        </button>

        <button
          onClick={() => setActiveTab('formula')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'formula'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Algorithm Weights & Mathematical Model
        </button>
      </div>

      {/* Tab 1: Candidates Breakdown Cards */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Calculating composite match scores...</p>
            </div>
          ) : !matchingData || matchingData.candidates.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-700">No candidates passed hard skill filtering for this task.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingData.candidates.map((cand, idx) => (
                <div
                  key={cand.userId}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:border-indigo-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/20"
                        />
                        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {cand.name}
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            Wave {cand.recommendedWave}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">{cand.course} • {cand.year}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          {cand.locationName} ({cand.distanceMeters}m away)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-base shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        {cand.matchScore}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Composite Score
                      </p>
                    </div>
                  </div>

                  {/* Weights Breakdown Progress Bars */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>🎯 Skill Match (40% weight)</span>
                        <span className="font-bold text-indigo-600">{cand.skillMatchScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${cand.skillMatchScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>📍 Proximity Distance (30% weight)</span>
                        <span className="font-bold text-emerald-600">{cand.distanceScore}% ({cand.distanceMeters}m)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${cand.distanceScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-slate-500 font-medium">
                      <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                        <span className="block text-slate-400">Avail (15%)</span>
                        <b className="text-slate-800">{cand.availabilityScore}%</b>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                        <span className="block text-slate-400">Rating (10%)</span>
                        <b className="text-slate-800">{cand.ratingScore}%</b>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                        <span className="block text-slate-400">Reliability (5%)</span>
                        <b className="text-slate-800">{cand.reliabilityScore}%</b>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Proximity Waves Controller */}
      {activeTab === 'waves' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Proximity-Based Notification Escalation</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              To prevent campus notification spam, Gully Gigs does not blast notifications to all 20,000 students. Instead, notifications escalate in waves based on proximity radius.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Wave 1: 0 - 500m */}
            <div className={`p-5 rounded-2xl border transition-all ${
              escalatedWaves.includes(1)
                ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Wave 1
                </span>
                <span className="text-xs font-bold text-emerald-700">0 – 500m</span>
              </div>
              <h4 className="font-bold text-slate-900 mt-3 text-sm">Immediate Proximity</h4>
              <p className="text-xs text-slate-500 mt-1">
                Top matching students currently in the same or adjacent block.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Recipients:</span>
                <b className="text-slate-900">{matchingData?.summary.wave1Count || 0} students</b>
              </div>
              <button
                disabled={escalatedWaves.includes(1)}
                onClick={() => handleEscalateWave(1)}
                className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {escalatedWaves.includes(1) ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Dispatched
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Dispatch Wave 1
                  </>
                )}
              </button>
            </div>

            {/* Wave 2: 500m - 1km */}
            <div className={`p-5 rounded-2xl border transition-all ${
              escalatedWaves.includes(2)
                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Wave 2
                </span>
                <span className="text-xs font-bold text-indigo-700">500m – 1km</span>
              </div>
              <h4 className="font-bold text-slate-900 mt-3 text-sm">Walking Distance</h4>
              <p className="text-xs text-slate-500 mt-1">
                Expands if nobody in Wave 1 accepts within the acceptance window.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Recipients:</span>
                <b className="text-slate-900">{matchingData?.summary.wave2Count || 0} students</b>
              </div>
              <button
                disabled={escalatingWave === 2 || escalatedWaves.includes(2)}
                onClick={() => handleEscalateWave(2)}
                className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {escalatedWaves.includes(2) ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Dispatched
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" /> Escalate to Wave 2
                  </>
                )}
              </button>
            </div>

            {/* Wave 3: 1km - 2km */}
            <div className={`p-5 rounded-2xl border transition-all ${
              escalatedWaves.includes(3)
                ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Wave 3
                </span>
                <span className="text-xs font-bold text-purple-700">1km – 2km</span>
              </div>
              <h4 className="font-bold text-slate-900 mt-3 text-sm">Hostel & Outer Zones</h4>
              <p className="text-xs text-slate-500 mt-1">
                Further expands to student hostels, sports grounds, and outer labs.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Recipients:</span>
                <b className="text-slate-900">{matchingData?.summary.wave3Count || 0} students</b>
              </div>
              <button
                disabled={escalatingWave === 3 || escalatedWaves.includes(3)}
                onClick={() => handleEscalateWave(3)}
                className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-200 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {escalatedWaves.includes(3) ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Dispatched
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" /> Escalate to Wave 3
                  </>
                )}
              </button>
            </div>

            {/* Wave 4: Campus Wide */}
            <div className={`p-5 rounded-2xl border transition-all ${
              escalatedWaves.includes(4)
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Wave 4
                </span>
                <span className="text-xs font-bold text-amber-700">2km+</span>
              </div>
              <h4 className="font-bold text-slate-900 mt-3 text-sm">Campus-Wide Pool</h4>
              <p className="text-xs text-slate-500 mt-1">
                Broadcasts to all eligible candidates across the entire campus.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Recipients:</span>
                <b className="text-slate-900">{matchingData?.summary.wave4Count || 0} students</b>
              </div>
              <button
                disabled={escalatingWave === 4 || escalatedWaves.includes(4)}
                onClick={() => handleEscalateWave(4)}
                className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-200 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                {escalatedWaves.includes(4) ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Dispatched
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" /> Escalate Campus-Wide
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Formula Explanation */}
      {activeTab === 'formula' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Mathematical Matching Formulation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gully Gigs computes a deterministic hybrid match score before applying proximity notification rules.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-indigo-300 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner">
            <span className="text-slate-400"># Composite Score Calculation (0 - 100)</span>
            <br />
            Match Score = (
            <br />
            &nbsp;&nbsp;<span className="text-indigo-400">Skill Match</span> × <b className="text-white">0.40</b> +
            <br />
            &nbsp;&nbsp;<span className="text-emerald-400">Distance Score</span> × <b className="text-white">0.30</b> +
            <br />
            &nbsp;&nbsp;<span className="text-amber-400">Availability</span> × <b className="text-white">0.15</b> +
            <br />
            &nbsp;&nbsp;<span className="text-sky-400">Rating / History</span> × <b className="text-white">0.10</b> +
            <br />
            &nbsp;&nbsp;<span className="text-purple-400">Reliability Rate</span> × <b className="text-white">0.05</b>
            <br />
            )
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h5 className="font-bold text-slate-900">Haversine Distance Model</h5>
              <p>
                Calculates precise spherical distance on earth surface between gig coordinates and worker location:
                d = 2R · arcsin(√(sin²(Δφ/2) + cos(φ₁)cos(φ₂)sin²(Δλ/2))).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h5 className="font-bold text-slate-900">Semantic Skill Clusters</h5>
              <p>
                Matches not only exact strings, but cross-relates clustered skills (e.g. Canva ↔ Graphic Design ↔ Photoshop) with weighted relevance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
