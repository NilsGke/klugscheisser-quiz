import { useState } from "react";
import Onboard from "./pages/Onboard";
import Edit from "./pages/Editor";
import { Image, PartialCategory } from "../../helpers/categoryTypes";
import "./Editor.page.scss";
import { dataURLtoFile } from "../../helpers/dataURLtoFile.temp";

// TODO remove these for prod
const tempImageFile = dataURLtoFile(
    "data:image/jpeg;base64,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",
    "test.png"
) as Image;
tempImageFile.dbIndex = 32;

const exampleCategory = {
    name: "example",
    fields: [
        {
            question: {
                type: "text",
                content: 'name an animal with one "H"',
            },
            answer: {
                type: "text",
                content: "Habicht",
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: tempImageFile as Image,
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: tempImageFile as Image,
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: tempImageFile as Image,
            },
        },

        {
            question: {
                type: "text",
                content: 'name an animal with one "H"',
            },
            answer: {
                type: "text",
                content: "Habicht",
            },
        },
    ],
} as PartialCategory;

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
