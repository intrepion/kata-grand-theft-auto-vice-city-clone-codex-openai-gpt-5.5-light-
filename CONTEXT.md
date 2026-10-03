# Vice City Homage

This context defines the shared game-design language for an original browser-based open-world crime sandbox inspired by the feel of Grand Theft Auto: Vice City. It keeps the team precise about what the clone preserves, what it renames, and where the first playable slice begins and ends.

## Language

**Homage**:
An original work that preserves the broad design grammar of a source, such as coastal neon crime fantasy, third-person traversal, vehicles, police heat, and mission play, without copying protected characters, map layouts, missions, music, logos, or writing.
_Avoid_: Direct copy, remake, Vice City content

**Neon District**:
The first dense playable area: several connected blocks with roads, intersections, alleys, landmarks, a safehouse, vehicles, pedestrians, traffic, mission markers, and police response.
_Avoid_: Full city, map, level

**Open-World Crime Sandbox**:
A playable loop where the player can move through a city on foot, enter and drive vehicles, trigger missions, cause police heat, escape pressure, and return to a safe location.
_Avoid_: Driving toy, action level, tech demo

**Mission Slice**:
A short, complete objective chain that starts from a city marker, requires traversal and vehicle use, can create police pressure, and resolves with a clear success or failure state.
_Avoid_: Quest, task, script

**Heat**:
The player's current police pressure, caused by illegal or disruptive actions and reduced by escaping pursuit or reaching a safe state.
_Avoid_: Wanted level, aggro, alert

**Safehouse**:
A player-owned refuge that anchors free roam, mission recovery, and progression state within the city.
_Avoid_: Base, home, checkpoint

**Vehicle Claim**:
The act of taking control of an available vehicle in the world, including parked or traffic vehicles, without yet modeling a broader combat or weapon system.
_Avoid_: Carjacking, theft mechanic, pickup

**City Life**:
The ambient systems that make the Neon District feel inhabited, including traffic, pedestrians, reactive police, radio mood, signage, and landmark memory.
_Avoid_: Background decoration, ambience

**Arcade Handling**:
Vehicle motion that favors immediate steering, readable sliding, survivable collisions, and quick recovery over simulation accuracy.
_Avoid_: Sim handling, realistic driving model

**Physical Consequence**:
A visible gameplay response to movement and driving choices, such as collision, curb impact, loss of speed, pursuit pressure, or route disruption.
_Avoid_: Realism, physics detail

**Player Control Contract**:
The minimum feel promise for controlling the character and vehicles: third-person keyboard and mouse movement, camera orbit, sprinting, entering and exiting vehicles, and responsive driving.
_Avoid_: Controls, input scheme

**Delivery Run**:
The first Mission Slice shape: leave the Safehouse, claim a vehicle, collect a package from a hotel alley, draw Heat, deliver to the docks, escape police pressure, and return safe.
_Avoid_: Tutorial mission, fetch quest

**Soft Reset**:
A failure response that returns the player to the Safehouse and clears current mission progress without ending the broader sandbox session.
_Avoid_: Game over, respawn, restart

**Evidence Route**:
The repeatable proof path used to verify a playable slice: load the game, walk, enter a vehicle, drive, start the mission, trigger Heat, complete delivery, return to the Safehouse, and confirm the browser console is clean.
_Avoid_: Smoke test, demo path

**Vertical Slice**:
A small, independently verified increment that adds one real gameplay capability through the browser rather than only adding isolated code or assets.
_Avoid_: Phase, milestone, task batch

**Neon Noir**:
The visual identity for the Homage: low-poly pastel architecture, palm silhouettes, wet roads, bright signage, and dusk or night lighting focused on readability over realism.
_Avoid_: Realistic Miami, retro skin, vaporwave

**Pursuit**:
A Heat response where nearby patrol vehicles chase the player using proximity and line of sight until the player escapes by distance or time out of sight.
_Avoid_: Combat encounter, police battle

**Direct Launch**:
The packaged browser experience that can run from a double-clicked local file URL as well as from the development server.
_Avoid_: Static export, offline mode

**Slice Evidence**:
The checks required before a Vertical Slice is accepted: automated checks, a browser interaction test for the capability introduced, and a pushed commit.
_Avoid_: Done, tested, validated
