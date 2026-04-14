# Cinderfall First Playable Loop

Date: 2026-04-14

Status: Working design lock for graybox development

## Purpose

This report defines the first playable loop for `Cinderfall`.

It is not the final game design. It is the smallest ruleset that should still feel dramatic, readable, replayable, and worth building properly in 3D.

## Locked Working Names

These names are now the default for the graybox build:

- Project: `Cinderfall`
- Mountain: `Mount Cinder`
- Primary rolling hazard: `Ember Boulders`
- Central objective: `Heartstone`
- Escape point: `Smuggler's Dock`

These can still change later, but only if playtesting gives us a strong reason.

## Core Fantasy

Players climb a dangerous volcanic island, fight over the `Heartstone`, survive `Ember Boulders`, and scramble back to `Smuggler's Dock` before someone else escapes with the prize.

That is the emotional center of the first playable.

## First Playable Win Condition

The first player to:

1. reach the summit objective node
2. claim the `Heartstone`
3. carry it back to `Smuggler's Dock`

wins immediately.

If a carrier is hit by an `Ember Boulder` or certain player effects, the `Heartstone` is dropped on the carrier's current node.

## Board Shape For First Playable

The first board should be a tightly scoped vertical island with:

- 1 summit objective zone
- 3 main ascent routes
- 2 shortcut elements, such as a cave route and a bridge route
- 3 authored `Ember Boulder` lanes
- 1 escape route that funnels into `Smuggler's Dock`
- a small number of safe pockets for recovery and positioning

Important technical note:

This should still be implemented as a logical board graph, not a visible square grid.

## Turn Structure

Each player turn should resolve in this order:

1. Draw until hand size is `3`
2. Play `1` card from hand
3. Resolve movement from that card
4. Resolve the card's extra effect, if any
5. Resolve pickup, steal, or drop interactions
6. Resolve board-space effects
7. Resolve volcano meter and `Ember Boulder` release, if triggered
8. End turn

This keeps turns short, legible, and interactive.

## Why Cards Instead Of Pure Dice

Pure roll-and-move keeps the old-school chaos, but it does not give enough control for a modern tactics-heavy browser game.

A small card hand is the better fit because it gives players:

- movement certainty
- clutch defensive choices
- ways to punish or outplay rivals
- a reason to plan around routes and timing
- better drama than flat randomness

The card system should still stay light. This is not a deckbuilder and not a heavy strategy card battler.

## Card System Rules

The first playable should use:

- hand size `3`
- draw back to `3` at the start of each turn
- play exactly `1` card per turn
- every card grants movement
- some cards also grant a simple tactical effect

Design rule:

Every card should be readable in one glance and resolvable in a few seconds.

## Volcano Meter

To preserve table-flip drama without relying only on dice, the first playable should use a shared `Volcano Meter`.

The meter increases from:

- certain cards
- designated danger spaces
- selected board effects

When the meter fills:

- the active player chooses 1 of the 3 `Ember Boulder` lanes
- `2` `Ember Boulders` are released down that lane
- knockback and drops are resolved
- the meter resets

Why this works:

- players can see danger building
- eruptions stay dramatic
- the active player gets a meaningful decision
- hazard testing becomes easier and more deterministic

## Ember Boulder Rules

For the first playable:

- `Ember Boulders` follow authored lanes
- lanes may include branch points later, but the first graybox can keep them simple
- a hit causes knockback
- a hit on the `Heartstone` carrier causes a drop
- knocked-down players lose tempo, but are not removed from the game

This gives us the right drama without requiring full free-rolling physics from day one.

## Interaction Rules

The first playable should include only a few direct interaction types:

- steal the `Heartstone`
- shove a nearby rival
- brace against incoming hazard impact
- race through shortcuts before someone cuts you off

That is enough conflict for the first loop.

We do not need complex inventory, combat trees, status stacks, or elaborate power combos yet.

## Starter Card Set

The first playable deck should be built from a small shared card pool. These are the recommended starter card designs:

### 1. Dash

- Move `4`
- No extra effect

### 2. Trek

- Move `3`
- Draw `1`, then discard `1`

### 3. Clamber

- Move `3`
- Ignore one elevation penalty or steep-route restriction this turn

### 4. Shortcut

- Move `3`
- You may use one cave or bridge shortcut edge this turn

### 5. Brace

- Move `2`
- Gain `Guard` until your next turn

### 6. Shove

- Move `2`
- If adjacent to a rival after moving, push them `1` node

### 7. Snatch

- Move `2`
- If adjacent to the `Heartstone` carrier after moving, steal the `Heartstone`

### 8. Scramble

- Move `3`
- You may move through one occupied node this turn

### 9. Stoke

- Move `2`
- Increase the `Volcano Meter` by `2`

### 10. Risky Sprint

- Move `4`
- Increase the `Volcano Meter` by `1`

### 11. Duck

- Move `2`
- Ignore the first knockback from an `Ember Boulder` this round

### 12. Seize Ground

- Move `2`
- If you end on a danger space, it does not increase the `Volcano Meter`

## Why This Card Set Works

This first card set gives us:

- fast movement cards
- route-manipulation cards
- hazard-pressure cards
- a defensive reaction card
- direct conflict over the objective

Most importantly, every card still helps a player move. That keeps turns from feeling dead or overly mean.

## What We Are Deliberately Not Building Yet

The first playable should not include:

- character-specific powers
- multiple objectives
- treasure sub-systems
- advanced physics chaos
- online multiplayer
- large cinematic sequences
- complex AI opponents

Those can all come later if the core loop proves strong.

## What Must Feel Good In Graybox

If the first playable is working, these should already feel good before real art arrives:

- camera readability
- route choice
- summit tension
- `Heartstone` steals
- `Ember Boulder` drama
- comeback potential
- short, satisfying turns

If those are not working in graybox, more art and polish will not save the design.

## Build Recommendation

The first implementation pass should prioritize:

1. board graph and movement preview
2. card play and hand flow
3. `Volcano Meter`
4. authored `Ember Boulder` lanes
5. `Heartstone` pickup, drop, and steal logic
6. `Smuggler's Dock` win check

That is the smallest complete loop worth engineering cleanly.

## Bottom Line

`Cinderfall` should move forward with a light card-driven movement system, a shared volcano meter, and authored `Ember Boulder` hazards.

That gives us more agency than pure roll-and-move, more drama than a dry tactical race, and a much stronger foundation for a real 3D browser game.
