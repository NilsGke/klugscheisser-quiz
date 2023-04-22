import { useEffect, useState } from "react";
import { Image } from "$types/categoryTypes";
import ResourceRenderer from "./ResourceRenderer";
import "./Diashow.scss";
import TimeBar from "./TimeBar";

import openIcon from "$assets/fullscreen.svg";

type props = {
    images: Image[];
    show?: boolean;
    edit?: boolean;
};

const time = 4000;

const Diashow = ({ images, show, edit }: props) => {
    const [current, setCurrent] = useState(0);
    const [done, setDone] = useState(false);

    if (show)
        useEffect(() => {
            const nextImage = () => {
                setCurrent((prev) => {
                    if (prev === images.length - 1) {
                        setDone(true);
                        return 0;
                    } else return prev + 1;
                });
            };
            const timer = setInterval(nextImage, time);

            return () => clearInterval(timer);
        }, []);

    console.log(images[current]);

    const cellSize = Math.round(100 / Math.sqrt(images.length)) + "%";

    return (
        <div className="diashow">
            {show ? (
                !done ? (
                    <>
                        <div className="info">
                            {current + 1}/{images.length}
                        </div>
                        <div className="images">
                            <ResourceRenderer
                                key={current}
                                resource={{
                                    type: "image",
                                    content: images[current],
                                }}
                            />
                        </div>
                        <TimeBar key={current} time={time} />
                    </>
                ) : (
                    <div
                        className="all"
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        {images.map((image, index) => (
                            <ResourceRenderer
                                key={index}
                                resource={{ type: "image", content: image }}
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                }}
                            />
                        ))}
                    </div>
                )
            ) : null}

            {edit ? (
                <div className="edit">
                    <button className="big">
                        <img src={openIcon} alt="open" />
                    </button>
                    edit
                </div>
            ) : null}
        </div>
    );
};

export default Diashow;
