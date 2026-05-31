# ExcaliburJS Editor Architecture Notes

## Session Summary

---

# Overview

The editor is a **scene-centric game editor**, but scenes are **not the primary ownership boundary**.

Instead, the editor architecture is evolving toward a model where:

- Resources are created and managed independently.
- Composition objects (Actors, ScreenElements, etc.) reference resources.
- Scenes compose entities into playable experiences.
- Editor state acts as the single source of truth.

---

# High-Level Architecture

```text
Project
│
├── Resources
│   ├── Assets
│   ├── Graphics
|   ├── Sounds
│   ├── Materials
│   └── Scripts
│
├── Composition
│   ├── Actors
│   ├── ScreenElements
│   ├── Tilemaps
│   └── Scenes
│
└── Editor State
```

---

# Editor State

Editor state should be the authoritative source of truth.

```ts
EditorState {
    project: ProjectState;
    selection: SelectionState;
    ui: UIState;
}
```

---

## Project State

Contains all project data:

```ts
ProjectState {
    scenes;
    actors;
    screenElements;
    graphics;
    materials;
    scripts;
    assets;
    tilemaps;
}
```

---

## Selection State

Selection is considered a first-class subsystem.

```ts
SelectionState {
    primarySelectionId;
    activeSceneId;
}
```

Selection affects:

- Object Tree
- Scene Editor
- Inspector
- Property Editing
- Context Menus
- Delete Operations

---

## UI State

Contains editor-only presentation state.

Examples:

```ts
UIState {
    panelLayout;
    expandedNodes;
    activeTabs;
    consoleVisible;
}
```

This state should never be exported as part of the project.

---

# Commands & State Mutation

All project mutations should occur through commands.

Avoid:

```ts
actor.name = "Player";
```

Prefer:

```ts
dispatch(new RenameObjectCommand(actorId, "Player"));
```

Benefits:

- Undo/Redo
- History
- Serialization
- Collaboration
- Macro Recording
- Deterministic State Changes

---

# Ownership vs References

One of the most important architectural distinctions.

---

## Ownership

Ownership implies lifecycle control.

Example:

```text
Player Actor
 ├── Child Actor
 ├── Child Actor
 └── Child Actor
```

Deleting the parent deletes owned children.

---

## References

References imply dependency but not ownership.

Example:

```text
Player Actor
 ├── WalkAnimation
 ├── PlayerMaterial
 └── PlayerControllerScript
```

Deleting the actor does NOT necessarily delete these resources.

---

# Resource Architecture

Resources exist independently of entities.

---

## Assets

Raw imported project data.

Examples:

```text
player.png
enemy.png
ui-frame.png
theme.mp3
```

Assets are not directly consumed by entities.

---

## Graphics

Graphics are first-class reusable resources.

Graphics are polymorphic Excalibur render objects.

Examples:

```text
Graphic
├── Sprite
├── Animation
├── Text
├── Rectangle
├── Circle
├── NineSlice
├── Canvas
└── Custom Graphic
```

Graphics can exist independently of Actors.

Examples:

```text
PlayerIdle
PlayerWalk
DialogFrame
HealthBar
```

Graphics reference Assets.

```text
Asset
    ↓
Graphic
```

---

## Materials

Reusable project resources.

Referenced by entities.

---

## Scripts

Reusable project resources.

Referenced by entities.

Potential future distinction:

```text
Project Scripts
Object Scripts
```

---

# Composition Objects

Composition objects are gameplay entities.

Examples:

```text
Actor
ScreenElement
Tilemap
```

These objects reference resources.

---

## Actor Example

```ts
Actor {
    graphicIds: [];
    materialIds: [];
    scriptIds: [];

    childActorIds: [];
}
```

Important distinction:

```text
graphicIds
materialIds
scriptIds
```

are references.

```text
childActorIds
```

represent ownership.

---

# Graphics on Entities

Entities may reference multiple graphics.

Example:

```text
Player
 ├── Idle Graphic
 ├── Walk Graphic
 └── Attack Graphic
```

Runtime state controls active graphic.

```ts
Actor {
    graphicIds: [];

    activeGraphicId;
}
```

Graphics themselves remain reusable resources.

---

# Scene Architecture

Scenes are composition containers.

Scenes do NOT own most objects.

Instead, scenes reference entities.

Example:

```ts
Scene {
    actorIds: [];
    screenElementIds: [];
    tilemapIds: [];
}
```

Relationship:

```text
Scene
    ↓
Entity
    ↓
Resource
```

---

# Resource Dependency Chain

The editor should eventually support dependency tracking.

Example:

```text
player.png
    ↓
PlayerWalkGraphic
    ↓
Player Actor
    ↓
Forest Scene
```

This enables:

- Safe Deletes
- Reference Viewers
- Dependency Auditing
- Impact Analysis

---

# Inspector Architecture

Inspector should be registry-driven.

Avoid large type-switching logic.

Example:

```ts
InspectorRegistry.register("actor", ActorInspector);

InspectorRegistry.register("graphic", GraphicInspector);
```

Future supported types:

```text
Actor
ScreenElement
Graphic
Material
Script
Scene
Tilemap
Asset
```

---

# Inspector Sections

Inspector implementations should be modular.

Example:

```text
Player Actor

[Transform]
[Graphics]
[Scripts]
[Materials]
[Children]
```

Future plugins should be able to register sections.

Example:

```ts
InspectorSectionRegistry.register("physics", PhysicsInspectorSection);
```

---

# Object Tree Considerations

The editor likely needs multiple logical views.

---

## Resource View

```text
Resources

 Assets
 Graphics
 Materials
 Scripts
```

---

## Scene/Composition View

```text
Forest Scene

 Player
 Enemy
 HUD
```

---

Avoid implying ownership where only references exist.

---

# Persistence Strategy

Two separate persistence domains.

---

## Project Persistence

Exported with project.

```text
Actors
Scenes
Graphics
Materials
Scripts
Assets
Tilemaps
```

---

## Editor Persistence

Stored locally.

Examples:

```text
Panel Layout
Expanded Tree Nodes
Active Tabs
Window Visibility
```

Store using:

```text
LocalStorage
```

or future workspace files.

---

# Proposed Resource Base Type

Potential future abstraction.

```ts
ProjectResource {
    id: string;
    name: string;
}
```

Examples:

```ts
Graphic extends ProjectResource
Material extends ProjectResource
Script extends ProjectResource
```

Benefits:

- Resource Explorer
- Search
- Reference Tracking
- Dependency Graphs
- Generic Inspectors
- Shared CRUD Operations

---

# Emerging Architectural Pattern

The architecture is trending toward:

```text
Assets
        ↓
Resources
        ↓
Composition Objects
        ↓
Scenes
```

Where:

- Assets are imported data.
- Resources define reusable functionality/rendering.
- Composition objects assemble resources.
- Scenes organize composition objects into gameplay.

This separation appears to be the foundational model for the editor moving forward.
