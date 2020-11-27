import * as PIXI from "pixi.js"
import TRIE = require("./trie");

namespace XChecker {
    let app = new PIXI.Application({ width: 1000, height: 800, backgroundColor: 0xd3d3d3 });
    let element: any = document.getElementById('app');
    element.appendChild(app.view);

    // const loader = new PIXI.Loader();
    // loader.load(setup);

    // Variables
    const bcSize = 16;
    const edgeSize = 4;

    const elemWidth = 50;
    const elemHeight = 50;

    const textStyle = { fontSize: 25, fill: 0x000000 };

    let leftKey = keyboard("ArrowLeft", () => { }, () => { });
    let rightKey = keyboard("ArrowRight", () => { }, () => { });
    let downKey = keyboard("ArrowDown", () => { }, () => { });

    const [posLists, edgeLists] = TRIE.makeSolutions(bcSize, edgeSize);
    const rootNode = TRIE.makeTrie(edgeLists);

    let baseValue = 0;
    let nodeQueue: Array<{ node: TRIE.Node, bcPos: number }>;

    let collisionChecked = false;
    let finished = false;

    function keyboard(value: string, press: (arg: void) => void, release: (arg: void) => void) {
        let key = {
            value: value,
            isDown: false,
            isUp: true,
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

    function drawArrayHeaderTexts(names: Array<string>, width: number, container: PIXI.Container) {
        let objs = Array<PIXI.Text>(names.length);
        for (let j = 0; j < names.length; j++) {
            const x = width / 2;
            const y = j * elemHeight + (elemHeight / 2);
            objs[j] = new PIXI.Text(names[j], textStyle);
            objs[j].position.set(x, y);
            objs[j].anchor.set(0.5, 0.5);
            container.addChild(objs[j]);
        }
        return objs;
    }

    function drawArrayIndexTexts(size: number, isCode: boolean, container: PIXI.Container) {
        let objs = Array<PIXI.Text>(size);
        for (let i = 0; i < size; i++) {
            const x = i * elemWidth;
            const idx = isCode ? `${TRIE.codeTable[i]}` : `${i}`;
            objs[i] = new PIXI.Text(idx, textStyle);
            objs[i].position.set(x + (elemWidth / 2), elemHeight / 2);
            objs[i].anchor.set(0.5, 0.5);
            container.addChild(objs[i]);
        }
        return objs;
    }

    function drawArrayBodyTexts(size: number, container: PIXI.Container) {
        let objs = Array<PIXI.Text>(size);
        for (let i = 0; i < size; i++) {
            const x = i * elemWidth;
            objs[i] = new PIXI.Text('', textStyle);
            objs[i].position.set(x + (elemWidth / 2), elemHeight / 2);
            objs[i].anchor.set(0.5, 0.5);
            container.addChild(objs[i]);
        }
        return objs;
    }

    function drawArrayBodyGraphics(size: number, container: PIXI.Container) {
        let objs = Array<PIXI.Graphics>(size);
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

    // Graphics Objects
    let bcIndexTexts: Array<PIXI.Text>;
    let bcHeaderTexts: Array<PIXI.Text>;
    let baseBodyGraphics: Array<PIXI.Graphics>;
    let checkBodyGraphics: Array<PIXI.Graphics>;
    let baseBodyTexts: Array<PIXI.Text>;
    let checkBodyTexts: Array<PIXI.Text>;

    let edgeIndexTexts: Array<PIXI.Text>;
    let edgeBodyGraphics: Array<PIXI.Graphics>;
    let edgeBodyTexts: Array<PIXI.Text>;

    let triePixiObjs: any;

    // Containers
    let bcHeaderContainer = new PIXI.Container();
    let bcBodyContainer = new PIXI.Container();
    let bcContainer = new PIXI.Container();
    let edgeContainer = new PIXI.Container();

    const indexHeightOffset = elemHeight * 0.15;
    const bcHeaderWidth = 2.2 * elemWidth;
    const bcMarginTop = 600;
    const bcMarginLeft = 20;

    const edgeMarginTop = 500;
    const edgeMarginLeft = bcMarginLeft + bcHeaderWidth;

    let state: (x: number) => void;

    function setup() {
        /**
         * BaseCheck Containors
         */
        // Header of BaseCheck
        bcHeaderTexts = drawArrayHeaderTexts(["BASE", "CHECK"], bcHeaderWidth, bcHeaderContainer);
        bcHeaderContainer.position.set(0, elemHeight);

        // Index of BaseCheck
        let bcIndexContainer = new PIXI.Container();
        bcIndexTexts = drawArrayIndexTexts(bcSize, false, bcIndexContainer);
        bcIndexContainer.position.set(0, indexHeightOffset);

        // Body of Base
        let baseBodyContainer = new PIXI.Container();
        baseBodyGraphics = drawArrayBodyGraphics(bcSize, baseBodyContainer);
        baseBodyTexts = drawArrayBodyTexts(bcSize, baseBodyContainer);
        baseBodyContainer.position.set(0, elemHeight);

        // Body of Check
        let checkBodyContainer = new PIXI.Container();
        checkBodyGraphics = drawArrayBodyGraphics(bcSize, checkBodyContainer);
        checkBodyTexts = drawArrayBodyTexts(bcSize, checkBodyContainer);
        checkBodyContainer.position.set(0, 2 * elemHeight);

        bcBodyContainer.addChild(bcIndexContainer);
        bcBodyContainer.addChild(baseBodyContainer);
        bcBodyContainer.addChild(checkBodyContainer);
        bcBodyContainer.position.set(bcHeaderWidth, 0);

        bcContainer.addChild(bcHeaderContainer);
        bcContainer.addChild(bcBodyContainer);
        bcContainer.position.set(bcMarginLeft, bcMarginTop);

        for (let i = 0; i < bcSize; i++) {
            checkBodyTexts[i].visible = false;
        }
        checkBodyTexts[0].visible = true;
        checkBodyTexts[0].text = '-1';

        /**
         * Edge Containors
         */
        let edgeIndexContainer = new PIXI.Container();
        edgeIndexTexts = drawArrayIndexTexts(edgeSize, true, edgeIndexContainer);
        edgeIndexContainer.position.set(0, indexHeightOffset);

        let edgeBodyContainer = new PIXI.Container();
        edgeBodyGraphics = drawArrayBodyGraphics(edgeSize, edgeBodyContainer);
        edgeBodyTexts = drawArrayBodyTexts(edgeSize, edgeBodyContainer);
        edgeBodyContainer.position.set(0, elemHeight);

        edgeContainer.addChild(edgeIndexContainer);
        edgeContainer.addChild(edgeBodyContainer);
        edgeContainer.position.set(edgeMarginLeft, edgeMarginTop);

        for (let c = 0; c < edgeSize; c++) {
            edgeBodyTexts[c].text = '✓';
            edgeBodyTexts[c].visible = false;
        }
        for (let e of rootNode.edges) {
            edgeBodyTexts[e.c].visible = true;
        }

        nodeQueue = [{ node: rootNode, bcPos: 0 }];

        let trieContainer = new PIXI.Container();
        triePixiObjs = TRIE.drawTrie(rootNode, bcSize);

        for (let i = 1; i < bcSize; i++) {
            trieContainer.addChild(triePixiObjs.edgeGraphics[i])
            trieContainer.addChild(triePixiObjs.edgeTexts[i])
        }
        for (let i = 0; i < bcSize; i++) {
            trieContainer.addChild(triePixiObjs.nodeGraphics[i])
            trieContainer.addChild(triePixiObjs.nodeTexts[i])
        }
        trieContainer.position.set(50, 20);

        app.stage.addChild(bcContainer);
        app.stage.addChild(edgeContainer);
        app.stage.addChild(trieContainer);

        for (let i = 1; i < bcSize; i++) {
            triePixiObjs.nodeTexts[i].visible = false;
        }

        state = play;
        app.ticker.add(delta => gameLoop(delta));
    }

    function gameLoop(delta: number) {
        //Update the current game state:
        state(delta);
    }

    function play(delta: number) {
        if (finished) {
            let finishC = new PIXI.Container();
            let obj = new PIXI.Text("FINISHED!!!", textStyle);
            obj.position.set(0, 0);
            obj.anchor.set(0.5, 0.5);
            finishC.addChild(obj);
            finishC.position.set(300, 50);
            app.stage.addChild(finishC);
            return;
        }

        const speed = 0.2 * delta;
        if (leftKey.isDown && baseValue >= speed) { baseValue -= speed; }
        if (rightKey.isDown && baseValue + speed < bcSize - edgeSize + 1) { baseValue += speed; }

        const curr = nodeQueue[0];
        const baseInt = Math.floor(baseValue);

        if (baseBodyTexts[curr.bcPos].text != `${baseInt}`) {
            baseBodyTexts[curr.bcPos].text = `${baseInt}`;
            baseBodyTexts[curr.bcPos].style.fill = '#FF0000';
            edgeContainer.x = baseInt * elemWidth + edgeMarginLeft;
            collisionChecked = false;

            for (let e of curr.node.edges) {
                triePixiObjs.nodeTexts[e.child.nodeId].visible = true;
                triePixiObjs.nodeTexts[e.child.nodeId].text = `${baseInt + e.c}`;
                triePixiObjs.nodeTexts[e.child.nodeId].style.fill = '#FF0000';
            }
        }

        if (downKey.isDown && !collisionChecked) {
            if (checkCollisions()) {
                insertNodes();
            } else {
                collisionChecked = true;
            }
        }
    }

    function checkCollisions() {
        const baseInt = Math.floor(baseValue);
        for (let c = 0; c < edgeSize; c++) {
            if (!edgeBodyTexts[c].visible) {
                continue;
            }
            if (checkBodyTexts[baseInt + c].visible) {
                return false;
            }
        }
        return true;
    }

    function insertNodes() {
        let curr = nodeQueue[0];
        nodeQueue.shift();

        const baseInt = Math.floor(baseValue);
        baseBodyTexts[curr.bcPos].visible = true;
        baseBodyTexts[curr.bcPos].text = `${baseInt}`;
        baseBodyTexts[curr.bcPos].style = textStyle;

        for (let c = 0; c < edgeSize; c++) {
            if (!edgeBodyTexts[c].visible) {
                continue;
            }
            checkBodyTexts[baseInt + c].text = `${curr.bcPos}`;
            checkBodyTexts[baseInt + c].visible = true;
        }

        for (let e of curr.node.edges) {
            if (!edgeBodyTexts[e.c].visible) {
                console.assert("What's up!?");
            }
            edgeBodyTexts[e.c].visible = false;
            checkBodyTexts[baseInt + e.c].text = `${curr.bcPos}`;
            checkBodyTexts[baseInt + e.c].visible = true;
        }

        for (let e of curr.node.edges) {
            triePixiObjs.nodeTexts[e.child.nodeId].style.fill = '#000000';
        }

        for (let e of curr.node.edges) {
            if (!e.child.isLeaf()) {
                nodeQueue.push({ node: e.child, bcPos: baseInt + e.c });
            }
        }

        if (nodeQueue.length > 0) {
            for (let e of nodeQueue[0].node.edges) {
                edgeBodyTexts[e.c].visible = true;
            }
        } else {
            finished = true;
        }
    }

    setup();
}
