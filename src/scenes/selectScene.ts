/**
 * Implements the difficulty selection scene and transitions into the play scene.
 */
import * as PIXI from "pixi.js";

import { DifficultyLevel, DifficultyPresets, PALETTE, SELECT_DESCRIPTION, TEXT_STYLE, TITLE_FAMILY } from "../constants";
import { GameKeys } from "../input/keyboard";
import { PlaySettings, RUNNING_UPDATE, SceneController, SceneUpdate } from "./types";

/**
 * Initialization parameters for the SelectScene controller.
 */
interface SelectSceneOptions {
    app: PIXI.Application;
    keys: Pick<GameKeys, "enter" | "left" | "right">;
}

const MAIN_WIDTH = 600;
const MAIN_HEIGHT = 600;

/**
 * Scene that displays difficulty choices and descriptive text.
 */
export class SelectScene implements SceneController {
    private readonly app: PIXI.Application;
    private readonly keys: Pick<GameKeys, "enter" | "left" | "right">;

    private container?: PIXI.Container;
    private indicatorText?: PIXI.Text;
    private easyText?: PIXI.Text;
    private hardText?: PIXI.Text;

    private counter = 0;
    private difficulty = DifficultyLevel.Easy;

    /**
     * Stores references to PIXI and keyboard dependencies.
     */
    constructor(options: SelectSceneOptions) {
        this.app = options.app;
        this.keys = options.keys;
    }

    /**
     * Creates PIXI display objects for titles, buttons, and help text.
     */
    setup(): void {
        const container = new PIXI.Container();

        const frame = new PIXI.Graphics()
            .lineStyle(10, 0x000000)
            .beginFill(0xffffff)
            .drawRect(0, 0, MAIN_WIDTH, MAIN_HEIGHT)
            .endFill();
        container.addChild(frame);

        const titleText = new PIXI.Text('XCHECKER', { fontFamily: TITLE_FAMILY, fontSize: 80, stroke: PALETTE.Black, fill: PALETTE.Black, strokeThickness: 5 });
        titleText.position.set(300, 100);
        titleText.anchor.set(0.5, 0.5);
        container.addChild(titleText);

        this.easyText = new PIXI.Text('Easy', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 44, fill: PALETTE.Blue });
        this.easyText.position.set(MAIN_WIDTH / 4 + 20, 240);
        this.easyText.anchor.set(0.5, 0.5);
        container.addChild(this.easyText);

        this.hardText = new PIXI.Text('Hard', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 44, fill: PALETTE.Red });
        this.hardText.position.set(MAIN_WIDTH / 4 * 3 - 20, 240);
        this.hardText.anchor.set(0.5, 0.5);
        container.addChild(this.hardText);

        this.indicatorText = new PIXI.Text('Press Enter', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 32 });
        this.indicatorText.position.set(MAIN_WIDTH / 2, 330);
        this.indicatorText.anchor.set(0.5, 0.5);
        container.addChild(this.indicatorText);

        const descText = new PIXI.Text(SELECT_DESCRIPTION, { fontFamily: TEXT_STYLE.fontFamily, fontSize: 26, fill: PALETTE.Black, align: 'center' });
        descText.position.set(MAIN_WIDTH / 2, 400);
        descText.anchor.set(0.5, 0);
        container.addChild(descText);

        const licenseText = new PIXI.Text('Created by Kampersanda', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 26, fill: '#808080' });
        licenseText.position.set(MAIN_WIDTH / 2, 550);
        licenseText.anchor.set(0.5, 0);
        container.addChild(licenseText);

        container.pivot.set(container.width / 2, 0);
        container.position.set(this.app.renderer.width / 2, 100);

        this.container = container;
        this.counter = 0;
        this.difficulty = DifficultyLevel.Easy;
        this.app.stage.addChild(container);
        this.applyDifficultyStyles();
    }

    /**
     * Handles blinking indicators, keyboard input, and scene transitions.
     */
    update(delta: number): SceneUpdate {
        if (!this.container) {
            return RUNNING_UPDATE;
        }

        this.counter += delta;
        if (this.indicatorText && this.counter > 35) {
            this.indicatorText.visible = !this.indicatorText.visible;
            this.counter = 0;
        }

        if (this.keys.left.isDown && !this.keys.left.isProcessed) {
            this.keys.left.isProcessed = true;
            this.difficulty = DifficultyLevel.Easy;
            this.applyDifficultyStyles();
        }
        if (this.keys.right.isDown && !this.keys.right.isProcessed) {
            this.keys.right.isProcessed = true;
            this.difficulty = DifficultyLevel.Hard;
            this.applyDifficultyStyles();
        }

        if (this.keys.enter.isDown && !this.keys.enter.isProcessed) {
            this.keys.enter.isProcessed = true;
            this.container.visible = false;
            return { type: 'start-play', settings: this.currentSettings() };
        }

        return RUNNING_UPDATE;
    }

    /**
     * Removes PIXI resources allocated by the scene.
     */
    destroy(): void {
        if (!this.container) {
            return;
        }
        this.app.stage.removeChild(this.container);
        this.container.destroy({ children: true });
        this.container = undefined;
    }

    /**
     * Updates the text styling to reflect the currently highlighted difficulty.
     */
    private applyDifficultyStyles() {
        if (!this.easyText || !this.hardText) {
            return;
        }
        const isEasy = this.difficulty === DifficultyLevel.Easy;
        this.easyText.style.fill = isEasy ? PALETTE.Blue : PALETTE.Black;
        this.easyText.style.fontSize = isEasy ? 64 : 44;
        this.hardText.style.fill = isEasy ? PALETTE.Black : PALETTE.Red;
        this.hardText.style.fontSize = isEasy ? 44 : 64;
    }

    /**
     * Converts the selected difficulty into the settings consumed by PlayScene.
     */
    private currentSettings(): PlaySettings {
        const preset = DifficultyPresets[this.difficulty];
        return { bcSize: preset.bcSize, alphSize: preset.alphSize };
    }
}
