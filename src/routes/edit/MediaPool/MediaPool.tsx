import { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { IndexedFile, MediaType, Resource } from "$types/categoryTypes";
import "./MediaPool.scss";
import {
    deleteStoredFile,
    getStoredFiles,
    getStoredFilesLength,
    storeFileInIndexedDB,
} from "$db/media";
import toast from "react-simple-toasts";
import DotSpinner from "$components/DotSpinner";

// assets
import audioIcon from "$assets/audioFile.svg";
import imageIcon from "$assets/image.svg";
import videoIcon from "$assets/videoCam.svg";
import trashIcon from "$assets/delete.svg";
import arrowIcon from "$assets/arrow.svg";
import dotsIcon from "$assets/dots.svg";
import fullscreenIcon from "$assets/fullscreen.svg";

import { confirmAlert } from "react-confirm-alert";
import autoAnimate from "@formkit/auto-animate";
import AudioPlayer from "$components/AudioPlayer";
import VideoPlayer from "$components/VideoPlayer";
import { Indexed } from "$db/indexeddb";
import useOutsideClick from "$hooks/useOutsideClick";
import ResourceRenderer from "$components/ResourceRenderer";

const MediaPool = ({
    addToCateogry,
}: {
    addToCateogry: (resource: Resource) => void;
}) => {
    const [mediaType, setMediaType] = useState<MediaType>("image");

    const [files, setFiles] = useState<IndexedFile[]>([]);

    const [length, setLength] = useState<number>(Infinity);
    const [gotAllFiles, setGotAllFiles] = useState(false);

    // retrieve length on first render
    useEffect(() => {
        getStoredFilesLength(mediaType).then(setLength);
    }, [files, mediaType]);

    const [loadMore, setLoadMore] = useState(false);
    useEffect(() => {
        if (loadMore) {
            getStoredFiles(
                mediaType,
                (files.at(-1)?.dbIndex || 999999999999) - 1,
                10
            )
                .then((newFiles) => setFiles((prev) => [...prev, ...newFiles]))
                .then(() => setLoadMore(false));
        }
    }, [loadMore, files]);
    // check if need to load more on file change (-> screen should be filled)
    useEffect(() => {
        if (length === files.length) setGotAllFiles(true);
        else checkScroll();
    }, [files, mediaType]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const checkScroll = useCallback(() => {
        if (loadMore || bottomRef.current === null || listRef.current === null)
            return;

        const containerRect = listRef.current.getBoundingClientRect();
        const bottomRect = bottomRef.current.getBoundingClientRect();

        if (containerRect.bottom >= bottomRect.top - 50) setLoadMore(true);
    }, [bottomRef, listRef, files, loadMore]);

    // animate media
    const mediaRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (mediaRef.current) autoAnimate(mediaRef.current);
    }, []);

    // scroll listener
    useEffect(() => {
        const scrollHandler = (e: Event) => checkScroll();

        if (bottomRef.current && listRef.current)
            listRef.current.addEventListener("scroll", scrollHandler);

        return () => {
            if (listRef.current)
                listRef.current.removeEventListener("scroll", scrollHandler);
        };
    }, [bottomRef, listRef]);

    const changeMediaType = (mediaType: MediaType) => {
        setFiles([]);
        setGotAllFiles(false);
        setLength(Infinity);
        setMediaType(mediaType);
    };

    return (
        <div className="mediaPool" ref={listRef}>
            <h2>Media</h2>
            <div className="header">
                <div className="toggle">
                    <button
                        className={mediaType === "image" ? " selected" : ""}
                        onClick={() => changeMediaType("image")}
                    >
                        Images
                    </button>
                    <button
                        className={mediaType === "video" ? " selected" : ""}
                        onClick={() => changeMediaType("video")}
                    >
                        Video
                    </button>
                    <button
                        className={mediaType === "audio" ? " selected" : ""}
                        onClick={() => changeMediaType("audio")}
                    >
                        Audio
                    </button>
                </div>
            </div>
            <div className="media" ref={mediaRef}>
                <div className="file addMedia" key={mediaType + "addMore"}>
                    <label htmlFor="fileInput">
                        <img
                            draggable="false"
                            src={
                                mediaType === "audio"
                                    ? audioIcon
                                    : mediaType === "image"
                                    ? imageIcon
                                    : mediaType === "text"
                                    ? ""
                                    : mediaType === "video"
                                    ? videoIcon
                                    : ""
                            }
                            alt={mediaType + "icon"}
                        />
                        <input
                            type="file"
                            name="fileInput"
                            id="fileInput"
                            accept={
                                mediaType === "audio"
                                    ? "audio/*"
                                    : mediaType === "image"
                                    ? "image/*"
                                    : mediaType === "video"
                                    ? "video/*"
                                    : ""
                            }
                            multiple
                            onChange={async (e) => {
                                const files = e.target.files;
                                if (files !== null && files.length !== 0)
                                    for (let i = 0; i < files.length; i++) {
                                        const file = files[i];
                                        await storeFileInIndexedDB(
                                            file,
                                            mediaType
                                        ).then((dbIndex) => {
                                            const indexedFile =
                                                file as IndexedFile;
                                            indexedFile.dbIndex = dbIndex;
                                            setFiles((prev) => [
                                                indexedFile,
                                                ...prev,
                                            ]);
                                            setLength((prev) => prev + 1);
                                            toast(`added ${mediaType}`);
                                        });
                                    }
                            }}
                        />
                        <sub>add {mediaType}s</sub>
                    </label>
                </div>

                {files.map((file) => (
                    <File
                        key={file.name + file.size}
                        file={file}
                        mediaType={mediaType}
                        addToCateogry={() => {
                            addToCateogry({
                                type: mediaType,
                                content: file,
                            } as Resource);
                            console.log("asdf");
                        }}
                        deleteFile={() =>
                            deleteStoredFile(mediaType, file.dbIndex).then(
                                () => {
                                    setFiles((prev) =>
                                        prev.filter(
                                            (f) => f.dbIndex !== file.dbIndex
                                        )
                                    );
                                    setLength((prev) => prev - 1);
                                    checkScroll();
                                }
                            )
                        }
                    />
                ))}

                {!gotAllFiles ? (
                    <div
                        className="file bottom"
                        ref={bottomRef}
                        key="bottom"
                        onClick={checkScroll}
                    >
                        <DotSpinner />
                        <sub>click to load more</sub>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default MediaPool;

const File = ({
    file,
    mediaType,
    deleteFile,
    addToCateogry,
}: {
    file: Indexed<File>;
    mediaType: MediaType;
    deleteFile: () => void;
    addToCateogry: () => void;
}) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const url = useRef("");

    // drag 'n drop
    const dragStart = (event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData(
            "text/plain",
            (event.target as HTMLElement).id
        );

        const objectUrl = URL.createObjectURL(file);
        url.current = objectUrl;
        event.dataTransfer.setData("text/uri-list", objectUrl);

        event.dataTransfer.dropEffect = "copy";
    };
    const dragEnd = () =>
        setTimeout(() => {
            URL.revokeObjectURL(url.current);
            url.current = "";
        }, 1000);

    let MediaElement = <div>no player found for this media element</div>;

    if (mediaType === "image") {
        const url = URL.createObjectURL(file);
        MediaElement = (
            <img
                src={url}
                alt={file.name}
                draggable="false"
                onLoad={() => URL.revokeObjectURL(url)}
                loading="lazy"
            />
        );
    } else if (mediaType === "video")
        MediaElement = <VideoPlayer file={file} small={true} />;
    else if (mediaType === "audio") MediaElement = <AudioPlayer file={file} />;

    const deleteFun = () => {
        confirmAlert({
            title: `Delete ${mediaType} from Cache?`,
            message: "This cannot be undone",
            childrenElement: () => (
                <ResourceRenderer
                    resource={{ type: mediaType, content: file } as Resource}
                />
            ),
            buttons: [
                {
                    label: "Delete",
                    onClick: () => {
                        deleteFile();
                        setPopoverOpen(false);
                    },
                },
                {
                    label: "Cancel",
                },
            ],
            overlayClassName: "popupOverlay",
            closeOnEscape: true,
            closeOnClickOutside: true,
        });
    };

    return (
        <div
            className="file"
            id={mediaType + "_" + file.dbIndex}
            onDragStart={(e) => dragStart(e)}
            onDragEnd={dragEnd}
            draggable
        >
            {MediaElement}
            <button
                className="dots"
                onClick={() => setPopoverOpen((prev) => !prev)}
            >
                <img src={dotsIcon} alt="dot menu icon" />
            </button>

            {popoverOpen ? (
                <Popover
                    close={() => setPopoverOpen(false)}
                    delete={deleteFun}
                    add={addToCateogry}
                    view={() => {
                        const url = URL.createObjectURL(file);
                        const newWindow = window.open(url);
                        if (newWindow)
                            newWindow.onload = () => URL.revokeObjectURL(url);
                    }}
                    rename={
                        mediaType === "audio"
                            ? () => {
                                  console.log("rename");
                                  //TODO add Renaming
                              }
                            : undefined
                    }
                />
            ) : null}
        </div>
    );
};

const Popover = ({
    rename,
    close,
    add,
    view,
    delete: deleteFun,
}: {
    close: () => void;
    delete: () => void;
    add: () => void;
    view: () => void;
    rename?: () => void;
}) => {
    // this is to prevent instant closing
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const popoverRef = useOutsideClick(close);

    return (
        <div className="popover" ref={mounted ? popoverRef : undefined}>
            <button className="add" onClick={add}>
                add <img src={arrowIcon} alt="arrow right" />
            </button>
            {/* TODO: renaming files */}
            {/* {rename ? (
                <button className="rename">
                    rename <img src={editIcon} alt="edit icon" />
                </button>
            ) : null} */}
            <button onClick={view}>
                view <img src={fullscreenIcon} alt="fullscreen icon" />
            </button>
            <button className="delete" onClick={deleteFun}>
                delete <img src={trashIcon} alt="trash icon" />
            </button>
        </div>
    );
};
