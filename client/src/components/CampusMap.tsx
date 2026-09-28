import React, { useEffect, useRef, useState } from 'react';
import type { Gig, User } from '../types';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  Radio
} from 'lucide-react';

interface CampusMapProps {
  gigs: Gig[];
  currentUser: User | null;
  onSelectGig: (gig: Gig) => void;
  onAcceptGig: (gig: Gig) => void;
  onUpdateLocation: (locationName: string, lat: number, lon: number) => void;
}

const CAMPUS_HOTSPOTS = [
  { name: 'Block B (Tech Hub)', lat: 28.5448, lon: 77.1935, desc: 'CSE Dept & Labs' },
  { name: 'Central Library', lat: 28.5435, lon: 77.1940, desc: 'Study halls & reading zones' },
  { name: 'SAC & Canteen', lat: 28.5440, lon: 77.1918, desc: 'Food court & student activity' },
  { name: 'Hostel 4 (Block D)', lat: 28.5420, lon: 77.1905, desc: 'Boys & girls hostel quad' },
  { name: 'Block A (CSE & Xerox)', lat: 28.5455, lon: 77.1920, desc: 'Xerox & workshop' },
  { name: 'Sports Complex', lat: 28.5480, lon: 77.1950, desc: 'Grounds & badminton' }
];

export const CampusMap: React.FC<CampusMapProps> = ({
  gigs,
  currentUser,
  onSelectGig,
  onAcceptGig,
  onUpdateLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showWaves, setShowWaves] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const defaultLat = currentUser?.latitude || 28.5448;
    const defaultLon = currentUser?.longitude || 77.1935;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLon],
      zoom: 16,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Circles when Gigs or User changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !circlesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    circlesLayerRef.current.clearLayers();

    const userLat = currentUser?.latitude || 28.5448;
    const userLon = currentUser?.longitude || 77.1935;

    // 1. Draw Wave Proximity Circles around Current User
    if (showWaves) {
      // Wave 1: 500m (Green/Indigo)
      L.circle([userLat, userLon], {
        radius: 500,
        color: '#4f46e5',
        fillColor: '#6366f1',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6'
      })
        .bindTooltip('Wave 1 Radius (500m)', { permanent: false, direction: 'top' })
        .addTo(circlesLayerRef.current);

      // Wave 2: 1000m (Cyan)
      L.circle([userLat, userLon], {
        radius: 1000,
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '5, 8'
      })
        .bindTooltip('Wave 2 Radius (1km)', { permanent: false, direction: 'top' })
        .addTo(circlesLayerRef.current);
    }

    // 2. Add Current User Pin
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(79, 70, 229, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 22px; height: 22px; background-color: #4f46e5; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const userMarker = L.marker([userLat, userLon], { icon: userIcon }).addTo(markersLayerRef.current);
    userMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
        <b style="color: #4f46e5;">👤 You are here</b><br/>
        <b>${currentUser?.name || 'Student'}</b><br/>
        <span style="color: #64748b;">${currentUser?.location_name || 'Campus'}</span>
      </div>
    `);

    // 3. Add Gigs Pins
    gigs.forEach((gig) => {
      const isUrgent = gig.urgency === 'Urgent';
      const bgColor = isUrgent ? '#e11d48' : '#4f46e5';

      const gigIcon = L.divIcon({
        className: 'custom-gig-marker',
        html: `
          <div style="
            background: ${bgColor};
            color: white;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
            display: inline-flex;
            align-items: center;
            gap: 3px;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>₹${gig.budget}</span>
          </div>
        `,
        iconSize: [50, 26],
        iconAnchor: [25, 13]
      });

      const marker = L.marker([gig.latitude, gig.longitude], { icon: gigIcon }).addTo(markersLayerRef.current!);

      marker.on('click', () => {
        setSelectedGig(gig);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; max-width: 200px;">
          <div style="font-size: 11px; font-weight: bold; color: ${bgColor}; text-transform: uppercase;">${gig.category}</div>
          <b style="font-size: 14px; color: #0f172a;">${gig.title}</b>
          <div style="margin: 4px 0; color: #475569; font-size: 12px;">📍 ${gig.location_name}</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px;">₹${gig.budget} <span style="font-size: 10px; font-weight: normal; color: #64748b;">(Worker gets ₹${gig.worker_payout})</span></div>
        </div>
      `);
    });
  }, [gigs, currentUser, showWaves]);

  const handlePanToHotspot = (spot: (typeof CAMPUS_HOTSPOTS)[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.lat, spot.lon], 17, { duration: 1.2 });
    }
    onUpdateLocation(spot.name, spot.lat, spot.lon);
  };

  return (
    <div className="space-y-4">
      {/* Map Control Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Campus Micro-Gig Radar</h2>
            <p className="text-xs text-slate-500">Live geo-tagged micro-tasks across college blocks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Wave circles toggle */}
          <button
            onClick={() => setShowWaves(!showWaves)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showWaves
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${showWaves ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <span>Proximity Waves (500m / 1km)</span>
          </button>

          <span className="text-xs text-slate-400 hidden sm:inline">|</span>

          {/* Gigs count badge */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{gigs.length} Active Pins</span>
          </div>
        </div>
      </div>

      {/* Campus Hotspots Walk Simulation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap pl-1">
          🚶‍♂️ Simulate Walking To:
        </span>
        {CAMPUS_HOTSPOTS.map((spot) => (
          <button
            key={spot.name}
            onClick={() => handlePanToHotspot(spot)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all flex items-center gap-1.5 ${
              currentUser?.location_name === spot.name
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {spot.name.split(' (')[0]}
          </button>
        ))}
      </div>

      {/* Map Container and Card Overlay */}
      <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-md">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Selected Gig Bottom Card Overlay */}
        {selectedGig && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl z-20 transition-all animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                  {selectedGig.category}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedGig.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">📍 {selectedGig.location_name}</p>
              </div>
              <button
                onClick={() => setSelectedGig(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <div>
                <span className="text-base font-extrabold text-slate-900">₹{selectedGig.budget}</span>
                <span className="text-[11px] text-slate-400 ml-1">({selectedGig.deadline})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectGig(selectedGig)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  View Full
                </button>
                {currentUser?.id !== selectedGig.poster_id && selectedGig.status === 'ACTIVE' && (
                  <button
                    onClick={() => onAcceptGig(selectedGig)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    Accept Gig
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
