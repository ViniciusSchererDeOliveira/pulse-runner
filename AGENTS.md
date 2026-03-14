# Pulse Runner AGENTS File

## Codebase Analysis

### Core Architecture: Multi-Agent Flow and ESM/TypeScript Structure

The Pulse Runner codebase implements a sophisticated multi-agent architecture centered around two primary AI systems:

**Maestro Agent**: Tactical decision-making AI responsible for:

- Calculating tactical scores based on combat situations
- Generating tool calls representing player actions (attack, move, loot, hack, etc.)

**Narrator Agent**: Descriptive AI responsible for:

- Generating immersive, context-aware narrative descriptions of game events
- Creating flavor text that enhances player experience based on combat outcomes
- Providing atmospheric storytelling that responds to player actions and environmental factors

**Technical Implementation**:

- **ESM/TypeScript Foundation**: The project uses ES modules (`"type": "module"` in package.json) with TypeScript for type safety
- **Path Aliases**: Clean import system using `@engine/*`, `@ai/*`, `@app-types/*`, `@constants/*`, etc. for maintainable code organization
- **SOLID Principles**:
  - Single Responsibility: Each module has one clear purpose (e.g., attack.resolver.ts handles only combat calculations)
  - Dependency Inversion: High-level modules depend on abstractions (interfaces) rather than concrete implementations
  - Open/Closed: Systems are extensible without modification (e.g., new weapon types can be added without changing core combat logic)
- **Modular Organization**:
  - `/src/types`: Centralized type definitions with clear interfaces
  - `/src/constants`: Game constants and configuration values
  - `/src/engine`: Separated concern modules (combat, core, AI, interaction, movement)
  - Colocated tests: Test files alongside implementation for easy maintenance

### Combat Logic: Sequential Tier-based Mechanics and Two-Step Hit Resolution

The combat system implements a sophisticated tier-based mechanics model with layered resolution steps:

**Tier System Foundation**:

- **Damage Levels**: LIGHT(1) → MEDIUM(2) → HEAVY(3) → ABSOLUTE(4) → DEVASTATING(5)
- **Protection Levels**: NONE(0) → LIGHT(1) → MEDIUM(2) → HEAVY(3) → ABSOLUTE(4)
- **Damage Types**: PHYSICAL, ENERGY, THERMAL, HACK, BEYOND (must match protection type for effectiveness)
- **Weapon Ranges**: MELEE, SHORT, MEDIUM, LONG (affects damage based on room ideal ranges)

**Two-Step Hit Resolution Process**:

1. **Global Hit Check**:
   - Roll against hitChance (accuracy modified by O2 percentage)
   - Determines if attack connects at all (miss if roll ≥ hitChance)
2. **Precision Hit Check** (only if Global Hit succeeds):
   - Roll against same hitChance
   - Determines if attack hits targeted body part (precision hit if roll < hitChance)
3. **Fallback/Ricochet** (if Global succeeds but Precision fails):
   - Hits random body part (excluding targeted part)
   - Represents glancing blows or deflection

**Damage Resolution Pipeline**:

1. **Calculate Effective Damage Tier**:
   - Base damage tier from weapon damage level
   - +1 tier if weapon range matches room ideal ranges
   - -1 tier if damage type matches protection type
   - Clamped between 0-5 tiers

2. **Barrier Resolution Sequence**:
   - **Environmental Cover**:
     - If damage tier > cover tier: Cover destroyed, damage reduced by cover tier
     - If damage tier = cover tier: Cover degrades, damage stopped
     - If damage tier < cover tier: No effect on cover
   - **Personal Armor** (only if damage remains after cover):
     - Same logic as cover protection applied to armor
3. **Target Impact**:
   - Remaining damage tier applied to target health:
     - 0 tiers: No effect
     - 1 tier: INTACT → DAMAGED, DAMAGED → DESTROYED
     - 2+ tiers: Instant DESTROYED regardless of current state
   - **Anatomy System** (for Shell targets):
     - Vital parts (head/torso): INTACT → DAMAGED → DESTROYED
     - Limbs: INTACT → DAMAGED → SEVERED
     - Specific body part tracking for detailed damage reporting
     - **Subjective Narrative Statuses**: Mechanically, SEVERED, DESTROYED, and DEACTIVATED are treated identically (body part is non-functional at 0 HP). The specific term used is determined dynamically by the AI (Maestro/Narrator) based on context: blades cause SEVERED, lasers/thermal cause DESTROYED, hacks cause DEACTIVATED.

**O2 Integration**:

- Hit chance calculation: `Math.ceil((tacticalScore + currentO2Percentage) / 2)`
- Hit chance derives entirely from player's tactical choices (tacticalScore) and physical state (O2 percentage). There is no weapon accuracy stat.
- Lower O2 significantly reduces hit chance, creating tactical oxygen management gameplay
- O2 depletion occurs per turn and per action taken

**Word Budget Constraint**:

- `word_budget_per_turn` is a constraint placed exclusively on the **Player's natural language input limit**. It exists to simulate cognitive load and time urgency for the human player in a hardcore environment, capping how much they can "do" or "describe" in a single turn.
- This is NOT a constraint on the Maestro AI's generation - the AI can generate as many tokens as needed to provide optimal tactical recommendations.

### State Management: Immutability and O2 Depletion Handling

The state management system ensures predictable, testable gameplay through rigorous immutability patterns and resource management:

**Immutability Pattern**:

- **structuredClone Deep Copy**: All state modifications work on cloned snapshots
- **Before/After Snapshots**: Each turn maintains `state_before` and `state_after` for complete audit trail
- **Pure Functions**: Combat and resolution functions accept inputs and return outputs without mutating originals
- **Selective Updates**: Only specific state properties are modified in clones (e.g., target health, cover durability)

**O2 Depletion System**:

- **Dual Depletion Mechanism**:
  - Base depletion: Constant O2 loss per turn (O2_DEPLETION_CONSTANTS.BASE_DEPLETION_PER_TURN = 2)
  - Action depletion: Additional loss per action taken (O2_DEPLETION_CONSTANTS.ACTION_DEPLETION = 1)
- **Formula**: `Final O2 = Current O2 - (BASE_DEPLETION + (actions × ACTION_DEPLETION))`
- **O2 Leak Damage Over Time**: Shells with `is_oxygen_leaking = true` lose additional 1% O2 per turn
- **Clamping**: O2 percentage never goes below 0% or above maximum capacity

**Turn State Architecture**:

- **GameState**: Contains run ID, turn history, and current snapshot (active shell, current room, entities in cover)
- **TurnState**: Complete turn record with:
  - `state_before`: Immutable snapshot pre-turn
  - `state_after`: Modified snapshot post-turn
  - `turn_metrics`: Tactical score, word usage, hit results with detailed body part data
  - `timeline`: Chronological event log with role-based entries (PLAYER, ENEMY_NPC, MAESTRO_MODEL, etc.)
- **Deterministic Testing**: Mockable random number generation enables precise combat outcome testing

**Resource Management**:

- Credits system for economic progression
- Inventory limits (backpack slots, equipped gear)
- Consumable item usage tracking
- Equipment durability and modification systems

This architecture creates a deeply tactical combat system where resource management (especially O2) is as crucial as weapon selection and positioning, with clear separation between decision-making (Maestro), narration (Narrator), and core game mechanics.
