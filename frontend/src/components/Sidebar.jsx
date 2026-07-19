import React from 'react';
import { Sliders, Download, AlertTriangle, Info, MapPin } from 'lucide-react';

export const Sidebar = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  accessPoints,
  hazards,
  filters,
  onFilterChange,
  colourMetric,
  onColourMetricChange
}) => {
  const selectedRoute = routes.find(r => r.route_id === selectedRouteId);
  const selectedPutIn = selectedRoute ? accessPoints.find(a => a.access_id === selectedRoute.put_in_id) : null;
  const selectedTakeOut = selectedRoute ? accessPoints.find(a => a.access_id === selectedRoute.take_out_id) : null;
  const routeHazards = selectedRoute ? hazards.filter(h => h.river_name === selectedRoute.river_name) : [];

  const handleDownloadGPX = () => {
    if (!selectedRoute) return;
    
    // Build simple GPX payload
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Alberta River Atlas" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${selectedRoute.trip_name}</name>
    <desc>${selectedRoute.description}</desc>
  </metadata>
  <rte>
    <name>${selectedRoute.trip_name}</name>
    <rtept lat="${selectedPutIn?.coordinates.latitude || 0}" lon="${selectedPutIn?.coordinates.longitude || 0}">
      <name>PUT IN: ${selectedPutIn?.name || ''}</name>
    </rtept>
    <rtept lat="${selectedTakeOut?.coordinates.latitude || 0}" lon="${selectedTakeOut?.coordinates.longitude || 0}">
      <name>TAKE OUT: ${selectedTakeOut?.name || ''}</name>
    </rtept>
  </rte>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedRoute.route_id}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1><span>Alberta</span> River Atlas</h1>
        <p>Interactive Voyageur & Canoe Trip Dashboard</p>
      </div>

      <div className="sidebar-content">
        {/* Dynamic Controls Deck */}
        <div className="filter-section">
          <div className="filter-label-row" style={{ marginBottom: '8px' }}>
            <span className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} /> Filters
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div className="filter-label-row">
                <span className="filter-label">Max Distance</span>
                <span className="filter-value">{filters.maxDistance} km</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="10"
                max="100"
                value={filters.maxDistance}
                onChange={(e) => onFilterChange('maxDistance', parseInt(e.target.value))}
              />
            </div>

            <div>
              <div className="filter-label-row">
                <span className="filter-label">Max Duration</span>
                <span className="filter-value">{filters.maxDays} {filters.maxDays === 1 ? 'Day' : 'Days'}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="1"
                max="5"
                value={filters.maxDays}
                onChange={(e) => onFilterChange('maxDays', parseInt(e.target.value))}
              />
            </div>

            <div>
              <span className="filter-label" style={{ display: 'block', marginBottom: '6px' }}>Color Metric</span>
              <select
                className="select-dropdown"
                value={colourMetric}
                onChange={(e) => onColourMetricChange(e.target.value)}
              >
                <option value="default">Default Blue</option>
                <option value="difficulty">Difficulty Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Route Results Listing */}
        <div className="route-list-header">Selectable Routes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {routes.map(route => (
            <div
              key={route.route_id}
              className={`route-card ${selectedRouteId === route.route_id ? 'selected' : ''}`}
              onClick={() => onSelectRoute(route.route_id)}
            >
              <div className="route-card-river">{route.river_name}</div>
              <div className="route-card-title">{route.trip_name}</div>
              <div className="route-meta-badges">
                <span className={`badge badge-${route.difficulty_class === 1 ? 'easy' : route.difficulty_class === 2 ? 'medium' : 'hard'}`}>
                  Class {route.difficulty_class === 1 ? 'I' : route.difficulty_class === 2 ? 'II' : 'III'}
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>
                  {route.distance_km} km
                </span>
                {route.is_high_flow && (
                  <span className="badge badge-flow-alert" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={10} /> High Flow
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Info Cards Deck */}
        {selectedRoute && (
          <div className="expanded-detail">
            <div className="detail-section-title">Trip Logistics</div>
            
            {selectedRoute.is_high_flow && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '10px',
                color: '#fb7185',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>High Flow Advisory!</strong> Live discharge rate ({selectedRoute.current_gauge_reading} m³/s) exceeds the safe operational limit ({selectedRoute.flow_thresholds.maximum_m3_s} m³/s).
                </div>
              </div>
            )}

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {selectedRoute.description}
            </p>

            <div className="detail-row">
              <span className="detail-label">Current flow reading:</span>
              <span className="detail-value" style={{ color: selectedRoute.is_high_flow ? '#fb7185' : '#34d399' }}>
                {selectedRoute.current_gauge_reading ? `${selectedRoute.current_gauge_reading} m³/s` : 'Unknown'}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Safe optimal flow window:</span>
              <span className="detail-value">
                {selectedRoute.flow_thresholds.minimum_m3_s} - {selectedRoute.flow_thresholds.maximum_m3_s} m³/s
              </span>
            </div>

            <div className="detail-section-title" style={{ marginTop: '8px' }}>Launch Facilities</div>
            
            {selectedPutIn && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <MapPin size={14} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
                <div>
                  <strong style={{ color: '#fff' }}>Put In: {selectedPutIn.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Road Access: {selectedPutIn.vehicle_suitability} | Parking Cap: {selectedPutIn.infrastructure.parking_capacity_vehicles} | Ramp: {selectedPutIn.infrastructure.ramp_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}

            {selectedTakeOut && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', marginTop: '4px' }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                <div>
                  <strong style={{ color: '#fff' }}>Take Out: {selectedTakeOut.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Road Access: {selectedTakeOut.vehicle_suitability} | Parking Cap: {selectedTakeOut.infrastructure.parking_capacity_vehicles} | Ramp: {selectedTakeOut.infrastructure.ramp_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}

            {routeHazards.length > 0 && (
              <>
                <div className="detail-section-title" style={{ marginTop: '8px' }}>Hazards & Riffles</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {routeHazards.map(h => (
                    <div key={h.hazard_id} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                      <strong style={{ color: '#fff' }}>{h.name} ({h.severity})</strong>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{h.safety_notes}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button className="gpx-button" onClick={handleDownloadGPX}>
              <Download size={16} /> Export GPX Payload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
