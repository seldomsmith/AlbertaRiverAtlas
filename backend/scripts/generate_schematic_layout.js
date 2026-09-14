const fs = require('fs');
const path = require('path');

const topology = require('../data/bow_basin_topology.json');

// Canvas dimensions for generous 2D geographic distribution
const WIDTH = 3900;
const HEIGHT = 2300;

// Waterways of America transit palette
const LINE_PALETTES = {
  BOW_TRUNK: { id: 'bow-trunk', name: 'Bow River Trunk Line', color: '#1E3A8A', light: '#93C5FD', bg: '#EFF6FF', label: 'BOW RIVER' },
  PIPESTONE: { id: 'pipestone', name: 'Pipestone & Upper Bow', color: '#0284C7', light: '#BAE6FD', bg: '#F0F9FF', label: 'PIPESTONE RIVER' },
  CASCADE: { id: 'cascade', name: 'Cascade & Minnewanka', color: '#4338CA', light: '#C7D2FE', bg: '#EEF2FF', label: 'CASCADE RIVER' },
  SPRAY: { id: 'spray', name: 'Spray Valley', color: '#0F766E', light: '#99F6E4', bg: '#F0FDFA', label: 'SPRAY RIVER' },
  GHOST: { id: 'ghost', name: 'Ghost Wilderness', color: '#7E22CE', light: '#E9D5FF', bg: '#FAF5FF', label: 'GHOST RIVER' },
  KANANASKIS: { id: 'kananaskis', name: 'Kananaskis Country', color: '#047857', light: '#A7F3D0', bg: '#ECFDF5', label: 'KANANASKIS RIVER' },
  JUMPINGPOUND: { id: 'jumpingpound', name: 'Jumpingpound & Bighill', color: '#B45309', light: '#FDE68A', bg: '#FFFBEB', label: 'JUMPINGPOUND CREEK' },
  ELBOW: { id: 'elbow', name: 'Elbow River', color: '#0891B2', light: '#A5F3FC', bg: '#ECFEFF', label: 'ELBOW RIVER' },
  NOSE: { id: 'nose', name: 'Nose Creek', color: '#6D28D9', light: '#DDD6FE', bg: '#F5F3FF', label: 'NOSE CREEK' },
  FISH: { id: 'fish', name: 'Fish Creek', color: '#4D7C0F', light: '#D9F99D', bg: '#F7FEE7', label: 'FISH CREEK' },
  SHEEP: { id: 'sheep', name: 'Sheep River', color: '#BE123C', light: '#FECDD3', bg: '#FFF1F2', label: 'SHEEP RIVER' },
  HIGHWOOD: { id: 'highwood', name: 'Highwood River Express', color: '#B91C1C', light: '#FECACA', bg: '#FEF2F2', label: 'HIGHWOOD RIVER' },
  LOWER_BOW: { id: 'lower-bow', name: 'Lower Bow Prairie', color: '#C2410C', light: '#FED7AA', bg: '#FFF7ED', label: 'LOWER BOW' }
};

// Eco-regions / Watershed landscape background sectors
const ECOREGIONS = [
  {
    id: 'rockies',
    name: 'ROCKY MOUNTAINS & CONTINENTAL DIVIDE',
    subtext: 'Banff National Park • Kananaskis High Country',
    x: 100, y: 100, width: 1450, height: 2100,
    fill: '#F4EFE6', stroke: '#E5DCce'
  },
  {
    id: 'foothills',
    name: 'FOOTHILLS ECODISTRICT & CALGARY METROPOLITAN',
    subtext: 'Bragg Creek • Cochrane • Airdrie • Okotoks',
    x: 1550, y: 100, width: 950, height: 2100,
    fill: '#EDF5EC', stroke: '#DBE9DA'
  },
  {
    id: 'prairies',
    name: 'GRASSLAND PRAIRIES & EASTERN IRRIGATION',
    subtext: 'Siksika Nation • Bassano • Oldman Confluence',
    x: 2500, y: 100, width: 1300, height: 2100,
    fill: '#FBF5E8', stroke: '#ECE2CC'
  }
];

// Stylized Geometric Lakes and Reservoirs (Transit style pills and polygons)
const WATERBODIES = [
  { id: 'bow-lake', name: 'Bow Lake', x: 330, y: 340, width: 110, height: 65, rx: 16 },
  { id: 'hector-lake', name: 'Hector Lake', x: 470, y: 440, width: 85, height: 50, rx: 12 },
  { id: 'lake-louise', name: 'Lake Louise', x: 610, y: 535, width: 95, height: 55, rx: 14 },
  { id: 'lake-minnewanka', name: 'Lake Minnewanka', x: 1050, y: 460, width: 220, height: 75, rx: 20 },
  { id: 'spray-lakes', name: 'Spray Lakes Reservoir', x: 910, y: 1010, width: 170, height: 85, rx: 22 },
  { id: 'kananaskis-lakes', name: 'Upper & Lower Kananaskis Lakes', x: 770, y: 1620, width: 210, height: 95, rx: 24 },
  { id: 'barrier-lake', name: 'Barrier Lake', x: 1320, y: 960, width: 120, height: 60, rx: 16 },
  { id: 'ghost-lake', name: 'Ghost Lake Reservoir', x: 1480, y: 770, width: 140, height: 65, rx: 18 },
  { id: 'glenmore-reservoir', name: 'Glenmore Reservoir', x: 1940, y: 1060, width: 130, height: 65, rx: 16 },
  { id: 'mcgregor-lake', name: 'McGregor Lake', x: 2750, y: 1500, width: 180, height: 80, rx: 20 },
  { id: 'lake-newell', name: 'Lake Newell Reservoir', x: 3260, y: 1350, width: 210, height: 100, rx: 26 }
];

// Master Trunk Stations with careful 2D subway geometry
const TRUNK_STATIONS = [
  { id: 'bow-glacier', name: 'Bow Glacier (Source)', x: 210, y: 370, type: 'headwater', labelPos: 'top-left' },
  { id: 'bow-lake-stn', name: 'Bow Lake', x: 385, y: 370, type: 'lake-stn', labelPos: 'bottom' },
  { id: 'hector-lake-stn', name: 'Hector Lake', x: 510, y: 465, type: 'lake-stn', labelPos: 'top-left' },
  { id: 'lake-louise-stn', name: 'Lake Louise', x: 650, y: 560, type: 'major-interchange', labelPos: 'bottom-right' },
  { id: 'castle-junction', name: 'Castle Junction', x: 810, y: 650, type: 'interchange', labelPos: 'bottom-right' },
  { id: 'banff-stn', name: 'Banff', x: 1040, y: 710, type: 'central-hub', labelPos: 'top-left' },
  { id: 'canmore-stn', name: 'Canmore', x: 1240, y: 750, type: 'town', labelPos: 'bottom-right' },
  { id: 'exshaw-stn', name: 'Lac des Arcs / Exshaw', x: 1390, y: 775, type: 'town', labelPos: 'bottom-right' },
  { id: 'ghost-lake-stn', name: 'Ghost Lake / Seebe', x: 1540, y: 800, type: 'central-hub', labelPos: 'top-left' },
  { id: 'cochrane-stn', name: 'Cochrane', x: 1740, y: 840, type: 'major-interchange', labelPos: 'bottom-right' },
  { id: 'bearspaw-stn', name: 'Bearspaw Dam', x: 1890, y: 880, type: 'dam', labelPos: 'top-right' },
  { id: 'calgary-downtown', name: 'Calgary (Downtown / Peace Bridge)', x: 2060, y: 920, type: 'central-hub', labelPos: 'top-left' },
  { id: 'fort-calgary-stn', name: 'Fort Calgary (Harvie Passage)', x: 2200, y: 950, type: 'major-interchange', labelPos: 'bottom-right' },
  { id: 'fish-creek-stn', name: 'Fish Creek Provincial Park', x: 2330, y: 1030, type: 'interchange', labelPos: 'top-right' },
  { id: 'carseland-stn', name: 'Carseland Weir', x: 2540, y: 1140, type: 'central-hub', labelPos: 'top-right' },
  { id: 'shouldice-stn', name: 'Arrowwood / Shouldice', x: 2780, y: 1200, type: 'interchange', labelPos: 'bottom' },
  { id: 'cluny-stn', name: 'Cluny / Siksika', x: 3020, y: 1200, type: 'interchange', labelPos: 'bottom' },
  { id: 'bassano-stn', name: 'Bassano Dam', x: 3260, y: 1200, type: 'dam', labelPos: 'top' },
  { id: 'bow-city-stn', name: 'Bow City / Scandia', x: 3480, y: 1200, type: 'town', labelPos: 'bottom' },
  { id: 'grand-forks-stn', name: 'Grand Forks (Confluence -> South Sask)', x: 3730, y: 1200, type: 'terminal', labelPos: 'right' }
];

// Spatially routed tributary branch corridors
const BRANCH_ROUTES = {
  'PIPESTONE RIVER': {
    palette: LINE_PALETTES.PIPESTONE,
    junctionId: 'lake-louise-stn',
    path: [
      { x: 650, y: 560 },
      { x: 530, y: 440 },
      { x: 420, y: 330 }
    ],
    title: 'Pipestone River Branch'
  },
  'CASCADE RIVER': {
    palette: LINE_PALETTES.CASCADE,
    junctionId: 'banff-stn',
    path: [
      { x: 1040, y: 710 },
      { x: 1050, y: 530 },
      { x: 1050, y: 350 },
      { x: 970, y: 270 }
    ],
    title: 'Cascade River & Lake Minnewanka Line'
  },
  'SPRAY RIVER': {
    palette: LINE_PALETTES.SPRAY,
    junctionId: 'banff-stn',
    path: [
      { x: 1040, y: 710 },
      { x: 960, y: 830 },
      { x: 960, y: 1080 },
      { x: 840, y: 1280 }
    ],
    title: 'Spray River Valley Line'
  },
  'GHOST RIVER': {
    palette: LINE_PALETTES.GHOST,
    junctionId: 'ghost-lake-stn',
    path: [
      { x: 1540, y: 800 },
      { x: 1440, y: 640 },
      { x: 1340, y: 480 },
      { x: 1200, y: 340 }
    ],
    title: 'Ghost River & Waiparous Wilderness Line'
  },
  'KANANASKIS RIVER': {
    palette: LINE_PALETTES.KANANASKIS,
    junctionId: 'ghost-lake-stn',
    path: [
      { x: 1540, y: 800 },
      { x: 1380, y: 960 },
      { x: 1220, y: 1160 },
      { x: 1040, y: 1420 },
      { x: 860, y: 1680 },
      { x: 740, y: 1860 }
    ],
    title: 'Kananaskis Country Valley Express'
  },
  'JUMPINGPOUND CREEK': {
    palette: LINE_PALETTES.JUMPINGPOUND,
    junctionId: 'cochrane-stn',
    path: [
      { x: 1740, y: 840 },
      { x: 1640, y: 980 },
      { x: 1540, y: 1180 }
    ],
    title: 'Jumpingpound Creek Branch'
  },
  'BIGHILL CREEK': {
    palette: LINE_PALETTES.JUMPINGPOUND,
    junctionId: 'cochrane-stn',
    path: [
      { x: 1740, y: 840 },
      { x: 1740, y: 620 }
    ],
    title: 'Bighill Creek Branch'
  },
  'NOSE CREEK': {
    palette: LINE_PALETTES.NOSE,
    junctionId: 'calgary-downtown',
    path: [
      { x: 2060, y: 920 },
      { x: 2060, y: 720 },
      { x: 2060, y: 520 },
      { x: 2060, y: 340 }
    ],
    title: 'Nose Creek Line (Airdrie / Crossfield)'
  },
  'ELBOW RIVER': {
    palette: LINE_PALETTES.ELBOW,
    junctionId: 'fort-calgary-stn',
    path: [
      { x: 2200, y: 950 },
      { x: 1980, y: 1090 },
      { x: 1780, y: 1250 },
      { x: 1580, y: 1430 },
      { x: 1380, y: 1610 }
    ],
    title: 'Elbow River Valley Line'
  },
  'FISH CREEK': {
    palette: LINE_PALETTES.FISH,
    junctionId: 'fish-creek-stn',
    path: [
      { x: 2330, y: 1030 },
      { x: 2130, y: 1170 },
      { x: 1930, y: 1290 }
    ],
    title: 'Fish Creek & Priddis Branch'
  },
  'HIGHWOOD RIVER': {
    palette: LINE_PALETTES.HIGHWOOD,
    junctionId: 'carseland-stn',
    path: [
      { x: 2540, y: 1140 },
      { x: 2380, y: 1260 },
      { x: 2220, y: 1400 },
      { x: 2080, y: 1580 },
      { x: 1880, y: 1780 },
      { x: 1640, y: 2000 }
    ],
    title: 'Highwood River Express Line'
  },
  'SHEEP RIVER': {
    palette: LINE_PALETTES.SHEEP,
    junctionId: 'carseland-stn',
    path: [
      { x: 2220, y: 1400 }, // Branches off Highwood at Okotoks
      { x: 2020, y: 1480 },
      { x: 1820, y: 1580 },
      { x: 1600, y: 1680 }
    ],
    title: 'Sheep River & Turner Valley Line'
  },
  'CROWFOOT CREEK': {
    palette: LINE_PALETTES.LOWER_BOW,
    junctionId: 'cluny-stn',
    path: [
      { x: 3020, y: 1200 },
      { x: 3020, y: 940 }
    ],
    title: 'Crowfoot Creek Prairie Branch'
  },
  'WEST ARROWWOOD CREEK': {
    palette: LINE_PALETTES.LOWER_BOW,
    junctionId: 'shouldice-stn',
    path: [
      { x: 2780, y: 1200 },
      { x: 2780, y: 1480 }
    ],
    title: 'West Arrowwood Branch'
  },
  'EAST ARROWWOOD CREEK': {
    palette: LINE_PALETTES.LOWER_BOW,
    junctionId: 'shouldice-stn',
    path: [
      { x: 2780, y: 1200 },
      { x: 2900, y: 1440 }
    ],
    title: 'East Arrowwood Branch'
  }
};

function interpolatePolyline(points, t) {
  let totalLen = 0;
  const lens = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    lens.push(len);
    totalLen += len;
  }

  const targetDist = t * totalLen;
  let running = 0;
  for (let i = 0; i < lens.length; i++) {
    if (running + lens[i] >= targetDist) {
      const segT = (targetDist - running) / lens[i];
      const p1 = points[i];
      const p2 = points[i+1];
      const x = p1.x + (p2.x - p1.x) * segT;
      const y = p1.y + (p2.y - p1.y) * segT;
      const angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      return { x: Math.round(x), y: Math.round(y), angleDeg };
    }
    running += lens[i];
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y, angleDeg: 0 };
}

function buildOverhauledLayout() {
  console.log('Compiling Waterways of America layout for Bow River Basin...');

  const streams = topology.streams;
  const stationsMap = new Map();

  // 1. Trunk Line Stations
  const allStations = [];
  TRUNK_STATIONS.forEach((st, idx) => {
    const station = {
      ...st,
      isTrunk: true,
      strahlerOrder: 9,
      lineId: LINE_PALETTES.BOW_TRUNK.id,
      color: LINE_PALETTES.BOW_TRUNK.color,
      branchName: 'BOW RIVER'
    };
    allStations.push(station);
    stationsMap.set(st.name.toUpperCase(), station);
  });

  // 2. Prepare Branch Corridors and Feeder Lines
  const branchLines = [];
  const feederLines = [];
  const assignedStreamNames = new Set(['BOW RIVER']);

  for (const [branchName, cfg] of Object.entries(BRANCH_ROUTES)) {
    // Convert path to SVG path string
    let d = `M ${cfg.path[0].x} ${cfg.path[0].y}`;
    for (let i = 1; i < cfg.path.length; i++) {
      d += ` L ${cfg.path[i].x} ${cfg.path[i].y}`;
    }

    // Find all streams that drain into this branch
    const branchCreeks = [];
    for (const stream of streams) {
      if (stream.name === 'BOW RIVER') continue;
      
      let curr = stream;
      while (curr) {
        if (curr.name === branchName) {
          branchCreeks.push(stream);
          assignedStreamNames.add(stream.name);
          break;
        }
        if (!curr.parentStream || curr.parentStream === 'BOW RIVER') break;
        const parent = streams.find(s => s.name === curr.parentStream);
        if (!parent || parent.name === curr.name) break;
        curr = parent;
      }
    }

    branchLines.push({
      branchName,
      lineId: cfg.palette.id,
      lineName: cfg.palette.name,
      color: cfg.palette.color,
      lightColor: cfg.palette.light,
      label: cfg.palette.label,
      d,
      points: cfg.path,
      creekCount: branchCreeks.length
    });

    // Sort creeks by Strahler Order descending so primary creeks get prime spacing
    branchCreeks.sort((a, b) => b.strahlerOrder - a.strahlerOrder);

    // Distribute tributary creeks evenly with comfortable spacing
    const count = branchCreeks.length;
    branchCreeks.forEach((creek, idx) => {
      // Calculate normalized position along polyline
      const t = (idx + 0.8) / (count + 1);
      const pos = interpolatePolyline(cfg.path, t);

      // Alternate spur direction cleanly (perpendicular +/- 90)
      const sign = idx % 2 === 0 ? 1 : -1;
      const spurAngleRad = ((pos.angleDeg + 90 * sign) * Math.PI) / 180;
      
      // Short, tidy ticks (25px to 45px)
      const isMajorCreek = creek.strahlerOrder >= 4;
      const spurLength = isMajorCreek ? 42 : 26;
      const endX = Math.round(pos.x + Math.cos(spurAngleRad) * spurLength);
      const endY = Math.round(pos.y + Math.sin(spurAngleRad) * spurLength);

      const stnObj = {
        id: `st-${creek.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: creek.commonName || creek.name,
        officialName: creek.name,
        strahlerOrder: creek.strahlerOrder,
        tier: creek.tier,
        huc8: creek.huc8,
        parentStream: creek.parentStream,
        lineId: cfg.palette.id,
        lineName: cfg.palette.name,
        color: cfg.palette.color,
        branchName: branchName,
        x: endX,
        y: endY,
        confluenceX: pos.x,
        confluenceY: pos.y,
        isMajor: isMajorCreek,
        isTrunk: false
      };

      allStations.push(stnObj);
      stationsMap.set(creek.name.toUpperCase(), stnObj);

      feederLines.push({
        id: `feeder-${stnObj.id}`,
        fromX: pos.x,
        fromY: pos.y,
        toX: endX,
        toY: endY,
        streamName: creek.name,
        parentName: creek.parentStream,
        color: cfg.palette.color,
        order: creek.strahlerOrder,
        isMajor: isMajorCreek
      });
    });
  }

  // Handle remaining unassigned direct prairie creeks along Bow trunk
  const unassigned = streams.filter(s => !assignedStreamNames.has(s.name));
  unassigned.forEach((creek, idx) => {
    // Distribute along Bow trunk between Calgary and Grand Forks
    const t = 0.55 + (idx / Math.max(1, unassigned.length)) * 0.40;
    const pos = interpolatePolyline(TRUNK_STATIONS, t);
    const sign = idx % 2 === 0 ? -1 : 1;
    const endX = pos.x;
    const endY = pos.y + sign * 35;

    const stnObj = {
      id: `st-${creek.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: creek.commonName || creek.name,
      officialName: creek.name,
      strahlerOrder: creek.strahlerOrder,
      tier: creek.tier,
      huc8: creek.huc8,
      parentStream: 'BOW RIVER',
      lineId: LINE_PALETTES.BOW_TRUNK.id,
      lineName: LINE_PALETTES.BOW_TRUNK.name,
      color: LINE_PALETTES.BOW_TRUNK.color,
      branchName: 'BOW RIVER',
      x: endX,
      y: endY,
      confluenceX: pos.x,
      confluenceY: pos.y,
      isMajor: creek.strahlerOrder >= 4,
      isTrunk: false
    };

    allStations.push(stnObj);
    stationsMap.set(creek.name.toUpperCase(), stnObj);

    feederLines.push({
      id: `feeder-${stnObj.id}`,
      fromX: pos.x,
      fromY: pos.y,
      toX: endX,
      toY: endY,
      streamName: creek.name,
      parentName: 'BOW RIVER',
      color: LINE_PALETTES.BOW_TRUNK.color,
      order: creek.strahlerOrder,
      isMajor: creek.strahlerOrder >= 4
    });
  });

  // Build Trunk Path SVG definition
  let trunkPathD = `M ${TRUNK_STATIONS[0].x} ${TRUNK_STATIONS[0].y}`;
  for (let i = 1; i < TRUNK_STATIONS.length; i++) {
    trunkPathD += ` L ${TRUNK_STATIONS[i].x} ${TRUNK_STATIONS[i].y}`;
  }

  const schematic = {
    title: "Waterways of Alberta: Bow River Basin",
    subtitle: "Schematic Hydrological Transit Network",
    dimensions: { width: WIDTH, height: HEIGHT },
    ecoregions: ECOREGIONS,
    waterbodies: WATERBODIES,
    lines: Object.values(LINE_PALETTES),
    trunkPath: {
      lineId: LINE_PALETTES.BOW_TRUNK.id,
      color: LINE_PALETTES.BOW_TRUNK.color,
      width: 14,
      d: trunkPathD,
      label: 'BOW RIVER'
    },
    branchPaths: branchLines,
    feederLines: feederLines,
    stations: allStations,
    totalStations: allStations.length,
    totalStreams: topology.totalStreams
  };

  return schematic;
}

function main() {
  const layout = buildOverhauledLayout();

  const outBackend = path.join(__dirname, '..', 'data', 'bow_basin_schematic_map.json');
  fs.writeFileSync(outBackend, JSON.stringify(layout, null, 2), 'utf8');

  const outFrontend = path.join(__dirname, '..', '..', 'frontend', 'src', 'data', 'bow_basin_schematic_map.json');
  fs.writeFileSync(outFrontend, JSON.stringify(layout, null, 2), 'utf8');

  console.log(`Generated overhauled schematic map with ${layout.stations.length} stations across ${layout.branchPaths.length} branch corridors!`);
}

main();
