import * as PIXI from "pixi.js"
import * as WebFont from "webfontloader"
import TRIE = require("./trie");

// let app: PIXI.Application;
const app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight, transparent: true, antialias: true });
app.renderer.plugins.interaction.autoPreventDefault = false;
app.renderer.view.style.touchAction = 'auto';

const element: any = document.getElementById('app');
element.appendChild(app.view);

// Variables
let bcSize = 16;
let alphSize = 4;

const elemWidth = 50;
const elemHeight = 50;

const FontFamily = 'MPLUSRounded1c-Regular';
const TitleFamily = "\"Comic Sans MS\", cursive, sans-serif";
const TextStyle = { fontFamily: FontFamily, fontSize: 26, fill: 0x000000 };

const Palette = {
    Black: '#000000',
    White: '#FFFFFF',
    Red: '#ED1C22',
    Yellow: '#FEC907',
    Blue: '#1373C7',
}
enum Difficulty {
    Easy,
    Hard,
}

let edgeLeftOrigin = 0;

const indexHeightOffset = elemHeight * 0.15;
const bcHeaderWidth = 2.2 * elemWidth;

const edgeMarginTop = elemHeight * 0.8;
const bcMarginTop = edgeMarginTop + elemHeight * 2;


const CodeTable = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const EnterKey = keyboard("Enter", () => { }, () => { });
const LeftKey = keyboard("ArrowLeft", () => { }, () => { });
const RightKey = keyboard("ArrowRight", () => { }, () => { });
const DownKey = keyboard("ArrowDown", () => { }, () => { });

function keyboard(value: string, press: (arg: void) => void, release: (arg: void) => void) {
    let key = {
        value: value,
        isDown: false,
        isUp: true,
        isProcessed: false,
        press: press,
        release: release,
        downHandler: (arg: KeyboardEvent) => { },
        upHandler: (arg: KeyboardEvent) => { },
        unsubscribe: () => { },
    };

    key.downHandler = (event: KeyboardEvent) => {
        if (event.key === key.value) {
            if (key.isUp && key.press()) {
                key.press();
            }
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };
    key.upHandler = (event: KeyboardEvent) => {
        if (event.key === key.value) {
            if (key.isDown && key.release) {
                key.release();
            }
            key.isDown = false;
            key.isUp = true;
            key.isProcessed = false;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener("keydown", downListener, false);
    window.addEventListener("keyup", upListener, false);

    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };
    return key;
}

function timer() {
    let timeStart = new Date().getTime();
    return {
        get seconds() {
            const sec = (new Date().getTime() - timeStart) / 1000;
            return sec.toFixed(1) + 's';
        },
    }
}

let state: (delta: number) => void;
let willRetry = false;

function setup() {
    willRetry = false;

    SelectMode.setup();
    state = SelectMode.doWork;

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta: number) {
    if (willRetry) {
        app.stage.removeChildren();
        willRetry = false;
        SelectMode.setup();
        state = SelectMode.doWork;
    } else if (!SelectMode.nowWorking() && state != PlayMode.doWork) {
        PlayMode.setup();
        state = PlayMode.doWork;
    }
    state(delta);
}

namespace SelectMode {
    const MainWidth = 600;
    const MainHeight = 600;

    let mainContainer: PIXI.Container;
    let mainGraphics: PIXI.Graphics;
    let titleText: PIXI.Text;
    let easyText: PIXI.Text;
    let hardText: PIXI.Text;
    let indicatorText: PIXI.Text;
    let descText: PIXI.Text;
    let licenseText: PIXI.Text;

    let counter = 0;
    let difficulty = Difficulty.Easy;

    const Description =
        'トライからダブル配列を構築するゲームです\n' +
        '隙間なく要素を配置できればクリアです\n' +
        '（方向キーで操作します）';

    export function setup() {
        console.log('SelectMode.setup');

        mainContainer = new PIXI.Container();
        mainGraphics = new PIXI.Graphics()
            .lineStyle(10, 0x000000)
            .beginFill(0xffffff)
            .drawRect(0, 0, MainWidth, MainHeight)
            .endFill();
        mainContainer.addChild(mainGraphics);

        titleText = new PIXI.Text('XCHECKER', { fontFamily: TitleFamily, fontSize: 80, stroke: Palette.Black, fill: Palette.Black, strokeThickness: 5 });
        titleText.position.set(300, 100);
        titleText.anchor.set(0.5, 0.5);
        mainContainer.addChild(titleText);

        easyText = new PIXI.Text('Easy', { fontFamily: FontFamily, fontSize: 44, fill: Palette.Blue });
        easyText.position.set(MainWidth / 4 + 20, 240);
        easyText.anchor.set(0.5, 0.5);
        mainContainer.addChild(easyText);

        hardText = new PIXI.Text('Hard', { fontFamily: FontFamily, fontSize: 44, fill: Palette.Red });
        hardText.position.set(MainWidth / 4 * 3 - 20, 240);
        hardText.anchor.set(0.5, 0.5);
        mainContainer.addChild(hardText);

        indicatorText = new PIXI.Text('Press Enter', { fontFamily: FontFamily, fontSize: 32 });
        indicatorText.position.set(MainWidth / 2, 330);
        indicatorText.anchor.set(0.5, 0.5);
        mainContainer.addChild(indicatorText);

        descText = new PIXI.Text(Description, { fontFamily: FontFamily, fontSize: 26, fill: Palette.Black, align: 'center' });
        descText.position.set(MainWidth / 2, 400);
        descText.anchor.set(0.5, 0);
        mainContainer.addChild(descText);

        licenseText = new PIXI.Text('Created by Kampersanda', { fontFamily: FontFamily, fontSize: 26, fill: '#808080' });
        licenseText.position.set(MainWidth / 2, 550);
        licenseText.anchor.set(0.5, 0);
        mainContainer.addChild(licenseText);

        mainContainer.pivot.set(mainContainer.width / 2, 0);
        mainContainer.position.set(window.innerWidth / 2, 100);

        app.stage.addChild(mainContainer);
    }

    export function doWork(delta: number) {
        counter += delta;
        if (counter > 35) {
            indicatorText.visible = !indicatorText.visible;
            counter = 0;
        }

        if (LeftKey.isDown && !LeftKey.isProcessed) {
            LeftKey.isProcessed = true;
            difficulty = Difficulty.Easy;
        }
        if (RightKey.isDown && !RightKey.isProcessed) {
            RightKey.isProcessed = true;
            difficulty = Difficulty.Hard;
        }

        if (difficulty == Difficulty.Easy) {
            easyText.style.fill = Palette.Blue;
            easyText.style.fontSize = 64;
            hardText.style.fill = Palette.Black;
            hardText.style.fontSize = 44;
            bcSize = 16;
            alphSize = 4;
        } else {
            easyText.style.fill = Palette.Black;
            easyText.style.fontSize = 44;
            hardText.style.fill = Palette.Red;
            hardText.style.fontSize = 64;
            bcSize = 20;
            alphSize = 6;
        }

        if (EnterKey.isDown && !EnterKey.isProcessed) {
            EnterKey.isProcessed = true;
            mainContainer.visible = false;
        }
    }

    export function nowWorking() {
        return mainContainer.visible;
    }
} // SelectMode

namespace PlayMode {
    const InfoTopMargin = 20;
    const InfoWeight = 800;
    const InfoHeight = 100;

    const NodeRadius = 25;
    const NodeMargin = 100;

    // The game scene
    let mainContainer: PIXI.Container;

    /**
     * PIXI objects of Trie
     */
    let timerText: PIXI.Text;
    let resultText: PIXI.Text;
    let helpText: PIXI.Text;
    let infoContainer: PIXI.Container;

    /**
     * PIXI objects of Trie
     */
    let nodeGraphics: Array<PIXI.Graphics>;
    let nodeTexts: Array<PIXI.Text>;
    let edgeGraphics: Array<PIXI.Graphics>;
    let edgeTexts: Array<PIXI.Text>;
    let trieContainer: PIXI.Container;

    /**
     * PIXI objects of Base & Check
     */
    let bcHeaderTexts: Array<PIXI.Text>;
    let bcIndexTexts: Array<PIXI.Text>;
    let baseBodyGraphics: Array<PIXI.Graphics>;
    let checkBodyGraphics: Array<PIXI.Graphics>;
    let baseBodyTexts: Array<PIXI.Text>;
    let checkBodyTexts: Array<PIXI.Text>;

    let bcHeaderContainer: PIXI.Container;
    let bcIndexContainer: PIXI.Container;
    let baseBodyContainer: PIXI.Container;
    let checkBodyContainer: PIXI.Container;
    let bcContainer: PIXI.Container;

    /**
     * PIXI objects of target edges
     */
    let targetIndexTexts: Array<PIXI.Text>;
    let targetBodyGraphics: Array<PIXI.Graphics>;
    let targetBodyTexts: Array<PIXI.Text>;

    let targetIndexContainer: PIXI.Container;
    let targetBodyContainer: PIXI.Container;
    let targetContainer: PIXI.Container;

    let root: TRIE.Node; // Root node of random trie
    let traverser: Array<{ node: TRIE.Node, bcPos: number }>; // Traverser

    let baseValue: number;
    let collisionChecked: boolean;

    let howLong = timer();

    enum GameState { Playing, Succeed, Failed, ToNext }
    let gameState: GameState;

    export function setup() {
        /**
         * Info Containors
         */
        infoContainer = new PIXI.Container();

        timerText = new PIXI.Text('', TextStyle);
        timerText.position.set(0, InfoHeight / 2);
        timerText.anchor.set(0.0, 0.5);
        infoContainer.addChild(timerText);

        helpText = new PIXI.Text('移動：左右キー\n配置：下キー\n戻る：ENTER', TextStyle);
        helpText.position.set(InfoWeight, InfoHeight / 2);
        helpText.anchor.set(1.0, 0.5);
        infoContainer.addChild(helpText);

        resultText = new PIXI.Text('', { fontFamily: FontFamily, fontSize: 64, fill: 0x000000 });
        resultText.position.set(InfoWeight / 2, InfoHeight / 2);
        resultText.anchor.set(0.5, 0.5);
        infoContainer.addChild(resultText);

        infoContainer.pivot.set(infoContainer.width / 2, 0);
        infoContainer.position.set(window.innerWidth / 2, InfoTopMargin);

        /**
         * TRIE Containors
         */
        const [posLists, edgeLists] = TRIE.makeSolutions(bcSize, alphSize);
        root = TRIE.makeTrie(edgeLists);
        drawTrie(root, bcSize);

        trieContainer = new PIXI.Container();
        for (let i = 1; i < bcSize; i++) {
            trieContainer.addChild(edgeGraphics[i])
            trieContainer.addChild(edgeTexts[i])
        }
        for (let i = 0; i < bcSize; i++) {
            trieContainer.addChild(nodeGraphics[i])
            trieContainer.addChild(nodeTexts[i])
        }
        trieContainer.pivot.set(trieContainer.width / 2, 0);
        trieContainer.position.set(window.innerWidth / 2, InfoTopMargin + InfoHeight);

        /**
         * Base & Check Containors
         */
        bcHeaderContainer = new PIXI.Container();
        bcHeaderTexts = drawArrayHeaderTexts(["BASE", "CHECK"], bcHeaderWidth, bcHeaderContainer);
        bcHeaderContainer.position.set(0, elemHeight);

        bcIndexContainer = new PIXI.Container();
        bcIndexTexts = drawArrayIndexTexts(bcSize, false, bcIndexContainer);
        bcIndexContainer.position.set(bcHeaderWidth, indexHeightOffset);

        baseBodyContainer = new PIXI.Container();
        baseBodyGraphics = drawArrayBodyGraphics(bcSize, baseBodyContainer);
        baseBodyTexts = drawArrayBodyTexts(bcSize, baseBodyContainer);
        baseBodyContainer.position.set(bcHeaderWidth, elemHeight);

        checkBodyContainer = new PIXI.Container();
        checkBodyGraphics = drawArrayBodyGraphics(bcSize, checkBodyContainer);
        checkBodyTexts = drawArrayBodyTexts(bcSize, checkBodyContainer);
        checkBodyContainer.position.set(bcHeaderWidth, 2 * elemHeight);

        bcContainer = new PIXI.Container();
        bcContainer.addChild(bcHeaderContainer);
        bcContainer.addChild(bcIndexContainer);
        bcContainer.addChild(baseBodyContainer);
        bcContainer.addChild(checkBodyContainer);
        bcContainer.pivot.set(bcContainer.width / 2, 0);
        bcContainer.position.set(window.innerWidth / 2, trieContainer.position.y + trieContainer.height + bcMarginTop);


        /**
         * Target Containors
         */
        targetIndexContainer = new PIXI.Container();
        targetIndexTexts = drawArrayIndexTexts(alphSize, true, targetIndexContainer);
        targetIndexContainer.position.set(0, indexHeightOffset);

        targetBodyContainer = new PIXI.Container();
        targetBodyGraphics = drawArrayBodyGraphics(alphSize, targetBodyContainer);
        targetBodyTexts = drawArrayBodyTexts(alphSize, targetBodyContainer);
        targetBodyContainer.position.set(0, elemHeight);

        targetContainer = new PIXI.Container();
        targetContainer.addChild(targetIndexContainer);
        targetContainer.addChild(targetBodyContainer);

        edgeLeftOrigin = bcContainer.position.x - bcContainer.pivot.x + bcHeaderWidth;
        targetContainer.position.set(edgeLeftOrigin, trieContainer.position.y + trieContainer.height + edgeMarginTop);

        // Append
        mainContainer = new PIXI.Container();
        mainContainer.addChild(infoContainer);
        mainContainer.addChild(bcContainer);
        mainContainer.addChild(targetContainer);
        mainContainer.addChild(trieContainer);
        app.stage.addChild(mainContainer);

        traverser = [{ node: root, bcPos: 0 }];

        // Init
        for (let c = 0; c < alphSize; c++) {
            targetBodyTexts[c].text = '✓';
            targetBodyTexts[c].visible = false;
        }
        for (let e of root.edges) {
            targetBodyTexts[e.c].visible = true;
        }

        for (let i = 0; i < bcSize; i++) {
            checkBodyTexts[i].visible = false;
        }
        checkBodyTexts[0].visible = true;
        checkBodyTexts[0].text = '-1';

        for (let i = 1; i < bcSize; i++) {
            nodeTexts[i].visible = false;
        }
        howLong = timer();

        baseValue = 0;
        collisionChecked = false;

        gameState = GameState.Playing;
    }

    export function doWork(delta: number) {
        if (EnterKey.isDown && !EnterKey.isProcessed) {
            mainContainer.visible = false;
            EnterKey.isProcessed = true;
            willRetry = true;
            return;
        }

        if (gameState == GameState.Playing) { // Playing
            timerText.text = `経過時間：${howLong.seconds}`;

            const speed = 0.2 * delta;
            if (LeftKey.isDown && baseValue >= speed) {
                baseValue -= speed;
            }
            if (RightKey.isDown && baseValue + speed < bcSize - alphSize + 1) {
                baseValue += speed;
            }

            const curr = traverser[0];
            const baseInt = Math.floor(baseValue);

            if (baseBodyTexts[curr.bcPos].text != `${baseInt}`) {
                baseBodyTexts[curr.bcPos].text = `${baseInt}`;
                baseBodyTexts[curr.bcPos].style.fill = Palette.Red;
                targetContainer.x = baseInt * elemWidth + edgeLeftOrigin;
                collisionChecked = false;

                for (let e of curr.node.edges) {
                    nodeTexts[e.child.nodeId].visible = true;
                    nodeTexts[e.child.nodeId].text = `${baseInt + e.c}`;
                    nodeTexts[e.child.nodeId].style.fill = Palette.Red;
                }
            }

            if (DownKey.isDown && !DownKey.isProcessed && !collisionChecked) {
                DownKey.isProcessed = true;
                if (checkCollisions()) {
                    insertNodes();
                    if (!checkContinuability()) {
                        gameState = GameState.Failed;
                    }
                } else {
                    collisionChecked = true;
                }
            }
        } else if (gameState == GameState.Succeed || gameState == GameState.Failed) { // 1: Finished
            if (gameState == GameState.Succeed) {
                resultText.text = '最適 :)';
                resultText.style.fill = Palette.Blue;
            } else {
                resultText.text = '負け :(';
                resultText.style.fill = Palette.Red;
            }
            gameState = GameState.ToNext;
            return;
        } else if (gameState == GameState.ToNext) { // 2: ToNextGame
            return;
        }
    }

    function drawTrie(root: TRIE.Node, numNodes: number) {
        nodeGraphics = new Array<PIXI.Graphics>(numNodes);
        nodeTexts = new Array<PIXI.Text>(numNodes);
        edgeGraphics = new Array<PIXI.Graphics>(numNodes);
        edgeTexts = new Array<PIXI.Text>(numNodes);

        let queue = new Array<{ parent: TRIE.Node, node: TRIE.Node }>();
        queue.push({ parent: root, node: root });

        while (queue.length != 0) {
            let curr = queue[0];
            queue.shift();

            const x = curr.node.offset * NodeMargin + (NodeMargin / 2);
            const y = curr.node.level * NodeMargin + (NodeMargin / 2);

            nodeGraphics[curr.node.nodeId] = new PIXI.Graphics()
                .lineStyle(3, 0x000000)
                .beginFill(0xffffff)
                .drawCircle(x, y, NodeRadius)
                .endFill();

            nodeTexts[curr.node.nodeId] = new PIXI.Text(`${curr.node.nodeId}`, TextStyle);
            nodeTexts[curr.node.nodeId].position.set(x, y);
            nodeTexts[curr.node.nodeId].anchor.set(0.5, 0.5);

            if (curr.node.nodeId != 0) { // not root
                const pt = nodeTexts[curr.parent.nodeId];
                const nt = nodeTexts[curr.node.nodeId];
                edgeGraphics[curr.node.nodeId] = new PIXI.Graphics()
                    .lineStyle(3, 0x000000)
                    .moveTo(pt.x, pt.y)
                    .lineTo(nt.x, pt.y)
                    .lineTo(nt.x, nt.y - NodeRadius)
                    .lineTo(nt.x - NodeRadius / 3, nt.y - NodeRadius - NodeRadius / 2.5)
                    .moveTo(nt.x + NodeRadius / 3, nt.y - NodeRadius - NodeRadius / 2.5)
                    .lineTo(nt.x, nt.y - NodeRadius);
                edgeTexts[curr.node.nodeId] = new PIXI.Text(`${CodeTable[curr.node.inEdge]}`, TextStyle);
                edgeTexts[curr.node.nodeId].position.set(x - (NodeMargin / 4.5), y - (NodeMargin / 1.8));
                edgeTexts[curr.node.nodeId].anchor.set(0.5, 0.5);
            }

            for (let e of curr.node.edges) {
                queue.push({ parent: curr.node, node: e.child });
            }
        }
    }

    function drawArrayHeaderTexts(names: Array<string>, width: number, container: PIXI.Container) {
        let objs = new Array<PIXI.Text>(names.length);
        for (let j = 0; j < names.length; j++) {
            const x = width / 2;
            const y = j * elemHeight + (elemHeight / 2);
            objs[j] = new PIXI.Text(names[j], TextStyle);
            objs[j].position.set(x, y);
            objs[j].anchor.set(0.5, 0.5);
            container.addChild(objs[j]);
        }
        return objs;
    }

    function drawArrayIndexTexts(size: number, isCode: boolean, container: PIXI.Container) {
        let objs = new Array<PIXI.Text>(size);
        for (let i = 0; i < size; i++) {
            const x = i * elemWidth;
            const idx = isCode ? `${CodeTable[i]}` : `${i}`;
            objs[i] = new PIXI.Text(idx, TextStyle);
            objs[i].position.set(x + (elemWidth / 2), elemHeight / 2);
            objs[i].anchor.set(0.5, 0.5);
            container.addChild(objs[i]);
        }
        return objs;
    }

    function drawArrayBodyTexts(size: number, container: PIXI.Container) {
        let objs = new Array<PIXI.Text>(size);
        for (let i = 0; i < size; i++) {
            const x = i * elemWidth;
            objs[i] = new PIXI.Text('', TextStyle);
            objs[i].position.set(x + (elemWidth / 2), elemHeight / 2);
            objs[i].anchor.set(0.5, 0.5);
            container.addChild(objs[i]);
        }
        return objs;
    }

    function drawArrayBodyGraphics(size: number, container: PIXI.Container) {
        let objs = new Array<PIXI.Graphics>(size);
        for (let i = 0; i < size; i++) {
            const x = i * elemWidth;
            objs[i] = new PIXI.Graphics()
                .lineStyle(3, 0x000000)
                .beginFill(0xffffff)
                .drawRect(x, 0, elemWidth, elemHeight)
                .endFill();
            container.addChild(objs[i]);
        }
        return objs;
    }

    function checkCollisions() {
        const baseInt = Math.floor(baseValue);
        for (let c = 0; c < alphSize; c++) {
            if (!targetBodyTexts[c].visible) {
                continue;
            }
            if (checkBodyTexts[baseInt + c].visible) {
                return false;
            }
        }
        return true;
    }

    function checkContinuability() {
        for (let base = 0; base <= bcSize - alphSize; base++) {
            let insertable = true;
            for (let c = 0; c < alphSize; c++) {
                if (!targetBodyTexts[c].visible) {
                    continue;
                }
                if (checkBodyTexts[base + c].visible) {
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

    function insertNodes() {
        let curr = traverser[0];
        traverser.shift();

        const baseInt = Math.floor(baseValue);
        baseBodyTexts[curr.bcPos].visible = true;
        baseBodyTexts[curr.bcPos].text = `${baseInt}`;
        baseBodyTexts[curr.bcPos].style = TextStyle;

        for (let c = 0; c < alphSize; c++) {
            if (!targetBodyTexts[c].visible) {
                continue;
            }
            checkBodyTexts[baseInt + c].text = `${curr.bcPos}`;
            checkBodyTexts[baseInt + c].visible = true;
        }

        for (let e of curr.node.edges) {
            if (!targetBodyTexts[e.c].visible) {
                console.assert("What's up!?");
            }
            targetBodyTexts[e.c].visible = false;
            checkBodyTexts[baseInt + e.c].text = `${curr.bcPos}`;
            checkBodyTexts[baseInt + e.c].visible = true;
        }

        for (let e of curr.node.edges) {
            nodeTexts[e.child.nodeId].style.fill = '#000000';
        }

        for (let e of curr.node.edges) {
            if (!e.child.isLeaf()) {
                traverser.push({ node: e.child, bcPos: baseInt + e.c });
            }
        }

        if (traverser.length > 0) {
            for (let e of traverser[0].node.edges) {
                targetBodyTexts[e.c].visible = true;
            }
        } else {
            gameState = 1; // finished
        }
    }
} // PlayMode

WebFont.load({
    // ! GoogleWebFontではなんか上手く作動しない
    // 解決しなかったのでダウンロードして使った
    // google: { families: [FontFamily] },
    custom: {
        families: [FontFamily],
        urls: ['./font.css'],
    },
    active: () => {
        // alert('フォント読み込み成功しました。');
        setup();
    },
    inactive: () => {
        alert('フォント読み込み失敗しました。');
        setup();
    },
});
