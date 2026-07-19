import React from 'react';
import { Sliders } from 'lucide-react';

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
        {/* Search & Visual Filters Deck */}
        <div className="filter-section">
          <div className="filter-label-row" style={{ marginBottom: '8px' }}>
            <span className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} /> Filters
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span className="filter-label" style={{ display: 'block', marginBottom: '6px' }}>Search Routes</span>
              <input
                type="text"
                placeholder="Search by river or trip..."
                className="select-dropdown"
                value={filters.searchQuery}
                onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              />
            </div>

            <div>
              <span className="filter-label" style={{ display: 'block', marginBottom: '6px' }}>Difficulty Class</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', '1', '2', '3'].map((d) => (
                  <button
                    key={d}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: filters.difficultyClass === d ? '#3b82f6' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => onFilterChange('difficultyClass', d)}
                  >
                    {d === 'all' ? 'All' : `Class ${d === '1' ? 'I' : d === '2' ? 'II' : 'III'}`}
                  </button>
                ))}
              </div>
            </div>

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
                <option value="default">Default Pink</option>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
