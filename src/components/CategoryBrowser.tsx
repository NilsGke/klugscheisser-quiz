import { FC, useEffect, useRef, useState } from "react";
import "./CategoryBrowser.scss";
import { Category } from "$types/categoryTypes";
import { Indexed } from "$db/indexeddb";
// assets
import editIcon from "$assets/edit.svg";
import testIcon from "$assets/test.svg";
import checkIcon from "$assets/check.svg";
import removeIcon from "$assets/close.svg";
import eyeIcon from "$assets/eye.svg";
import autoAnimate from "@formkit/auto-animate";
import { getStoredCategories } from "$db/categories";

type props = {
    selecting?: boolean;
    submit?: (categories: Indexed<Category>[]) => void;
    finish?: boolean;

    chooseOne?: boolean;
    choose?: (category: Indexed<Category>) => void;

    exclude?: Indexed<Category>["dbIndex"][];

    setSelected?: (selected: Indexed<Category>[]) => void;
    selected?: Indexed<Category>[];
};
enum Purpose {
    VIEWING,
    CHOOSE_ONE,
    SELECTING_MULTIPLE,
}

/** adding `selected` prop makes this component controlled by its parent */
const CategoryBrowser: FC<props> = ({
    submit,
    finish = false,

    chooseOne = false,
    choose,

    exclude = [],

    selecting = false,
    selected,
    setSelected,
}) => {
    const purpose: Purpose = selecting
        ? Purpose.SELECTING_MULTIPLE
        : Purpose.VIEWING;

    const [categories, setCategories] = useState<Indexed<Category>[]>([]);
    useEffect(() => {
        getStoredCategories(Infinity, Infinity).then(setCategories);
    }, []);

    const [searchTerm, setSearchTerm] = useState("");

    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (listRef.current) autoAnimate(listRef.current);
    }, []);

    const filtered = categories
        .filter((category) => !exclude.includes(category.dbIndex))
        .filter(
            (category) =>
                category.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                category.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
        );

    const submitFun = () => {
        if (!submit || !selected) return;
        const chosenCategories = categories.filter((c) => selected.includes(c));
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
                <div className="results" ref={listRef}>
                    {filtered.map((category) => (
                        <CategoryElement
                            key={category.dbIndex}
                            category={category}
                            selectable={purpose === Purpose.SELECTING_MULTIPLE}
                            choosable={chooseOne}
                            choose={choose ? () => choose(category) : undefined}
                            toggle={() => {
                                if (!selected || !setSelected) return;
                                if (!selected.includes(category))
                                    setSelected([...selected, category]);
                                else
                                    setSelected(
                                        selected.filter((i) => i !== category)
                                    );
                            }}
                            selected={selected?.includes(category)}
                        />
                    ))}

                    {filtered.length === 0 ? (
                        <div className="nothing">nothing found</div>
                    ) : null}
                </div>
            </div>

            {purpose === Purpose.SELECTING_MULTIPLE && selected ? (
                <>
                    <div className="separator"></div>
                    <div className="selected">
                        <h2>Selected</h2>
                        <div className="categories">
                            {selected.map((category, i) => (
                                <CategoryElement
                                    key={i}
                                    category={category}
                                    removable
                                    remove={() => {
                                        if (setSelected && selected)
                                            setSelected(
                                                selected.filter(
                                                    (c) => c !== category
                                                )
                                            );
                                    }}
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
                        title="edit category"
                        onClick={() =>
                            (window.location.href = `/categories/editor/${category.dbIndex}`)
                        }
                    >
                        <img src={editIcon} alt="edit icon" />
                    </button>
                ) : null}
                <button
                    className="view"
                    title="view category"
                    onClick={() =>
                        window.open(
                            `/categories/view/${category.dbIndex}`,
                            "_blank"
                        )
                    }
                >
                    <img src={eyeIcon} alt="view icon" />
                </button>
                <button
                    className="test"
                    title="test category in a game"
                    onClick={() =>
                        window.open(
                            `/categories/test/${category.dbIndex}`,
                            "_blank"
                        )
                    }
                >
                    <img src={testIcon} alt="test in new Tab icon" />
                </button>
            </div>
        </div>
    );
};

export default CategoryBrowser;
