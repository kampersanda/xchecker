import * as PIXI from "pixi.js"

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

export function makeSolutions(bcSize: number, alphSize: number) {
    let permutation = new Array<number>(bcSize - 1);
    for (let i = 1; i < bcSize; i++) {
        permutation[i - 1] = i;
    }
    permutation = shuffle(permutation);

    let cursor = 0;
    let posLists = new Array<Array<number>>();

    const minDegree = Math.min(2, alphSize);
    const maxDegree = Math.min(4, alphSize);

    while (cursor < permutation.length) {
        const degree = getRandomInt(minDegree, maxDegree);

        let posList = new Array<number>();
        posList.push(permutation[cursor]);

        let minPos = permutation[cursor];
        let maxPos = permutation[cursor];

        for (let i = cursor + 1; i < permutation.length; i++) {
            if (posList.length > degree) {
                break;
            }

            const candidate = permutation[i];
            if (candidate == -1) {
                continue;
            }

            if (candidate < minPos) {
                if (getRangeSize(candidate, maxPos) > alphSize) {
                    continue;
                }
                minPos = candidate;
            } else if (candidate > maxPos) {
                if (getRangeSize(minPos, candidate) > alphSize) {
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
        let edgeList = new Array<number>(posList.length);

        const rangeSize = getRangeSize(posList[0], posList[posList.length - 1]);
        const shiftable = alphSize - rangeSize;

        let shift = 0;
        if (posList[0] < alphSize) { // 左への溢れ
            shift = 0;
        } else if (posList[posList.length - 1] >= bcSize - alphSize) { // 右への溢れ
            shift = Math.min(shiftable, alphSize - (bcSize - posList[posList.length - 1]));
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
