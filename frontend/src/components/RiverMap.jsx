import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

export const RiverMap = ({ 
  routes, 
  filteredRouteIds, 
  selectedRouteId, 
  onSelectRoute,
  accessPoints,
  hazards,
  colourMetric 
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Sleek dark/minimalist canvas style
      center: [-113.55, 53.45], // Anchored around Edmonton/Devon
      zoom: 9,
    });

    const map = mapRef.current;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // 1. Add route LineStrings source
      map.addSource('river-routes', {
        type: 'geojson',
        data: '/vectors/vector_routes.geojson',
        promoteId: 'route_id'
      });

      // 2. Base/Background line style layer (dimmed)
      map.addLayer({
        id: 'river-lines-base',
        type: 'line',
        source: 'river-routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1e293b',
          'line-width': 3,
          'line-opacity': 0.5
        }
      });

      // 3. Dynamic Active route layer style
      map.addLayer({
        id: 'river-lines-active',
        type: 'line',
        source: 'river-routes',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 6,
            4
          ],
          'line-opacity': 0.9
        }
      });

      // Click callback integration
      map.on('click', 'river-lines-active', (e) => {
        if (e.features.length > 0) {
          const clickedId = e.features[0].properties.route_id;
          onSelectRoute(clickedId);
        }
      });

      // Hover status logic
      let hoveredFeatureId = null;
      map.on('mousemove', 'river-lines-active', (e) => {
        if (e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          if (hoveredFeatureId !== null) {
            map.setFeatureState(
              { source: 'river-routes', id: hoveredFeatureId },
              { hover: false }
            );
          }
          hoveredFeatureId = e.features[0].id;
          map.setFeatureState(
            { source: 'river-routes', id: hoveredFeatureId },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'river-lines-active', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredFeatureId !== null) {
          map.setFeatureState(
            { source: 'river-routes', id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredFeatureId = null;
      });

      updateMapFilters();
      updateLayerStyles();
      updatePoints();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map layer filters when active state selections filter changes
  useEffect(() => {
    updateMapFilters();
  }, [filteredRouteIds]);

  // Update coloring expressions
  useEffect(() => {
    updateLayerStyles();
  }, [colourMetric, routes]);

  // Redraw node indicators for access points and rapids
  useEffect(() => {
    updatePoints();
  }, [accessPoints, hazards, selectedRouteId]);

  const updateMapFilters = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (filteredRouteIds.length === 0) {
      map.setFilter('river-lines-active', ['==', ['get', 'route_id'], '']);
      return;
    }

    map.setFilter('river-lines-active', [
      'in',
      ['get', 'route_id'],
      ['literal', filteredRouteIds]
    ]);
  };

  const updateLayerStyles = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const highFlowIds = routes.filter(r => r.is_high_flow).map(r => r.route_id);
    let lineColourExpression;

    if (colourMetric === 'difficulty') {
      lineColourExpression = [
        'match',
        ['get', 'difficulty_class'],
        1, '#10b981', // Class I: Emerald
        2, '#f59e0b', // Class II: Amber
        3, '#ef4444', // Class III: Crimson
        '#3b82f6'     // Default Blue
      ];
    } else {
      lineColourExpression = '#3b82f6';
    }

    // Override colors for flow advisories
    if (highFlowIds.length > 0) {
      lineColourExpression = [
        'case',
        ['in', ['get', 'route_id'], ['literal', highFlowIds]],
        '#f43f5e', // Hot pink alert color
        lineColourExpression
      ];
    }

    map.setPaintProperty('river-lines-active', 'line-color', lineColourExpression);
  };

  const updatePoints = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Cleanup existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(m => m.remove());

    const activeRoute = routes.find(r => r.route_id === selectedRouteId);
    if (!activeRoute) return;

    // Draw access point markers
    accessPoints.forEach(point => {
      const isEndpoint = point.access_id === activeRoute.put_in_id || point.access_id === activeRoute.take_out_id;
      if (!isEndpoint) return;

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fff';
      el.style.backgroundColor = point.access_id === activeRoute.put_in_id ? '#10b981' : '#ef4444';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <h3 style="font-weight:600; font-size:14px; margin-bottom:4px;">${point.name}</h3>
        <p style="font-size:11px; color:#9ca3af; text-transform:uppercase;">${point.type.replace('_', ' ')}</p>
        <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px; font-size:12px;">
          <div><span style="color:#9ca3af;">Parking:</span> ${point.infrastructure.parking_capacity_vehicles} cars</div>
          <div><span style="color:#9ca3af;">Ramp:</span> ${point.infrastructure.ramp_type.replace('_', ' ')}</div>
          <div><span style="color:#9ca3af;">Access:</span> ${point.vehicle_suitability}</div>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([point.coordinates.longitude, point.coordinates.latitude])
        .setPopup(popup)
        .addTo(map);
    });

    // Draw hazards & campsite markers
    hazards.forEach(hazard => {
      if (hazard.river_name !== activeRoute.river_name) return;

      const el = document.createElement('div');
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.transform = 'rotate(45deg)';
      el.style.backgroundColor = hazard.type === 'rapid' ? '#f59e0b' : '#3b82f6';
      el.style.border = '1px solid #fff';
      el.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';

      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <h3 style="font-weight:600; font-size:14px; margin-bottom:4px;">${hazard.name}</h3>
        <p style="font-size:11px; color:#9ca3af; text-transform:uppercase;">${hazard.type} - ${hazard.severity}</p>
        <p style="font-size:12px; margin-top:6px; line-height:1.4;">${hazard.safety_notes}</p>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([hazard.coordinates.longitude, hazard.coordinates.latitude])
        .setPopup(popup)
        .addTo(map);
    });
  };

  return (
    <div className="map-container-wrapper">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
export default RiverMap;
