import { useEffect, useRef, useState } from "react";
import { storeCategoryInDB } from "$db/categories";
import { toast } from "react-toastify";
import { importCategoryFromZip } from "$helpers/zip";
import { useNavigate } from "react-router-dom";
import { confirmAlert } from "react-confirm-alert";
import exportAllCategories from "$helpers/exportAllCategories";
import downloadFile from "$helpers/downloadFile";
// components
import HomeButton from "$components/HomeButton";
import CategoryBrowser from "$components/CategoryBrowser";
// styles
import "./Categories.page.scss";
// assets
import folderIcon from "$assets/folder.svg";
import addIcon from "$assets/addRound.svg";
import useTitle from "$hooks/useTitle";
import downloadIcon from "$assets/downloadFolder.svg";
import { changeSetting, defaultSettings, getSettings } from "$helpers/settings";

const Categories = ({ fsdh }: { fsdh: FileSystemDirectoryHandle }) => {
    const [files, setFiles] = useState<File[]>();
    const [dragging, setDragging] = useState(false);
    const [update, setUpdate] = useState(Date.now());

    useTitle("ksq - categories");

    const navigate = useNavigate();

    // file input stuff
    const fileInputLabelRef = useRef<HTMLLabelElement>(null);
    useEffect(() => {
        if (fileInputLabelRef.current === null) return;
        const fileDropCallback = (e: DragEvent) => {
            console.log(e);
            e.preventDefault();
        };
        fileInputLabelRef.current.addEventListener("drop", fileDropCallback);
        console.log("added");

        return () => {
            if (fileInputLabelRef.current === null) return;
            fileInputLabelRef.current.addEventListener(
                "drop",
                fileDropCallback
            );
        };
    }, []);

    // drag styles and drop handeling
    useEffect(() => {
        if (fileInputLabelRef.current === null) return;

        const dragover = (e: Event) => {
            e.preventDefault();
            setDragging(true);
        };
        const drop = (e: DragEvent) => {
            if (e.target === null || e.dataTransfer === null) return;
            e.preventDefault();

            setFiles(Array.from(e.dataTransfer.files));

            setDragging(false);
        };
        const dragLeave = () => setDragging(false);

        fileInputLabelRef.current.addEventListener("dragover", dragover);
        fileInputLabelRef.current.addEventListener("drop", drop);
        fileInputLabelRef.current.addEventListener("dragleave", dragLeave);

        return () => {
            if (fileInputLabelRef.current === null) return;
            fileInputLabelRef.current.removeEventListener("dragover", dragover);
            fileInputLabelRef.current.removeEventListener("drop", drop);
            fileInputLabelRef.current.removeEventListener(
                "dragleave",
                dragLeave
            );
        };
    }, []);

    // file stuff
    useEffect(() => {
        if (files === undefined) return;
        files.forEach((file) =>
            importCategoryFromZip(file).then((category) =>
                storeCategoryInDB(category).then((dbIndex) =>
                    setUpdate(Date.now())
                )
            )
        );
    }, [files]);

    const [exportInfo, setExportInfo] = useState<
        Parameters<Parameters<typeof exportAllCategories>[0]>[0] | null
    >(null);

    return (
        <div id="editorPage">
            <HomeButton />
            <div id="onboard">
                <div className="decide">
                    <h1>Kategorie-Editor</h1>
                    <CategoryBrowser
                        refresh={update}
                        fsdh={fsdh}
                        testable
                        editable
                        deletable
                        downloadable
                    />
                    <div className="actions">
                        <label
                            className={dragging ? "dragging" : ""}
                            htmlFor="fileInput"
                            id="fileInputLabel"
                            ref={fileInputLabelRef}
                        >
                            <input
                                type="file"
                                name="category zip input"
                                id="fileInput"
                                accept=".zip"
                                multiple
                                tabIndex={1}
                                onChange={(e) => {
                                    const fileList = e.target.files;
                                    if (
                                        fileList === null ||
                                        fileList.length === 0
                                    )
                                        return;
                                    setFiles(Array.from(fileList));
                                }}
                            />
                            <img src={folderIcon} alt="import logo" />
                            <p>
                                drag to import or click <u>here</u> to select
                            </p>
                        </label>
                        <button
                            tabIndex={2}
                            onClick={() => navigate("/categories/editor")}
                        >
                            <img src={addIcon} alt="create new logo" />
                            <p>Create New Category</p>
                        </button>
                        <button
                            className="backup"
                            onClick={() =>
                                confirmAlert({
                                    title: "export all categories?",
                                    childrenElement: () => <PopupChildren />,
                                    buttons: [
                                        {
                                            label: "cancel",
                                        },
                                        {
                                            label: "export",
                                            onClick: () =>
                                                exportAllCategories(
                                                    setExportInfo
                                                )
                                                    .then((file) => {
                                                        setExportInfo(null);
                                                        toast(
                                                            "🟩 Export successful!"
                                                        );
                                                    })
                                                    .catch((error) => {
                                                        console.error(error);
                                                        toast(
                                                            `🟥 Error while exporting! \n\n ${error}`,
                                                            {
                                                                autoClose:
                                                                    false,
                                                                onClose: () =>
                                                                    setExportInfo(
                                                                        null
                                                                    ),
                                                            }
                                                        );
                                                    }),
                                        },
                                    ],
                                })
                            }
                        >
                            <img src={downloadIcon} alt="download icon" />
                            backup
                        </button>
                    </div>
                </div>
            </div>

            {exportInfo !== null ? (
                <div className="exportInfoContainer">
                    <div className="exportInfo">
                        <h1>Exporting</h1>
                        <div className="categories">
                            Categories:
                            <div className="progressBar">
                                <div
                                    className="progress"
                                    style={{
                                        width: `${Math.ceil(
                                            (100 / exportInfo.categoriesTotal) *
                                                exportInfo.categoriesDone
                                        )}%`,
                                    }}
                                ></div>
                            </div>
                            <span>
                                {exportInfo.categoriesDone}/
                                {exportInfo.categoriesTotal}
                            </span>
                        </div>
                        <div className="currentFile">
                            {exportInfo.currentAction}
                            <div className="progressBar">
                                <div
                                    className="progress"
                                    style={{
                                        width: `${Math.ceil(
                                            exportInfo.currentPercent
                                        )}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

const PopupChildren = () => {
    const [maxExportSize, setMaxExportSize] = useState(
        getSettings().maxExportSize
    );

    const updateMaxExportSize = (num: number) => {
        setMaxExportSize(num);
        changeSetting({
            maxExportSize: num,
        });
    };

    return (
        <p>
            The browser might not be able to handle all categories at once, so
            the website breaks it up into multiple zip files <br />
            you might need to allow the page to download multiple files
            <br /> <br />
            you can configure the max file size here:{" "}
            <input
                type="number"
                value={maxExportSize / 10 ** 6}
                onChange={(e) =>
                    !isNaN(parseInt(e.target.value)) &&
                    updateMaxExportSize(parseInt(e.target.value) * 10 ** 6)
                }
            />{" "}
            (MB){" "}
            <button
                onClick={() =>
                    updateMaxExportSize(defaultSettings.maxExportSize)
                }
            >
                reset
            </button>
        </p>
    );
};

export default Categories;
