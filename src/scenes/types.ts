/**
 * Shared type helpers for scene transitions and lifecycles.
 */
export interface PlaySettings {
    bcSize: number;
    alphSize: number;
}

/**
 * Scene update responses that drive switching between scenes.
 */
export type SceneUpdate =
    | { type: "none" }
    | { type: "start-play"; settings: PlaySettings }
    | { type: "back-to-select" };

/**
 * Contract every scene must follow so the main loop can orchestrate it.
 */
export interface SceneController {
    setup(): void;
    update(delta: number): SceneUpdate;
    destroy(): void;
}

/**
 * Sentinel update indicating the scene keeps running without transitions.
 */
export const RUNNING_UPDATE: SceneUpdate = { type: "none" };
