import { FC, useEffect, useRef, useState } from "react";
import "./TimeBar.scss";

type props = {
    time: number; // milliseconds
    stop?: boolean;
};

const TimeBar: FC<props> = ({ time, stop }) => {
    const progressRef = useRef<HTMLDivElement>(null);

    const [animation, setAnimation] = useState<Animation | undefined>(
        undefined
    );

    useEffect(() => {
        if (progressRef.current === null)
            throw new Error("progressRef is null -> cannot animate it");

        setAnimation(
            progressRef.current.animate(
                [
                    {
                        width: "0%",
                    },
                    {
                        width: "100%",
                    },
                ],
                {
                    duration: time,
                    easing: "ease-out",
                }
            )
        );
    }, []);

    useEffect(() => {
        if (stop && animation) animation.pause();
    }, [stop, animation]);

    return (
        <div className="timeBarContainer">
            <div className="progress" ref={progressRef}></div>
        </div>
    );
};

export default TimeBar;
