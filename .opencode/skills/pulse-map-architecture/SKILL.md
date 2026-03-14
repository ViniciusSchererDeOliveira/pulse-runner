---
name: pulse-map-architecture
description: The strict procedural rules for PULSE_RUNNER room tree generation and movement logic. Reference this when modifying map generation, exits, or movement resolvers.
---

# PULSE_RUNNER Map Architecture Rules

1. **Tree Topology:** The map is a strict tree, NOT a grid.
2. **Main Branch:** 10 rooms from Start to Extraction. 5 rooms post-Extraction. (Total 15 rooms).
3. **Secondary Branches:**
   - Max 2 branches before extraction.
   - Max 3 branches after extraction.
   - Max depth of 3 consecutive rooms per branch.
   - No sub-branching allowed.
4. **Exit/Entrance Rule:** A room's exit direction(s) must NEVER match the direction the player used to enter the room.
5. **Types:** Always use `type` for state and parameters, never `interface`.
