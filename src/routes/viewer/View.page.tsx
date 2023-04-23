import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Indexed } from "$db/indexeddb";
import { getStoredCategory } from "$db/categories";
import { Category } from "$types/categoryTypes";
import Spinner from "$components/Spinner";
import ResourceRenderer from "$components/ResourceRenderer";

import "./View.page.scss";
import Diashow from "$components/Diashow";

const Viewer = () => {
    const [category, setCategory] = useState<Indexed<Category> | null | false>(
        null
    );

    const params = useParams();
    useEffect(() => {
        if (params.dbIndex && !isNaN(parseInt(params.dbIndex)))
            getStoredCategory(parseInt(params.dbIndex))
                .then((c) => {
                    console.log({ c });
                    setCategory(c);
                })
                .catch((e) => setCategory(false));
    }, []);

    if (category === null)
        return (
            <div id="viewerPage">
                <Spinner />
            </div>
        );

    if (category === false)
        return <div id="viewerPage">category not found!</div>;

    return (
        <div id="viewerPage">
            <h2>{category.name}</h2>
            {typeof category.description === "string" ? (
                <h3>{category.description}</h3>
            ) : (
                <ResourceRenderer
                    resource={{ type: "image", content: category.description }}
                />
            )}
            <div className="fields">
                {category.fields.map((field) => (
                    <div className="field">
                        <div className="question">
                            {field.question.type === "imageCollection" ? (
                                <Diashow images={field.question.content} view />
                            ) : (
                                <ResourceRenderer resource={field.question} />
                            )}
                        </div>
                        <div className="answer">
                            {field.answer.type === "imageCollection" ? (
                                <Diashow images={field.answer.content} view />
                            ) : (
                                <ResourceRenderer resource={field.answer} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Viewer;
