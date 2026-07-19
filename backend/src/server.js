const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { synchronizeHydrometricData } = require('./api/hydrometricFetcher');

// Resolve .env explicitly relative to server.js, not CWD
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Diagnostic: verify token loaded
const mbToken = process.env.MAPBOX_ACCESS_TOKEN || '';
if (mbToken) {
  console.log(`Mapbox token loaded successfully (length: ${mbToken.length})`);
} else {
  console.warn('WARNING: MAPBOX_ACCESS_TOKEN is empty. Map tiles will not render. Run "node scripts/setup-env.js" to generate backend/.env');
}

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

app.get('/api/config', (req, res) => {
  res.json({ mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '' });
});

// --- Serve React Static Frontend Bundle Assets ---
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendBuildPath));

// Direct any non-API traffic back to React router index
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Bind server to designated network port
app.listen(PORT, () => {
  console.log(`Paddling dashboard backend service operational on port ${PORT}`);
});
