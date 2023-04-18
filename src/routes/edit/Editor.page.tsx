import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Edit from "./editor/Editor";
import { PartialCategory, emptyCategory } from "../../types/categoryTypes";
import "./Editor.page.scss";
import { getStoredCategory } from "../../helpers/indexeddb";
import Spinner from "../../components/Spinner";

const Editor = () => {
    const [category, setCategory] = useState<PartialCategory | null>(null);

    // set initial category if set in URL
    const { dbIndex: dbIndexParam } = useParams();
    const [dbIndex, setdbIndex] = useState<number | undefined>(undefined);
    useEffect(() => {
        if (dbIndexParam === undefined) {
            setCategory(emptyCategory);
        } else {
            const index = parseInt(dbIndexParam);
            if (isNaN(index)) return;
            getStoredCategory(index)
                .then(setCategory)
                .then(() => {
                    setdbIndex(index);
                });
        }
    }, [dbIndexParam]);

    if (category === null) return <Spinner />;

    return (
        <div id="editorPage">
            <Edit initialCategory={category} dbIndex={dbIndex} />
        </div>
    );
};

export default Editor;
