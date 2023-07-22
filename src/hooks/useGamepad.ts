import {
    CustomGamepadEventMap,
    gamepadEvents,
    gamepads,
} from "$helpers/gamepad";
import { useState, useEffect, useCallback } from "react";

const useGamepad = (callback: (id: number) => void) => {
    const [connected, setConnected] = useState(
        !(
            Object.keys(gamepads).length === 0 &&
            Object.getPrototypeOf(gamepads) === Object.prototype
        )
    );

    const refresh = () => {
        setConnected(
            !(
                Object.keys(gamepads).length === 0 &&
                Object.getPrototypeOf(gamepads) === Object.prototype
            )
        );
    };

    // connecting / disconnecting
    useEffect(() => {
        window.addEventListener("gamepadconnected", refresh);
        window.addEventListener("gamepaddisconnected", refresh);

        return () => {
            window.removeEventListener("gamepadconnected", refresh);
            window.removeEventListener("gamepaddisconnected", refresh);
        };
    }, []);

    const handleButtonpress = useCallback(
        (event: CustomGamepadEventMap["buttonpress"]) => callback(event.detail),
        [callback]
    );

    // listen to buttonpresses
    useEffect(() => {
        gamepadEvents.addEventListener("buttonpress", handleButtonpress);
        return () =>
            gamepadEvents.removeEventListener("buttonpress", handleButtonpress);
    }, [handleButtonpress]);

    return { connected };
};

export default useGamepad;
