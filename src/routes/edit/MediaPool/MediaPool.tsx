import { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { IndexedFile, MediaType } from "../../../helpers/categoryTypes";
import "./MediaPool.scss";
import {
    deleteStoredFile,
    getStoredFiles,
    getStoredFilesLength,
    storeFileInIndexedDB,
} from "../../../helpers/indexeddb";
import toast from "react-simple-toasts";
import DotSpinner from "../../../components/DotSpinner";

// assets
import audioIcon from "../../../assets/audioFile.svg";
import imageIcon from "../../../assets/image.svg";
import videoIcon from "../../../assets/videoCam.svg";
import trashIcon from "../../../assets/delete.svg";
import { confirmAlert } from "react-confirm-alert";
import autoAnimate from "@formkit/auto-animate";

const MediaPool = () => {
    const [mediaType, setMediaType] = useState<MediaType>("image");

    const [dataSource, setDataSource] = useState<"local" | "external">("local");
    const [files, setFiles] = useState<IndexedFile[]>([]);

    const [length, setLength] = useState<number>(Infinity);
    const [gotAllFiles, setGotAllFiles] = useState(false);

    // retrieve length on first render
    useEffect(() => {
        getStoredFilesLength(mediaType).then(setLength);
    }, [files]);

    const [loadMore, setLoadMore] = useState(false);
    useEffect(() => {
        if (loadMore) {
            getStoredFiles(
                mediaType,
                (files.at(-1)?.dbIndex || 999999999999) - 1,
                2
            )
                .then((newFiles) => setFiles((prev) => [...prev, ...newFiles]))
                .then(() => setLoadMore(false));
        }
    }, [loadMore, files]);
    // check if need to load more on file change (-> screen should be filled)
    useEffect(() => {
        if (length === files.length) setGotAllFiles(true);
        else checkScroll();
    }, [files]);

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

    // drag 'n drop
    const dragStart = (event: DragEvent<HTMLDivElement>, mediaUrl: string) => {
        event.dataTransfer.setData(
            "text/plain",
            (event.target as HTMLElement).id
        );
        event.dataTransfer.setData("text/uri-list", mediaUrl);
        event.dataTransfer.dropEffect = "copy";
    };

    return (
        <div className="mediaPool" ref={listRef}>
            <h2>Media</h2>
            <div className="header">
                <div className="toggle">
                    <button
                        className={
                            "local" +
                            (dataSource === "local" ? " selected" : "")
                        }
                    >
                        Local files
                    </button>
                    <button
                        className={
                            "external" +
                            (dataSource === "external" ? " selected" : "")
                        }
                    >
                        External
                    </button>
                </div>
            </div>
            <div className="media" ref={mediaRef}>
                <div className="file addMedia" key="addMore">
                    <label htmlFor="fileInput">
                        <img
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
                                            toast("image added");
                                        });
                                    }
                            }}
                        />
                        <sub>add {mediaType}s</sub>
                    </label>
                </div>

                {files.map((file) => {
                    const mediaURL = URL.createObjectURL(file);
                    if (mediaType === "image")
                        return (
                            <div
                                className="file"
                                key={file.name + file.size}
                                id={mediaType + "_" + file.dbIndex}
                                onDragStart={(e) => dragStart(e, mediaURL)}
                                draggable
                            >
                                <img
                                    src={mediaURL}
                                    alt={file.name}
                                    draggable="false"
                                />
                                <button
                                    className="delete"
                                    onClick={() =>
                                        confirmAlert({
                                            title: "Delete Image from Cache?",
                                            message: "This cannot be undone",
                                            childrenElement: () => (
                                                <img
                                                    src={mediaURL}
                                                    alt="image, you want to delete"
                                                />
                                            ),
                                            buttons: [
                                                {
                                                    label: "Delete",
                                                    onClick: () =>
                                                        deleteStoredFile(
                                                            mediaType,
                                                            file.dbIndex
                                                        ).then(() => {
                                                            setFiles((prev) =>
                                                                prev.filter(
                                                                    (f) =>
                                                                        f.dbIndex !==
                                                                        file.dbIndex
                                                                )
                                                            );
                                                            setLength(
                                                                (prev) =>
                                                                    prev - 1
                                                            );
                                                            checkScroll();
                                                        }),
                                                },
                                                {
                                                    label: "Cancel",
                                                },
                                            ],
                                            overlayClassName: "popupOverlay",
                                            closeOnEscape: true,
                                            closeOnClickOutside: true,
                                        })
                                    }
                                >
                                    <img
                                        src={trashIcon}
                                        alt="delete icon"
                                        draggable="false"
                                    />
                                </button>
                            </div>
                        );
                })}

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
