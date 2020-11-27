import * as PIXI from "pixi.js"

const nodeRadius = 25;
const nodeMargin = 100;

const textStyle = { fontSize: 25, fill: 0x000000 };
export const codeTable = ['a', 'b', 'c', 'd'];

function shuffle<T>(array: T[]) {
    const out = Array.from(array);
    for (let i = out.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        const tmp = out[i];
        out[i] = out[r];
        out[r] = tmp;
    }
    return out;
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * Math.floor(max - min)) + min;
}
function getRangeSize(min: number, max: number) {
    return max - min + 1;
}

export function makeSolutions(bcSize: number, edgeSize: number) {
    let permutation = Array<number>(bcSize - 1);
    for (let i = 1; i < bcSize; i++) { permutation[i - 1] = i; }
    permutation = shuffle(permutation);

    let cursor = 0;
    let posLists = Array<Array<number>>();

    while (cursor < permutation.length) {
        const degree = getRandomInt(2, 4);

        let posList = Array<number>();
        posList.push(permutation[cursor]);

        let minPos = permutation[cursor];
        let maxPos = permutation[cursor];

        for (let i = cursor + 1; i < permutation.length && posList.length < degree; i++) {
            const candidate = permutation[i];
            if (candidate == -1) {
                continue;
            }
            if (candidate < minPos) {
                if (getRangeSize(candidate, maxPos) > edgeSize) {
                    continue;
                }
                minPos = candidate;
            } else if (candidate > maxPos) {
                if (getRangeSize(minPos, candidate) > edgeSize) {
                    continue;
                }
                maxPos = candidate;
            }
            posList.push(permutation[i]);
            permutation[i] = -1;
        }
        posList = posList.sort(function (a, b) { return a - b; });
        posLists.push(posList);

        cursor += 1;
        while (cursor < permutation.length) {
            if (permutation[cursor] != -1) {
                break;
            }
            cursor += 1;
        }
    }
    posLists = shuffle(posLists);

    let edgeLists = Array<Array<number>>();
    for (let i = 0; i < posLists.length; i++) {
        const posList = posLists[i];
        let edgeList = Array<number>(posList.length);

        const rangeSize = getRangeSize(posList[0], posList[posList.length - 1]);
        const shiftable = edgeSize - rangeSize;

        let shift = 0;
        if (posList[0] < edgeSize) { // 左への溢れ
            shift = 0;
        } else if (posList[posList.length - 1] >= bcSize - edgeSize) { // 右への溢れ
            shift = Math.min(shiftable, edgeSize - (bcSize - posList[posList.length - 1]));
        } else {
            shift = getRandomInt(0, shiftable);
        }

        for (let j = 0; j < posList.length; j++) {
            edgeList[j] = posList[j] - posList[0] + shift;
        }
        edgeLists.push(edgeList);
    }

    return [posLists, edgeLists];
}

export class Node {
    size: number;
    level: number;
    edges: Array<{ c: number, child: Node }>;
    nodeId: number;
    offset: number;
    inEdge: number;
    constructor(level: number, nodeId: number, inEdge: number) {
        this.size = 0;
        this.level = level;
        this.edges = new Array<{ c: number, child: Node }>();
        this.nodeId = nodeId;
        this.offset = 0;
        this.inEdge = inEdge;
    }
    isLeaf() {
        return this.edges.length == 0;
    }
}

export function makeTrie(edgeLists: Array<Array<number>>) {
    let nextNodeId = 0;
    let root = new Node(0, nextNodeId++, -1);

    let queue = new Array<Node>();
    queue.push(root);

    let nodesForLevels = new Array<Array<Node>>();

    while (queue.length != 0) {
        let node = queue[0];
        queue.shift();

        if (nodesForLevels.length == node.level) {
            nodesForLevels.push(new Array<Node>());
        }
        nodesForLevels[node.level].push(node);

        if (node.nodeId >= edgeLists.length) {
            continue;
        }

        const edgeList = edgeLists[node.nodeId];
        for (let c of edgeList) {
            let child = new Node(node.level + 1, nextNodeId++, c);
            node.edges.push({ c: c, child: child });
            queue.push(child);
        }
    }
    setSubtreeSize(root);

    // Set offsets
    for (let j = 0; j < nodesForLevels.length; j++) {
        let offset = 0;
        for (let node of nodesForLevels[j]) {
            node.offset = offset;
            offset += node.size;
        }
    }
    return root;
}

function setSubtreeSize(node: Node) {
    if (node.edges.length == 0) {
        node.size = 1;
        return;
    }
    for (let e of node.edges) {
        setSubtreeSize(e.child);
        node.size += e.child.size;
    }
}

export function drawTrie(root: Node, numNodes: number) {
    let nodeGraphics = new Array<PIXI.Graphics>(numNodes);
    let nodeTexts = new Array<PIXI.Text>(numNodes);

    let edgeGraphics = new Array<PIXI.Graphics>(numNodes);
    let edgeTexts = new Array<PIXI.Text>(numNodes);

    let queue = new Array<{ par: Node, node: Node }>();
    queue.push({ par: root, node: root });

    while (queue.length != 0) {
        let curr = queue[0];
        queue.shift();

        const x = curr.node.offset * nodeMargin + (nodeMargin / 2);
        const y = curr.node.level * nodeMargin + (nodeMargin / 2);

        nodeGraphics[curr.node.nodeId] = new PIXI.Graphics()
            .lineStyle(3, 0x000000)
            .beginFill(0xffffff)
            .drawCircle(x, y, nodeRadius)
            .endFill();

        nodeTexts[curr.node.nodeId] = new PIXI.Text(`${curr.node.nodeId}`, textStyle);
        nodeTexts[curr.node.nodeId].position.set(x, y);
        nodeTexts[curr.node.nodeId].anchor.set(0.5, 0.5);

        if (curr.node.nodeId != 0) { // not root
            const pt = nodeTexts[curr.par.nodeId];
            const nt = nodeTexts[curr.node.nodeId];
            edgeGraphics[curr.node.nodeId] = new PIXI.Graphics()
                .lineStyle(3, 0x000000)
                .moveTo(pt.x, pt.y)
                .lineTo(nt.x, pt.y)
                .lineTo(nt.x, nt.y - nodeRadius)
                .lineTo(nt.x - nodeRadius / 3, nt.y - nodeRadius - nodeRadius / 2.5)
                .moveTo(nt.x + nodeRadius / 3, nt.y - nodeRadius - nodeRadius / 2.5)
                .lineTo(nt.x, nt.y - nodeRadius);
            edgeTexts[curr.node.nodeId] = new PIXI.Text(`${codeTable[curr.node.inEdge]}`, textStyle);
            edgeTexts[curr.node.nodeId].position.set(x - (nodeMargin / 4.5), y - (nodeMargin / 1.8));
            edgeTexts[curr.node.nodeId].anchor.set(0.5, 0.5);
        }

        for (let e of curr.node.edges) {
            queue.push({ par: curr.node, node: e.child });
        }
    }

    return {
        nodeGraphics: nodeGraphics,
        nodeTexts: nodeTexts,
        edgeGraphics: edgeGraphics,
        edgeTexts: edgeTexts,
    };
}
