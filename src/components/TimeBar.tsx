import { FC, useEffect, useRef, useState } from "react";
import "./TimeBar.scss";

type props = {
    time: number; // milliseconds
};

const TimeBar: FC<props> = ({ time }) => {
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (progressRef.current === null)
            throw new Error("progressRef is null -> cannot animate it");

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
        );
    }, []);

    return (
        <div className="timeBarContainer">
            <div className="progress" ref={progressRef}></div>
        </div>
    );
};

export default TimeBar;
