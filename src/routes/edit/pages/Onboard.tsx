import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import toast from "react-simple-toasts";
import { PartialCategory, emptyCategory } from "../../../types/categoryTypes";
import { importCategoryFromZip } from "../../../helpers/zip";
// components
import HomeButton from "../../../components/HomeButton";
// styles
import "./Onboard.scss";
// assets
import folderIcon from "../../../assets/folder.svg";
import addIcon from "../../../assets/addRound.svg";
import closeIcon from "../../../assets/close.svg";
import CategoryBrowser from "../../../components/CategoryBrowser";
import { useNavigate } from "react-router-dom";

enum Action {
    IMPORT,
    NEW,
}
const Onboard = ({
    setCategory,
}: {
    setCategory: Dispatch<SetStateAction<PartialCategory | null>>;
}) => {
    const [action, setAction] = useState<Action>();
    const [file, setFile] = useState<File>();
    const [dragging, setDragging] = useState(false);

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

        importCategoryFromZip(file).then(setCategory);
        // todo
    }, [file]);

    const navigate = useNavigate();

    return (
        <div id="onboard">
            <HomeButton />
            <div className="decide">
                <CategoryBrowser
                    chooseOne
                    choose={(category) =>
                        navigate(`/editor/${category.dbIndex}`)
                    }
                />
                <div className="actions">
                    <button onClick={() => setAction(Action.IMPORT)}>
                        <img src={folderIcon} alt="import logo" />
                        <p>Import Category-File</p>
                    </button>
                    <button onClick={() => setCategory(emptyCategory)}>
                        <img src={addIcon} alt="create new logo" />
                        <p>Create New Category</p>
                    </button>
                </div>
            </div>
            <div
                id="popupContainer"
                className={action !== undefined ? "visible" : "hidden"}
            >
                <div id="popup" className={dragging ? "drag" : ""}>
                    <button
                        className="close"
                        onClick={() => setAction(undefined)}
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
    );
};

export default Onboard;
