import { useEffect, useRef, useState } from "react";
import "./Categories.page.scss";
import { storeCategoryInDB } from "$db/categories";
import toast from "react-simple-toasts";
import { importCategoryFromZip } from "$helpers/zip";
import { useNavigate } from "react-router-dom";
// components
import HomeButton from "$components/HomeButton";
import CategoryBrowser from "$components/CategoryBrowser";
// styles
import "./Categories.page.scss";
// assets
import folderIcon from "$assets/folder.svg";
import addIcon from "$assets/addRound.svg";
import useTitle from "$hooks/useTitle";

const Categories = () => {
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
        files.forEach((file) => {
            if (file.type !== "application/x-zip-compressed") {
                toast(`"${file.name}" is not a zip file`);
            } else {
                importCategoryFromZip(file).then((category) =>
                    storeCategoryInDB(category).then((dbIndex) =>
                        setUpdate(Date.now())
                    )
                );
            }
        });
    }, [files]);

    return (
        <div id="editorPage">
            <HomeButton />
            <div id="onboard">
                <div className="decide">
                    <h1>Kategorie-Editor</h1>
                    <CategoryBrowser
                        refresh={update}
                        testable
                        editable
                        deletable
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
                                accept=".ksq.zip"
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
