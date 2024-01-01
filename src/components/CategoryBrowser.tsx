import { FC, useEffect, useMemo, useRef, useState } from "react";
import "./CategoryBrowser.scss";
import { Category } from "$types/categoryTypes";
import { Indexed } from "$db/indexeddb";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
    SortingMethod,
    getStoredCategories,
    removeCategoryFromDb,
} from "$db/categories";
import { confirmAlert } from "react-confirm-alert";
import stringToColorGradient from "$helpers/stringToColorGradient";

// assets
import editIcon from "$assets/edit.svg";
import testIcon from "$assets/test.svg";
import checkIcon from "$assets/check.svg";
import removeIcon from "$assets/close.svg";
import trashIcon from "$assets/trash.svg";
import sortAZIcon from "$assets/sortAZ.svg";
import sortZAIcon from "$assets/sortZA.svg";
import clockIcon from "$assets/clock.svg";
import downloadIcon from "$assets/download.svg";
import { generateZipFromCategory } from "$helpers/zip";
import downloadFile from "$helpers/downloadFile";
import toast from "react-simple-toasts";
import useDebounce from "$hooks/useDebounce";
import zoomInArrows from "$assets/zoomInArrows.svg";
import zoomOutArrows from "$assets/zoomOutArrows.svg";
import { changeSetting, getSettings } from "$helpers/settings";

type props = {
    refresh?: any;

    selecting?: boolean;
    submit?: (categories: Indexed<Category>[]) => void;
    finish?: boolean;

    chooseOne?: boolean;
    choose?: (category: Indexed<Category>) => void;

    exclude?: Indexed<Category>["dbIndex"][];

    setSelected?: (selected: Indexed<Category>[]) => void;
    selected?: Indexed<Category>[];

    testable?: boolean;
    editable?: boolean;
    deletable?: boolean;
    downloadable?: boolean;
    defaultSmall?: boolean;
};
enum Purpose {
    VIEWING,
    CHOOSE_ONE,
    SELECTING_MULTIPLE,
}

/** adding `selected` prop makes this component controlled by its parent */
const CategoryBrowser: FC<props> = ({
    refresh,

    submit,
    finish = false,

    chooseOne = false,
    choose,

    exclude = [],

    selecting = false,
    selected,
    setSelected,

    testable,
    deletable,
    editable,
    downloadable,
    defaultSmall,
}) => {
    const purpose: Purpose = selecting
        ? Purpose.SELECTING_MULTIPLE
        : Purpose.VIEWING;

    const [categories, setCategories] = useState<Indexed<Category>[]>([]);
    useEffect(() => {
        getStoredCategories(Infinity, Infinity).then(setCategories);
    }, [refresh]);

    const [searchTerm, setSearchTerm] = useState("");
    const search = useDebounce(searchTerm, 100);

    const [selectedRef] = useAutoAnimate();

    const filtered = categories
        .filter((category) => !exclude.includes(category.dbIndex))
        .filter(
            (category) =>
                category.name.toLowerCase().includes(search.toLowerCase()) ||
                (typeof category.description === "string" &&
                    category.description
                        .toLowerCase()
                        .includes(search.toLowerCase()))
        );

    const submitFun = () => {
        if (!submit || !selected) return;
        const chosenCategories = categories.filter((c) => selected.includes(c));
        submit(chosenCategories);
    };

    // sorting
    const [sortingMethod, setSortingMethod] = useState(
        SortingMethod.creationDate
    );
    const sorted = filtered.sort((a, b) => {
        switch (sortingMethod) {
            case SortingMethod.creationDate:
                return b.dbIndex - a.dbIndex;
            case SortingMethod.abcNormal:
                return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
            case SortingMethod.abcReverse:
                return a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1;

            default:
                return 1;
        }
    });

    const [smallCategories, setSmallCategories] = useState(
        defaultSmall ?? getSettings().smallCategories
    );

    return (
        <div className="categoryBrowser">
            <div className="browser">
                <div className="searchHeader">
                    <input
                        type="text"
                        placeholder="search..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        title={`sort by ${sortingMethod}`}
                        className="sort"
                        onClick={() =>
                            setSortingMethod((prev) => {
                                switch (prev) {
                                    case SortingMethod.abcNormal:
                                        return SortingMethod.abcReverse;
                                    case SortingMethod.abcReverse:
                                        return SortingMethod.creationDate;
                                    case SortingMethod.creationDate:
                                        return SortingMethod.abcNormal;

                                    default:
                                        return SortingMethod.creationDate;
                                }
                            })
                        }
                    >
                        <img
                            src={
                                sortingMethod === SortingMethod.abcNormal
                                    ? sortAZIcon
                                    : sortingMethod === SortingMethod.abcReverse
                                    ? sortZAIcon
                                    : sortingMethod ===
                                      SortingMethod.creationDate
                                    ? clockIcon
                                    : "error"
                            }
                            alt={sortingMethod}
                        />
                    </button>
                    <button
                        title={`${smallCategories ? "zoom in" : "zoom out"}`}
                        className="smallOrBig"
                        onClick={() => {
                            setSmallCategories((prev) => {
                                changeSetting({
                                    smallCategories: !prev,
                                });
                                return !prev;
                            });
                        }}
                    >
                        <img
                            src={smallCategories ? zoomInArrows : zoomOutArrows}
                        />
                    </button>
                </div>
                <div className="results">
                    {sorted.map((category) => (
                        <CategoryElement
                            key={category.dbIndex}
                            category={category}
                            selectable={purpose === Purpose.SELECTING_MULTIPLE}
                            choosable={chooseOne}
                            choose={choose ? () => choose(category) : undefined}
                            testable={testable}
                            toggle={() => {
                                if (!selected || !setSelected) return;
                                if (!selected.includes(category))
                                    setSelected([...selected, category]);
                                else
                                    setSelected(
                                        selected.filter((i) => i !== category)
                                    );
                            }}
                            selected={selected
                                ?.map((c) => c.dbIndex)
                                .includes(category.dbIndex)}
                            deletable={deletable}
                            editable={editable}
                            downloadable={downloadable}
                            small={smallCategories}
                            delete={() =>
                                removeCategoryFromDb(category.dbIndex).then(
                                    () =>
                                        setCategories((prev) =>
                                            prev.filter(
                                                (prevCategory) =>
                                                    prevCategory.dbIndex !==
                                                    category.dbIndex
                                            )
                                        )
                                )
                            }
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
                        <div className="categories" ref={selectedRef}>
                            {selected.map((category, i) => (
                                <CategoryElement
                                    key={category.dbIndex}
                                    category={category}
                                    removable
                                    remove={() => {
                                        if (setSelected && selected)
                                            setSelected(
                                                selected.filter(
                                                    (c) =>
                                                        c.dbIndex !==
                                                        category.dbIndex
                                                )
                                            );
                                    }}
                                    small={smallCategories}
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

    deletable = false,
    delete: deleteFun,

    testable = false,
    editable = false,
    downloadable = false,
    small,
}: {
    category: Indexed<Category>;

    selected?: boolean;
    selectable?: boolean;
    toggle?: () => void;

    removable?: boolean;
    remove?: () => void;

    choosable?: boolean;
    choose?: () => void;

    deletable?: boolean;
    delete?: () => void;

    testable?: boolean;
    editable?: boolean;
    downloadable?: boolean;

    small: boolean;
}) => {
    const imageURL = useMemo(() => {
        if (small) return "";
        if (typeof category.description === "string") return "";
        if (category.thumbnail) return URL.createObjectURL(category.thumbnail);
        return URL.createObjectURL(category.description);
    }, [category, small]);

    const gradient = useMemo(() => stringToColorGradient(category.name), []);

    const bgImgage =
        typeof category.description === "string"
            ? gradient
            : `url("${imageURL}")`;

    return (
        <div
            className={"categoryWrapper" + (small ? " small" : "")}
            style={{
                backgroundImage: bgImgage,
                cursor: selectable ? "pointer" : undefined,
            }}
            onClick={selectable ? toggle : undefined}
        >
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
                    {!small && (
                        <div className="description">
                            {typeof category.description === "string" ? (
                                <>
                                    <p>{category.description}</p>
                                </>
                            ) : (
                                <img
                                    src={imageURL}
                                    alt="categor description image"
                                    onLoad={() => URL.revokeObjectURL(imageURL)}
                                />
                            )}
                        </div>
                    )}
                </div>
                <div className="buttons">
                    {editable ? (
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

                    {testable ? (
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
                    ) : null}

                    {downloadable ? (
                        <button
                            className="download"
                            title="download category file"
                            onClick={() => {
                                toast("⏳export...");
                                generateZipFromCategory(category, () => {})
                                    .then((file) => {
                                        downloadFile(
                                            file,
                                            category.name + ".ksq.zip"
                                        );
                                        toast("✔️export successful");
                                    })
                                    .catch((error) => {
                                        console.error(error);
                                        toast("❌exporting failed!");
                                    });
                            }}
                        >
                            <img src={downloadIcon} alt="download icon" />
                        </button>
                    ) : null}

                    {deletable ? (
                        <button
                            className="delete"
                            title="delete category"
                            onClick={() =>
                                confirmAlert({
                                    title: `delete  "${category.name}"?`,
                                    overlayClassName: "delete",
                                    childrenElement: () => (
                                        <p>deleting cannot be undone</p>
                                    ),
                                    buttons: [
                                        {
                                            label: "delete",
                                            onClick: deleteFun,
                                        },
                                        {
                                            label: "keep",
                                        },
                                    ],
                                })
                            }
                        >
                            <img src={trashIcon} alt="trash icon" />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CategoryBrowser;
