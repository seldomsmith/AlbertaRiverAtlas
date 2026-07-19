import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RiverMap from './components/RiverMap';
import DetailPanel from './components/DetailPanel';

export const App = () => {
  const [routes, setRoutes] = useState([]);
  const [accessPoints, setAccessPoints] = useState([]);
  const [hazards, setHazards] = useState([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [colourMetric, setColourMetric] = useState('default');
  
  const [filters, setFilters] = useState({
    maxDistance: 50,
    maxDays: 2
  });

  const apiHost = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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
    return (
      route.distance_km <= filters.maxDistance &&
      route.recommended_duration_days <= filters.maxDays
    );
  });

  const filteredRouteIds = filteredRoutes.map(r => r.route_id);

  return (
    <div className="dashboard-container">
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
  );
};
export default App;
