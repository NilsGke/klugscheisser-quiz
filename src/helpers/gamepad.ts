export const gamepads: { [key: number]: Gamepad } = {};

function gamepadHandler(event: GamepadEvent, connecting: boolean) {
    const gamepad = event.gamepad;

    if (connecting) {
        gamepads[gamepad.index] = gamepad;
    } else {
        delete gamepads[gamepad.index];
    }
}

const connect = (e: GamepadEvent) => gamepadHandler(e, true);
const disconnect = (e: GamepadEvent) => gamepadHandler(e, false);

window.addEventListener("gamepadconnected", connect, false);
window.addEventListener("gamepaddisconnected", disconnect, false);

export interface CustomGamepadEventMap {
    buttonpress: CustomEvent<{ gamepad: number; button: number }>;
}
interface GamepadEvents {
    //adds definition to Document, but you can do the same with HTMLElement
    addEventListener<K extends keyof CustomGamepadEventMap>(
        type: K,
        listener: (this: Document, ev: CustomGamepadEventMap[K]) => void
    ): void;
    removeEventListener<K extends keyof CustomGamepadEventMap>(
        type: K,
        listener: (this: Document, ev: CustomGamepadEventMap[K]) => void
    ): void;
    dispatchEvent<K extends keyof CustomGamepadEventMap>(
        ev: CustomGamepadEventMap[K]
    ): void;
}

export const gamepadEvents: GamepadEvents = document.createElement("a");

const pressed: { button: number; gamepad: number }[] = [];

const update = () => {
    const pads = navigator.getGamepads();
    for (const gamepad of pads) {
        if (gamepad) {
            gamepads[gamepad.index] = gamepad;
        }
    }

    Object.keys(gamepads).forEach((gamepadIdString) => {
        const gamepadId = parseInt(gamepadIdString);
        const controller = gamepads[gamepadId];
        controller.buttons.forEach((button, i) => {
            if (button.pressed) {
                if (!pressed.map((b) => b.button).includes(i)) {
                    gamepadEvents.dispatchEvent(
                        new CustomEvent<
                            CustomGamepadEventMap["buttonpress"]["detail"]
                        >("buttonpress", {
                            detail: {
                                button: i,
                                gamepad: gamepadId,
                            },
                        })
                    );

                    pressed.push({ button: i, gamepad: gamepadId });
                }
            } else if (pressed.map((b) => b.button).includes(i))
                pressed.splice(
                    pressed.findIndex((b) => b.button === i),
                    1
                );
        });
    });

    window.requestAnimationFrame(update);
};

window.requestAnimationFrame(update);
