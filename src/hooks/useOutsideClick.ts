import { useEffect, useRef } from "react";

const useOutsideClick = (callback: () => any) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) callback();
  };

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return ref;
};

export default useOutsideClick;
