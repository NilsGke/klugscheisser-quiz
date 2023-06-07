import toast from "react-simple-toasts";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Category,
    Image,
    PartialCategory,
    Resource,
    indexCategory,
    isCategory,
} from "$types/categoryTypes";
import "./Editor.scss";
import MediaPool from "./MediaPool";
import CategoryEditor from "./CategoryEditor";
import { Indexed } from "$db/indexeddb";
import { storeCategoryInDB, updateCategoryInDB } from "$db/categories";
import BackButton from "$components/BackButton";
import testIcon from "$assets/test.svg";
import imageIcon from "$assets/image.svg";
import { confirmAlert } from "react-confirm-alert";
import useTitle from "$hooks/useTitle";
import useStringifyChange from "$hooks/useStringifyChange";
import { generateThumbnail } from "$helpers/thumbnail";

const Edit = ({
    initialCategory,
    dbIndex,
}: {
    initialCategory: PartialCategory;
    dbIndex?: Indexed<Category>["dbIndex"];
}) => {
    const [category, setCategory] = useState<PartialCategory>(initialCategory);
    const [name, setName] = useState(initialCategory.name);
    const [description, setDescription] = useState(initialCategory.description);
    const [thumbnail, setThumbnail] = useState(initialCategory.thumbnail);
    const [answerTime, setAnswerTime] = useState(initialCategory.answerTime);

    // unsaved changes
    const [unsavedChanges, setUnsavedChanges] = useState(dbIndex === undefined);

    useStringifyChange(category, () => setUnsavedChanges(true));
    useStringifyChange(name, () => setUnsavedChanges(true));
    useStringifyChange(description, () => setUnsavedChanges(true));
    useStringifyChange(answerTime, () => setUnsavedChanges(true));

    useTitle(`ksq - editor${name !== "" ? ": " + name : ""}`);

    // resource added by media pool (dot menu)
    const [addResource, setAddResource] = useState<Resource | null>(null);
    const mediaPoolRendered = useMemo(
        () => (
            <MediaPool addToCateogry={(resource) => setAddResource(resource)} />
        ),
        []
    ); // memo render so media does not have to reload on every render (dont acutally know if this is the case)

    const unloadHandler = useCallback(
        (e: BeforeUnloadEvent) => {
            console.log("beforeunload");

            if (unsavedChanges) {
                console.log("beforeunload stop");
                e.preventDefault();
                return (e.returnValue = "");
            }
        },
        [unsavedChanges]
    );

    // ask user to confirm unload
    useEffect(() => {
        if (!unsavedChanges) return;

        window.addEventListener("beforeunload", unloadHandler);
        return () => window.removeEventListener("beforeunload", unloadHandler);
    }, [unsavedChanges]);

    // exporting
    const saveCategory = async () => {
        // validate category
        if (
            !category.fields.every(
                (field) =>
                    field.question !== undefined && field.answer !== undefined
            )
        )
            return toast("❌please fill out every field");

        if (name.trim() === "") return toast("❌please enter a name");

        if (answerTime <= 0 || Number.isNaN(answerTime))
            return toast("❌please enter a (positive) answer-time");

        category.name = name;
        category.description = description;

        if (!isCategory(category))
            return toast("❌your category is not complete!");

        // save category
        let promiseDbIndex: Promise<Indexed<Category>["dbIndex"]>;
        if (dbIndex)
            promiseDbIndex = updateCategoryInDB(
                indexCategory(category, dbIndex)
            );
        else promiseDbIndex = storeCategoryInDB(category);

        promiseDbIndex.then((promisedDbIndex) => {
            setUnsavedChanges(false);
            if (dbIndex === undefined) {
                window.onbeforeunload = null;
                window.removeEventListener("beforeunload", unloadHandler);
                window.setTimeout(() => {
                    window.location.replace(
                        `/categories/editor/${promisedDbIndex}`
                    );
                }, 300);
            }
            toast("✅ category saved");
        });
    };

    // description file input
    const descriptionImageInputRef = useRef<HTMLInputElement>(null);
    const [descriptionImageUrl, setDescriptionImageUrl] = useState("");

    useEffect(() => {
        if (typeof description !== "string")
            setDescriptionImageUrl(URL.createObjectURL(description));

        if (typeof description === "string") setThumbnail(null);
        else generateThumbnail(description).then(setThumbnail);
    }, [description]);

    const test = async () => {
        const wholeCategory: Category = {
            answerTime,
            description: description ?? "[empty]",
            name: name ?? "[empty]",
            fields: category.fields.map((field) => ({
                question: field.question ?? {
                    content: "[empty]",
                    type: "text",
                },
                answer: field.answer ?? { content: "[empty]", type: "text" },
            })) as Category["fields"],
            thumbnail,
        };

        const dbIndex = await storeCategoryInDB(wholeCategory);
        window.open(`/categories/test/${dbIndex}/destroy`);
    };

    return (
        <div id="edit">
            <BackButton
                to="/categories"
                confirm={unsavedChanges ?? undefined}
            />

            <div id="topRow">
                <input
                    type="text"
                    id="nameInput"
                    value={name}
                    placeholder="name"
                    onChange={(e) => setName(e.target.value)}
                    title="name for this category"
                />
                <div className="description">
                    {typeof description === "string" ? (
                        <>
                            <input
                                type="text"
                                id="descriptionInput"
                                value={description}
                                placeholder="description / question / task"
                                onChange={(e) => setDescription(e.target.value)}
                                title="question or description for this category"
                            />
                            <label className="image">
                                <img src={imageIcon} alt="image icon" />
                                <input
                                    type="file"
                                    style={{ display: "none" }}
                                    accept="image/*"
                                    name="descriptionImage"
                                    id="descriptionImageInput"
                                    onInput={() => {
                                        if (
                                            descriptionImageInputRef.current ===
                                            null
                                        )
                                            return;
                                        const files =
                                            descriptionImageInputRef.current
                                                .files;
                                        if (
                                            files === null ||
                                            files.length === 0
                                        )
                                            return;
                                        const image = files[0] as Image;
                                        setDescription(image);
                                    }}
                                    ref={descriptionImageInputRef}
                                />
                            </label>
                        </>
                    ) : (
                        <button
                            onClick={() =>
                                confirmAlert({
                                    title: "Your description image",
                                    message:
                                        "This image is shown before every question of this category",
                                    childrenElement: () => (
                                        <img
                                            src={descriptionImageUrl}
                                            alt="image, you set as description"
                                            draggable="false"
                                        />
                                    ),
                                    buttons: [
                                        {
                                            label: "Remove",
                                            onClick: () => {
                                                URL.revokeObjectURL(
                                                    descriptionImageUrl
                                                );
                                                setDescription("");
                                            },
                                        },
                                        {
                                            label: "Keep",
                                        },
                                    ],
                                    overlayClassName: "popupOverlay",
                                    closeOnEscape: true,
                                    closeOnClickOutside: true,
                                })
                            }
                        >
                            <img
                                src={URL.createObjectURL(description)}
                                alt="category description image"
                            />
                        </button>
                    )}
                </div>
                <input
                    type="number"
                    name="answerTime"
                    id="answerTime"
                    placeholder="answer Time"
                    value={answerTime}
                    onChange={(e) => setAnswerTime(parseInt(e.target.value))}
                    title="time to answer question (in seconds)"
                />

                <button
                    className="test"
                    title="test your category in a game"
                    onClick={test}
                >
                    <img src={testIcon} alt="" />
                </button>

                <button className="export" onClick={saveCategory}>
                    save{unsavedChanges ? " ❗" : <>d &#9989;</>}
                </button>
            </div>

            <div className="mediaPoolWrapper">{mediaPoolRendered}</div>

            <div id="categoryWrapper">
                <CategoryEditor
                    category={category}
                    chooseField={
                        addResource
                            ? (index, fieldType) => {
                                  const newCategory = Object.assign(
                                      {},
                                      category
                                  );

                                  if (addResource.type === "image") {
                                      if (
                                          newCategory.fields[index][fieldType]
                                              ?.type === "image" &&
                                          (
                                              newCategory.fields[index][
                                                  fieldType
                                              ]?.content as Image
                                          ).name !== addResource.content.name
                                      )
                                          newCategory.fields[index][fieldType] =
                                              {
                                                  type: "imageCollection",
                                                  content: [
                                                      newCategory.fields[index][
                                                          fieldType
                                                      ]?.content as Image,
                                                      addResource.content as Image,
                                                  ],
                                              };
                                      else if (
                                          newCategory.fields[index][fieldType]
                                              ?.type === "imageCollection" &&
                                          (
                                              newCategory.fields[index][
                                                  fieldType
                                              ]?.content as File[]
                                          ).find(
                                              (img) =>
                                                  img.name ===
                                                  addResource.content.name
                                          ) === undefined
                                      )
                                          newCategory.fields[index][fieldType] =
                                              {
                                                  type: "imageCollection",
                                                  content: [
                                                      ...(newCategory.fields[
                                                          index
                                                      ][fieldType]
                                                          ?.content as Image[]),
                                                      addResource.content,
                                                  ],
                                              };
                                      else {
                                          newCategory.fields[index][fieldType] =
                                              addResource;
                                      }
                                  } else {
                                      newCategory.fields[index][fieldType] =
                                          addResource;
                                  }

                                  setCategory(newCategory);
                                  setAddResource(null);
                              }
                            : undefined
                    }
                    setCategory={(newCategory: PartialCategory) => {
                        // need to copy the old Category in order for the state to update
                        setCategory(Object.assign({}, newCategory));
                    }}
                />
            </div>
        </div>
    );
};
export default Edit;
1;
