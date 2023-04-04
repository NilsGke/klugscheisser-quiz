import { useCallback, useEffect } from "react";

const useClick = (callback: () => void) => {
    const handleClick = useCallback(callback, [callback]);
    useEffect(() => {
        document.addEventListener("click", handleClick);
        return document.removeEventListener("click", handleClick);
    }, []);
};


export default useClick