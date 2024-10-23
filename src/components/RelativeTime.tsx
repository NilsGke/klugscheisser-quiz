import getRelativeTime from "$helpers/getRelativeTime";
import { ReactNode, useEffect, useState } from "react";

export default function RelativeTime({ time }: { time: number }) {
  const [timeString, setTimeString] = useState(getRelativeTime(time).result);
  const [updateIn, setUpdateIn] = useState(1000);

  const update = () => {
    const { result, updateIn } = getRelativeTime(time);
    setTimeString(result);
    setUpdateIn(updateIn);
  };

  useEffect(() => {
    const interval = setInterval(update, updateIn);
    return () => clearInterval(interval);
  }, [updateIn]);

  return <>{timeString}</>;
}
