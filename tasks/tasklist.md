# Task List: Alberta River Schematic Atlas (Pilot: Bow River Basin)

## Phase 1: Data Pipeline & Hydrology Ingestion
- [x] 1.1 Ingest official Bow River Basin hydrographic arcs and geometry from Alberta EPA / FWMIS GIS MapServer.
- [x] 1.2 Build topological tree parser to resolve upstream-downstream confluence graph (parent streams, confluence coordinates, stream orders).
- [x] 1.3 Export clean, normalized JSON schema (`bow_basin_topology.json`) with nodes (headwaters, confluences, major towns, monitoring stations) and edges (river lines with Strahler orders).

## Phase 2: Schematic / Subway Layout Generation
- [x] 2.1 Design the Bow River Trunk corridor (Bow Glacier -> Lake Louise -> Banff -> Canmore -> Cochrane -> Calgary -> Carseland -> Bassano -> Grand Forks).
- [x] 2.2 Construct octilinear branch routing engine (snapping tributaries to 45°/90° angles relative to trunk corridor).
- [x] 2.3 Implement hierarchical level-of-detail / stream order pruning (Express/Trunk vs Branch vs Creek Feeder).

## Phase 3: Interactive Visualizer & Transit Map UI
- [x] 3.1 Build interactive SVG/Canvas viewer with pan, zoom, and Beck transit map aesthetics (distinct branch line colors, interchange circles, clean label typography).
- [x] 3.2 Add stream tracing interaction (click any creek to illuminate path to South Saskatchewan / Hudson Bay).
- [x] 3.3 Add confluence and station inspection drawer (elevation profile, Strahler order, flow metadata).

## Phase 4: Verification & Extensibility
- [x] 4.1 Verify complete coverage of all 272 named Bow Basin watercourses against official registry (100% connected, 0 cycles).
- [x] 4.2 Document generalized pipeline for expanding to North Saskatchewan, Red Deer, Oldman, Athabasca, and Peace basins.
