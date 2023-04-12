import toast from "react-simple-toasts";
import { JSZipMetadata } from "jszip";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PartialCategory, isCategory } from "../../../types/categoryTypes";
import "./Editor.scss";
import MediaPool from "../MediaPool/MediaPool";
import CategoryEditor from "../CategoryEditor/CategoryEditor";
import { generateZipFromCategory } from "../../../helpers/zip";
import { storeCategoryInDB } from "../../../helpers/indexeddb";
import HomeButton from "../../../components/HomeButton";

const Edit = ({ initialCategory }: { initialCategory: PartialCategory }) => {
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

        const promiseDbIndex = storeCategoryInDB(category);

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
                promiseDbIndex.then((dbIndex) => {
                    window.onbeforeunload = null;
                    window.location.replace(`/editor/${dbIndex}`);
                    setExporting(false);
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

    return (
        <div id="edit">
            <HomeButton confirm />
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
