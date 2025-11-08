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

function mountScene(scene: SceneController) {
    if (currentScene) {
        currentScene.destroy();
    }
    currentScene = scene;
    currentScene.setup();
}

function startSelectScene() {
    const scene = new SelectScene({ app, keys });
    mountScene(scene);
}

function startPlayScene(settings: PlaySettings) {
    const scene = new PlayScene({ app, keys, settings });
    mountScene(scene);
}

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

function beginTicker() {
    app.ticker.add(delta => {
        if (!currentScene) {
            return;
        }
        const result = currentScene.update(delta);
        handleSceneUpdate(result);
    });
}

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
