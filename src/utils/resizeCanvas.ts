/**
 * Responsive canvas helpers for keeping the PIXI stage within the viewport.
 */
import * as PIXI from "pixi.js";

/**
 * Resizes the renderer view proportionally so it fits in the browser window.
 */
export function resizeCanvas(app: PIXI.Application, defaultWidth: number, defaultHeight: number) {
    let canvasWidth = defaultWidth;
    let canvasHeight = defaultHeight;

    if (canvasWidth > window.innerWidth) {
        const ratio = window.innerWidth / canvasWidth;
        canvasWidth *= ratio;
        canvasHeight *= ratio;
    }
    if (canvasHeight > window.innerHeight) {
        const ratio = window.innerHeight / canvasHeight;
        canvasWidth *= ratio;
        canvasHeight *= ratio;
    }

    app.renderer.view.style.width = `${canvasWidth}px`;
    app.renderer.view.style.height = `${canvasHeight}px`;
}
