import { FC, useEffect, useRef, useState } from "react";
import {
    AnyIndexedMedia,
    MediaType,
    MediaTypes,
    PartialCategory,
} from "$types/categoryTypes";
import "./Category.scss";
import { getStoredFile } from "$db/media";
import removeIcon from "$assets/close.svg";
import ResourceRenderer from "$components/ResourceRenderer";

type props = {
    category: PartialCategory;
    setCategory: (newCategory: PartialCategory) => void;
};

const CategoryEditor: FC<props> = ({ category, setCategory }) => {
    return (
        <div className="category">
            {category.fields.map((field, fieldIndex) => (
                <Field
                    key={fieldIndex}
                    fieldIndex={fieldIndex}
                    category={category}
                    setCategory={setCategory}
                />
            ))}
        </div>
    );
};

const Field = ({
    fieldIndex,
    category,
    setCategory,
}: {
    fieldIndex: number;
    category: PartialCategory;
    setCategory: (newCategory: PartialCategory) => void;
}) => {
    return (
        <div className="field">
            <h3>{(fieldIndex + 1) * 100}</h3>
            <div className="content">
                <div className="question">
                    <MediaElement
                        fieldIndex={fieldIndex}
                        type="question"
                        category={category}
                        setCategory={setCategory}
                    />
                </div>
                <div className="answer">
                    <MediaElement
                        fieldIndex={fieldIndex}
                        type="answer"
                        category={category}
                        setCategory={setCategory}
                    />
                </div>
            </div>
        </div>
    );
};

const MediaElement = ({
    fieldIndex,
    type,
    category,
    setCategory,
}: {
    fieldIndex: number;
    type: "question" | "answer";
    category: PartialCategory;
    setCategory: (newCategory: PartialCategory) => void;
}) => {
    const resource = category.fields[fieldIndex][type];

    // handle text input
    const [text, setText] = useState(
        resource ? (resource.type === "text" ? resource.content : "") : ""
    );

    const blurHandler = () => {
        const newCategory = category;

        newCategory.fields[fieldIndex][type] = {
            type: "text",
            content: text,
        };

        setCategory(newCategory);
    };

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textAreaRef.current === null) return;
        textAreaRef.current.focus();
    }, [resource?.type]);
    useEffect(() => {
        if (
            textAreaRef.current === null ||
            resource === undefined ||
            resource.type !== "text"
        )
            return;
        textAreaRef.current.addEventListener("blur", blurHandler);

        return () => {
            if (textAreaRef.current === null) return;
            textAreaRef.current.removeEventListener("blur", blurHandler);
        };
    }, [resource?.type, text]);

    // handle drag and drop
    const mediaElementRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (mediaElementRef.current === null) return;

        const dragOverHandler = (e: DragEvent) => {
            if (e.dataTransfer === null) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        };
        const dropHandler = async (e: DragEvent) => {
            if (e.dataTransfer === null) return;
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain");

            const [newRessourceType, dbIndexString] = id.split("_") as [
                MediaType,
                string
            ];
            const dbIndex = parseInt(dbIndexString);

            if (!MediaTypes.includes(newRessourceType))
                throw new Error(
                    `new media type (${newRessourceType}) is not in MediaTypes`
                );
            if (isNaN(dbIndex))
                throw new Error("db index is not a number: " + dbIndexString);

            const newFile = (await getStoredFile(
                newRessourceType,
                dbIndex
            )) as AnyIndexedMedia;

            newFile.dbIndex = dbIndex;

            const newCategory = category;
            newCategory.fields[fieldIndex][type] = {
                type: newRessourceType as any,
                content: newFile,
            };

            setCategory(newCategory);
        };

        mediaElementRef.current.addEventListener("dragover", dragOverHandler);
        mediaElementRef.current.addEventListener("drop", dropHandler);

        return () => {
            if (mediaElementRef.current === null) return;
            mediaElementRef.current.addEventListener(
                "dragover",
                dragOverHandler
            );
            mediaElementRef.current.addEventListener("drop", dropHandler);
        };
    }, [mediaElementRef.current, fieldIndex]);

    // generate content
    let content: JSX.Element = <></>;

    if (resource === undefined || resource.type === undefined)
        return (
            <div className="mediaElement" ref={mediaElementRef}>
                <button
                    onClick={() => {
                        const newCategory = category;
                        newCategory.fields[fieldIndex][type] = {
                            type: "text",
                            content: "",
                        };
                        setCategory(newCategory);
                    }}
                    className="addMedia"
                >
                    click to add text or drop a media element
                </button>
            </div>
        );

    if (resource.type === "text")
        content = (
            <div className="text">
                <textarea
                    ref={textAreaRef}
                    placeholder="enter text..."
                    onChange={(e) => setText(e.target.value)}
                    value={text}
                />
                <button
                    className="remove"
                    onClick={() => {
                        const newCategory = category;
                        newCategory.fields[fieldIndex][type] = undefined;
                        setCategory(newCategory);
                    }}
                >
                    <img src={removeIcon} alt="remove" />
                </button>
            </div>
        );
    else
        content = (
            <ResourceRenderer
                resource={resource}
                onVolumeChange={(value) => {
                    if (resource.type === "image") return;

                    const newCategory = category;
                    newCategory.fields[fieldIndex][type] = Object.assign(
                        resource,
                        {
                            volume: value,
                        }
                    );
                    setCategory(newCategory);
                }}
            />
        );

    return (
        <div className="mediaElement" ref={mediaElementRef}>
            {content}
        </div>
    );
};
export default CategoryEditor;
