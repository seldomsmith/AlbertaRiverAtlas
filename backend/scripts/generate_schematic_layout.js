const fs = require('fs');
const path = require('path');

const topology = require('../data/bow_basin_topology.json');

// Configuration for subway schematic canvas
const WIDTH = 3400;
const HEIGHT = 2000;

// Transit Line Color Palette (Harry Beck style)
const LINE_COLORS = {
  'BOW_TRUNK': { id: 'bow-trunk', name: 'Bow River Trunk Line', color: '#1D4ED8', lightColor: '#93C5FD', bg: '#EFF6FF', text: '#1E3A8A' },
  'PIPESTONE_LINE': { id: 'pipestone-line', name: 'Pipestone & Upper Bow Line', color: '#0284C7', lightColor: '#BAE6FD', bg: '#F0F9FF', text: '#0369A1' },
  'CASCADE_LINE': { id: 'cascade-line', name: 'Cascade & Minnewanka Line', color: '#6366F1', lightColor: '#C7D2FE', bg: '#EEF2FF', text: '#4338CA' },
  'SPRAY_LINE': { id: 'spray-line', name: 'Spray Valley Line', color: '#0D9488', lightColor: '#99F6E4', bg: '#F0FDFA', text: '#0F766E' },
  'GHOST_LINE': { id: 'ghost-line', name: 'Ghost Wilderness Line', color: '#9333EA', lightColor: '#E9D5FF', bg: '#FAF5FF', text: '#7E22CE' },
  'KANANASKIS_LINE': { id: 'kananaskis-line', name: 'Kananaskis Country Line', color: '#059669', lightColor: '#A7F3D0', bg: '#ECFDF5', text: '#047857' },
  'JUMPINGPOUND_LINE': { id: 'jumpingpound-line', name: 'Jumpingpound & Bighill Line', color: '#D97706', lightColor: '#FDE68A', bg: '#FFFBEB', text: '#B45309' },
  'ELBOW_LINE': { id: 'elbow-line', name: 'Elbow River Line', color: '#0891B2', lightColor: '#A5F3FC', bg: '#ECFEFF', text: '#0E7490' },
  'NOSE_LINE': { id: 'nose-line', name: 'Nose Creek Line', color: '#8B5CF6', lightColor: '#DDD6FE', bg: '#F5F3FF', text: '#6D28D9' },
  'FISH_LINE': { id: 'fish-line', name: 'Fish Creek Line', color: '#65A30D', lightColor: '#D9F99D', bg: '#F7FEE7', text: '#4D7C0F' },
  'HIGHWOOD_LINE': { id: 'highwood-line', name: 'Highwood River Line', color: '#DC2626', lightColor: '#FECACA', bg: '#FEF2F2', text: '#B91C1C' },
  'SHEEP_LINE': { id: 'sheep-line', name: 'Sheep River Line', color: '#E11D48', lightColor: '#FECDD3', bg: '#FFF1F2', text: '#BE123C' },
  'LOWER_BOW_LINE': { id: 'lower-bow-line', name: 'Lower Bow Prairie Line', color: '#EA580C', lightColor: '#FED7AA', bg: '#FFF7ED', text: '#C2410C' }
};

// Bow River Trunk corridor station positions (Harry Beck octilinear routing)
const TRUNK_STATIONS = [
  { id: 'bow-glacier', name: 'Bow Glacier (Source)', x: 180, y: 400, type: 'headwater', branch: 'BOW_TRUNK' },
  { id: 'bow-lake', name: 'Bow Lake', x: 280, y: 400, type: 'lake', branch: 'BOW_TRUNK' },
  { id: 'lake-louise', name: 'Lake Louise', x: 440, y: 400, type: 'interchange', branch: 'BOW_TRUNK', labelPos: 'bottom' },
  { id: 'castle-junction', name: 'Castle Junction', x: 600, y: 480, type: 'interchange', branch: 'BOW_TRUNK', labelPos: 'bottom-right' },
  { id: 'banff', name: 'Banff', x: 800, y: 600, type: 'major-interchange', branch: 'BOW_TRUNK', labelPos: 'top-left' },
  { id: 'canmore', name: 'Canmore', x: 980, y: 680, type: 'town', branch: 'BOW_TRUNK', labelPos: 'bottom-right' },
  { id: 'exshaw', name: 'Lac des Arcs / Exshaw', x: 1140, y: 740, type: 'town', branch: 'BOW_TRUNK', labelPos: 'bottom-right' },
  { id: 'ghost-lake', name: 'Ghost Lake / Seebe', x: 1300, y: 800, type: 'major-interchange', branch: 'BOW_TRUNK', labelPos: 'bottom-right' },
  { id: 'cochrane', name: 'Cochrane', x: 1520, y: 860, type: 'interchange', branch: 'BOW_TRUNK', labelPos: 'bottom-right' },
  { id: 'bearspaw', name: 'Bearspaw Dam', x: 1680, y: 900, type: 'dam', branch: 'BOW_TRUNK', labelPos: 'top' },
  { id: 'calgary-downtown', name: 'Calgary (Downtown / Peace Bridge)', x: 1880, y: 940, type: 'central-hub', branch: 'BOW_TRUNK', labelPos: 'top-right' },
  { id: 'fort-calgary', name: 'Fort Calgary / Harvie Passage', x: 2020, y: 970, type: 'major-interchange', branch: 'BOW_TRUNK', labelPos: 'bottom' },
  { id: 'fish-creek-park', name: 'Fish Creek Park', x: 2160, y: 1040, type: 'interchange', branch: 'BOW_TRUNK', labelPos: 'bottom-left' },
  { id: 'carseland', name: 'Carseland Weir', x: 2360, y: 1140, type: 'major-interchange', branch: 'BOW_TRUNK', labelPos: 'bottom-left' },
  { id: 'shouldice', name: 'Arrowwood / Shouldice', x: 2560, y: 1200, type: 'interchange', branch: 'BOW_TRUNK', labelPos: 'bottom' },
  { id: 'cluny', name: 'Cluny / Crowfoot', x: 2740, y: 1200, type: 'interchange', branch: 'BOW_TRUNK', labelPos: 'bottom' },
  { id: 'bassano', name: 'Bassano Dam', x: 2940, y: 1200, type: 'dam', branch: 'BOW_TRUNK', labelPos: 'top' },
  { id: 'grand-forks', name: 'Grand Forks (Terminal -> South Sask)', x: 3180, y: 1200, type: 'terminal', branch: 'BOW_TRUNK', labelPos: 'right' }
];

// Branch corridor vector configurations
const BRANCH_CONFIGS = {
  'PIPESTONE RIVER': {
    lineKey: 'PIPESTONE_LINE',
    junctionStationId: 'lake-louise',
    angleDeg: -45, // NW
    length: 320,
    title: 'Pipestone River Branch'
  },
  'CASCADE RIVER': {
    lineKey: 'CASCADE_LINE',
    junctionStationId: 'banff',
    angleDeg: -90, // North
    length: 380,
    title: 'Cascade River & Lake Minnewanka Branch'
  },
  'SPRAY RIVER': {
    lineKey: 'SPRAY_LINE',
    junctionStationId: 'banff',
    angleDeg: 135, // South-West
    length: 440,
    title: 'Spray River Valley Branch'
  },
  'GHOST RIVER': {
    lineKey: 'GHOST_LINE',
    junctionStationId: 'ghost-lake',
    angleDeg: -45, // North-West into Ghost Wilderness
    length: 460,
    title: 'Ghost River & Waiparous Branch'
  },
  'KANANASKIS RIVER': {
    lineKey: 'KANANASKIS_LINE',
    junctionStationId: 'ghost-lake',
    angleDeg: 135, // South-West into K-Country
    length: 520,
    title: 'Kananaskis Country Valley Branch'
  },
  'JUMPINGPOUND CREEK': {
    lineKey: 'JUMPINGPOUND_LINE',
    junctionStationId: 'cochrane',
    angleDeg: 135, // South-West
    length: 340,
    title: 'Jumpingpound Creek Branch'
  },
  'BIGHILL CREEK': {
    lineKey: 'JUMPINGPOUND_LINE',
    junctionStationId: 'cochrane',
    angleDeg: -90, // North
    length: 240,
    title: 'Bighill Creek Branch'
  },
  'NOSE CREEK': {
    lineKey: 'NOSE_LINE',
    junctionStationId: 'calgary-downtown',
    angleDeg: -90, // North through Airdrie
    length: 360,
    title: 'Nose Creek & West Nose Branch'
  },
  'ELBOW RIVER': {
    lineKey: 'ELBOW_LINE',
    junctionStationId: 'fort-calgary',
    angleDeg: 150, // South-West toward Bragg Creek & Elbow Falls
    length: 560,
    title: 'Elbow River Valley Line'
  },
  'FISH CREEK': {
    lineKey: 'FISH_LINE',
    junctionStationId: 'fish-creek-park',
    angleDeg: 180, // West
    length: 380,
    title: 'Fish Creek & Priddis Branch'
  },
  'HIGHWOOD RIVER': {
    lineKey: 'HIGHWOOD_LINE',
    junctionStationId: 'carseland',
    angleDeg: 150, // South-West towards High River & K-Pass
    length: 620,
    title: 'Highwood River Express Line'
  },
  'SHEEP RIVER': {
    lineKey: 'SHEEP_LINE',
    junctionStationId: 'carseland',
    angleDeg: 165, // South-West branch from Highwood
    length: 500,
    title: 'Sheep River & Turner Valley Line'
  },
  'CROWFOOT CREEK': {
    lineKey: 'LOWER_BOW_LINE',
    junctionStationId: 'cluny',
    angleDeg: -90, // North
    length: 260,
    title: 'Crowfoot Creek Prairie Branch'
  },
  'WEST ARROWWOOD CREEK': {
    lineKey: 'LOWER_BOW_LINE',
    junctionStationId: 'shouldice',
    angleDeg: 90, // South
    length: 220,
    title: 'Arrowwood Creek Branch'
  },
  'EAST ARROWWOOD CREEK': {
    lineKey: 'LOWER_BOW_LINE',
    junctionStationId: 'shouldice',
    angleDeg: 120, // South-East
    length: 240,
    title: 'East Arrowwood Branch'
  }
};

function buildSchematicModel() {
  console.log('Generating Harry Beck subway schematic layout for Bow River Basin...');

  // 1. Station Index
  const stationsMap = new Map();
  const trunkStationsList = TRUNK_STATIONS.map((st, idx) => {
    const obj = {
      ...st,
      strahlerOrder: 9,
      sequence: idx,
      isTrunk: true,
      lineId: 'bow-trunk',
      color: LINE_COLORS.BOW_TRUNK.color
    };
    stationsMap.set(st.name.toUpperCase(), obj);
    stationsMap.set(st.id, obj);
    return obj;
  });

  // 2. Build branch corridors
  const branchCorridors = [];
  const linesMap = new Map();

  for (const [branchName, cfg] of Object.entries(BRANCH_CONFIGS)) {
    const junc = TRUNK_STATIONS.find(s => s.id === cfg.junctionStationId);
    if (!junc) continue;

    const rad = (cfg.angleDeg * Math.PI) / 180;
    const endX = Math.round(junc.x + Math.cos(rad) * cfg.length);
    const endY = Math.round(junc.y + Math.sin(rad) * cfg.length);

    const linePalette = LINE_COLORS[cfg.lineKey] || LINE_COLORS.BOW_TRUNK;

    const corridor = {
      branchName,
      lineKey: cfg.lineKey,
      lineId: linePalette.id,
      lineName: linePalette.name,
      color: linePalette.color,
      lightColor: linePalette.lightColor,
      startX: junc.x,
      startY: junc.y,
      endX,
      endY,
      junctionStationId: junc.id,
      angleDeg: cfg.angleDeg,
      length: cfg.length,
      creeks: []
    };

    branchCorridors.push(corridor);
    linesMap.set(branchName, corridor);
  }

  // 3. Attach all 272 named streams to branch corridors or trunk
  const streams = topology.streams;
  const unassigned = [];

  // Direct branch attribution lookup
  function findBranchCorridor(stream) {
    let curr = stream;
    while (curr) {
      if (BRANCH_CONFIGS[curr.name]) {
        return curr.name;
      }
      if (!curr.parentStream || curr.parentStream === 'BOW RIVER') {
        break;
      }
      const parent = streams.find(s => s.name === curr.parentStream);
      if (!parent || parent.name === curr.name) break;
      curr = parent;
    }
    return null;
  }

  const allStations = [...trunkStationsList];
  const feederLines = [];

  for (const stream of streams) {
    if (stream.name === 'BOW RIVER') continue;

    const branchName = findBranchCorridor(stream);
    const corridor = branchName ? linesMap.get(branchName) : null;

    if (corridor) {
      corridor.creeks.push(stream);
    } else {
      unassigned.push(stream);
    }
  }

  console.log(`Assigned streams to branch corridors. Direct branch matches: ${streams.length - unassigned.length}, Unassigned to sub-corridors: ${unassigned.length}`);

  // Lay out creek stations along each branch corridor
  for (const corridor of branchCorridors) {
    const creeks = corridor.creeks;
    const count = creeks.length;
    if (count === 0) continue;

    // Distribute creeks evenly along the corridor line
    creeks.forEach((creek, idx) => {
      const t = (idx + 1) / (count + 1);
      const cx = Math.round(corridor.startX + (corridor.endX - corridor.startX) * t);
      const cy = Math.round(corridor.startY + (corridor.endY - corridor.startY) * t);

      // Spur tick angle (perpendicular to corridor: angle +/- 90)
      const spurSign = idx % 2 === 0 ? 1 : -1;
      const spurAngleRad = ((corridor.angleDeg + 90 * spurSign) * Math.PI) / 180;
      const spurLength = 35 + (creek.strahlerOrder || 2) * 10;
      const spurEndX = Math.round(cx + Math.cos(spurAngleRad) * spurLength);
      const spurEndY = Math.round(cy + Math.sin(spurAngleRad) * spurLength);

      const stationObj = {
        id: `st-${creek.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: creek.commonName || creek.name,
        officialName: creek.name,
        strahlerOrder: creek.strahlerOrder,
        tier: creek.tier,
        huc8: creek.huc8,
        parentStream: creek.parentStream,
        lineId: corridor.lineId,
        lineName: corridor.lineName,
        color: corridor.color,
        branchName: corridor.branchName,
        x: spurEndX,
        y: spurEndY,
        confluenceX: cx,
        confluenceY: cy,
        type: creek.tier >= 30 ? 'branch-junction' : 'creek-stop',
        isTrunk: false
      };

      allStations.push(stationObj);
      stationsMap.set(creek.name.toUpperCase(), stationObj);
      stationsMap.set(stationObj.id, stationObj);

      // Add feeder spur line segment
      feederLines.push({
        id: `feeder-${stationObj.id}`,
        fromX: cx,
        fromY: cy,
        toX: spurEndX,
        toY: spurEndY,
        streamName: creek.name,
        parentName: creek.parentStream,
        color: corridor.color,
        order: creek.strahlerOrder
      });
    });
  }

  // Handle remaining unassigned prairie / trunk creeks by placing them on Bow trunk ticks
  if (unassigned.length > 0) {
    unassigned.forEach((creek, idx) => {
      // Find closest trunk station by longitude
      let closestTrunk = TRUNK_STATIONS[0];
      let minLonDiff = Infinity;
      for (const ts of TRUNK_STATIONS) {
        // Approximate lon mapping
        const diff = Math.abs((creek.center ? creek.center[0] : -114.0) - (ts.x / 3000 * -5 - 111));
        if (diff < minLonDiff) {
          minLonDiff = diff;
          closestTrunk = ts;
        }
      }

      const spurY = closestTrunk.y + (idx % 2 === 0 ? -50 : 50);
      const spurX = closestTrunk.x + ((idx % 3) - 1) * 25;

      const stationObj = {
        id: `st-${creek.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: creek.commonName || creek.name,
        officialName: creek.name,
        strahlerOrder: creek.strahlerOrder,
        tier: creek.tier,
        huc8: creek.huc8,
        parentStream: 'BOW RIVER',
        lineId: 'bow-trunk',
        lineName: 'Bow River Trunk Line',
        color: LINE_COLORS.BOW_TRUNK.color,
        branchName: 'BOW RIVER',
        x: spurX,
        y: spurY,
        confluenceX: closestTrunk.x,
        confluenceY: closestTrunk.y,
        type: 'creek-stop',
        isTrunk: false
      };

      allStations.push(stationObj);
      stationsMap.set(creek.name.toUpperCase(), stationObj);
      stationsMap.set(stationObj.id, stationObj);

      feederLines.push({
        id: `feeder-${stationObj.id}`,
        fromX: closestTrunk.x,
        fromY: closestTrunk.y,
        toX: spurX,
        toY: spurY,
        streamName: creek.name,
        parentName: 'BOW RIVER',
        color: LINE_COLORS.BOW_TRUNK.color,
        order: creek.strahlerOrder
      });
    });
  }

  // Build Trunk Path SVG definition
  let trunkPathD = `M ${TRUNK_STATIONS[0].x} ${TRUNK_STATIONS[0].y}`;
  for (let i = 1; i < TRUNK_STATIONS.length; i++) {
    const prev = TRUNK_STATIONS[i - 1];
    const curr = TRUNK_STATIONS[i];
    // Check if 45 deg or straight
    trunkPathD += ` L ${curr.x} ${curr.y}`;
  }

  // Build Branch Paths SVG definitions
  const branchPaths = branchCorridors.map(bc => ({
    branchName: bc.branchName,
    lineId: bc.lineId,
    lineName: bc.lineName,
    color: bc.color,
    d: `M ${bc.startX} ${bc.startY} L ${bc.endX} ${bc.endY}`
  }));

  const schematic = {
    title: "Bow River Basin Transit Map (Harry Beck Schematic)",
    dimensions: { width: WIDTH, height: HEIGHT },
    lines: Object.values(LINE_COLORS),
    trunkPath: {
      lineId: 'bow-trunk',
      color: LINE_COLORS.BOW_TRUNK.color,
      width: 14,
      d: trunkPathD
    },
    branchPaths,
    feederLines,
    stations: allStations,
    totalStations: allStations.length,
    totalStreams: topology.totalStreams,
    majorBranches: topology.majorBranches
  };

  return schematic;
}

function main() {
  const schematic = buildSchematicModel();

  const outBackend = path.join(__dirname, '..', 'data', 'bow_basin_schematic_map.json');
  fs.writeFileSync(outBackend, JSON.stringify(schematic, null, 2), 'utf8');

  const outFrontend = path.join(__dirname, '..', '..', 'frontend', 'src', 'data', 'bow_basin_schematic_map.json');
  fs.writeFileSync(outFrontend, JSON.stringify(schematic, null, 2), 'utf8');

  console.log(`Generated schematic map JSON with ${schematic.stations.length} stations!`);
  console.log(`Backend written: ${outBackend}`);
  console.log(`Frontend written: ${outFrontend}`);
}

main();
