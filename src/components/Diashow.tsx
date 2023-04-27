import { useEffect, useState, useRef } from "react";
import { Image } from "$types/categoryTypes";
import ResourceRenderer from "./ResourceRenderer";
import "./Diashow.scss";
import TimeBar from "./TimeBar";
import autoAnimate from "@formkit/auto-animate";

import editIcon from "$assets/edit.svg";
import closeIcon from "$assets/close.svg";
import moveIcon from "$assets/arrow.svg";
import removeIcon from "$assets/trash.svg";
import cursorClickIcon from "$assets/cursorClick.svg";
import cycleIcon from "$assets/cycle.svg";
import arrowIcon from "$assets/arrow.svg";
import useKeyboard from "$hooks/keyboard";

type props = {
    images: Image[];
    show?: boolean;
    edit?: boolean;
    view?: boolean;
    setImages?: (images: Image[]) => void;
    autoSkip?: boolean;
    setAutoSkip?: (auto: boolean) => void;
    stop?: boolean;
};

const time = 5000;

const Diashow = ({
    images,
    show,
    edit,
    view,
    setImages,
    autoSkip,
    setAutoSkip,
    stop,
}: props) => {
    const [current, setCurrent] = useState(0);
    const [done, setDone] = useState(false);

    // auto skip
    if (show && autoSkip)
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

    // manual skip (keyboard)
    const prevImage = () => setCurrent((prev) => (prev === 0 ? 0 : prev - 1));
    const nextImage = () =>
        setCurrent((prev) =>
            current < images.length - 1 ? prev + 1 : images.length - 1
        );
    if (show && !autoSkip) {
        useKeyboard((key) => {
            if (key === "ArrowLeft") prevImage();
            if (key === "ArrowRight") nextImage();
            if (!isNaN(parseInt(key)))
                setTimeout(() => {
                    (document.activeElement as HTMLButtonElement).blur();
                }, 10);
        });
    }

    const imageContainerRef = useRef<HTMLImageElement>(null);
    useEffect(() => {
        if (imageContainerRef.current) autoAnimate(imageContainerRef.current);
    }, [imageContainerRef.current]);

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

                            {!autoSkip ? (
                                <button
                                    className="prev"
                                    onClick={prevImage}
                                    style={{
                                        opacity: current === 0 ? 0 : 1,
                                    }}
                                >
                                    <img src={arrowIcon} alt="arrow left" />
                                </button>
                            ) : null}

                            <div className="images" ref={imageContainerRef}>
                                <ResourceRenderer
                                    key={current}
                                    resource={{
                                        type: "image",
                                        content: images[current],
                                    }}
                                />
                            </div>

                            {!autoSkip ? (
                                <button
                                    className="next"
                                    onClick={nextImage}
                                    style={{
                                        opacity:
                                            current < images.length - 1 ? 1 : 0,
                                    }}
                                >
                                    <img src={arrowIcon} alt="arrow right" />
                                </button>
                            ) : null}

                            {autoSkip ? (
                                <TimeBar
                                    key={current}
                                    time={time}
                                    stop={stop}
                                />
                            ) : null}
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
                    <>
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
                                                } * ${
                                                    images.length - 1 - index
                                                })`,
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
                            <button
                                className="auto"
                                onClick={() =>
                                    setAutoSkip && setAutoSkip(!autoSkip)
                                }
                            >
                                {autoSkip ? (
                                    <img
                                        src={cycleIcon}
                                        alt="cycle icon"
                                        title="auto cycle between images"
                                    />
                                ) : (
                                    <img
                                        src={cursorClickIcon}
                                        alt="click icon"
                                        title="click to reveal next image"
                                    />
                                )}
                            </button>
                        </div>

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
                                                        onClick={() =>
                                                            move(index, -1)
                                                        }
                                                    >
                                                        <img
                                                            src={moveIcon}
                                                            alt="move left"
                                                        />
                                                    </button>
                                                ) : null}

                                                <button
                                                    className="remove"
                                                    onClick={() =>
                                                        remove(index)
                                                    }
                                                >
                                                    <img
                                                        src={removeIcon}
                                                        alt="remove"
                                                    />
                                                </button>

                                                {index !== images.length - 1 ? (
                                                    <button
                                                        className="right"
                                                        onClick={() =>
                                                            move(index, 1)
                                                        }
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
                    </>
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
            </div>
        </>
    );
};

export default Diashow;
