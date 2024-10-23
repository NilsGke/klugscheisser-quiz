import { useRef, useEffect, useState } from "react";

const useStringifyChange = (thing: any, callback: () => void) => {
  const ref = useRef<string>("");
  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false);
      ref.current = JSON.stringify(thing);
      return;
    }

    const stringyThing = JSON.stringify(thing);

    if (ref.current !== stringyThing) {
      console.log(thing);
      callback();
      ref.current = stringyThing;
    }
  }, [thing]);
};

export default useStringifyChange;
