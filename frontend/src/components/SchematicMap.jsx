import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Layers, 
  Navigation, 
  Info, 
  X, 
  GitBranch, 
  Compass, 
  Droplets,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';
import fallbackData from '../data/bow_basin_schematic_map.json';

export const SchematicMap = ({ onSelectStream, selectedStreamName }) => {
  const [data, setData] = useState(fallbackData);
  const [selectedStation, setSelectedStation] = useState(null);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [activeLineFilter, setActiveLineFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMinorCreeks, setShowMinorCreeks] = useState(true);
  const [streamOrderMin, setStreamOrderMin] = useState(1);

  // SVG Pan & Zoom State
  const [viewBox, setViewBox] = useState({ x: 0, y: 150, w: 3400, h: 1600 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Sync with selectedStreamName prop if provided
  useEffect(() => {
    if (selectedStreamName && data?.stations) {
      const found = data.stations.find(
        s => s.name.toUpperCase() === selectedStreamName.toUpperCase() ||
             (s.officialName && s.officialName.toUpperCase() === selectedStreamName.toUpperCase())
      );
      if (found) {
        setSelectedStation(found);
      }
    }
  }, [selectedStreamName, data]);

  // Compute Downstream Drainage Route for selected station
  const drainageRoute = useMemo(() => {
    const target = selectedStation || hoveredStation;
    if (!target || !data?.stations) return new Set();

    const stationMap = new Map();
    data.stations.forEach(s => {
      stationMap.set(s.officialName || s.name.toUpperCase(), s);
    });

    const route = new Set();
    let curr = target;
    route.add(curr.id);

    // Trace upstream and downstream
    while (curr && curr.parentStream) {
      route.add(curr.parentStream);
      const parent = stationMap.get(curr.parentStream.toUpperCase());
      if (!parent || parent.name === curr.name) break;
      route.add(parent.id);
      curr = parent;
    }

    return route;
  }, [selectedStation, hoveredStation, data]);

  // Filtered stations and lines
  const filteredStations = useMemo(() => {
    if (!data?.stations) return [];
    return data.stations.filter(s => {
      if (s.isTrunk) return true;
      if (activeLineFilter !== 'all' && s.lineId !== activeLineFilter) return false;
      if (!showMinorCreeks && s.strahlerOrder < 3) return false;
      if (s.strahlerOrder < streamOrderMin) return false;
      return true;
    });
  }, [data, activeLineFilter, showMinorCreeks, streamOrderMin]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !data?.stations) return [];
    const q = searchQuery.toLowerCase();
    return data.stations
      .filter(s => s.name.toLowerCase().includes(q) || (s.officialName && s.officialName.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [searchQuery, data]);

  // Zoom Handler
  const handleZoom = (factor) => {
    setViewBox(prev => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return {
        x: Math.max(-500, prev.x + dx),
        y: Math.max(-500, prev.y + dy),
        w: Math.min(5000, Math.max(600, newW)),
        h: Math.min(3000, Math.max(350, newH))
      };
    });
  };

  const handleResetZoom = () => {
    setViewBox({ x: 0, y: 150, w: 3400, h: 1600 });
  };

  // Mouse Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setStartPan({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !svgRef.current) return;
    const dx = (e.clientX - startPan.x) * (viewBox.w / svgRef.current.clientWidth);
    const dy = (e.clientY - startPan.y) * (viewBox.h / svgRef.current.clientHeight);
    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }));
    setStartPan({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    handleZoom(factor);
  };

  const focusStation = (station) => {
    setSelectedStation(station);
    if (onSelectStream) {
      onSelectStream(station.officialName || station.name);
    }
    setViewBox({
      x: station.x - 400,
      y: station.y - 250,
      w: 800,
      h: 500
    });
    setSearchQuery('');
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#FAF9F6] text-[#1E293B] overflow-hidden select-none font-sans">
      
      {/* Top Navigation & Subway Bar */}
      <header className="z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900">
                Alberta River Atlas <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 ml-2 bg-blue-100 text-blue-800 rounded-full">Subway Edition</span>
              </h1>
              <p className="text-xs text-slate-500">Bow River Basin Pilot Network • Harry Beck Octilinear Schematic</p>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all w-64 shadow-inner">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search 272 rivers & creeks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50">
                {searchResults.map(station => (
                  <button
                    key={station.id}
                    onClick={() => focusStation(station)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">{station.name}</div>
                      <div className="text-xs text-slate-400">
                        {station.isTrunk ? 'Trunk Line' : `Feeder: ${station.parentStream || 'Bow River'}`}
                      </div>
                    </div>
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: station.color || '#2563EB' }}
                    >
                      Order {station.strahlerOrder}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line Filter Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            <select
              value={activeLineFilter}
              onChange={(e) => setActiveLineFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium outline-none py-1 pr-2 cursor-pointer"
            >
              <option value="all">All Transit Lines ({data?.totalStreams || 272} Creeks)</option>
              {data?.lines?.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Strahler Order Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs text-slate-600">
            <span>Min Order:</span>
            {[1, 3, 5].map(order => (
              <button
                key={order}
                onClick={() => setStreamOrderMin(order)}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  streamOrderMin === order 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {order}+
              </button>
            ))}
          </div>

          {/* Minor Creeks Toggle */}
          <button
            onClick={() => setShowMinorCreeks(!showMinorCreeks)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showMinorCreeks 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showMinorCreeks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Minor Creeks
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing">
        
        {/* Floating Zoom & Map Controls */}
        <div className="absolute right-6 top-6 z-10 flex flex-col gap-2 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-md">
          <button 
            onClick={() => handleZoom(0.8)} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleZoom(1.25)} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={handleResetZoom} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Panel */}
        <div className="absolute left-6 bottom-6 z-10 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg max-w-xs text-xs">
          <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>Hydrological Transit Lines</span>
            <span className="text-[10px] text-slate-400 font-normal">Click to highlight</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {data?.lines?.slice(0, 10).map(line => (
              <button
                key={line.id}
                onClick={() => setActiveLineFilter(activeLineFilter === line.id ? 'all' : line.id)}
                className={`flex items-center gap-2 p-1 rounded text-left transition-all ${
                  activeLineFilter === line.id ? 'bg-slate-100 font-bold scale-105' : 'hover:bg-slate-50'
                }`}
              >
                <div 
                  className="w-3.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: line.color }} 
                />
                <span className="truncate text-slate-700">{line.name.replace(' Line', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Schematic SVG */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            {/* Subway Route Glow Filter */}
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Pattern for background schematic grid */}
            <pattern id="schematic-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="2,4" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect x="-1000" y="-1000" width="6000" height="4000" fill="url(#schematic-grid)" />

          {/* Directional Flow Indicators */}
          <g opacity="0.15">
            <text x="350" y="300" fontSize="32" fontWeight="800" fill="#1E293B" letterSpacing="4">ROCKY MOUNTAINS (HEADWATERS)</text>
            <text x="1800" y="850" fontSize="32" fontWeight="800" fill="#1E293B" letterSpacing="4">FOOTHILLS & CALGARY</text>
            <text x="2800" y="1130" fontSize="32" fontWeight="800" fill="#1E293B" letterSpacing="4">PRAIRIES & TERMINAL DRAINAGE</text>
          </g>

          {/* Feeder Spur Lines (Creeks) */}
          <g id="feeder-spurs">
            {data?.feederLines?.map(feeder => {
              const isHighlight = drainageRoute.has(feeder.streamName) || drainageRoute.has(feeder.id);
              const isVisible = showMinorCreeks || (feeder.order >= streamOrderMin);

              if (!isVisible) return null;

              return (
                <line
                  key={feeder.id}
                  x1={feeder.fromX}
                  y1={feeder.fromY}
                  x2={feeder.toX}
                  y2={feeder.toY}
                  stroke={isHighlight ? '#F59E0B' : (feeder.color || '#64748B')}
                  strokeWidth={isHighlight ? 4 : (feeder.order >= 4 ? 2.5 : 1.5)}
                  strokeLinecap="round"
                  strokeOpacity={isHighlight ? 1 : 0.7}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Major Branch Corridors */}
          <g id="branch-corridors">
            {data?.branchPaths?.map(bp => {
              const isHighlight = drainageRoute.has(bp.branchName);
              return (
                <path
                  key={bp.branchName}
                  d={bp.d}
                  stroke={isHighlight ? '#F59E0B' : bp.color}
                  strokeWidth={isHighlight ? 10 : 7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Bow River Trunk Line (Main Arterial) */}
          {data?.trunkPath && (
            <g id="trunk-corridor">
              {/* White casing for crisp subway track separation */}
              <path
                d={data.trunkPath.d}
                stroke="#FFFFFF"
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d={data.trunkPath.d}
                stroke={drainRouteActive() ? '#F59E0B' : data.trunkPath.color}
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="transition-all duration-300"
              />
            </g>
          )}

          {/* Stations & Confluence Interchange Nodes */}
          <g id="stations">
            {filteredStations.map(st => {
              const isSelected = selectedStation?.id === st.id;
              const isHovered = hoveredStation?.id === st.id;
              const isDrainagePath = drainageRoute.has(st.id) || drainageRoute.has(st.officialName || st.name);

              if (st.isTrunk) {
                // Major Trunk Station Styles
                return (
                  <g
                    key={st.id}
                    transform={`translate(${st.x}, ${st.y})`}
                    className="cursor-pointer group"
                    onClick={() => focusStation(st)}
                    onMouseEnter={() => setHoveredStation(st)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    {/* Interchange Ring */}
                    {st.type === 'major-interchange' || st.type === 'central-hub' ? (
                      <g>
                        <circle r="14" fill="#FFFFFF" stroke={isDrainagePath ? '#F59E0B' : st.color} strokeWidth="5" />
                        <circle r="6" fill={isDrainagePath ? '#F59E0B' : st.color} />
                      </g>
                    ) : st.type === 'dam' ? (
                      <g>
                        <rect x="-10" y="-10" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
                        <line x1="-6" y1="0" x2="6" y2="0" stroke="#0F172A" strokeWidth="3" />
                      </g>
                    ) : st.type === 'terminal' ? (
                      <g>
                        <polygon points="0,-14 14,0 0,14 -14,0" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5" />
                        <circle r="5" fill="#DC2626" />
                      </g>
                    ) : (
                      <circle r="9" fill="#FFFFFF" stroke={isDrainagePath ? '#F59E0B' : st.color} strokeWidth="4" />
                    )}

                    {/* Station Name Label */}
                    <text
                      x={st.labelPos === 'top' ? 0 : st.labelPos === 'bottom' ? 0 : st.labelPos === 'left' ? -20 : 20}
                      y={st.labelPos === 'top' ? -22 : st.labelPos === 'bottom' ? 26 : 5}
                      textAnchor={st.labelPos === 'top' || st.labelPos === 'bottom' ? 'middle' : st.labelPos === 'left' ? 'end' : 'start'}
                      className={`text-xs font-bold transition-all ${
                        isSelected || isHovered || isDrainagePath
                          ? 'fill-amber-600 font-extrabold text-sm'
                          : 'fill-slate-900 group-hover:fill-blue-600'
                      }`}
                      style={{ fontSize: isSelected ? '15px' : '12px' }}
                    >
                      {st.name}
                    </text>
                  </g>
                );
              }

              // Tributary / Creek Feeder Station Dot
              return (
                <g
                  key={st.id}
                  transform={`translate(${st.x}, ${st.y})`}
                  className="cursor-pointer group"
                  onClick={() => focusStation(st)}
                  onMouseEnter={() => setHoveredStation(st)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  <circle
                    r={isDrainagePath ? 6 : (st.strahlerOrder >= 4 ? 4.5 : 3)}
                    fill={isDrainagePath ? '#F59E0B' : '#FFFFFF'}
                    stroke={isDrainagePath ? '#D97706' : st.color}
                    strokeWidth={isDrainagePath ? 3 : 2}
                  />

                  {/* Creek Label (Shown conditionally or on hover) */}
                  {(isHovered || isSelected || isDrainagePath || st.strahlerOrder >= 4 || viewBox.w < 1800) && (
                    <text
                      x="10"
                      y="4"
                      className={`text-[10px] font-medium tracking-tight ${
                        isSelected || isDrainagePath
                          ? 'fill-amber-700 font-bold'
                          : 'fill-slate-600 group-hover:fill-slate-900'
                      }`}
                    >
                      {st.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Station / Drainage Journey Drawer */}
        {selectedStation && (
          <div className="absolute right-6 bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-2xl w-96 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedStation.color || '#2563EB' }} 
                  />
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {selectedStation.name}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedStation.isTrunk ? 'Bow River Main Stem Corridor' : `Tributary feeding ${selectedStation.parentStream || 'Bow River'}`}
                </div>
              </div>
              <button 
                onClick={() => setSelectedStation(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 gap-2 my-3.5">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Strahler Order</div>
                <div className="text-base font-bold text-blue-700 mt-0.5">
                  Level {selectedStation.strahlerOrder}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sub-Basin (HUC-8)</div>
                <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                  {selectedStation.huc8 || '04020601'}
                </div>
              </div>
            </div>

            {/* Drainage Transit Journey Route */}
            <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                <Droplets className="w-3.5 h-3.5 text-amber-600" />
                Drainage Transit Journey
              </div>
              <div className="text-xs text-amber-950 font-medium space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-bold">{selectedStation.name}</span>
                </div>
                {selectedStation.parentStream && selectedStation.parentStream !== selectedStation.name && (
                  <div className="flex items-center gap-2 pl-1">
                    <div className="w-0.5 h-3 bg-amber-300 ml-0.5" />
                    <span className="text-slate-600 text-[11px] truncate">via {selectedStation.parentStream}</span>
                  </div>
                )}
                {selectedStation.parentStream !== 'BOW RIVER' && !selectedStation.isTrunk && (
                  <div className="flex items-center gap-2 pl-1">
                    <div className="w-0.5 h-3 bg-amber-300 ml-0.5" />
                    <span className="text-slate-600 text-[11px]">into Bow River Trunk Line</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-blue-900 font-semibold">Grand Forks Confluence</span>
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-0.5 h-3 bg-blue-300 ml-0.5" />
                  <span className="text-blue-700 text-[10px]">Merges with Oldman River</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-emerald-900 font-bold">South Saskatchewan ➔ Lake Winnipeg / Hudson Bay</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function drainRouteActive() {
    return drainageRoute.has('BOW RIVER') || drainageRoute.has('bow-glacier');
  }
};

export default SchematicMap;
