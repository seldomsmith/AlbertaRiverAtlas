import React from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';

export const Sidebar = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  filters,
  onFilterChange,
  colourMetric,
  onColourMetricChange
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1><span>Alberta</span> River Atlas</h1>
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
        <div className="route-list-header font-semibold text-gray-400 mt-4 mb-2">Available Routes</div>
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
      </div>
    </div>
  );
};
export default Sidebar;
