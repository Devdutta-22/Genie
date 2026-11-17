import { MapPin, ArrowUpRight } from 'lucide-react';



export const COMMUNITY_LOCATIONS = [
  {
    id: 'galgotias',
    name: 'Galgotias University',
    alias: 'GU Campus',
    tagline: 'Hostels, Main Block & Food Street',
    lat: 28.3664,
    lon: 77.5404,
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'gaur_yamuna',
    name: 'Gaur Yamuna City',
    alias: 'GYC Hub',
    tagline: 'Residential clusters & commercial blocks',
    lat: 28.3496,
    lon: 77.5312,
    imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'knowledge_park_3',
    name: 'Knowledge Park 3',
    alias: 'KP-3 Zone',
    tagline: 'Colleges, PG hubs & metro strip',
    lat: 28.4682,
    lon: 77.4921,
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'supertech',
    name: 'Supertech',
    alias: 'Supertech Area',
    tagline: 'Hostel towers, student markets & cafes',
    lat: 28.4735,
    lon: 77.5036,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80'
  }
];



export const CommunitySection = ({
  selectedLocation,
  onSelectLocation,
  gigs,
  onOpenNewGig
}) => {
  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3 border-b-2 border-blue-900 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-700" />
          <h2 className="text-sm font-black uppercase tracking-wider text-blue-950">
            Campus Communities
          </h2>
        </div>
        <span className="text-[11px] font-bold text-blue-800 uppercase tracking-widest">
          4 Local Hubs • Instant Delivery
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COMMUNITY_LOCATIONS.map((loc) => {
          const isActive = selectedLocation === loc.name;
          const gigCount = gigs.filter((g) =>
            g.location_name.toLowerCase().includes(loc.name.toLowerCase()) ||
            g.location_name.toLowerCase().includes(loc.alias.toLowerCase())
          ).length;

          return (
            <div
              key={loc.id}
              onClick={() => onSelectLocation(loc.name, loc.lat, loc.lon)}
              className={`group border-2 border-blue-900 transition-all cursor-pointer select-none flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'bg-blue-700 text-white shadow-[4px_4px_0px_#1e3a8a]'
                  : 'bg-white text-slate-900 shadow-[3px_3px_0px_#1e3a8a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1e3a8a]'
              }`}
            >
              {/* Community Image Header */}
              <div className="relative h-28 w-full overflow-hidden border-b-2 border-blue-900 bg-blue-950">
                <img
                  src={loc.imageUrl}
                  alt={loc.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-black/20" />
                
                {/* Hub Badge Overlay */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                      isActive
                        ? 'bg-white text-blue-900 border-white'
                        : 'bg-blue-700 text-white border-blue-900'
                    }`}
                  >
                    {loc.alias}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 border ${
                    isActive 
                      ? 'bg-blue-900 text-white border-white' 
                      : 'bg-white text-blue-900 border-blue-900'
                  }`}>
                    {gigCount} {gigCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-sm tracking-tight leading-snug">
                    {loc.name}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-normal line-clamp-2 ${
                      isActive ? 'text-blue-100' : 'text-slate-600'
                    }`}
                  >
                    {loc.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-current flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {isActive ? 'Viewing Now' : 'Select Hub'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewGig(loc.name);
                    }}
                    className={`text-[10px] uppercase font-black px-2 py-0.5 border border-current hover:underline flex items-center gap-0.5 ${
                      isActive 
                        ? 'hover:bg-white hover:text-blue-900' 
                        : 'hover:bg-blue-700 hover:text-white'
                    }`}
                  >
                    Post Here
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
