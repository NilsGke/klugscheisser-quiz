import { useEffect, useRef, useState } from "react";
import "./Categories.page.scss";
import { storeCategoryInDB } from "../../db/categories";
import toast from "react-simple-toasts";
import { importCategoryFromZip } from "../../helpers/zip";
import { useNavigate } from "react-router-dom";
// components
import HomeButton from "../../components/HomeButton";
import CategoryBrowser from "../../components/CategoryBrowser";
// styles
import "./Categories.page.scss";
// assets
import folderIcon from "../../assets/folder.svg";
import addIcon from "../../assets/addRound.svg";
import closeIcon from "../../assets/close.svg";

const Categories = () => {
    const [importOpen, setImportOpen] = useState(false);
    const [file, setFile] = useState<File>();
    const [dragging, setDragging] = useState(false);

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

            setFile(e.dataTransfer?.files[0]);

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
        if (file === undefined) return;
        if (file.type !== "application/x-zip-compressed") {
            toast("This file is not a zip file");
            setFile(undefined);
            return;
        }

        importCategoryFromZip(file).then((category) =>
            storeCategoryInDB(category).then((dbIndex) =>
                navigate(`categories/editor/${dbIndex}`)
            )
        );
    }, [file]);

    return (
        <div id="editorPage">
            <HomeButton />
            <h1>Kategorie-Editor</h1>
            <div id="onboard">
                <div className="decide">
                    <CategoryBrowser />
                    <div className="actions">
                        <button onClick={() => setImportOpen(true)}>
                            <img src={folderIcon} alt="import logo" />
                            <p>Import Category-File</p>
                        </button>
                        <button onClick={() => navigate("/categories/editor")}>
                            <img src={addIcon} alt="create new logo" />
                            <p>Create New Category</p>
                        </button>
                    </div>
                </div>
                <div
                    id="popupContainer"
                    className={importOpen ? "visible" : "hidden"}
                >
                    <div id="popup" className={dragging ? "drag" : ""}>
                        <button
                            className="close"
                            onClick={() => setImportOpen(false)}
                        >
                            <img src={closeIcon} alt="" />
                        </button>

                        <label
                            htmlFor="fileInput"
                            id="fileInputLabel"
                            ref={fileInputLabelRef}
                        >
                            <input
                                type="file"
                                name="category zip input"
                                id="fileInput"
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (files === null || files.length === 0)
                                        return;
                                    setFile(files[0]);
                                }}
                            />
                            <p className="text">
                                drag to import or click <u>here</u> to select
                            </p>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
