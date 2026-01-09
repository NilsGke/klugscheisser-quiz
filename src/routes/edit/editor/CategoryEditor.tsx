import { FC, useEffect, useRef, useState } from "react";
import {
    AnyIndexedMedia,
    MediaType,
    MediaTypes,
    PartialCategory,
    PartialField,
    PartialResource,
    Resource,
} from "$types/categoryTypes";
import { getStoredFile } from "$db/media";
import removeIcon from "$assets/close.svg";
import ResourceRenderer from "$components/ResourceRenderer";
import Diashow from "$components/Diashow";

type props = {
    category: PartialCategory;
    setCategory: (newCategory: PartialCategory) => void;
    chooseField:
        | ((fieldIndex: number, type: keyof PartialField) => void)
        | undefined;
};

const CategoryEditor: FC<props> = ({ category, setCategory, chooseField }) => {
    return (
        <div className="EditorCategory">
            {category.fields.map((field, fieldIndex) => (
                <Field
                    key={fieldIndex}
                    fieldIndex={fieldIndex}
                    category={category}
                    setCategory={setCategory}
                    choose={
                        chooseField
                            ? (type) => chooseField(fieldIndex, type)
                            : undefined
                    }
                />
            ))}
        </div>
    );
};

const Field = ({
    fieldIndex,
    category,
    setCategory,
    choose,
}: {
    fieldIndex: number;
    category: PartialCategory;
    setCategory: (newCategory: PartialCategory) => void;
    choose: ((type: keyof PartialField) => void) | undefined;
}) => {
    return (
        <div className="field">
            <h3>{(fieldIndex + 1) * 100}</h3>
            <div className="content">
                <div className="question">
                    {choose ? (
                        <div
                            className="choose"
                            onClick={() => choose("question")}
                        >
                            click here to add
                        </div>
                    ) : null}
                    <MediaElement
                        fieldIndex={fieldIndex}
                        type="question"
                        category={category}
                        setCategory={setCategory}
                    />
                </div>
                <div className="answer">
                    {choose ? (
                        <div
                            className="choose"
                            onClick={() => choose("answer")}
                        >
                            click here to add
                        </div>
                    ) : null}
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
        resource ? (resource.type === "text" ? resource.content : "") : "",
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

            const [newResourceType, dbIndexString] = id.split("_") as [
                MediaType,
                string,
            ];
            const dbIndex = parseInt(dbIndexString);

            if (!MediaTypes.includes(newResourceType))
                throw new Error(
                    `new media type (${newResourceType}) is not in MediaTypes`,
                );
            if (isNaN(dbIndex))
                throw new Error("db index is not a number: " + dbIndexString);

            const newFile = (await getStoredFile(
                newResourceType,
                dbIndex,
            )) as AnyIndexedMedia;

            newFile.dbIndex = dbIndex;

            const oldResource = category.fields[fieldIndex][type];
            const newCategory: PartialCategory = Object.assign(category, {});
            let newResource: PartialResource;

            if (oldResource?.type === "image" && newResourceType === "image") {
                //FIXME no duplicates!
                if (
                    oldResource.content.size === newFile.size &&
                    oldResource.content.name === newFile.name
                )
                    return;
                newResource = {
                    type: "imageCollection",
                    content: [oldResource.content, newFile],
                };
            } else if (
                oldResource?.type === "imageCollection" &&
                newResourceType === "image"
            ) {
                if (
                    oldResource.content.some(
                        (file) =>
                            file.size === newFile.size &&
                            file.name === newFile.name,
                    )
                )
                    return;
                newResource = {
                    type: "imageCollection",
                    content: [...oldResource.content, newFile],
                };
            } else
                newResource = {
                    type: newResourceType,
                    content: newFile,
                } as Resource;

            newCategory.fields[fieldIndex][type] = newResource;

            setCategory(newCategory);
        };

        mediaElementRef.current.addEventListener("dragover", dragOverHandler);
        mediaElementRef.current.addEventListener("drop", dropHandler);

        return () => {
            if (mediaElementRef.current === null) return;
            mediaElementRef.current.removeEventListener(
                "dragover",
                dragOverHandler,
            );
            mediaElementRef.current.removeEventListener("drop", dropHandler);
        };
    }, [mediaElementRef.current, fieldIndex]);

    // generate content
    let content: JSX.Element = <></>;

    const RemoveButton = (
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
    );

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
            <>
                <div className="text">
                    <textarea
                        ref={textAreaRef}
                        placeholder="enter text..."
                        onChange={(e) => setText(e.target.value)}
                        value={text}
                    />
                </div>
                {RemoveButton}
            </>
        );
    else if (resource.type === "imageCollection")
        content = (
            <>
                <Diashow
                    images={resource.content}
                    setImages={(newImages) => {
                        category.fields[fieldIndex][type] = {
                            type: "imageCollection",
                            content: newImages,
                        };
                        setCategory(category);
                    }}
                    edit
                />
                {RemoveButton}
            </>
        );
    else
        content = (
            <>
                <ResourceRenderer
                    resource={resource}
                    onVolumeChange={(value) => {
                        if (resource.type === "image") return;

                        const newCategory = Object.assign(category, {});
                        newCategory.fields[fieldIndex][type] = Object.assign(
                            resource,
                            {
                                volume: value,
                            },
                        );
                        setCategory(newCategory);
                    }}
                />
                {RemoveButton}
            </>
        );

    return (
        <div className="mediaElement" ref={mediaElementRef}>
            {content}
        </div>
    );
};
export default CategoryEditor;
