import toast from "react-simple-toasts";
import { JSZipMetadata } from "jszip";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Category,
    PartialCategory,
    indexCategory,
    isCategory,
} from "../../../types/categoryTypes";
import "./Editor.scss";
import MediaPool from "../MediaPool/MediaPool";
import CategoryEditor from "../CategoryEditor/CategoryEditor";
import { generateZipFromCategory } from "../../../helpers/zip";
import { Indexed } from "../../../db/indexeddb";
import { storeCategoryInDB, updateCategoryInDB } from "../../../db/categories";
import testIcon from "../../../assets/test.svg";
import BackButton from "../../../components/BackButton";

const Edit = ({
    initialCategory,
    dbIndex,
}: {
    initialCategory: PartialCategory;
    dbIndex?: Indexed<Category>["dbIndex"];
}) => {
    const [category, setCategory] = useState(initialCategory);
    const [name, setName] = useState(initialCategory.name);
    const [description, setDescription] = useState(initialCategory.description);
    const [answerTime, setAnswerTime] = useState(initialCategory.answerTime);

    const mediaPoolRendered = useMemo(() => <MediaPool />, []); // memo render so media does not have to reload on every render (dont acutally know if this is the case)

    useEffect(() => {
        console.log("category changed", category);
    }, [category]);
    useEffect(() => {
        console.log("name changed", name);
    }, [name]);
    useEffect(() => {
        console.log("description changed", description);
    }, [description]);
    useEffect(() => {
        console.log("answer-time changed", answerTime);
    }, [answerTime]);

    // exporting
    const [exporting, setExporting] = useState<boolean>(false);
    const [exportData, setExportData] = useState<JSZipMetadata | null>(null);
    const exportCategory = useCallback(async () => {
        if (
            !category.fields.every(
                (field) =>
                    field.question !== undefined && field.answer !== undefined
            )
        )
            return toast("please fill out every field");

        if (name.trim() === "") return toast("please enter a name");

        if (answerTime <= 0 || Number.isNaN(answerTime))
            return toast("please enter a (positive) answer-time");

        category.name = name;
        category.description = description;

        if (!isCategory(category))
            return toast("your category is not complete!");

        setExporting(true);

        let promiseDbIndex: Promise<Indexed<Category>["dbIndex"]>;
        if (dbIndex)
            promiseDbIndex = updateCategoryInDB(
                indexCategory(category, dbIndex)
            );
        else promiseDbIndex = storeCategoryInDB(category);

        generateZipFromCategory(category, setExportData).then(
            async (result) => {
                const url = window.URL.createObjectURL(result);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute(
                    "download",
                    `${category.name
                        .trim()
                        .replace(/[^a-z0-9]/gi, "_")
                        .toLowerCase()}.ksq.zip`
                );
                document.body.appendChild(link);
                link.click();
                link.remove();
                promiseDbIndex.then((promisedDbIndex) => {
                    if (dbIndex === undefined) {
                        window.onbeforeunload = null;
                        window.location.replace(
                            `/categories/editor/${promisedDbIndex}`
                        );
                    }
                    toast("✅ category saved and exported");
                    setTimeout(() => setExporting(false), 1000);
                });
            }
        );
    }, [category, name]);

    // ask user to confirm unload
    useEffect(() => {
        const unloadHandler = (e: BeforeUnloadEvent) => {
            if (!exporting) {
                e.preventDefault();
                return (e.returnValue = "");
            }
        };
        window.addEventListener("beforeunload", unloadHandler);

        return () => window.removeEventListener("beforeunload", unloadHandler);
    }, [exporting]);

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
        };

        const dbIndex = await storeCategoryInDB(wholeCategory);
        window.open(`/categories/test/${dbIndex}/destroy`);
    };

    return (
        <div id="edit">
            <BackButton confirm to="/categories" />
            <div id="topRow">
                <input
                    type="text"
                    id="nameInput"
                    value={name}
                    placeholder="name"
                    onChange={(e) => setName(e.target.value)}
                    title="name for this category"
                />
                <input
                    type="text"
                    id="descriptionInput"
                    value={description}
                    placeholder="description / question / task"
                    onChange={(e) => setDescription(e.target.value)}
                    title="question or description for this category"
                />
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

                <button className="export" onClick={exportCategory}>
                    save & export
                </button>
            </div>
            <div className="mediaPoolWrapper">{mediaPoolRendered}</div>
            <div id="categoryWrapper">
                <CategoryEditor
                    category={category}
                    setCategory={(newCategory: PartialCategory) => {
                        // need to copy the old Category in order for the state to update
                        setCategory(Object.assign({}, newCategory));
                    }}
                />
            </div>
            <div
                className={
                    "exportPopupContainer" +
                    (exporting ? " visible " : " hidden ")
                }
            >
                <div className="exportPopup">
                    <h2>Exporting</h2>
                    {exportData ? (
                        <>
                            <div className="progressBar">
                                <div
                                    className="progress"
                                    style={{
                                        width: `${Math.round(
                                            exportData.percent
                                        )}%`,
                                    }}
                                ></div>
                            </div>
                            <div className="currentFile">
                                {exportData.currentFile}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
export default Edit;
1;
