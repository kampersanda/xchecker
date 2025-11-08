/**
 * Application bootstrapper that wires PIXI scenes, keyboard input, and global assets.
 * Responsible for switching between the select and play scenes and running the main ticker.
 */
import * as PIXI from "pixi.js";
import * as WebFont from "webfontloader";

import { CANVAS, FONT_FAMILY } from "./constants";
import { createKey, GameKeys } from "./input/keyboard";
import { PlayScene } from "./scenes/playScene";
import { SelectScene } from "./scenes/selectScene";
import { PlaySettings, SceneController, SceneUpdate } from "./scenes/types";
import { resizeCanvas } from "./utils/resizeCanvas";

const app = new PIXI.Application({ width: CANVAS.width, height: CANVAS.height, transparent: true, antialias: true });
const element = document.getElementById('app');
if (!element) {
    throw new Error('Missing #app element.');
}
element.appendChild(app.view);

const keys: GameKeys = {
    enter: createKey("Enter"),
    left: createKey("ArrowLeft"),
    right: createKey("ArrowRight"),
    down: createKey("ArrowDown"),
};

let currentScene: SceneController | null = null;

/**
 * Replaces the currently mounted scene with the provided one.
 * Ensures the outgoing scene is destroyed before the new scene is set up.
 */
function mountScene(scene: SceneController) {
    if (currentScene) {
        currentScene.destroy();
    }
    currentScene = scene;
    currentScene.setup();
}

/**
 * Creates and mounts the SelectScene.
 */
function startSelectScene() {
    const scene = new SelectScene({ app, keys });
    mountScene(scene);
}

/**
 * Creates and mounts the PlayScene using the provided settings.
 */
function startPlayScene(settings: PlaySettings) {
    const scene = new PlayScene({ app, keys, settings });
    mountScene(scene);
}

/**
 * Routes scene update messages to the appropriate scene transition handler.
 */
function handleSceneUpdate(result: SceneUpdate) {
    switch (result.type) {
        case 'start-play':
            startPlayScene(result.settings);
            break;
        case 'back-to-select':
            startSelectScene();
            break;
        default:
            break;
    }
}

/**
 * Starts the PIXI ticker loop and forwards delta updates to the current scene.
 */
function beginTicker() {
    app.ticker.add(delta => {
        if (!currentScene) {
            return;
        }
        const result = currentScene.update(delta);
        handleSceneUpdate(result);
    });
}

/**
 * Entry point triggered after fonts are loaded; sets the initial scene and sizing.
 */
function initialize() {
    startSelectScene();
    resizeCanvas(app, CANVAS.width, CANVAS.height);
    beginTicker();
}

WebFont.load({
    custom: {
        families: [FONT_FAMILY],
        urls: ['./font.css'],
    },
    active: initialize,
    inactive: () => {
        alert('フォント読み込み失敗しました。');
        initialize();
    },
});

window.addEventListener('resize', () => resizeCanvas(app, CANVAS.width, CANVAS.height));
