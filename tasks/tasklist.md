# Task List: Alberta River Schematic Atlas (Aesthetic & Layout Overhaul)

## Phase 1: Data Pipeline & Hydrology Ingestion (Completed)
- [x] 1.1 Ingest official Bow River Basin hydrographic arcs from Alberta EPA / FWMIS GIS.
- [x] 1.2 Build topological tree parser (272 streams, 0 cycles, strict DAG).
- [x] 1.3 Export clean topology JSON schema.

## Phase 2: Waterways of America Layout Overhaul
- [ ] 2.1 Re-route river corridors across a spacious 2D regional grid (Upper Bow, Ghost, Kananaskis, Elbow, Sheep/Highwood, Prairies).
- [ ] 2.2 Add stylized geometric waterbodies (Bow Lake, Lake Louise, Lake Minnewanka, Spray Lakes, Ghost Lake, Glenmore Reservoir, Lake Newell).
- [ ] 2.3 Implement hierarchical creek spacing: primary tributaries labeled along 45°/90° corridors; minor creeks as short clean ticks with zoom-dependent labels to banish clutter.
- [ ] 2.4 Add basin ecodistrict background shading (Rockies, Foothills, Grassland Prairies).

## Phase 3: Typography & Visual Polish
- [ ] 3.1 Inline river name ribbons (`— BOW RIVER —`, `— ELBOW RIVER —`, `— HIGHWOOD RIVER —`).
- [ ] 3.2 Transit interchange station discs with elevation/town markers.
- [ ] 3.3 Dynamic semantic zoom and interactive station/creek highlight.

## Phase 4: Verification & Git Deployment
- [ ] 4.1 Validate visual layout on 1080p/4K viewports without text collision.
- [ ] 4.2 Commit and push overhaul to origin/main.
