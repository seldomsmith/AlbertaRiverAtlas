const fs = require('fs');
const path = require('path');

const topology = require('../data/bow_basin_topology.json');

// Canvas dimensions for generous 2D geographic distribution
const WIDTH = 4000;
const HEIGHT = 2400;

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
    x: 100, y: 100, width: 1450, height: 2200,
    fill: '#F4EFE6', stroke: '#E5DCce'
  },
  {
    id: 'foothills',
    name: 'FOOTHILLS ECODISTRICT & CALGARY METROPOLITAN',
    subtext: 'Bragg Creek • Cochrane • Airdrie • Okotoks',
    x: 1580, y: 100, width: 950, height: 2200,
    fill: '#EDF5EC', stroke: '#DBE9DA'
  },
  {
    id: 'prairies',
    name: 'GRASSLAND PRAIRIES & EASTERN IRRIGATION',
    subtext: 'Siksika Nation • Bassano • Oldman Confluence',
    x: 2560, y: 100, width: 1340, height: 2200,
    fill: '#FBF5E8', stroke: '#ECE2CC'
  }
];

// Stylized Geometric Lakes and Reservoirs with clean non-colliding coordinates
const WATERBODIES = [
  { id: 'bow-lake', name: 'Bow Lake', x: 310, y: 320, width: 130, height: 75, rx: 18, labelYOffset: 0 },
  { id: 'hector-lake', name: 'Hector Lake', x: 450, y: 430, width: 95, height: 55, rx: 14, labelYOffset: 0 },
  { id: 'lake-louise', name: 'Lake Louise', x: 580, y: 530, width: 110, height: 60, rx: 16, labelYOffset: 0 },
  { id: 'lake-minnewanka', name: 'Lake Minnewanka', x: 1050, y: 440, width: 230, height: 80, rx: 20, labelYOffset: 0 },
  { id: 'spray-lakes', name: 'Spray Lakes Reservoir', x: 890, y: 1020, width: 180, height: 90, rx: 22, labelYOffset: 0 },
  { id: 'kananaskis-lakes', name: 'Upper & Lower Kananaskis Lakes', x: 740, y: 1650, width: 220, height: 100, rx: 24, labelYOffset: 0 },
  { id: 'barrier-lake', name: 'Barrier Lake', x: 1310, y: 980, width: 130, height: 65, rx: 16, labelYOffset: 0 },
  { id: 'ghost-lake', name: 'Ghost Lake Reservoir', x: 1480, y: 840, width: 170, height: 75, rx: 18, labelYOffset: 12 },
  { id: 'glenmore-reservoir', name: 'Glenmore Reservoir', x: 1940, y: 1070, width: 140, height: 70, rx: 18, labelYOffset: 0 },
  { id: 'mcgregor-lake', name: 'McGregor Lake', x: 2750, y: 1520, width: 190, height: 85, rx: 20, labelYOffset: 0 },
  { id: 'lake-newell', name: 'Lake Newell Reservoir', x: 3260, y: 1380, width: 220, height: 110, rx: 26, labelYOffset: 0 }
];

// Master Trunk Stations with careful spatial clearance and alternating label anchors
const TRUNK_STATIONS = [
  { id: 'bow-glacier', name: 'Bow Glacier (Source)', x: 190, y: 360, type: 'headwater', labelPos: 'top-left' },
  { id: 'bow-lake-stn', name: 'Bow Lake', x: 375, y: 360, type: 'lake-stn', labelPos: 'bottom' },
  { id: 'hector-lake-stn', name: 'Hector Lake', x: 500, y: 460, type: 'lake-stn', labelPos: 'top-left' },
  { id: 'lake-louise-stn', name: 'Lake Louise', x: 650, y: 560, type: 'major-interchange', labelPos: 'bottom-right' },
  { id: 'castle-junction', name: 'Castle Junction', x: 820, y: 650, type: 'interchange', labelPos: 'top-left' },
  { id: 'banff-stn', name: 'Banff', x: 1040, y: 710, type: 'central-hub', labelPos: 'top-left' },
  { id: 'canmore-stn', name: 'Canmore', x: 1220, y: 750, type: 'town', labelPos: 'bottom-right' },
  { id: 'exshaw-stn', name: 'Lac des Arcs / Exshaw', x: 1370, y: 775, type: 'town', labelPos: 'top-left' },
  { id: 'ghost-lake-stn', name: 'Ghost Lake / Seebe', x: 1580, y: 805, type: 'central-hub', labelPos: 'bottom-right' },
  { id: 'cochrane-stn', name: 'Cochrane', x: 1780, y: 845, type: 'major-interchange', labelPos: 'top-left' },
  { id: 'bearspaw-stn', name: 'Bearspaw Dam', x: 1940, y: 885, type: 'dam', labelPos: 'top-right' },
  { id: 'calgary-downtown', name: 'Calgary (Downtown / Peace Bridge)', x: 2110, y: 925, type: 'central-hub', labelPos: 'top-left' },
  { id: 'fort-calgary-stn', name: 'Fort Calgary (Harvie Passage)', x: 2250, y: 955, type: 'major-interchange', labelPos: 'bottom-right' },
  { id: 'fish-creek-stn', name: 'Fish Creek Provincial Park', x: 2380, y: 1035, type: 'interchange', labelPos: 'top-right' },
  { id: 'carseland-stn', name: 'Carseland Weir', x: 2590, y: 1145, type: 'central-hub', labelPos: 'top-right' },
  { id: 'shouldice-stn', name: 'Arrowwood / Shouldice', x: 2820, y: 1210, type: 'interchange', labelPos: 'bottom' },
  { id: 'cluny-stn', name: 'Cluny / Siksika', x: 3060, y: 1210, type: 'interchange', labelPos: 'bottom' },
  { id: 'bassano-stn', name: 'Bassano Dam', x: 3300, y: 1210, type: 'dam', labelPos: 'top' },
  { id: 'bow-city-stn', name: 'Bow City / Scandia', x: 3520, y: 1210, type: 'town', labelPos: 'bottom' },
  { id: 'grand-forks-stn', name: 'Grand Forks (Confluence -> South Sask)', x: 3770, y: 1210, type: 'terminal', labelPos: 'right' }
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
      { x: 1580, y: 805 },
      { x: 1470, y: 640 },
      { x: 1360, y: 480 },
      { x: 1220, y: 340 }
    ],
    title: 'Ghost River & Waiparous Wilderness Line'
  },
  'KANANASKIS RIVER': {
    palette: LINE_PALETTES.KANANASKIS,
    junctionId: 'ghost-lake-stn',
    path: [
      { x: 1580, y: 805 },
      { x: 1420, y: 970 },
      { x: 1260, y: 1170 },
      { x: 1060, y: 1430 },
      { x: 880, y: 1690 },
      { x: 750, y: 1880 }
    ],
    title: 'Kananaskis Country Valley Express'
  },
  'JUMPINGPOUND CREEK': {
    palette: LINE_PALETTES.JUMPINGPOUND,
    junctionId: 'cochrane-stn',
    path: [
      { x: 1780, y: 845 },
      { x: 1680, y: 990 },
      { x: 1570, y: 1190 }
    ],
    title: 'Jumpingpound Creek Branch'
  },
  'BIGHILL CREEK': {
    palette: LINE_PALETTES.JUMPINGPOUND,
    junctionId: 'cochrane-stn',
    path: [
      { x: 1780, y: 845 },
      { x: 1780, y: 620 }
    ],
    title: 'Bighill Creek Branch'
  },
  'NOSE CREEK': {
    palette: LINE_PALETTES.NOSE,
    junctionId: 'calgary-downtown',
    path: [
      { x: 2110, y: 925 },
      { x: 2110, y: 720 },
      { x: 2110, y: 520 },
      { x: 2110, y: 340 }
    ],
    title: 'Nose Creek Line (Airdrie / Crossfield)'
  },
  'ELBOW RIVER': {
    palette: LINE_PALETTES.ELBOW,
    junctionId: 'fort-calgary-stn',
    path: [
      { x: 2250, y: 955 },
      { x: 2020, y: 1095 },
      { x: 1810, y: 1260 },
      { x: 1600, y: 1440 },
      { x: 1390, y: 1620 }
    ],
    title: 'Elbow River Valley Line'
  },
  'FISH CREEK': {
    palette: LINE_PALETTES.FISH,
    junctionId: 'fish-creek-stn',
    path: [
      { x: 2380, y: 1035 },
      { x: 2170, y: 1180 },
      { x: 1960, y: 1300 }
    ],
    title: 'Fish Creek & Priddis Branch'
  },
  'HIGHWOOD RIVER': {
    palette: LINE_PALETTES.HIGHWOOD,
    junctionId: 'carseland-stn',
    path: [
      { x: 2590, y: 1145 },
      { x: 2420, y: 1270 },
      { x: 2250, y: 1410 },
      { x: 2100, y: 1590 },
      { x: 1900, y: 1790 },
      { x: 1650, y: 2010 }
    ],
    title: 'Highwood River Express Line'
  },
  'SHEEP RIVER': {
    palette: LINE_PALETTES.SHEEP,
    junctionId: 'carseland-stn',
    path: [
      { x: 2250, y: 1410 },
      { x: 2040, y: 1490 },
      { x: 1830, y: 1590 },
      { x: 1610, y: 1690 }
    ],
    title: 'Sheep River & Turner Valley Line'
  },
  'CROWFOOT CREEK': {
    palette: LINE_PALETTES.LOWER_BOW,
    junctionId: 'cluny-stn',
    path: [
      { x: 3060, y: 1210 },
      { x: 3060, y: 940 }
    ],
    title: 'Crowfoot Creek Prairie Branch'
  },
  'WEST ARROWWOOD CREEK': {
    palette: LINE_PALETTES.LOWER_BOW,
    junctionId: 'shouldice-stn',
    path: [
      { x: 2820, y: 1210 },
      { x: 2820, y: 1490 }
    ],
    title: 'West Arrowwood Branch'
  },
  'EAST ARROWWOOD CREEK': {
    palette: LINE_PALETTES.LOWER_BOW,
    junctionId: 'shouldice-stn',
    path: [
      { x: 2820, y: 1210 },
      { x: 2940, y: 1450 }
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
  console.log('Compiling anti-collision layout with strict directional text anchors...');

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
    let d = `M ${cfg.path[0].x} ${cfg.path[0].y}`;
    for (let i = 1; i < cfg.path.length; i++) {
      d += ` L ${cfg.path[i].x} ${cfg.path[i].y}`;
    }

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

    // Sort creeks by Strahler Order descending
    branchCreeks.sort((a, b) => b.strahlerOrder - a.strahlerOrder);

    const count = branchCreeks.length;
    branchCreeks.forEach((creek, idx) => {
      // Avoid junction buffer zone: t spans from 0.18 to 0.94
      const t = 0.18 + (idx / Math.max(1, count)) * 0.76;
      const pos = interpolatePolyline(cfg.path, t);

      // Alternate spur direction cleanly (perpendicular +/- 90)
      const sign = idx % 2 === 0 ? 1 : -1;
      const spurAngleRad = ((pos.angleDeg + 90 * sign) * Math.PI) / 180;
      
      // Staggered two-lane offset (Rule 3)
      const isMajorCreek = creek.strahlerOrder >= 4;
      const laneOffset = (idx % 4 < 2) ? 32 : 64;
      const spurLength = isMajorCreek ? (laneOffset + 8) : laneOffset;

      const endX = Math.round(pos.x + Math.cos(spurAngleRad) * spurLength);
      const endY = Math.round(pos.y + Math.sin(spurAngleRad) * spurLength);

      // Strict Directional Text Anchor (Rule 1)
      const isLeft = endX < pos.x - 2;
      const labelAnchor = isLeft ? 'end' : 'start';
      const labelOffsetX = isLeft ? -9 : 9;
      const labelOffsetY = 3.5;

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
        labelAnchor,
        labelOffsetX,
        labelOffsetY,
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
    const t = 0.58 + (idx / Math.max(1, unassigned.length)) * 0.38;
    const pos = interpolatePolyline(TRUNK_STATIONS, t);
    const sign = idx % 2 === 0 ? -1 : 1;
    const laneOffset = (idx % 4 < 2) ? 35 : 65;
    const endX = pos.x;
    const endY = pos.y + sign * laneOffset;

    const labelAnchor = 'middle';
    const labelOffsetX = 0;
    const labelOffsetY = sign > 0 ? 16 : -10;

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
      labelAnchor,
      labelOffsetX,
      labelOffsetY,
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

  console.log(`Generated anti-collision schematic map with ${layout.stations.length} stations!`);
}

main();
