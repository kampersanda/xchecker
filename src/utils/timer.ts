/**
 * Lightweight timer utilities for tracking elapsed seconds at scene level.
 */
export interface Timer {
    readonly seconds: number;
    reset(): void;
}

/**
 * Creates a timer object that tracks elapsed seconds and can be reset.
 */
export function createTimer(): Timer {
    let start = new Date().getTime();
    return {
        get seconds() {
            return (new Date().getTime() - start) / 1000;
        },
        reset() {
            start = new Date().getTime();
        },
    };
}
