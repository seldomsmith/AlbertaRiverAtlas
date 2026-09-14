import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RiverMap from './components/RiverMap';
import DetailPanel from './components/DetailPanel';
import SchematicMap from './components/SchematicMap';

export const App = () => {
  const [viewMode, setViewMode] = useState('schematic'); // 'schematic' | 'geographic'
  const [routes, setRoutes] = useState([]);
  const [accessPoints, setAccessPoints] = useState([]);
  const [hazards, setHazards] = useState([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedStreamName, setSelectedStreamName] = useState(null);
  const [colourMetric, setColourMetric] = useState('default');
  
  const [filters, setFilters] = useState({
    maxDistance: 100,
    maxDays: 5,
    searchQuery: '',
    difficultyClass: 'all'
  });

  const apiHost = process.env.REACT_APP_API_URL || '';

  // Fetch base relational data from local Node server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, accessRes, hazardsRes] = await Promise.all([
          fetch(`${apiHost}/api/routes`).then(r => r.json()),
          fetch(`${apiHost}/api/access-points`).then(r => r.json()),
          fetch(`${apiHost}/api/hazards`).then(r => r.json())
        ]);
        
        setRoutes(routesRes);
        setAccessPoints(accessRes);
        setHazards(hazardsRes);
        
        // Auto-select first route if available
        if (routesRes.length > 0) {
          setSelectedRouteId(routesRes[0].route_id);
        }
      } catch (err) {
        console.error('Error fetching data from backend API server:', err);
      }
    };
    
    fetchData();
  }, [apiHost]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filter local route array based on slide configs
  const filteredRoutes = routes.filter(route => {
    const matchesDistance = route.distance_km <= filters.maxDistance;
    const matchesDuration = route.recommended_duration_days <= filters.maxDays;
    const matchesSearch = !filters.searchQuery || 
      route.river_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      route.trip_name.toLowerCase().includes(filters.searchQuery.toLowerCase());
    const matchesDifficulty = filters.difficultyClass === 'all' || 
      route.difficulty_class === parseInt(filters.difficultyClass);
      
    return matchesDistance && matchesDuration && matchesSearch && matchesDifficulty;
  });

  const filteredRouteIds = filteredRoutes.map(r => r.route_id);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Mode Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white/90 backdrop-blur-md p-1 rounded-full border border-slate-200 shadow-lg">
        <button
          onClick={() => setViewMode('schematic')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            viewMode === 'schematic'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          🚇 Subway Schematic (Bow Basin Pilot)
        </button>
        <button
          onClick={() => setViewMode('geographic')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            viewMode === 'geographic'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          🗺️ Geographic Map
        </button>
      </div>

      {viewMode === 'schematic' ? (
        <SchematicMap
          onSelectStream={(name) => setSelectedStreamName(name)}
          selectedStreamName={selectedStreamName}
        />
      ) : (
        <div className="dashboard-container w-full h-full flex">
          <Sidebar
            routes={filteredRoutes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            filters={filters}
            onFilterChange={handleFilterChange}
            colourMetric={colourMetric}
            onColourMetricChange={setColourMetric}
          />
          <RiverMap
            routes={routes}
            filteredRouteIds={filteredRouteIds}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => {
              if (id) setSelectedRouteId(id);
            }}
            accessPoints={accessPoints}
            hazards={hazards}
            colourMetric={colourMetric}
          />
          {selectedRouteId && (
            <DetailPanel
              routes={routes}
              selectedRouteId={selectedRouteId}
              onClose={() => setSelectedRouteId(null)}
              accessPoints={accessPoints}
              hazards={hazards}
            />
          )}
        </div>
      )}
    </div>
  );
};
export default App;
