export interface Timer {
    readonly seconds: number;
    reset(): void;
}

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
