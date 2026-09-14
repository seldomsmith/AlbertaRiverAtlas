import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Layers, 
  X, 
  GitBranch, 
  Droplets,
  Eye,
  EyeOff,
  Sparkles,
  MapPin
} from 'lucide-react';
import fallbackData from '../data/bow_basin_schematic_map.json';

export const SchematicMap = ({ onSelectStream, selectedStreamName }) => {
  const [data, setData] = useState(fallbackData);
  const [selectedStation, setSelectedStation] = useState(null);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [activeLineFilter, setActiveLineFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [streamOrderMin, setStreamOrderMin] = useState(1);

  // SVG Pan & Zoom State
  const [viewBox, setViewBox] = useState({ x: 100, y: 150, w: 3700, h: 2100 });
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

  // Compute Downstream Drainage Route for selected/hovered station
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

    while (curr && curr.parentStream) {
      route.add(curr.parentStream);
      const parent = stationMap.get(curr.parentStream.toUpperCase());
      if (!parent || parent.name === curr.name) break;
      route.add(parent.id);
      curr = parent;
    }

    return route;
  }, [selectedStation, hoveredStation, data]);

  // Zoom Handler
  const handleZoom = (factor) => {
    setViewBox(prev => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return {
        x: Math.max(-200, prev.x + dx),
        y: Math.max(-200, prev.y + dy),
        w: Math.min(4800, Math.max(500, newW)),
        h: Math.min(2800, Math.max(300, newH))
      };
    });
  };

  const handleResetZoom = () => {
    setViewBox({ x: 100, y: 150, w: 3700, h: 2100 });
  };

  // Mouse Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.12 : 0.88;
    handleZoom(factor);
  };

  const focusStation = (station) => {
    setSelectedStation(station);
    if (onSelectStream) {
      onSelectStream(station.officialName || station.name);
    }
    setViewBox({
      x: station.x - 450,
      y: station.y - 280,
      w: 900,
      h: 560
    });
    setSearchQuery('');
  };

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !data?.stations) return [];
    const q = searchQuery.toLowerCase();
    return data.stations
      .filter(s => s.name.toLowerCase().includes(q) || (s.officialName && s.officialName.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [searchQuery, data]);

  // Is zoomed in enough to show minor creek labels by default
  const isZoomedIn = viewBox.w < 1600;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F6F3EC] text-[#1E293B] overflow-hidden select-none font-sans">
      
      {/* Top Bar Header */}
      <header className="z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-2.5 flex flex-wrap items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-slate-900 font-serif">
                Waterways of Alberta
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100/80 text-blue-900 rounded-full">
                Bow River Basin
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Schematic Hydrological Transit Network • 272 Rivers & Creeks
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          {/* Autocomplete Search */}
          <div className="relative">
            <div className="flex items-center bg-slate-100/90 rounded-lg px-3 py-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all w-60 shadow-inner">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search any river or creek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs w-full outline-none text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50">
                {searchResults.map(station => (
                  <button
                    key={station.id}
                    onClick={() => focusStation(station)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{station.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {station.isTrunk ? 'Bow Trunk Line' : `Feeder: ${station.parentStream || 'Bow River'}`}
                      </div>
                    </div>
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: station.color || '#1E3A8A' }}
                    >
                      Order {station.strahlerOrder}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line Filter */}
          <div className="flex items-center bg-slate-100/90 rounded-lg p-1 border border-slate-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            <select
              value={activeLineFilter}
              onChange={(e) => setActiveLineFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium outline-none py-0.5 pr-2 cursor-pointer text-xs"
            >
              <option value="all">All River Lines (All 272 Creeks)</option>
              {data?.lines?.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* All Labels Toggle */}
          <button
            onClick={() => setShowAllLabels(!showAllLabels)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showAllLabels 
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle display of all creek labels at once"
          >
            {showAllLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>All Labels</span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing">
        
        {/* Floating Zoom Controls */}
        <div className="absolute right-6 top-6 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-md">
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

        {/* Legend Box */}
        <div className="absolute left-6 bottom-6 z-10 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg max-w-sm text-xs">
          <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span className="font-serif tracking-wide text-sm">River Lines</span>
            <span className="text-[10px] text-slate-400 font-normal">Click line to isolate</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {data?.lines?.map(line => (
              <button
                key={line.id}
                onClick={() => setActiveLineFilter(activeLineFilter === line.id ? 'all' : line.id)}
                className={`flex items-center gap-2 px-1.5 py-1 rounded text-left transition-all ${
                  activeLineFilter === line.id ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div 
                  className="w-3.5 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: line.color }} 
                />
                <span className="truncate">{line.name.replace(' Line', '').replace(' River', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SVG Viewport */}
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
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ecoregion Background Sectors (America's Waterways style) */}
          <g id="ecoregions">
            {data?.ecoregions?.map(eco => (
              <g key={eco.id}>
                <rect
                  x={eco.x}
                  y={eco.y}
                  width={eco.width}
                  height={eco.height}
                  fill={eco.fill}
                  stroke={eco.stroke}
                  strokeWidth="2"
                  rx="24"
                />
                <text
                  x={eco.x + 30}
                  y={eco.y + 60}
                  fontSize="22"
                  fontWeight="800"
                  fontFamily="serif"
                  letterSpacing="3"
                  fill="#78716C"
                  opacity="0.6"
                >
                  {eco.name}
                </text>
                <text
                  x={eco.x + 30}
                  y={eco.y + 88}
                  fontSize="14"
                  fontWeight="500"
                  letterSpacing="1"
                  fill="#A8A29E"
                  opacity="0.7"
                >
                  {eco.subtext}
                </text>
              </g>
            ))}
          </g>

          {/* Stylized Geometric Waterbodies (Lakes & Reservoirs) */}
          <g id="waterbodies">
            {data?.waterbodies?.map(wb => (
              <g key={wb.id}>
                <rect
                  x={wb.x}
                  y={wb.y}
                  width={wb.width}
                  height={wb.height}
                  rx={wb.rx}
                  fill="#BAE6FD"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  opacity="0.85"
                />
                <text
                  x={wb.x + wb.width / 2}
                  y={wb.y + wb.height / 2 + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  fill="#0369A1"
                  letterSpacing="0.5"
                >
                  {wb.name}
                </text>
              </g>
            ))}
          </g>

          {/* Feeder Spur Lines (Creeks) */}
          <g id="feeder-spurs">
            {data?.feederLines?.map(feeder => {
              const isHighlighted = drainageRoute.has(feeder.streamName) || drainageRoute.has(feeder.id);
              if (activeLineFilter !== 'all') {
                const streamObj = data.stations.find(s => s.officialName === feeder.streamName || s.name === feeder.streamName);
                if (streamObj && streamObj.lineId !== activeLineFilter) return null;
              }

              return (
                <line
                  key={feeder.id}
                  x1={feeder.fromX}
                  y1={feeder.fromY}
                  x2={feeder.toX}
                  y2={feeder.toY}
                  stroke={isHighlighted ? '#F59E0B' : (feeder.color || '#64748B')}
                  strokeWidth={isHighlighted ? 4.5 : (feeder.isMajor ? 2.5 : 1.5)}
                  strokeLinecap="round"
                  strokeOpacity={isHighlighted ? 1 : 0.75}
                  className="transition-all duration-200"
                />
              );
            })}
          </g>

          {/* Major Branch Corridors */}
          <g id="branch-corridors">
            {data?.branchPaths?.map(bp => {
              const isHighlighted = drainageRoute.has(bp.branchName);
              const isFiltered = activeLineFilter !== 'all' && bp.lineId !== activeLineFilter;

              return (
                <g key={bp.branchName} opacity={isFiltered ? 0.2 : 1}>
                  {/* Outer casing */}
                  <path
                    d={bp.d}
                    stroke="#FFFFFF"
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Colored Core Track */}
                  <path
                    d={bp.d}
                    stroke={isHighlighted ? '#F59E0B' : bp.color}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="transition-all duration-300"
                  />
                  
                  {/* Inline River Name Label along path */}
                  {bp.points && bp.points.length >= 2 && (
                    <text
                      x={(bp.points[0].x + bp.points[bp.points.length - 1].x) / 2}
                      y={(bp.points[0].y + bp.points[bp.points.length - 1].y) / 2 - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="800"
                      letterSpacing="2.5"
                      fill={bp.color}
                      className="select-none"
                    >
                      — {bp.label || bp.branchName} —
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Bow River Trunk Line (Main Spine) */}
          {data?.trunkPath && (
            <g id="trunk-corridor">
              {/* White casing */}
              <path
                d={data.trunkPath.d}
                stroke="#FFFFFF"
                strokeWidth={20}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Main Line Ribbon */}
              <path
                d={data.trunkPath.d}
                stroke={drainRouteActive() ? '#F59E0B' : data.trunkPath.color}
                strokeWidth={13}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="transition-all duration-300"
              />
              {/* Inline Trunk Badges */}
              <text x="890" y="660" fontSize="13" fontWeight="800" letterSpacing="4" fill="#1E3A8A">— BOW RIVER TRUNK —</text>
              <text x="2640" y="1185" fontSize="13" fontWeight="800" letterSpacing="4" fill="#1E3A8A">— BOW RIVER —</text>
            </g>
          )}

          {/* Stations and Creek Nodes */}
          <g id="stations">
            {data?.stations?.map(st => {
              const isSelected = selectedStation?.id === st.id;
              const isHovered = hoveredStation?.id === st.id;
              const isHighlighted = drainageRoute.has(st.id) || drainageRoute.has(st.officialName || st.name);

              if (activeLineFilter !== 'all' && st.lineId !== activeLineFilter && !st.isTrunk) {
                return null;
              }

              if (st.isTrunk) {
                // Major Trunk Stations
                return (
                  <g
                    key={st.id}
                    transform={`translate(${st.x}, ${st.y})`}
                    className="cursor-pointer group"
                    onClick={() => focusStation(st)}
                    onMouseEnter={() => setHoveredStation(st)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    {st.type === 'central-hub' ? (
                      <g>
                        <circle r="15" fill="#FFFFFF" stroke={isHighlighted ? '#F59E0B' : st.color} strokeWidth="5" />
                        <circle r="7" fill={isHighlighted ? '#F59E0B' : st.color} />
                      </g>
                    ) : st.type === 'dam' ? (
                      <g>
                        <rect x="-10" y="-10" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
                        <line x1="-6" y1="0" x2="6" y2="0" stroke="#0F172A" strokeWidth="3" />
                      </g>
                    ) : st.type === 'terminal' ? (
                      <g>
                        <polygon points="0,-16 16,0 0,16 -16,0" fill="#FFFFFF" stroke="#DC2626" strokeWidth="5" />
                        <circle r="6" fill="#DC2626" />
                      </g>
                    ) : (
                      <circle r="10" fill="#FFFFFF" stroke={isHighlighted ? '#F59E0B' : st.color} strokeWidth="4" />
                    )}

                    {/* Station Name Label */}
                    <text
                      x={st.labelPos?.includes('left') ? -22 : st.labelPos?.includes('right') ? 22 : 0}
                      y={st.labelPos?.includes('top') ? -24 : st.labelPos?.includes('bottom') ? 28 : 5}
                      textAnchor={st.labelPos?.includes('left') ? 'end' : st.labelPos?.includes('right') ? 'start' : 'middle'}
                      className={`text-xs font-bold transition-all ${
                        isSelected || isHovered || isHighlighted
                          ? 'fill-amber-700 font-extrabold text-sm'
                          : 'fill-slate-900 group-hover:fill-blue-700'
                      }`}
                      style={{ fontSize: isSelected ? '15px' : '12px' }}
                    >
                      {st.name}
                    </text>
                  </g>
                );
              }

              // Tributary / Feeder Creek Station
              const shouldShowLabel = showAllLabels || isHovered || isSelected || isHighlighted || (st.isMajor && isZoomedIn);

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
                    r={isHighlighted ? 5.5 : (st.isMajor ? 4 : 2.5)}
                    fill={isHighlighted ? '#F59E0B' : '#FFFFFF'}
                    stroke={isHighlighted ? '#D97706' : st.color}
                    strokeWidth={isHighlighted ? 3 : 2}
                  />

                  {shouldShowLabel && (
                    <text
                      x="8"
                      y="3.5"
                      className={`text-[9.5px] tracking-tight transition-all ${
                        isSelected || isHighlighted
                          ? 'fill-amber-800 font-bold text-[11px]'
                          : 'fill-slate-700 font-medium group-hover:fill-slate-950'
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
                    style={{ backgroundColor: selectedStation.color || '#1E3A8A' }} 
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
            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Strahler Order</div>
                <div className="text-base font-bold text-blue-900 mt-0.5">
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

            {/* Drainage Transit Journey */}
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
                    <span className="text-slate-600 text-[11px]">into Bow River Trunk</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-700 shrink-0" />
                  <span className="text-blue-900 font-semibold">Grand Forks Confluence</span>
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-0.5 h-3 bg-blue-300 ml-0.5" />
                  <span className="text-blue-700 text-[10px]">Merges with Oldman River</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-emerald-900 font-bold">South Saskatchewan ➔ Hudson Bay</span>
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
