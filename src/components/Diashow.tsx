import { useEffect, useState, useRef } from "react";
import { Image } from "$types/categoryTypes";
import ResourceRenderer from "./ResourceRenderer";
import "./Diashow.scss";
import TimeBar from "./TimeBar";

import editIcon from "$assets/edit.svg";
import closeIcon from "$assets/close.svg";
import moveIcon from "$assets/arrow.svg";
import removeIcon from "$assets/trash.svg";
import autoAnimate from "@formkit/auto-animate";

type props = {
    images: Image[];
    show?: boolean;
    edit?: boolean;
    view?: boolean;
    setImages?: (images: Image[]) => void;
    stop?: boolean;
};

const time = 5000;

const Diashow = ({ images, show, edit, view, setImages, stop }: props) => {
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
            const timer = stop ? undefined : setInterval(nextImage, time);

            return () => clearInterval(timer);
        }, [stop]);

    const cellSize =
        Math.round(100 / Math.ceil(Math.sqrt(images.length))) + "%";

    const [editorOpen, setEditorOpen] = useState(false);
    const editorImagesRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (editorImagesRef.current) autoAnimate(editorImagesRef.current);
    }, []);

    const move = (index: number, direction: 1 | -1) => {
        if (setImages === undefined) return;

        const newImages = images.slice();

        [newImages[index], newImages[index + direction]] = [
            newImages[index + direction],
            newImages[index],
        ];

        setImages(newImages);
    };

    const remove = (index: number) => {
        if (setImages === undefined) return;

        const newImages = images.slice();

        newImages.splice(index, 1);

        setImages(newImages);
    };

    return (
        <>
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
                            <TimeBar key={current} time={time} stop={stop} />
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
                        <button
                            className="big"
                            onClick={() => setEditorOpen(true)}
                        >
                            <img src={editIcon} alt="open" />
                        </button>
                        <div className="images">
                            {images
                                .slice()
                                .reverse()
                                .map((image, index) => (
                                    <ResourceRenderer
                                        key={image.size + index}
                                        resource={{
                                            type: "image",
                                            content: image,
                                        }}
                                        style={{
                                            left: `calc(40% / ${
                                                images.length
                                            } * ${images.length - 1 - index})`,
                                            filter: `brightness(${
                                                (100 *
                                                    (1 / images.length) *
                                                    (index + 1)) /
                                                    2 +
                                                50
                                            }%)`,
                                        }}
                                    />
                                ))}
                        </div>
                    </div>
                ) : null}

                {view ? (
                    <div className="view images">
                        {images.map((image) => (
                            <ResourceRenderer
                                resource={{
                                    type: "image",
                                    content: image,
                                }}
                            />
                        ))}
                    </div>
                ) : null}

                <div
                    className="editorWrapper"
                    style={{
                        opacity: editorOpen ? 1 : 0,
                        zIndex: editorOpen ? 1 : -1,
                    }}
                >
                    <div className="editor">
                        <button
                            className="close"
                            onClick={() => setEditorOpen(false)}
                        >
                            <img src={closeIcon} alt="closeIcon" />
                        </button>
                        <div className="images" ref={editorImagesRef}>
                            {images.slice().map((image, index) => (
                                <div
                                    className="image"
                                    key={
                                        image.name +
                                        image.size +
                                        image.lastModified
                                    }
                                >
                                    <ResourceRenderer
                                        resource={{
                                            type: "image",
                                            content: image,
                                        }}
                                    />
                                    <div className="controls">
                                        {index !== 0 ? (
                                            <button
                                                className="left"
                                                onClick={() => move(index, -1)}
                                            >
                                                <img
                                                    src={moveIcon}
                                                    alt="move left"
                                                />
                                            </button>
                                        ) : null}

                                        <button
                                            className="remove"
                                            onClick={() => remove(index)}
                                        >
                                            <img
                                                src={removeIcon}
                                                alt="remove"
                                            />
                                        </button>

                                        {index !== images.length - 1 ? (
                                            <button
                                                className="right"
                                                onClick={() => move(index, 1)}
                                            >
                                                <img
                                                    src={moveIcon}
                                                    alt="move right"
                                                />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Diashow;
