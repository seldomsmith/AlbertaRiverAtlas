# Task List: Alberta River Schematic Atlas (Pilot: Bow River Basin)

## Phase 1: Data Pipeline & Hydrology Ingestion (Completed)
- [x] 1.1 Ingest official Bow River Basin hydrographic arcs from Alberta EPA / FWMIS GIS MapServer.
- [x] 1.2 Build strict acyclic topological tree parser (272 streams, 0 cycles, 100% DAG reachability).
- [x] 1.3 Export clean topology JSON schema (`backend/data/bow_basin_topology.json`).

## Phase 2: Waterways of America Schematic Layout (Completed)
- [x] 2.1 Route 13 distinct transit lines across a spacious 2D regional grid (Upper Bow, Ghost, Kananaskis, Elbow, Sheep/Highwood, Prairies).
- [x] 2.2 Add stylized geometric waterbodies (Bow Lake, Lake Louise, Lake Minnewanka, Spray Lakes, Kananaskis Lakes, Ghost Lake, Glenmore Reservoir, Lake Newell).
- [x] 2.3 Implement anti-collision geometric rules:
  - Directional text anchors (left-branching text points away with `text-anchor: end`).
  - Two-lane staggered feathering (alternating `32px` / `64px` spur lengths).
  - SVG vector text knockout halos (`paint-order: stroke fill; stroke-width: 4px`).
- [x] 2.4 Add ecoregion background shading (Rocky Mountains, Foothills, Grassland Prairies).

## Phase 3: Interactive Visualizer & Transit UI (Completed)
- [x] 3.1 Build interactive React SVG canvas with smooth pan, zoom, reset, and line filtering.
- [x] 3.2 Add instant search autocomplete across all 272 rivers and creeks.
- [x] 3.3 Add illuminated "Drainage Transit Journey" path tracer from alpine creeks to Hudson Bay.
- [x] 3.4 Integrate dual-mode switcher in `App.jsx` (Subway Schematic vs Classic Geographic Map).

## Phase 4: Future Basin Expansions (Next Phase)
- [ ] 4.1 Expand extraction pipeline to North Saskatchewan River Basin (HUC 05G*).
- [ ] 4.2 Expand extraction pipeline to Red Deer River Basin (HUC 05C*).
- [ ] 4.3 Expand extraction pipeline to Oldman River Basin (HUC 05A*).
- [ ] 4.4 Expand extraction pipeline to Athabasca & Peace River Basins (Arctic drainage).
