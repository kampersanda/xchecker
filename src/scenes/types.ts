export interface PlaySettings {
    bcSize: number;
    alphSize: number;
}

export type SceneUpdate =
    | { type: "none" }
    | { type: "start-play"; settings: PlaySettings }
    | { type: "back-to-select" };

export interface SceneController {
    setup(): void;
    update(delta: number): SceneUpdate;
    destroy(): void;
}

export const RUNNING_UPDATE: SceneUpdate = { type: "none" };
