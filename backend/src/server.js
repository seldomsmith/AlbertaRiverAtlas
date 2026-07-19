const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { synchronizeHydrometricData } = require('./api/hydrometricFetcher');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-memory caching states
let activeHighFlowAlerts = [];
let gaugeDataCache = {};

const loadLocalData = (filename) => {
  try {
    return require(path.join(__dirname, '..', 'data', filename));
  } catch (error) {
    console.error(`Data retrieval failure for ${filename}:`, error.message);
    return [];
  }
};

// --- Hydrometric Synchronization Orchestration ---
const triggerDataRefresh = async () => {
  console.log('Initiating scheduled hydrometric observation update cycle...');
  const routes = loadLocalData('routes.json');
  const results = await synchronizeHydrometricData(routes);
  
  gaugeDataCache = results.gaugeCache;
  activeHighFlowAlerts = results.alertIds;
  console.log(`Update sequence complete. Active high-flow route alerts: [${activeHighFlowAlerts.join(', ')}]`);
};

// Automate sync routine execution on a fixed hourly interval schedule (top of every hour)
cron.schedule('0 * * * *', () => {
  triggerDataRefresh();
});

// Run a sync at startup to populate flow data immediately
triggerDataRefresh();

// --- REST Endpoint Routings ---
app.get('/api/routes', (req, res) => {
  const routes = loadLocalData('routes.json');
  
  const hydratedRoutes = routes.map(route => ({
    ...route,
    is_high_flow: activeHighFlowAlerts.includes(route.route_id),
    current_gauge_reading: gaugeDataCache[route.alberta_gauge_id] || null
  }));

  res.json(hydratedRoutes);
});

app.get('/api/access-points', (req, res) => {
  res.json(loadLocalData('access_points.json'));
});

app.get('/api/hazards', (req, res) => {
  res.json(loadLocalData('hazards.json'));
});

app.get('/api/alerts', (req, res) => {
  res.json({ high_flow_route_ids: activeHighFlowAlerts });
});

// Catch-all route handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint resource not found.' });
});

// Bind server to designated network port
app.listen(PORT, () => {
  console.log(`Paddling dashboard backend service operational on port ${PORT}`);
});
