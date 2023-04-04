import { useEffect } from "react";

const useKeyboard = (callback: (e: KeyboardEvent["key"]) => void) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => callback(e.key);
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);
};

export default useKeyboard;
