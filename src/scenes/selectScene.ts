import * as PIXI from "pixi.js";

import { DifficultyLevel, DifficultyPresets, Palette, SELECT_DESCRIPTION, TEXT_STYLE, TITLE_FAMILY } from "../constants";
import { GameKeys } from "../input/keyboard";
import { PlaySettings, RUNNING_UPDATE, SceneController, SceneUpdate } from "./types";

interface SelectSceneOptions {
    app: PIXI.Application;
    keys: Pick<GameKeys, "enter" | "left" | "right">;
}

const MainWidth = 600;
const MainHeight = 600;

export class SelectScene implements SceneController {
    private readonly app: PIXI.Application;
    private readonly keys: Pick<GameKeys, "enter" | "left" | "right">;

    private container?: PIXI.Container;
    private indicatorText?: PIXI.Text;
    private easyText?: PIXI.Text;
    private hardText?: PIXI.Text;

    private counter = 0;
    private difficulty = DifficultyLevel.Easy;

    constructor(options: SelectSceneOptions) {
        this.app = options.app;
        this.keys = options.keys;
    }

    setup(): void {
        const container = new PIXI.Container();

        const frame = new PIXI.Graphics()
            .lineStyle(10, 0x000000)
            .beginFill(0xffffff)
            .drawRect(0, 0, MainWidth, MainHeight)
            .endFill();
        container.addChild(frame);

        const titleText = new PIXI.Text('XCHECKER', { fontFamily: TITLE_FAMILY, fontSize: 80, stroke: Palette.Black, fill: Palette.Black, strokeThickness: 5 });
        titleText.position.set(300, 100);
        titleText.anchor.set(0.5, 0.5);
        container.addChild(titleText);

        this.easyText = new PIXI.Text('Easy', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 44, fill: Palette.Blue });
        this.easyText.position.set(MainWidth / 4 + 20, 240);
        this.easyText.anchor.set(0.5, 0.5);
        container.addChild(this.easyText);

        this.hardText = new PIXI.Text('Hard', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 44, fill: Palette.Red });
        this.hardText.position.set(MainWidth / 4 * 3 - 20, 240);
        this.hardText.anchor.set(0.5, 0.5);
        container.addChild(this.hardText);

        this.indicatorText = new PIXI.Text('Press Enter', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 32 });
        this.indicatorText.position.set(MainWidth / 2, 330);
        this.indicatorText.anchor.set(0.5, 0.5);
        container.addChild(this.indicatorText);

        const descText = new PIXI.Text(SELECT_DESCRIPTION, { fontFamily: TEXT_STYLE.fontFamily, fontSize: 26, fill: Palette.Black, align: 'center' });
        descText.position.set(MainWidth / 2, 400);
        descText.anchor.set(0.5, 0);
        container.addChild(descText);

        const licenseText = new PIXI.Text('Created by Kampersanda', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 26, fill: '#808080' });
        licenseText.position.set(MainWidth / 2, 550);
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

    destroy(): void {
        if (!this.container) {
            return;
        }
        this.app.stage.removeChild(this.container);
        this.container.destroy({ children: true });
        this.container = undefined;
    }

    private applyDifficultyStyles() {
        if (!this.easyText || !this.hardText) {
            return;
        }
        const isEasy = this.difficulty === DifficultyLevel.Easy;
        this.easyText.style.fill = isEasy ? Palette.Blue : Palette.Black;
        this.easyText.style.fontSize = isEasy ? 64 : 44;
        this.hardText.style.fill = isEasy ? Palette.Black : Palette.Red;
        this.hardText.style.fontSize = isEasy ? 44 : 64;
    }

    private currentSettings(): PlaySettings {
        const preset = DifficultyPresets[this.difficulty];
        return { bcSize: preset.bcSize, alphSize: preset.alphSize };
    }
}
