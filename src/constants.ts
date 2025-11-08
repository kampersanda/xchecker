/**
 * Centralized styling, layout, and gameplay constants shared across scenes.
 */
import * as PIXI from "pixi.js";

export const CANVAS = {
    width: 1400,
    height: 850,
};

export const FONT_FAMILY = "MPLUSRounded1c-Regular";
export const TITLE_FAMILY = "\"Comic Sans MS\", cursive, sans-serif";

export const TEXT_STYLE = new PIXI.TextStyle({
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fill: 0x000000,
});

export const Palette = {
    Black: "#000000",
    White: "#FFFFFF",
    Red: "#ED1C22",
    Yellow: "#FEC907",
    Blue: "#1373C7",
} as const;

export enum DifficultyLevel {
    Easy = "Easy",
    Hard = "Hard",
}

export interface DifficultyPreset {
    level: DifficultyLevel;
    bcSize: number;
    alphSize: number;
}

export const DifficultyPresets: Record<DifficultyLevel, DifficultyPreset> = {
    [DifficultyLevel.Easy]: { level: DifficultyLevel.Easy, bcSize: 16, alphSize: 4 },
    [DifficultyLevel.Hard]: { level: DifficultyLevel.Hard, bcSize: 20, alphSize: 6 },
};

export const CODE_TABLE = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const SELECT_DESCRIPTION =
    'トライからダブル配列を構築するゲームです\n' +
    '隙間なく要素を配置できればクリアです\n' +
    '（方向キーで操作します）';
