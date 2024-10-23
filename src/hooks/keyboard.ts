import { useEffect } from "react";

const useKeyboard = (
  callback: (key: KeyboardEvent["key"], e: KeyboardEvent) => void,
) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => callback(e.key, e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [callback]);
};

export default useKeyboard;
