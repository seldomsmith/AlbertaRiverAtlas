import React from 'react';
import { X, Download, AlertTriangle, MapPin, ShieldAlert } from 'lucide-react';

const DetailPanel = ({
  routes,
  selectedRouteId,
  onClose,
  accessPoints,
  hazards
}) => {
  const selectedRoute = routes.find(r => r.route_id === selectedRouteId);
  if (!selectedRoute) return null;

  const selectedPutIn = accessPoints.find(a => a.access_id === selectedRoute.put_in_id);
  const selectedTakeOut = accessPoints.find(a => a.access_id === selectedRoute.take_out_id);
  const routeHazards = hazards.filter(h => h.river_name === selectedRoute.river_name);

  // Flow thresholds
  const currentDischarge = selectedRoute.current_gauge_reading;
  const minFlow = selectedRoute.flow_thresholds.minimum_m3_s;
  const maxFlow = selectedRoute.flow_thresholds.maximum_m3_s;
  
  // Calculate index for padding months (May=0, Jun=1, Jul=2, Aug=3, Sep=4, Oct=5)
  const currentMonthIndex = Math.max(0, Math.min(5, new Date().getMonth() - 4));
  const activeMonthName = ['May', 'June', 'July', 'August', 'September', 'October'][currentMonthIndex];
  const monthNormal = selectedRoute.historical_monthly_averages?.[currentMonthIndex] || 0;

  // Determine dynamic flow status
  let flowStatusText = 'No telemetry available for this reach.';
  let flowStatusColor = 'var(--text-secondary)';
  let isAlert = false;

  if (currentDischarge) {
    if (currentDischarge < minFlow) {
      flowStatusText = `Low Flow Advisory: Discharge (${currentDischarge} m³/s) is below recommended minimum (${minFlow} m³/s). Scraping likely.`;
      flowStatusColor = '#f59e0b';
      isAlert = true;
    } else if (currentDischarge > maxFlow) {
      flowStatusText = `High Flow Warning: Discharge (${currentDischarge} m³/s) exceeds maximum safe limit (${maxFlow} m³/s). Strong currents.`;
      flowStatusColor = '#ef4444';
      isAlert = true;
    } else {
      const comparisonText = monthNormal 
        ? ` (Historical normal for ${activeMonthName} is ${monthNormal} m³/s)`
        : '';
      flowStatusText = `Normal Flow: Current discharge is ${currentDischarge} m³/s.${comparisonText}`;
      flowStatusColor = '#10b981';
    }
  }

  // Handle GPX download mapping full vector track coordinates
  const handleDownloadGPX = async () => {
    try {
      const res = await fetch('/vectors/vector_routes.geojson');
      const geojson = await res.json();
      const feature = geojson.features.find(f => f.properties.route_id === selectedRouteId);
      
      let trackPoints = '';
      if (feature?.geometry?.coordinates) {
        trackPoints = feature.geometry.coordinates.map(coord => 
          `      <trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`
        ).join('\n');
      }

      const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Alberta River Atlas" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${selectedRoute.trip_name}</name>
    <desc>${selectedRoute.description}</desc>
  </metadata>
  <trk>
    <name>${selectedRoute.trip_name}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedRoute.route_id}.gpx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('GPX generation failed:', err);
    }
  };

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <div>
          <div className="route-card-river">{selectedRoute.river_name}</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>
            {selectedRoute.trip_name}
          </h2>
        </div>
        <button className="close-panel-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="detail-panel-content">
        {isAlert && (
          <div className="flow-warning-card">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Advisory Alert</strong>
              <div style={{ marginTop: '2px' }}>{flowStatusText}</div>
            </div>
          </div>
        )}

        <div className="detail-panel-card">
          <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
            {selectedRoute.description}
          </p>
        </div>

        {/* Discharge Observations Panel */}
        <div className="detail-panel-card">
          <div className="detail-section-title">Hydrometric Status</div>
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-item">
              <span className="stat-label">Current Discharge</span>
              <span className="stat-value" style={{ color: flowStatusColor }}>
                {currentDischarge ? `${currentDischarge} m³/s` : 'No Data'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Recreational Window</span>
              <span className="stat-value" style={{ fontSize: '14px', marginTop: '4px' }}>
                {minFlow} - {maxFlow} m³/s
              </span>
            </div>
          </div>
          
          <div style={{ fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <span style={{ color: flowStatusColor, fontWeight: '500' }}>{flowStatusText}</span>
          </div>
        </div>

        {/* Historical averages list */}
        {selectedRoute.historical_monthly_averages && (
          <div className="detail-panel-card">
            <div className="detail-section-title">Historical Monthly Averages</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginTop: '10px', textAlign: 'center' }}>
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, idx) => {
                const isCurrent = idx === currentMonthIndex;
                return (
                  <div 
                    key={month} 
                    style={{
                      background: isCurrent ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isCurrent ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '6px 2px',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ fontSize: '10px', color: isCurrent ? '#60a5fa' : 'var(--text-secondary)', fontWeight: '600' }}>{month}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>
                      {selectedRoute.historical_monthly_averages[idx]}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.3' }}>
              Historical averages represent historical monthly discharge normals in cubic meters per second (m³/s). Current month is highlighted.
            </p>
          </div>
        )}

        <div className="detail-panel-card">
          <div className="detail-section-title">Logistics & Put-in/Take-out</div>
          
          <div className="access-info-block">
            {selectedPutIn && (
              <div className="access-point-row">
                <MapPin size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div className="access-title">Put-in: {selectedPutIn.name}</div>
                  <div className="access-meta">
                    <strong>Bank:</strong> {selectedPutIn.river_bank ? `${selectedPutIn.river_bank} bank (looking downstream)` : 'Unknown'}
                  </div>
                  <div className="access-meta">
                    <strong>Road access:</strong> {selectedPutIn.vehicle_suitability} | <strong>Ramp:</strong> {selectedPutIn.infrastructure.ramp_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}

            {selectedTakeOut && (
              <div className="access-point-row" style={{ marginTop: '16px' }}>
                <MapPin size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div className="access-title">Take-out: {selectedTakeOut.name}</div>
                  <div className="access-meta">
                    <strong>Bank:</strong> {selectedTakeOut.river_bank ? `${selectedTakeOut.river_bank} bank (looking downstream)` : 'Unknown'}
                  </div>
                  <div className="access-meta">
                    <strong>Road access:</strong> {selectedTakeOut.vehicle_suitability} | <strong>Ramp:</strong> {selectedTakeOut.infrastructure.ramp_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {routeHazards.length > 0 && (
          <div className="detail-panel-card">
            <div className="detail-section-title">Rapids & Hazards</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {routeHazards.map(h => (
                <div key={h.hazard_id} className="hazard-alert-box">
                  <ShieldAlert size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#fff' }}>{h.name} ({h.severity})</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '12px' }}>
                      {h.safety_notes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="gpx-button" style={{ width: '100%' }} onClick={handleDownloadGPX}>
          <Download size={16} /> Export GPX Payload
        </button>
      </div>
    </div>
  );
};

export default DetailPanel;
