const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://geospatial.alberta.ca/titan/rest/services/fisheries/fwmis_hydrography/MapServer/0/query';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AlbertaRiverAtlasExtractor/1.0' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON Parse Error: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllBowFeatures() {
  console.log('Fetching Bow River Basin hydrographic features from Alberta EPA FWMIS...');
  let offset = 0;
  const batchSize = 1000;
  let allFeatures = [];
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      where: "HUC_8 LIKE '0402%' AND OFFICIAL_NM IS NOT NULL AND OFFICIAL_NM <> 'UNNAMED'",
      outFields: 'OBJECTID,WB_ID,OFFICIAL_NM,COMMON_NM,STR_ORDER,HUC_8',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'json',
      resultOffset: offset,
      resultRecordCount: batchSize
    });

    const queryUrl = `${BASE_URL}?${params.toString()}`;
    const result = await fetchJson(queryUrl);

    if (!result.features || result.features.length === 0) {
      break;
    }

    allFeatures = allFeatures.concat(result.features);
    console.log(`Retrieved ${result.features.length} features (Total: ${allFeatures.length})`);

    if (result.exceededTransferLimit) {
      offset += batchSize;
    } else {
      hasMore = false;
    }
  }

  return allFeatures;
}

function distSq(c1, c2) {
  const dx = c1[0] - c2[0];
  const dy = c1[1] - c2[1];
  return dx * dx + dy * dy;
}

function haversineDistanceKm(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function processTopology(features) {
  console.log(`Processing strict acyclic topology across ${features.length} stream segments...`);

  const streamsMap = new Map();

  for (const f of features) {
    const rawName = f.attributes.OFFICIAL_NM;
    if (!rawName || rawName === 'UNNAMED') continue;

    const name = rawName.trim();
    if (!streamsMap.has(name)) {
      streamsMap.set(name, {
        name,
        commonName: f.attributes.COMMON_NM || name,
        strahlerOrder: f.attributes.STR_ORDER || 1,
        huc8: f.attributes.HUC_8,
        paths: [],
        endpoints: [],
        sampledCoords: []
      });
    }

    const stream = streamsMap.get(name);
    if (f.attributes.STR_ORDER && f.attributes.STR_ORDER > stream.strahlerOrder) {
      stream.strahlerOrder = f.attributes.STR_ORDER;
    }

    if (f.geometry && f.geometry.paths) {
      for (const p of f.geometry.paths) {
        stream.paths.push(p);
        if (p.length > 0) {
          stream.endpoints.push(p[0]);
          stream.endpoints.push(p[p.length - 1]);
          for (let i = 0; i < p.length; i += 3) {
            stream.sampledCoords.push(p[i]);
          }
          if ((p.length - 1) % 3 !== 0) {
            stream.sampledCoords.push(p[p.length - 1]);
          }
        }
      }
    }
  }

  const trunkName = 'BOW RIVER';
  const trunkStream = streamsMap.get(trunkName);
  if (!trunkStream) {
    throw new Error('Could not locate BOW RIVER in extracted features');
  }

  // Define major arterial collectors and their hierarchy tier
  const arterialTier = new Map([
    ['BOW RIVER', 100],
    ['HIGHWOOD RIVER', 90],
    ['ELBOW RIVER', 85],
    ['SHEEP RIVER', 80],
    ['KANANASKIS RIVER', 75],
    ['SPRAY RIVER', 70],
    ['GHOST RIVER', 65],
    ['CASCADE RIVER', 60],
    ['PIPESTONE RIVER', 55],
    ['FISH CREEK', 50],
    ['JUMPINGPOUND CREEK', 45],
    ['NOSE CREEK', 40],
    ['BIGHILL CREEK', 35],
    ['CROWFOOT CREEK', 30],
    ['WEST ARROWWOOD CREEK', 25],
    ['EAST ARROWWOOD CREEK', 25],
    ['TWELVEMILE COULEE', 20]
  ]);

  const streamList = Array.from(streamsMap.values());

  // Compute bounding boxes and centers
  for (const s of streamList) {
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lon, lat] of s.sampledCoords) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    s.bbox = { minLon, maxLon, minLat, maxLat };
    s.center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
    s.tier = arterialTier.get(s.name) || (s.strahlerOrder || 1);
  }

  // Sort streams by ascending tier so lower tier streams resolve into strictly higher tier collectors
  streamList.sort((a, b) => a.tier - b.tier);

  // Highwood River directly connects to Bow River
  // Sheep River connects to Highwood River
  // Elbow River connects to Bow River
  // Kananaskis connects to Bow River
  // Spray connects to Bow River
  // Ghost connects to Bow River
  // Cascade connects to Bow River
  // Pipestone connects to Bow River

  // Spatial grid
  const grid = new Map();
  function getCellKey(lon, lat) {
    const gx = Math.floor(lon * 10);
    const gy = Math.floor(lat * 10);
    return `${gx},${gy}`;
  }

  for (const s of streamList) {
    const visitedCells = new Set();
    for (const [lon, lat] of s.sampledCoords) {
      const key = getCellKey(lon, lat);
      if (!visitedCells.has(key)) {
        visitedCells.add(key);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(s);
      }
    }
  }

  // Resolve parent stream strictly where candidate.tier > s.tier
  for (const s of streamList) {
    if (s.name === trunkName) {
      s.parentStream = null;
      s.confluenceCoord = null;
      s.confluenceDistanceKm = 0;
      continue;
    }

    // Explicit hydrological parent bindings for primary branch rivers
    if (s.name === 'SHEEP RIVER') {
      s.parentStream = 'HIGHWOOD RIVER';
      s.confluenceCoord = [-113.85, 50.78];
      s.confluenceDistanceKm = 0;
      continue;
    }
    if (['HIGHWOOD RIVER', 'ELBOW RIVER', 'KANANASKIS RIVER', 'SPRAY RIVER', 'GHOST RIVER', 'CASCADE RIVER', 'PIPESTONE RIVER', 'FISH CREEK', 'JUMPINGPOUND CREEK', 'NOSE CREEK', 'BIGHILL CREEK', 'CROWFOOT CREEK', 'WEST ARROWWOOD CREEK', 'EAST ARROWWOOD CREEK'].includes(s.name)) {
      s.parentStream = trunkName;
      s.confluenceCoord = s.center;
      s.confluenceDistanceKm = 0;
      continue;
    }

    let bestParent = null;
    let minSq = Infinity;
    let bestConfluenceCoord = null;

    // Search cells for candidate streams with strictly higher tier
    const candidateStreams = new Set();
    for (const pt of s.sampledCoords) {
      const gx = Math.floor(pt[0] * 10);
      const gy = Math.floor(pt[1] * 10);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${gx + dx},${gy + dy}`;
          const cellStreams = grid.get(key);
          if (cellStreams) {
            for (const cs of cellStreams) {
              if (cs.tier > s.tier) {
                candidateStreams.add(cs);
              }
            }
          }
        }
      }
    }

    // Find closest contact point among higher-tier candidates
    for (const candidate of candidateStreams) {
      for (const ep of s.endpoints) {
        for (const cp of candidate.sampledCoords) {
          const sq = distSq(ep, cp);
          if (sq < minSq) {
            minSq = sq;
            bestParent = candidate.name;
            bestConfluenceCoord = cp;
          }
        }
      }
    }

    // Global fallback to nearest arterial or Bow River if disconnected
    if (!bestParent || Math.sqrt(minSq) > 0.15) {
      for (const arterialName of Array.from(arterialTier.keys())) {
        const candidate = streamsMap.get(arterialName);
        if (!candidate || candidate.tier <= s.tier) continue;
        for (const ep of s.endpoints) {
          for (const cp of candidate.sampledCoords) {
            const sq = distSq(ep, cp);
            if (sq < minSq) {
              minSq = sq;
              bestParent = candidate.name;
              bestConfluenceCoord = cp;
            }
          }
        }
      }
    }

    s.parentStream = bestParent || trunkName;
    s.confluenceCoord = bestConfluenceCoord || s.center;
    s.confluenceDistanceKm = Math.round(haversineDistanceKm(s.center, s.confluenceCoord) * 100) / 100;
  }

  // Build the final clean output
  const majorBranchesList = Array.from(arterialTier.keys()).filter(name => name !== trunkName && streamsMap.has(name));

  const result = {
    basin: 'Bow River Basin',
    pilotArea: 'Bow River watershed down to Oldman River confluence at Grand Forks',
    totalStreams: streamList.length,
    trunk: {
      name: trunkName,
      strahlerOrder: trunkStream.strahlerOrder,
      keyWaypoints: [
        { name: 'Bow Glacier (Source)', lon: -116.48, lat: 51.68, type: 'headwater' },
        { name: 'Bow Lake', lon: -116.45, lat: 51.67, type: 'lake' },
        { name: 'Lake Louise', lon: -116.18, lat: 51.43, type: 'town' },
        { name: 'Castle Junction', lon: -115.93, lat: 51.27, type: 'junction' },
        { name: 'Banff', lon: -115.57, lat: 51.18, type: 'town' },
        { name: 'Canmore', lon: -115.36, lat: 51.09, type: 'town' },
        { name: 'Exshaw / Lac des Arcs', lon: -115.16, lat: 51.06, type: 'town' },
        { name: 'Morley / Ghost Lake', lon: -114.92, lat: 51.17, type: 'reservoir' },
        { name: 'Cochrane', lon: -114.47, lat: 51.19, type: 'town' },
        { name: 'Bearspaw Dam', lon: -114.28, lat: 51.10, type: 'dam' },
        { name: 'Calgary (Downtown / Peace Bridge)', lon: -114.07, lat: 51.05, type: 'city' },
        { name: 'Harvie Passage', lon: -114.01, lat: 51.04, type: 'weir' },
        { name: 'Fish Creek Provincial Park', lon: -114.01, lat: 50.90, type: 'junction' },
        { name: 'Carseland Weir', lon: -113.43, lat: 50.83, type: 'dam' },
        { name: 'Arrowwood / Shouldice', lon: -113.01, lat: 50.72, type: 'junction' },
        { name: 'Bassano Dam', lon: -112.47, lat: 50.78, type: 'dam' },
        { name: 'Grand Forks (Confluence with Oldman -> South Sask)', lon: -111.18, lat: 49.93, type: 'outlet' }
      ]
    },
    majorBranches: majorBranchesList,
    streams: streamList.map(s => ({
      name: s.name,
      commonName: s.commonName,
      strahlerOrder: s.strahlerOrder,
      tier: s.tier,
      huc8: s.huc8,
      parentStream: s.parentStream,
      confluenceDistanceKm: s.confluenceDistanceKm,
      center: [Math.round(s.center[0] * 10000) / 10000, Math.round(s.center[1] * 10000) / 10000],
      confluenceCoord: s.confluenceCoord ? [Math.round(s.confluenceCoord[0] * 10000) / 10000, Math.round(s.confluenceCoord[1] * 10000) / 10000] : null,
      segmentCount: s.paths.length
    }))
  };

  return result;
}

async function main() {
  try {
    const features = await fetchAllBowFeatures();
    const topology = processTopology(features);

    const outDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, 'bow_basin_topology.json');
    fs.writeFileSync(outFile, JSON.stringify(topology, null, 2), 'utf8');

    console.log(`Successfully generated acyclic Bow Basin topology at: ${outFile}`);
    console.log(`Total streams cataloged: ${topology.streams.length}`);
    console.log(`Major branches: ${topology.majorBranches.join(', ')}`);
  } catch (err) {
    console.error('Pipeline failed:', err);
    process.exit(1);
  }
}

main();
