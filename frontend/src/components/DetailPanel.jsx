import React from 'react';
import { X, Download, AlertTriangle, MapPin, Compass, ShieldAlert } from 'lucide-react';

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

  const handleDownloadGPX = () => {
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
        {selectedRoute.is_high_flow && (
          <div className="flow-warning-card">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>High Flow Warning!</strong>
              <div style={{ marginTop: '2px' }}>
                Live flow ({selectedRoute.current_gauge_reading} m³/s) exceeds the safe operational limit ({selectedRoute.flow_thresholds.maximum_m3_s} m³/s).
              </div>
            </div>
          </div>
        )}

        <div className="detail-panel-card">
          <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
            {selectedRoute.description}
          </p>
        </div>

        <div className="detail-panel-card">
          <div className="detail-section-title">Hydrometric Observations</div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Current Discharge</span>
              <span className="stat-value" style={{ color: selectedRoute.is_high_flow ? '#fb7185' : '#10b981' }}>
                {selectedRoute.current_gauge_reading ? `${selectedRoute.current_gauge_reading} m³/s` : 'Unknown'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Optimal Flow Range</span>
              <span className="stat-value">
                {selectedRoute.flow_thresholds.minimum_m3_s} - {selectedRoute.flow_thresholds.maximum_m3_s} m³/s
              </span>
            </div>
          </div>
        </div>

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
