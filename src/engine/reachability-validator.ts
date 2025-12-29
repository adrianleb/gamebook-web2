/**
 * Reachability Validator
 *
 * Performs static graph analysis to detect unreachable scenes.
 * Uses breadth-first traversal from the starting scene to find all
 * scenes that cannot be reached through any path.
 *
 * Per agent-e recommendation: Separate class for testability and reuse.
 * Phase 1: Static graph analysis (ignores conditions).
 * Phase 2 (future): Conditional reachability considering stats/flags.
 */

import type {
  GameManifest,
  SceneData,
  SceneId,
  UnreachableScene,
} from './types.js';

/**
 * Reachability analysis result.
 */
export interface ReachabilityResult {
  /**
   * Total number of scenes in the manifest.
   */
  totalScenes: number;

  /**
   * Number of scenes reachable from the starting scene.
   */
  reachableScenes: number;

  /**
   * List of unreachable scenes with reasons.
   */
  unreachableScenes: UnreachableScene[];

  /**
   * Whether all scenes are reachable.
   */
  valid: boolean;
}

/**
 * Scene graph traversal options.
 */
export interface TraversalOptions {
  /**
   * Maximum depth to traverse (prevents infinite loops).
   * Default: 1000 scenes deep.
   */
  maxDepth?: number;

  /**
   * Whether to include goto effects in traversal.
   * Default: true.
   */
  followGotoEffects?: boolean;
}

/**
 * Reachability validator for static graph analysis.
 *
 * This class performs reachability analysis without evaluating conditions
 * (static analysis). It detects:
 * - Orphan scenes (no incoming links)
 * - Scenes disconnected from the starting scene
 *
 * Future enhancement: Add conditional reachability that evaluates
 * conditions to detect scenes only reachable through specific paths.
 */
export class ReachabilityValidator {
  private readonly DEFAULT_MAX_DEPTH = 1000;

  /**
   * Perform reachability analysis on the manifest.
   *
   * @param manifest - Game manifest to analyze
   * @param scenes - Map of scene ID to scene data (for traversing choices and effects)
   * @param options - Traversal options
   * @returns Reachability analysis result
   */
  analyze(
    manifest: GameManifest,
    scenes: Map<SceneId, SceneData>,
    options: TraversalOptions = {}
  ): ReachabilityResult {
    const maxDepth = options.maxDepth ?? this.DEFAULT_MAX_DEPTH;
    const followGotoEffects = options.followGotoEffects ?? true;

    // Early exit if no starting scene
    if (!manifest.startingScene) {
      return {
        totalScenes: Object.keys(manifest.sceneIndex).length,
        reachableScenes: 0,
        unreachableScenes: [],
        valid: false,
      };
    }

    // Get all scene IDs from manifest
    const allSceneIds = new Set(Object.keys(manifest.sceneIndex));
    const totalScenes = allSceneIds.size;

    // Find reachable scenes using BFS
    const reachableScenes = this.findReachableScenes(
      manifest,
      scenes,
      maxDepth,
      followGotoEffects
    );

    // Find unreachable scenes
    const unreachableScenes: UnreachableScene[] = [];
    for (const sceneId of allSceneIds) {
      if (!reachableScenes.has(sceneId)) {
        const scene = scenes.get(sceneId);
        unreachableScenes.push({
          sceneId,
          reason: this.determineUnreachabilityReason(sceneId, scenes, reachableScenes),
        });
      }
    }

    return {
      totalScenes,
      reachableScenes: reachableScenes.size,
      unreachableScenes,
      valid: unreachableScenes.length === 0,
    };
  }

  /**
   * Find all scenes reachable from the starting scene using BFS.
   *
   * @param manifest - Game manifest
   * @param scenes - Map of scene data
   * @param maxDepth - Maximum traversal depth
   * @param followGotoEffects - Whether to follow goto effects
   * @returns Set of reachable scene IDs
   */
  private findReachableScenes(
    manifest: GameManifest,
    scenes: Map<SceneId, SceneData>,
    maxDepth: number,
    followGotoEffects: boolean
  ): Set<SceneId> {
    const reachable = new Set<SceneId>();
    const visitedWithDepth = new Map<SceneId, number>();
    const queue: Array<{ sceneId: SceneId; depth: number }> = [];

    // Start from the beginning
    queue.push({ sceneId: manifest.startingScene, depth: 0 });
    visitedWithDepth.set(manifest.startingScene, 0);

    while (queue.length > 0) {
      const { sceneId, depth } = queue.shift()!;

      // Check depth limit to prevent infinite loops
      if (depth >= maxDepth) {
        continue;
      }

      // Mark as reachable
      reachable.add(sceneId);

      // Get neighbors (scenes linked from this scene)
      const neighbors = this.getNeighborScenes(sceneId, scenes, followGotoEffects);

      for (const neighborId of neighbors) {
        const previousDepth = visitedWithDepth.get(neighborId);
        const newDepth = depth + 1;

        // Add to queue if not visited or found a shorter path
        if (previousDepth === undefined || newDepth < previousDepth) {
          visitedWithDepth.set(neighborId, newDepth);
          queue.push({ sceneId: neighborId, depth: newDepth });
        }
      }
    }

    return reachable;
  }

  /**
   * Get all scenes directly reachable from a given scene.
   *
   * @param sceneId - Source scene ID
   * @param scenes - Map of scene data
   * @param followGotoEffects - Whether to include goto effects
   * @returns Array of neighbor scene IDs
   */
  private getNeighborScenes(
    sceneId: SceneId,
    scenes: Map<SceneId, SceneData>,
    followGotoEffects: boolean
  ): SceneId[] {
    const scene = scenes.get(sceneId);
    if (!scene) {
      return [];
    }

    const neighbors: SceneId[] = [];

    // Add targets from choices
    for (const choice of scene.choices) {
      if (choice.to) {
        neighbors.push(choice.to);
      }
    }

    // Add targets from goto effects if enabled
    if (followGotoEffects && scene.effects) {
      for (const effect of scene.effects) {
        if (effect.type === 'goto' && effect.sceneId) {
          neighbors.push(effect.sceneId);
        }
      }
    }

    return neighbors;
  }

  /**
   * Determine why a scene is unreachable.
   *
   * @param sceneId - The unreachable scene ID
   * @param scenes - Map of scene data
   * @param reachableScenes - Set of reachable scene IDs
   * @returns Reason for unreachability
   */
  private determineUnreachabilityReason(
    sceneId: SceneId,
    scenes: Map<SceneId, SceneData>,
    reachableScenes: Set<SceneId>
  ): UnreachableScene['reason'] {
    const scene = scenes.get(sceneId);

    // Check if scene has any incoming links at all
    let hasIncomingLinks = false;
    for (const [otherSceneId, otherScene] of scenes) {
      if (otherSceneId === sceneId) continue;

      // Check choices
      for (const choice of otherScene.choices) {
        if (choice.to === sceneId) {
          hasIncomingLinks = true;
          break;
        }
      }

      if (hasIncomingLinks) break;

      // Check goto effects
      if (otherScene.effects) {
        for (const effect of otherScene.effects) {
          if (effect.type === 'goto' && effect.sceneId === sceneId) {
            hasIncomingLinks = true;
            break;
          }
        }
      }

      if (hasIncomingLinks) break;
    }

    if (!hasIncomingLinks) {
      return 'no-incoming-links';
    }

    // Scene has incoming links but is still unreachable
    // This means it's behind conditions or in a disconnected component
    return 'behind-unsatisfied-condition';
  }

  /**
   * Check for circular references in the scene graph.
   * This is informational for content authors, not an error.
   *
   * @param manifest - Game manifest
   * @param scenes - Map of scene data
   * @returns Map of scene ID to cycle length (if part of a cycle)
   */
  detectCircularReferences(
    manifest: GameManifest,
    scenes: Map<SceneId, SceneData>
  ): Map<SceneId, number> {
    const cycles = new Map<SceneId, number>();

    // Use DFS with coloring to detect cycles
    enum Color {
      White = 0,  // Unvisited
      Gray = 1,   // Visiting (in current path)
      Black = 2,  // Visited
    }

    const color = new Map<SceneId, Color>();
    const cycleLength = new Map<SceneId, number>();

    // Initialize all scenes from both manifest and scenes map
    const allScenes = new Set([...Object.keys(manifest.sceneIndex), ...scenes.keys()]);
    for (const sceneId of allScenes) {
      color.set(sceneId, Color.White);
    }

    const dfs = (sceneId: SceneId, path: SceneId[]): boolean => {
      color.set(sceneId, Color.Gray);

      const neighbors = this.getNeighborScenes(sceneId, scenes, true);

      for (const neighbor of neighbors) {
        // Skip neighbors not in our scene set
        if (!color.has(neighbor)) {
          continue;
        }

        if (color.get(neighbor) === Color.Gray) {
          // Found a cycle
          const cycleStartIndex = path.indexOf(neighbor);
          const cycleLengthValue = path.length - cycleStartIndex + 1;

          // Mark all scenes in the cycle
          for (let i = cycleStartIndex; i < path.length; i++) {
            cycles.set(path[i], cycleLengthValue);
          }
          cycles.set(neighbor, cycleLengthValue);

          return true;
        }

        if (color.get(neighbor) === Color.White) {
          if (dfs(neighbor, [...path, sceneId])) {
            return true;
          }
        }
      }

      color.set(sceneId, Color.Black);
      return false;
    };

    // Start DFS from each unvisited scene
    for (const sceneId of allScenes) {
      if (color.get(sceneId) === Color.White) {
        dfs(sceneId, []);
      }
    }

    return cycles;
  }
}

/**
 * Singleton instance for convenient use.
 */
export const reachabilityValidator = new ReachabilityValidator();
