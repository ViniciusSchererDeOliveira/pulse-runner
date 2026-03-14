---
name: pulse-tier-combat
description: The core mathematical rules for the PULSE_RUNNER Tier-based combat system. Reference this when modifying health, armor, cover, or attack logic.
---
# PULSE_RUNNER Tier Combat System

1. **Tier Hierarchy & Natural Limits:** The game operates on a 1 to 5 tier scale: LIGHT (1), MEDIUM (2), HEAVY (3), ABSOLUTE (4), DEVASTATING (5).
    - **Protection Limits:** Only the first 3 tiers are natural (Base Stats). ABSOLUTE (4) is strictly reserved for when a HEAVY (3) protection receives a contextual +1 bonus.
    - **Damage Limits:** Only the first 4 tiers are natural (Base Stats). DEVASTATING (5) is strictly reserved for when an ABSOLUTE (4) attack receives a contextual +1 bonus.
    - **Bonus Application:** Contextual bonuses (like room range advantage or specific abilities) shift *any* base tier up by +1 step (e.g., a LIGHT armor receiving a bonus operates mechanically as a MEDIUM armor).

2. **Type-Matching Penalty (RPS Logic):** If the attack's `DamageType` exactly matches the barrier's `ProtectionType` (e.g., an ENERGY weapon hitting an ENERGY shield), the attack suffers a strict **-1 Tier regression** to its effective power. This reduction must be calculated *before* the barrier impact logic evaluates the tiers.

3. **Hit Chance Formula:** Global hit chance is derived entirely from state, NOT weapon stats. Formula: `Math.ceil((tacticalScore + currentO2Percentage) / 2)`.

4. **Sequential Barrier Impact:** A bullet's Effective Tier (after RPS penalties and Range bonuses) hits Cover first, then Armor, then Flesh.
    - If Damage Tier > Barrier Tier: Barrier is DESTROYED. Remaining tier = Damage - Barrier.
    - If Damage Tier == Barrier Tier: Barrier degrades (INTACT -> DAMAGED -> DESTROYED). Remaining tier = 0.
    - If Damage Tier < Barrier Tier: No effect.

5. **Limb Severing:** If a limb (arm/leg) receives massive residual damage (Tier 2+ remaining after all barriers), its status immediately transitions to `SEVERED`, `DESTROYED`, or `DEACTIVATED` (mechanically identical, chosen subjectively for narrative flavor).