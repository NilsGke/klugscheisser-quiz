import { useEffect } from "react";

const useClick = (callback: (e: Event) => void) => {
    useEffect(() => {
        document.addEventListener("click", callback);
        return () => document.removeEventListener("click", callback);
    }, [callback]);
};

export default useClick;
