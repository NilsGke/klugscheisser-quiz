import { useState } from "react";
import Onboard from "./pages/Onboard";
import Edit from "./pages/Editor";
import { PartialCategory } from "../../types/categoryTypes";
import "./Editor.page.scss";

const Editor = () => {
    const [category, setCategory] = useState<PartialCategory | null>(null);

    return (
        <div id="editorPage">
            {category === null ? (
                <>
                    <h1>Kategorie-Editor</h1>
                    <Onboard setCategory={setCategory} />
                </>
            ) : (
                <Edit initialCategory={category} />
            )}
        </div>
    );
};

export default Editor;
