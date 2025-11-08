import * as PIXI from "pixi.js";

import { CODE_TABLE, Palette, TEXT_STYLE } from "../constants";
import { GameKeys } from "../input/keyboard";
import { createTimer, Timer } from "../utils/timer";
import * as TRIE from "../trie";
import { PlaySettings, RUNNING_UPDATE, SceneController, SceneUpdate } from "./types";

interface PlaySceneOptions {
    app: PIXI.Application;
    keys: GameKeys;
    settings: PlaySettings;
}

const InfoWidth = 1000;
const InfoHeight = 150;

const TrieWidth = 1200;
const TrieHeight = 380;

const TargetTopMargin = 15;

const TargetHeight = 100;

const ElemWidth = 50;
const ElemHeight = 50;
const IndexHeightOffset = ElemHeight * 0.15;

const BcHeaderWidth = 2.2 * ElemWidth;

const NodeRadius = 25;
const NodeMargin = 100;

enum GameState { Playing, Succeed, Failed, ToNext }

export class PlayScene implements SceneController {
    private readonly app: PIXI.Application;
    private readonly keys: GameKeys;
    private readonly settings: PlaySettings;

    private mainContainer?: PIXI.Container;

    private infoContainer?: PIXI.Container;
    private timerText?: PIXI.Text;

    private trieContainer?: PIXI.Container;
    private nodeGraphics: Array<PIXI.Graphics> = [];
    private nodeTexts: Array<PIXI.Text> = [];
    private edgeGraphics: Array<PIXI.Graphics> = [];
    private edgeTexts: Array<PIXI.Text> = [];

    private bcHeaderTexts: Array<PIXI.Text> = [];
    private bcIndexTexts: Array<PIXI.Text> = [];
    private baseBodyGraphics: Array<PIXI.Graphics> = [];
    private baseBodyTexts: Array<PIXI.Text> = [];
    private checkBodyGraphics: Array<PIXI.Graphics> = [];
    private checkBodyTexts: Array<PIXI.Text> = [];
    private bcContainer?: PIXI.Container;

    private targetIndexTexts: Array<PIXI.Text> = [];
    private targetBodyGraphics: Array<PIXI.Graphics> = [];
    private targetBodyTexts: Array<PIXI.Text> = [];
    private targetContainer?: PIXI.Container;

    private targetXOrigin = 0;

    private traverser: Array<{ node: TRIE.Node; bcPos: number }> = [];
    private root?: TRIE.Node;
    private baseValue = 0;
    private insertable = false;
    private timer: Timer = createTimer();
    private gameState = GameState.Playing;

    constructor(options: PlaySceneOptions) {
        this.app = options.app;
        this.keys = options.keys;
        this.settings = options.settings;
    }

    setup(): void {
        const { bcSize, alphSize } = this.settings;

        this.infoContainer = new PIXI.Container();
        this.timerText = new PIXI.Text('', TEXT_STYLE);
        this.timerText.position.set(0, InfoHeight / 2);
        this.timerText.anchor.set(0.0, 0.5);
        this.infoContainer.addChild(this.timerText);

        const helpText = new PIXI.Text('移動：左右キー\n配置：下キー\n戻る：ENTER', TEXT_STYLE);
        helpText.position.set(InfoWidth, InfoHeight / 2);
        helpText.anchor.set(1.0, 0.5);
        this.infoContainer.addChild(helpText);

        this.infoContainer.pivot.set(InfoWidth / 2, 0);
        this.infoContainer.position.set(this.app.renderer.width / 2, 0);

        const [, edgeLists] = TRIE.makeSolutions(bcSize, alphSize);
        this.root = TRIE.makeTrie(edgeLists);
        this.drawTrie(this.root, bcSize);

        this.trieContainer = new PIXI.Container();
        for (let i = 1; i < bcSize; i++) {
            if (this.edgeGraphics[i]) {
                this.trieContainer.addChild(this.edgeGraphics[i]);
            }
            if (this.edgeTexts[i]) {
                this.trieContainer.addChild(this.edgeTexts[i]);
            }
        }
        for (let i = 0; i < bcSize; i++) {
            if (this.nodeGraphics[i]) {
                this.trieContainer.addChild(this.nodeGraphics[i]);
            }
            if (this.nodeTexts[i]) {
                this.trieContainer.addChild(this.nodeTexts[i]);
            }
        }

        this.trieContainer.pivot.set(this.trieContainer.width / 2, 0);
        this.trieContainer.position.set(this.app.renderer.width / 2, InfoHeight);
        if (this.trieContainer.height > TrieHeight) {
            const scale = TrieHeight / this.trieContainer.height;
            this.trieContainer.scale.set(scale, scale);
        } else if (this.trieContainer.width > TrieWidth) {
            const scale = TrieWidth / this.trieContainer.width;
            this.trieContainer.scale.set(scale, scale);
        }

        const bcHeaderContainer = new PIXI.Container();
        bcHeaderContainer.position.set(0, ElemHeight);
        this.bcHeaderTexts = this.drawArrayHeaderTexts(["BASE", "CHECK"], BcHeaderWidth, bcHeaderContainer);

        const bcIndexContainer = new PIXI.Container();
        bcIndexContainer.position.set(BcHeaderWidth, IndexHeightOffset);
        this.bcIndexTexts = this.drawArrayIndexTexts(bcSize, false, bcIndexContainer);

        const baseBodyContainer = new PIXI.Container();
        baseBodyContainer.position.set(BcHeaderWidth, ElemHeight);
        this.baseBodyGraphics = this.drawArrayBodyGraphics(bcSize, baseBodyContainer);
        this.baseBodyTexts = this.drawArrayBodyTexts(bcSize, baseBodyContainer);

        const checkBodyContainer = new PIXI.Container();
        checkBodyContainer.position.set(BcHeaderWidth, 2 * ElemHeight);
        this.checkBodyGraphics = this.drawArrayBodyGraphics(bcSize, checkBodyContainer);
        this.checkBodyTexts = this.drawArrayBodyTexts(bcSize, checkBodyContainer);

        this.bcContainer = new PIXI.Container();
        this.bcContainer.addChild(bcHeaderContainer);
        this.bcContainer.addChild(bcIndexContainer);
        this.bcContainer.addChild(baseBodyContainer);
        this.bcContainer.addChild(checkBodyContainer);
        this.bcContainer.pivot.set(this.bcContainer.width / 2, 0);
        this.bcContainer.position.set(this.app.renderer.width / 2, InfoHeight + TrieHeight + TargetTopMargin + TargetHeight);

        this.targetContainer = new PIXI.Container();
        const targetIndexContainer = new PIXI.Container();
        targetIndexContainer.position.set(0, IndexHeightOffset);
        const targetBodyContainer = new PIXI.Container();
        this.targetIndexTexts = this.drawArrayIndexTexts(alphSize, true, targetIndexContainer);
        this.targetBodyGraphics = this.drawArrayBodyGraphics(alphSize, targetBodyContainer);
        this.targetBodyTexts = this.drawArrayBodyTexts(alphSize, targetBodyContainer);
        targetBodyContainer.position.set(0, ElemHeight);
        this.targetContainer.addChild(targetIndexContainer);
        this.targetContainer.addChild(targetBodyContainer);

        if (this.bcContainer) {
            this.targetXOrigin = this.bcContainer.position.x - this.bcContainer.pivot.x + BcHeaderWidth;
        }
        this.targetContainer.position.set(this.targetXOrigin, InfoHeight + TrieHeight + TargetTopMargin);

        this.mainContainer = new PIXI.Container();
        if (this.infoContainer) {
            this.mainContainer.addChild(this.infoContainer);
        }
        if (this.bcContainer) {
            this.mainContainer.addChild(this.bcContainer);
        }
        if (this.targetContainer) {
            this.mainContainer.addChild(this.targetContainer);
        }
        if (this.trieContainer) {
            this.mainContainer.addChild(this.trieContainer);
        }
        this.app.stage.addChild(this.mainContainer);

        if (!this.root) {
            throw new Error('Failed to build trie root.');
        }

        this.traverser = [{ node: this.root, bcPos: 0 }];
        for (let i = 1; i < bcSize; i++) {
            if (this.nodeTexts[i]) {
                this.nodeTexts[i].visible = false;
            }
        }
        for (let c = 0; c < alphSize; c++) {
            this.targetBodyTexts[c].text = '✓';
            this.targetBodyTexts[c].visible = false;
        }
        for (let e of this.root.edges) {
            this.targetBodyTexts[e.c].visible = true;
        }

        for (let i = 0; i < bcSize; i++) {
            this.checkBodyTexts[i].visible = false;
        }
        this.checkBodyTexts[0].visible = true;
        this.checkBodyTexts[0].text = '-1';

        this.baseValue = 0;
        this.insertable = false;
        this.timer = createTimer();
        this.gameState = GameState.Playing;
    }

    update(delta: number): SceneUpdate {
        if (!this.mainContainer) {
            return RUNNING_UPDATE;
        }

        if (this.keys.enter.isDown && !this.keys.enter.isProcessed) {
            this.keys.enter.isProcessed = true;
            this.mainContainer.visible = false;
            return { type: 'back-to-select' };
        }

        if (!this.timerText) {
            return RUNNING_UPDATE;
        }

        if (this.gameState === GameState.Playing) {
            const elapsed = this.timer.seconds;
            this.timerText.text = `経過時間：${elapsed.toFixed(1)}s`;

            const speed = 0.18 * delta;
            if (this.keys.left.isDown && this.baseValue >= speed) {
                if (this.keys.left.isProcessed) {
                    this.baseValue -= speed;
                } else {
                    this.keys.left.isProcessed = true;
                    this.baseValue = Math.max(0.0, Math.ceil(this.baseValue) - 1.0);
                }
            }
            if (this.keys.right.isDown && this.baseValue + speed < this.settings.bcSize - this.settings.alphSize + 1) {
                if (this.keys.right.isProcessed) {
                    this.baseValue += speed;
                } else {
                    this.keys.right.isProcessed = true;
                    this.baseValue = Math.min(this.settings.bcSize - this.settings.alphSize, Math.floor(this.baseValue) + 1.0);
                }
            }

            const curr = this.traverser[0];
            if (!curr) {
                this.gameState = GameState.Succeed;
            } else {
                const baseInt = Math.floor(this.baseValue);
                if (this.baseBodyTexts[curr.bcPos].text !== `${baseInt}`) {
                    this.insertable = true;
                    for (let e of curr.node.edges) {
                        const dstPos = baseInt + e.c;
                        this.nodeTexts[e.child.nodeId].visible = true;
                        this.nodeTexts[e.child.nodeId].text = `${dstPos}`;
                        if (this.checkBodyTexts[dstPos].visible) {
                            this.nodeTexts[e.child.nodeId].style.fill = Palette.Red;
                            this.insertable = false;
                        } else {
                            this.nodeTexts[e.child.nodeId].style.fill = Palette.Blue;
                        }
                    }
                    this.baseBodyTexts[curr.bcPos].text = `${baseInt}`;
                    this.baseBodyTexts[curr.bcPos].style.fill = this.insertable ? Palette.Blue : Palette.Red;
                    if (this.targetContainer) {
                        this.targetContainer.x = baseInt * ElemWidth + this.targetXOrigin;
                    }
                }
            }

            if (this.keys.down.isDown && !this.keys.down.isProcessed && this.insertable) {
                this.keys.down.isProcessed = true;
                this.insertNodes();
                if (!this.checkContinuability()) {
                    this.gameState = GameState.Failed;
                }
                this.insertable = false;
            }
        } else if (this.gameState === GameState.Succeed || this.gameState === GameState.Failed) {
            const elapsed = this.timer.seconds;
            this.timerText.text = `経過時間：${elapsed.toFixed(1)}s`;
            if (!this.infoContainer) {
                return RUNNING_UPDATE;
            }

            if (this.gameState === GameState.Succeed) {
                this.timerText.style.fill = Palette.Blue;
                const resText = new PIXI.Text(`${this.getRank(elapsed)}`, { fontFamily: TEXT_STYLE.fontFamily, fontSize: 64, fill: Palette.Blue });
                resText.position.set(InfoWidth / 2 - 80, InfoHeight / 2);
                resText.anchor.set(0.0, 0.5);
                this.infoContainer.addChild(resText);

                const auxText = new PIXI.Text('まるで', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 32, fill: Palette.Blue });
                auxText.position.set(resText.position.x, resText.position.y - 10);
                auxText.anchor.set(1.0, 0.5);
                this.infoContainer.addChild(auxText);
            } else {
                const resText = new PIXI.Text('負け', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 64, fill: Palette.Red });
                resText.position.set(InfoWidth / 2 + 30, InfoHeight / 2);
                resText.anchor.set(0.0, 0.5);
                this.infoContainer.addChild(resText);

                const auxText = new PIXI.Text('データ構造的に', { fontFamily: TEXT_STYLE.fontFamily, fontSize: 32, fill: Palette.Red });
                auxText.position.set(resText.position.x, resText.position.y - 10);
                auxText.anchor.set(1.0, 0.5);
                this.infoContainer.addChild(auxText);
            }
            this.gameState = GameState.ToNext;
        }

        return RUNNING_UPDATE;
    }

    destroy(): void {
        if (!this.mainContainer) {
            return;
        }
        this.app.stage.removeChild(this.mainContainer);
        this.mainContainer.destroy({ children: true });
        this.mainContainer = undefined;
    }

    private drawTrie(root: TRIE.Node, numNodes: number) {
        this.nodeGraphics = new Array<PIXI.Graphics>(numNodes);
        this.nodeTexts = new Array<PIXI.Text>(numNodes);
        this.edgeGraphics = new Array<PIXI.Graphics>(numNodes);
        this.edgeTexts = new Array<PIXI.Text>(numNodes);

        const queue: Array<{ parent: TRIE.Node; node: TRIE.Node }> = [{ parent: root, node: root }];
        while (queue.length !== 0) {
            const curr = queue.shift();
            if (!curr) {
                break;
            }
            const x = curr.node.offset * NodeMargin + (NodeMargin / 2);
            const y = curr.node.level * NodeMargin + (NodeMargin / 2);

            this.nodeGraphics[curr.node.nodeId] = new PIXI.Graphics()
                .lineStyle(3, 0x000000)
                .beginFill(0xffffff)
                .drawCircle(x, y, NodeRadius)
                .endFill();

            this.nodeTexts[curr.node.nodeId] = new PIXI.Text(`${curr.node.nodeId}`, TEXT_STYLE);
            this.nodeTexts[curr.node.nodeId].position.set(x, y);
            this.nodeTexts[curr.node.nodeId].anchor.set(0.5, 0.5);

            if (curr.node.nodeId !== 0) {
                const pt = this.nodeTexts[curr.parent.nodeId];
                const nt = this.nodeTexts[curr.node.nodeId];
                this.edgeGraphics[curr.node.nodeId] = new PIXI.Graphics()
                    .lineStyle(3, 0x000000)
                    .moveTo(pt.x, pt.y)
                    .lineTo(nt.x, pt.y)
                    .lineTo(nt.x, nt.y - NodeRadius)
                    .lineTo(nt.x - NodeRadius / 3, nt.y - NodeRadius - NodeRadius / 2.5)
                    .moveTo(nt.x + NodeRadius / 3, nt.y - NodeRadius - NodeRadius / 2.5)
                    .lineTo(nt.x, nt.y - NodeRadius);
                this.edgeTexts[curr.node.nodeId] = new PIXI.Text(`${CODE_TABLE[curr.node.inEdge]}`, TEXT_STYLE);
                this.edgeTexts[curr.node.nodeId].position.set(x - (NodeMargin / 4.5), y - (NodeMargin / 1.8));
                this.edgeTexts[curr.node.nodeId].anchor.set(0.5, 0.5);
            }

            for (const e of curr.node.edges) {
                queue.push({ parent: curr.node, node: e.child });
            }
        }
    }

    private drawArrayHeaderTexts(names: Array<string>, width: number, container: PIXI.Container) {
        const objs = new Array<PIXI.Text>(names.length);
        for (let j = 0; j < names.length; j++) {
            const x = width / 2;
            const y = j * ElemHeight + (ElemHeight / 2);
            objs[j] = new PIXI.Text(names[j], TEXT_STYLE);
            objs[j].position.set(x, y);
            objs[j].anchor.set(0.5, 0.5);
            container.addChild(objs[j]);
        }
        return objs;
    }

    private drawArrayIndexTexts(size: number, isCode: boolean, container: PIXI.Container) {
        const objs = new Array<PIXI.Text>(size);
        for (let i = 0; i < size; i++) {
            const x = i * ElemWidth;
            const idx = isCode ? `${CODE_TABLE[i]}` : `${i}`;
            objs[i] = new PIXI.Text(idx, TEXT_STYLE);
            objs[i].position.set(x + (ElemWidth / 2), ElemHeight / 2);
            objs[i].anchor.set(0.5, 0.5);
            container.addChild(objs[i]);
        }
        return objs;
    }

    private drawArrayBodyTexts(size: number, container: PIXI.Container) {
        const objs = new Array<PIXI.Text>(size);
        for (let i = 0; i < size; i++) {
            const x = i * ElemWidth;
            objs[i] = new PIXI.Text('', TEXT_STYLE);
            objs[i].position.set(x + (ElemWidth / 2), ElemHeight / 2);
            objs[i].anchor.set(0.5, 0.5);
            container.addChild(objs[i]);
        }
        return objs;
    }

    private drawArrayBodyGraphics(size: number, container: PIXI.Container) {
        const objs = new Array<PIXI.Graphics>(size);
        for (let i = 0; i < size; i++) {
            const x = i * ElemWidth;
            objs[i] = new PIXI.Graphics()
                .lineStyle(3, 0x000000)
                .beginFill(0xffffff)
                .drawRect(x, 0, ElemWidth, ElemHeight)
                .endFill();
            container.addChild(objs[i]);
        }
        return objs;
    }

    private checkContinuability() {
        for (let base = 0; base <= this.settings.bcSize - this.settings.alphSize; base++) {
            let insertable = true;
            for (let c = 0; c < this.settings.alphSize; c++) {
                if (!this.targetBodyTexts[c].visible) {
                    continue;
                }
                if (this.checkBodyTexts[base + c].visible) {
                    insertable = false;
                    break;
                }
            }
            if (insertable) {
                return true;
            }
        }
        return false;
    }

    private insertNodes() {
        const curr = this.traverser[0];
        if (!curr) {
            return;
        }
        this.traverser.shift();

        const baseInt = Math.floor(this.baseValue);
        this.baseBodyTexts[curr.bcPos].visible = true;
        this.baseBodyTexts[curr.bcPos].text = `${baseInt}`;
        this.baseBodyTexts[curr.bcPos].style.fill = TEXT_STYLE.fill ?? Palette.Black;
        if (TEXT_STYLE.fontSize) {
            this.baseBodyTexts[curr.bcPos].style.fontSize = TEXT_STYLE.fontSize;
        }
        if (TEXT_STYLE.fontFamily) {
            this.baseBodyTexts[curr.bcPos].style.fontFamily = TEXT_STYLE.fontFamily;
        }

        for (let c = 0; c < this.settings.alphSize; c++) {
            if (!this.targetBodyTexts[c].visible) {
                continue;
            }
            this.checkBodyTexts[baseInt + c].text = `${curr.bcPos}`;
            this.checkBodyTexts[baseInt + c].visible = true;
        }

        for (const e of curr.node.edges) {
            this.targetBodyTexts[e.c].visible = false;
            this.checkBodyTexts[baseInt + e.c].text = `${curr.bcPos}`;
            this.checkBodyTexts[baseInt + e.c].visible = true;
        }

        for (const e of curr.node.edges) {
            this.nodeTexts[e.child.nodeId].style.fill = Palette.Black;
        }

        for (const e of curr.node.edges) {
            if (!e.child.isLeaf()) {
                this.traverser.push({ node: e.child, bcPos: baseInt + e.c });
            }
        }

        if (this.traverser.length > 0) {
            for (const e of this.traverser[0].node.edges) {
                this.targetBodyTexts[e.c].visible = true;
            }
        } else {
            this.gameState = GameState.Succeed;
        }
    }

    private getRank(elapsed: number) {
        if (elapsed <= 3.0) {
            return '定数時間';
        } else if (elapsed <= 5.0) {
            return '対数時間';
        } else if (elapsed <= 10.0) {
            return '線形時間';
        } else if (elapsed <= 20.0) {
            return '二乗時間';
        } else if (elapsed <= 30.0) {
            return '指数時間';
        }
        return '階乗時間';
    }
}
