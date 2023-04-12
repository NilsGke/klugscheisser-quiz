import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Onboard from "./pages/Onboard";
import Edit from "./pages/Editor";
import { PartialCategory } from "../../types/categoryTypes";
import "./Editor.page.scss";
import { getStoredCategory } from "../../helpers/indexeddb";
import Spinner from "../../components/Spinner";

const Editor = () => {
    const [category, setCategory] = useState<PartialCategory | null>(null);

    // set initial category if set in URL
    const { dbIndex: dbIndexParam } = useParams();
    const [loading, setLoading] = useState(false);
    const [dbIndex, setdbIndex] = useState<number | undefined>(undefined);
    useEffect(() => {
        if (dbIndexParam === undefined) return;
        const index = parseInt(dbIndexParam);
        if (isNaN(index)) return;
        setLoading(true);
        getStoredCategory(index)
            .then(setCategory)
            .then(() => {
                setdbIndex(index);
                setLoading(false);
            });
    }, []);

    return (
        <div id="editorPage">
            {category === null ? (
                <>
                    <h1>Kategorie-Editor</h1>
                    <Onboard setCategory={setCategory} />
                </>
            ) : loading ? (
                <Spinner />
            ) : (
                <Edit initialCategory={category} dbIndex={dbIndex} />
            )}
        </div>
    );
};

export default Editor;
