import { FC, useEffect, useState } from "react";
import "./CategoryBrowser.scss";
import { Category } from "../types/categoryTypes";
import { Indexed, getStoredCategories } from "../helpers/indexeddb";
// assets
import editIcon from "../assets/edit.svg";
import testIcon from "../assets/test.svg";
import checkIcon from "../assets/check.svg";
import removeIcon from "../assets/close.svg";
import eyeIcon from "../assets/eye.svg";

type props = {
    selecting?: boolean;
    submit?: (categories: Indexed<Category>[]) => void;
    onChange?: (categories: Indexed<Category>[]) => void;
    finish?: boolean;

    chooseOne?: boolean;
    choose?: (category: Indexed<Category>) => void;
};
enum Purpose {
    VIEWING,
    CHOOSE_ONE,
    SELECTING_MULTIPLE,
}

const CategoryBrowser: FC<props> = ({
    submit,
    selecting = false,
    onChange,
    finish = false,

    chooseOne = false,
    choose,
}) => {
    const purpose: Purpose = selecting
        ? Purpose.SELECTING_MULTIPLE
        : Purpose.VIEWING;

    const [categories, setCategories] = useState<Indexed<Category>[]>([]);
    useEffect(() => {
        getStoredCategories(Infinity, Infinity).then(setCategories);
    }, []);

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

    const filtered = categories.filter(
        (category) =>
            category.name.includes(searchTerm) ||
            category.description.includes(searchTerm)
    );

    if (onChange)
        useEffect(() => {
            onChange(
                categories.filter((category) =>
                    selectedIndexes.includes(category.dbIndex)
                )
            );
        }, [selectedIndexes]);

    const submitFun = () => {
        if (!submit) return;
        const chosenCategories = categories.filter((c) =>
            selectedIndexes.includes(c.dbIndex)
        );
        submit(chosenCategories);
    };

    return (
        <div className="categoryBrowser">
            <div className="browser">
                <div className="searchHeader">
                    <input
                        type="text"
                        placeholder="search..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="results">
                    {filtered.map((category) => (
                        <CategoryElement
                            key={category.dbIndex}
                            category={category}
                            selectable={purpose === Purpose.SELECTING_MULTIPLE}
                            choosable={chooseOne}
                            choose={choose ? () => choose(category) : undefined}
                            toggle={() => {
                                if (!selectedIndexes.includes(category.dbIndex))
                                    setSelectedIndexes((prev) => [
                                        ...prev,
                                        category.dbIndex,
                                    ]);
                                else
                                    setSelectedIndexes((prev) =>
                                        prev.filter(
                                            (i) => i !== category.dbIndex
                                        )
                                    );
                            }}
                            selected={selectedIndexes.includes(
                                category.dbIndex
                            )}
                        />
                    ))}

                    {filtered.length === 0 ? (
                        <div className="nothing">nothing found</div>
                    ) : null}
                </div>
            </div>

            {purpose === Purpose.SELECTING_MULTIPLE ? (
                <>
                    <div className="separator"></div>
                    <div className="selected">
                        <h2>Selected</h2>
                        <div className="categories">
                            {categories
                                .filter((c) =>
                                    selectedIndexes.includes(c.dbIndex)
                                )
                                .map((category) => (
                                    <CategoryElement
                                        category={category}
                                        removable
                                        remove={() =>
                                            setSelectedIndexes((prev) =>
                                                prev.filter(
                                                    (i) =>
                                                        i !== category.dbIndex
                                                )
                                            )
                                        }
                                    />
                                ))}
                        </div>
                        {finish ? (
                            <button className="submit" onClick={submitFun}>
                                finish
                            </button>
                        ) : null}
                    </div>
                </>
            ) : null}
        </div>
    );
};

const CategoryElement = ({
    category,

    selected = false,
    selectable = false,
    toggle,

    removable = false,
    remove,

    choosable = false,
    choose,
}: {
    category: Indexed<Category>;

    selected?: boolean;
    selectable?: boolean;
    toggle?: () => void;

    removable?: boolean;
    remove?: () => void;

    choosable?: boolean;
    choose?: () => void;
}) => {
    return (
        <div
            className={"category" + (choosable ? " choosable" : "")}
            onClick={choose}
        >
            {selectable ? (
                <div
                    className={
                        "selectContainer" + (selected ? " selected" : "")
                    }
                >
                    <button className="select" onClick={toggle}>
                        {selected ? <img src={checkIcon} alt="" /> : null}
                    </button>
                </div>
            ) : null}

            {removable ? (
                <div className="selectContainer">
                    <button className="remove" onClick={remove}>
                        <img src={removeIcon} alt="" />
                    </button>
                </div>
            ) : null}

            <div className="content">
                <h2>{category.name}</h2>
                <p className="description">{category.description}</p>
            </div>
            <div className="buttons">
                {!choosable ? (
                    <button
                        className="edit"
                        title="open category in editor"
                        onClick={() =>
                            window.open(`/editor/${category.dbIndex}`, "_blank")
                        }
                    >
                        <img src={editIcon} alt="edit icon" />
                    </button>
                ) : null}
                <button
                    className="view"
                    title="view category"
                    onClick={() =>
                        window.open(`/view/${category.dbIndex}`, "_blank")
                    }
                >
                    <img src={eyeIcon} alt="view icon" />
                </button>
                <button
                    className="test"
                    title="test category in a game"
                    onClick={() =>
                        window.open(`/test/${category.dbIndex}`, "_blank")
                    }
                >
                    <img src={testIcon} alt="test in new Tab icon" />
                </button>
            </div>
        </div>
    );
};

export default CategoryBrowser;
