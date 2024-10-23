import { FC, useEffect, useMemo, useState } from "react";
import "./CategoryBrowser.scss";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { SortingMethod } from "$db/categories";
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
import useDebounce from "$hooks/useDebounce";
import zoomInArrows from "$assets/zoomInArrows.svg";
import zoomOutArrows from "$assets/zoomOutArrows.svg";
import { changeSetting, getSettings } from "$helpers/settings";
import { CategoryNew, getAllCategories } from "filesystem/categories";
import { useQuery } from "@tanstack/react-query";

type props = {
  refresh?: any;

  selecting?: boolean;
  submit?: (categories: CategoryNew[]) => void;
  finish?: boolean;

  chooseOne?: boolean;
  choose?: (category: CategoryNew) => void;

  exclude?: CategoryNew["name"][];

  setSelected?: (selected: CategoryNew[]) => void;
  selected?: CategoryNew[];

  testable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  downloadable?: boolean;
  defaultSmall?: boolean;

  fsdh: FileSystemDirectoryHandle;
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

  fsdh,
}) => {
  const purpose: Purpose = selecting
    ? Purpose.SELECTING_MULTIPLE
    : Purpose.VIEWING;

  //   const [categories, setCategories] = useState<CategoryNew[]>([]);
  const { data: categories, refetch: refreshCategories } = useQuery({
    queryKey: ["categoryQuery"],
    queryFn: () => getAllCategories(fsdh).then(({ usable }) => usable),
  });
  console.log(categories);

  const [searchTerm, setSearchTerm] = useState("");
  const search = useDebounce(searchTerm, 100);

  const [selectedRef] = useAutoAnimate();

  const filtered = categories
    ?.filter((category) => !exclude.includes(category.name))
    .filter(
      (category) =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (typeof category.description === "string" &&
          category.description.toLowerCase().includes(search.toLowerCase()))
    );

  const submitFun = () => {
    if (!submit || !selected || categories === undefined) return;
    const chosenCategories = categories.filter((c) => selected.includes(c));
    submit(chosenCategories);
  };

  // sorting
  const [sortingMethod, setSortingMethod] = useState(
    SortingMethod.lastModified
  );
  const sorted = filtered?.toSorted((a, b) => {
    switch (sortingMethod) {
      case SortingMethod.lastModified:
        return b.lastModified.getTime() - a.lastModified.getTime();
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
                    return SortingMethod.lastModified;
                  case SortingMethod.lastModified:
                    return SortingMethod.abcNormal;

                  default:
                    return SortingMethod.lastModified;
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
                  : sortingMethod === SortingMethod.lastModified
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
            <img src={smallCategories ? zoomInArrows : zoomOutArrows} />
          </button>
        </div>
        <div className="results">
          {sorted === undefined && "Loading"}

          {sorted?.map((category) => (
            <CategoryElement
              key={category.name}
              category={category}
              selectable={purpose === Purpose.SELECTING_MULTIPLE}
              choosable={chooseOne}
              choose={choose ? () => choose(category) : undefined}
              testable={testable}
              toggle={() => {
                if (!selected || !setSelected) return;
                if (!selected.includes(category))
                  setSelected([...selected, category]);
                else setSelected(selected.filter((i) => i !== category));
              }}
              selected={selected?.map((c) => c.name).includes(category.name)}
              deletable={deletable}
              editable={editable}
              small={smallCategories}
              delete={() => {
                //TODO: reimplement category deletion
                // removeCategoryFromDb(category.name).then(() =>
                //     refreshCategories
                // )
              }}
            />
          ))}

          {filtered?.length === 0 ? (
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
                  key={category.name}
                  category={category}
                  removable
                  remove={() => {
                    if (setSelected && selected)
                      setSelected(
                        selected.filter((c) => c.name !== category.name)
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
  small,
}: {
  category: CategoryNew;

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

  small: boolean;
}) => {
  const [imageURL, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (small || typeof category.description === "string") return;

    (category.thumbnail || category.description).handle
      .getFile()
      .then((file) => setImageUrl(URL.createObjectURL(file)));
  }, [category, small]);

  const gradient = useMemo(() => stringToColorGradient(category.name), []);

  const bgImgage =
    typeof category.description === "string" ? gradient : `url("${imageURL}")`;

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
          <div className={"selectContainer" + (selected ? " selected" : "")}>
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
                  src={imageURL || ""}
                  alt="categor description image"
                  onLoad={() => imageURL && URL.revokeObjectURL(imageURL)}
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
                (window.location.href = `/categories/editor/${category.name}`)
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
                window.open(`/categories/test/${category.name}`, "_blank")
              }
            >
              <img src={testIcon} alt="test in new Tab icon" />
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
                  childrenElement: () => <p>deleting cannot be undone</p>,
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
