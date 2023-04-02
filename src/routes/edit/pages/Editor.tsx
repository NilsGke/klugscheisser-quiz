import { useCallback, useEffect, useMemo, useState } from "react";
import { Category, PartialCategory } from "../../../helpers/categoryTypes";
import "./Editor.scss";
import MediaPool from "../MediaPool/MediaPool";
import CategoryEditor from "../CategoryEditor/CategoryEditor";
import toast from "react-simple-toasts";
import { generateZipFromCategory } from "../../../helpers/zip";
import JSZip from "jszip";

const Edit = ({ initialCategory }: { initialCategory: PartialCategory }) => {
    const [category, setCategory] = useState(initialCategory);
    const [name, setName] = useState(initialCategory.name);

    const mediaPoolRendered = useMemo(() => <MediaPool />, []);

    useEffect(() => {
        console.log("category changed", category);
    }, [category]);

    const [exporting, setExporting] = useState<boolean>(false);
    const [exportData, setExportData] = useState<JSZip.JSZipMetadata | null>(
        null
    );
    const exportCategory = useCallback(() => {
        if (
            !category.fields.every(
                (field) =>
                    field.question !== undefined && field.answer !== undefined
            )
        )
            return toast("please fill out every field");

        if (name.trim() === "") return toast("please enter a name");
        category.name = name;

        setExporting(true);
        generateZipFromCategory(category as Category, setExportData).then(
            (result) => {
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
                setExporting(false);
            }
        );
    }, [category]);

    return (
        <div id="edit">
            <div id="topRow">
                <input
                    type="text"
                    id="nameInput"
                    value={name}
                    placeholder="enter a name"
                    onChange={(e) => setName(e.target.value)}
                />

                <button className="export" onClick={exportCategory}>
                    export
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
                                        width: Math.round(exportData.percent),
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
