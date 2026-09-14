# Lessons Learned

## Hydrology Data Sourcing
- Alberta Government FWMIS MapServer endpoint (`https://geospatial.alberta.ca/titan/rest/services/fisheries/fwmis_hydrography/MapServer/0`) provides clean hydrographic arcs with official names, HUC_8 drainage codes, and pre-calculated Strahler orders (`STR_ORDER`).
- Bow River Basin (HUC 0402*) contains ~276 named rivers and creeks, mirroring the scale of standard metropolitan transit systems (e.g., London Underground's 272 stations).

## Topology & Graph Construction
- Pure spatial nearest-neighbor search without directional hierarchy introduces reciprocal edge cycles between adjacent tributary creeks.
- Enforcing monotonic tier/Strahler hierarchy (`candidate.tier > s.tier`) guarantees a strict directed acyclic graph (DAG) where 100% of creeks resolve downstream to regional collectors and the primary Bow River trunk.

## Environment Constraints
- Local Node runtime is accessible via Playwright binary path (`C:\Users\matdow\AppData\Local\ms-playwright-go\1.57.0\node.exe`).
- Overpass API instances can experience timeout spikes on large province-wide bounding queries; official provincial GIS REST APIs are significantly faster and more structured.
