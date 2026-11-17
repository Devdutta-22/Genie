import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { COMMUNITY_LOCATIONS } from './CommunitySection.jsx';



export const CampusMap = ({
  gigs,
  currentUser,
  onSelectGig,
  onAcceptGig,
  onUpdateLocation
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [selectedGig, setSelectedGig] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const defaultLat = currentUser?.latitude || 28.3664; // Galgotias Univ default
    const defaultLon = currentUser?.longitude || 77.5404;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLon],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers on Gigs/Location change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const userLat = currentUser?.latitude || 28.3664;
    const userLon = currentUser?.longitude || 77.5404;

    // 1. User Pin (Brutalist royal blue badge)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="background: #1d4ed8; color: #ffffff; border: 2px solid #ffffff; box-shadow: 3px 3px 0px #1e3a8a; padding: 4px 8px; font-weight: 900; font-size: 11px; text-transform: uppercase; white-space: nowrap;">
          YOU
        </div>
      `,
      iconSize: [40, 24],
      iconAnchor: [20, 12]
    });

    L.marker([userLat, userLon], { icon: userIcon })
      .addTo(markersLayerRef.current)
      .bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1e3a8a;">
          <b style="font-size: 13px;">${currentUser?.name || 'Student'}</b><br/>
          <span>📍 ${currentUser?.location_name || 'Campus'}</span>
        </div>
      `);

    // 2. Add 4 Community Hub Markers
    COMMUNITY_LOCATIONS.forEach((hub) => {
      const hubIcon = L.divIcon({
        className: 'custom-hub-marker',
        html: `
          <div style="background: #ffffff; color: #1e3a8a; border: 2px solid #1e3a8a; box-shadow: 2px 2px 0px #1e3a8a; padding: 3px 7px; font-weight: 900; font-size: 10px; text-transform: uppercase; white-space: nowrap;">
            🏛️ ${hub.alias}
          </div>
        `,
        iconSize: [68, 24],
        iconAnchor: [34, 12]
      });

      L.marker([hub.lat, hub.lon], { icon: hubIcon })
        .addTo(markersLayerRef.current)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px;">
            <b style="color: #1e3a8a;">${hub.name}</b><br/>
            <span style="color: #475569;">${hub.tagline}</span>
          </div>
        `);
    });

    // 3. Add Gigs Pins (Royal Blue brutalist price tag)
    gigs.forEach((gig) => {
      const gigIcon = L.divIcon({
        className: 'custom-gig-marker',
        html: `
          <div style="
            background: #1d4ed8;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            padding: 3px 8px;
            border: 2px solid #ffffff;
            box-shadow: 3px 3px 0px #1e3a8a;
            cursor: pointer;
            white-space: nowrap;
          ">
            ₹${gig.budget}
          </div>
        `,
        iconSize: [46, 24],
        iconAnchor: [23, 12]
      });

      const marker = L.marker([gig.latitude, gig.longitude], { icon: gigIcon }).addTo(
        markersLayerRef.current
      );

      marker.on('click', () => {
        setSelectedGig(gig);
      });
    });
  }, [gigs, currentUser]);

  const handleFlyTo = (loc) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lon], 15, { duration: 1 });
      onUpdateLocation(loc.name, loc.lat, loc.lon);
    }
  };

  return (
    <div className="space-y-4 pb-16 font-sans text-slate-900">
      {/* Brutalist Royal Blue Header & Location Switcher */}
      <div className="border-2 border-blue-900 bg-white p-4 shadow-[4px_4px_0px_#1e3a8a]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b-2 border-blue-900 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
              Interactive Section 3
            </span>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-blue-950">
              Campus Radar & Live Help Requests
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 border border-blue-900 bg-blue-50 text-blue-900 shadow-[2px_2px_0px_#1e3a8a]">
            {gigs.length} Live Requests on Radar
          </span>
        </div>

        {/* 4 Community Area Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 shrink-0">
            View Area:
          </span>
          {COMMUNITY_LOCATIONS.map((loc) => {
            const isCurrent = currentUser?.location_name === loc.name;
            return (
              <button
                key={loc.id}
                onClick={() => handleFlyTo(loc)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-blue-900 whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-blue-700 text-white shadow-[2px_2px_0px_#1e3a8a]'
                    : 'bg-white text-blue-950 hover:bg-blue-50'
                }`}
              >
                {loc.alias}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Display & Selected Gig Card */}
      <div className="relative border-2 border-blue-900 shadow-[6px_6px_0px_#1e3a8a] h-[520px] bg-slate-100 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Selected Gig Drawer Overlay */}
        {selectedGig && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-84 bg-white border-2 border-blue-900 shadow-[5px_5px_0px_#1e3a8a] p-4 z-20 animate-in fade-in">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-blue-900 bg-blue-50 text-blue-900">
                {selectedGig.category}
              </span>
              <button
                onClick={() => setSelectedGig(null)}
                className="text-xs font-black text-blue-900 hover:opacity-60"
              >
                ✕
              </button>
            </div>

            <h3 className="font-black text-sm uppercase leading-tight line-clamp-1 mb-1 text-blue-950">
              {selectedGig.title}
            </h3>
            <p className="text-[11px] text-slate-600 line-clamp-2 mb-3">
              {selectedGig.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t-2 border-blue-900">
              <div>
                <span className="text-base font-black text-blue-950">₹{selectedGig.budget}</span>
                <span className="block text-[9px] text-blue-700 font-bold">Earn ₹{selectedGig.worker_payout}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectGig(selectedGig)}
                  className="px-2.5 py-1 text-xs font-black uppercase border border-blue-900 text-blue-950 hover:bg-blue-50"
                >
                  Details
                </button>
                {selectedGig.status === 'ACTIVE' && (
                  <button
                    onClick={() => onAcceptGig(selectedGig)}
                    className="px-3 py-1 text-xs font-black uppercase bg-blue-700 text-white border border-blue-900 hover:bg-blue-800 shadow-[2px_2px_0px_#1e3a8a]"
                  >
                    Accept
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
