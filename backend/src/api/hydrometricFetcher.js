const axios = require('axios');

// Global cache structures passed from/to the main server instance
let localGaugeCache = {};
let localAlertIds = [];

/**
 * Parses raw ECCC hourly CSV data strings to extract the most recent valid discharge reading.
 * @param {string} csvText - Raw comma-separated string from the datamart endpoint.
 * @returns {number|null} - The latest valid volumetric flow rate in m³/s.
 */
const parseLatestFlowFromCSV = (csvText) => {
  if (!csvText) return null;

  // Split lines and discard empty rows
  const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Iterate backward starting from the last row to find the newest entry
  for (let i = lines.length - 1; i >= 1; i--) {
    const columns = lines[i].split(',');
    if (columns.length < 7) continue;

    // Index 6 corresponds directly to the 'Discharge (cms)' data layer
    const dischargeValue = parseFloat(columns[6]);
    
    if (!isNaN(dischargeValue)) {
      return dischargeValue;
    }
  }
  
  return null;
};

/**
 * Executes a sync batch sequence across all unique gauge IDs registered in routes.json.
 * @param {Array} routes - List of route metadata records loaded from local memory.
 * @returns {Promise<Object>} - An updated payload containing the alert array and gauge mappings.
 */
const synchronizeHydrometricData = async (routes) => {
  const updatedGaugeCache = {};
  const updatedAlertIds = new Set();

  // Deduplicate gauge requests across identical river systems
  const uniqueGaugeIds = [...new Set(routes.map(r => r.alberta_gauge_id).filter(Boolean))];

  for (const gaugeId of uniqueGaugeIds) {
    try {
      const targetUrl = `https://dd.weather.gc.ca/hydrometric/csv/AB/hourly/AB_${gaugeId}_hourly_hydrometric.csv`;
      
      const response = await axios.get(targetUrl, { 
        timeout: 8000,
        headers: { 'User-Agent': 'Alberta-Paddling-Dashboard-Dev' }
      });

      const parsedFlow = parseLatestFlowFromCSV(response.data);

      if (parsedFlow !== null) {
        updatedGaugeCache[gaugeId] = parsedFlow;
        console.log(`Gauge ${gaugeId} synced successfully. Current Flow: ${parsedFlow} m³/s`);
      } else {
        console.warn(`Gauge ${gaugeId} data was retrieved but contained no valid numeric flow entries.`);
        updatedGaugeCache[gaugeId] = localGaugeCache[gaugeId] || null; // Fallback to stale cache if available
      }
    } catch (error) {
      console.error(`Hydrometric synchronization failure for Gauge ${gaugeId}:`, error.message);
      updatedGaugeCache[gaugeId] = localGaugeCache[gaugeId] || null;
    }
  }

  // Cross-reference parsed flows against defined maximum limits in routes database
  routes.forEach(route => {
    const currentFlow = updatedGaugeCache[route.alberta_gauge_id];
    if (currentFlow && route.flow_thresholds && currentFlow > route.flow_thresholds.maximum_m3_s) {
      updatedAlertIds.add(route.route_id);
    }
  });

  // Persist transformations to local state mirrors
  localGaugeCache = updatedGaugeCache;
  localAlertIds = Array.from(updatedAlertIds);

  return {
    gaugeCache: localGaugeCache,
    alertIds: localAlertIds
  };
};

module.exports = {
  synchronizeHydrometricData
};
