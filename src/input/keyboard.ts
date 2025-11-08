/**
 * Keyboard helper utilities for mapping DOM events into scene-friendly bindings.
 */
export type KeyHandler = () => void;

/**
 * Runtime state tracked for a single key binding.
 */
export interface KeyBinding {
    value: string;
    isDown: boolean;
    isUp: boolean;
    isProcessed: boolean;
    press?: KeyHandler;
    release?: KeyHandler;
    unsubscribe: () => void;
}

/**
 * Convenience bundle of the keys used across the game.
 */
export interface GameKeys {
    enter: KeyBinding;
    left: KeyBinding;
    right: KeyBinding;
    down: KeyBinding;
}

/**
 * Creates a key binding that toggles state and optional callbacks on DOM events.
 */
export function createKey(value: string, press?: KeyHandler, release?: KeyHandler): KeyBinding {
    const key: KeyBinding = {
        value,
        isDown: false,
        isUp: true,
        isProcessed: false,
        press,
        release,
        unsubscribe: () => { /* placeholder overwritten below */ },
    };

    const downHandler = (event: KeyboardEvent) => {
        if (event.key === key.value) {
            if (key.isUp && key.press) {
                key.press();
            }
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    const upHandler = (event: KeyboardEvent) => {
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

    window.addEventListener("keydown", downHandler, false);
    window.addEventListener("keyup", upHandler, false);

    key.unsubscribe = () => {
        window.removeEventListener("keydown", downHandler);
        window.removeEventListener("keyup", upHandler);
    };

    return key;
}
