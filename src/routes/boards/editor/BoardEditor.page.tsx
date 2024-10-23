import { useEffect, useRef, useState } from "react";
import { Board, categoryIsDeleted } from "$types/boardTypes";
import ResourceRenderer from "$components/ResourceRenderer";
import CategoryBrowser from "$components/CategoryBrowser";
import closeIcon from "$assets/close.svg";
import addIcon from "$assets/addRound.svg";
import deleteIcon from "$assets/delete.svg";
import arrowIcon from "$assets/arrow.svg";
import "./BoardEditor.page.scss";
import autoAnimate from "@formkit/auto-animate";
import { getStoredBoard, storeBoardInDB, updateBoardInDB } from "$db/boards";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "$components/BackButton";
import useTitle from "$hooks/useTitle";
import Diashow from "$components/Diashow";

const BoardEditor = () => {
  const [board, setBoard] = useState<Board>({
    name: "",
    categories: [],
  });

  useTitle(`ksq - board-editor${board.name ? ": " + board.name : ""}`);

  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  console.log(categoriesContainerRef.current);

  useEffect(() => {
    if (categoriesContainerRef.current)
      autoAnimate(categoriesContainerRef.current);
  }, []);

  const navigate = useNavigate();

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  // set initial category if set in URL
  const { dbIndex: dbIndexParam } = useParams();
  const [loading, setLoading] = useState(false);
  const [dbIndex, setdbIndex] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (dbIndexParam === undefined) return;
    const index = parseInt(dbIndexParam);
    if (isNaN(index)) return;
    setLoading(true);
    getStoredBoard(index)
      .then(setBoard)
      .then(() => {
        setdbIndex(index);
        setLoading(false);
      });
  }, [dbIndexParam]);

  const move = (index: number, direction: -1 | 1) =>
    setBoard((prev) => {
      const newCategories = prev.categories.slice();
      [newCategories[index], newCategories[index + direction]] = [
        newCategories[index + direction],
        newCategories[index],
      ];
      return {
        ...prev,
        categories: newCategories,
      };
    });

  const remove = (index: number) =>
    setBoard((prev) => {
      const newCategories = prev.categories.slice();
      newCategories.splice(index, 1);
      return { ...prev, categories: newCategories };
    });

  console.log(board);

  const save = () => {
    if (board.name.trim() === "") return toast("please enter a name");
    if (board.categories.length === 0)
      return toast("add at least one category");

    let promise: Promise<number>;

    if (dbIndex !== undefined) promise = updateBoardInDB({ ...board, dbIndex });
    else promise = storeBoardInDB(board);

    promise
      .then((promisedDbIndex) => {
        if (dbIndex === undefined)
          navigate(`/boards/editor/${promisedDbIndex}`);
        toast("✅ board saved!");
      })
      .catch((error) => {
        toast(error);
        throw new Error(error);
      });
  };

  return (
    <div id="boardEditor">
      <BackButton confirm to="/boards" />
      <div className="editor">
        <div className="topRow">
          <input
            type="text"
            placeholder="Name"
            value={board.name}
            onChange={(e) =>
              setBoard((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
          <button className="save" onClick={save}>
            save
          </button>
        </div>
        <div
          className="categories"
          style={{
            gridTemplateColumns: "1fr ".repeat(board.categories.length + 1),
          }}
          ref={categoriesContainerRef}
        >
          {board.categories.map((category, index) =>
            categoryIsDeleted(category) ? (
              <div className="category deleted" key={category.dbIndex}>
                deleted Category
                <div className="controls">
                  <button className="delete" onClick={() => remove(index)}>
                    <img src={deleteIcon} alt="trash can" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="category" key={category.dbIndex}>
                <h2>{category.name}</h2>
                <div className="fields">
                  {category.fields.map((field, index) => (
                    <div className="field">
                      {field.question.type === "text" ? (
                        <div className="text">{field.question.content}</div>
                      ) : field.question.type === "imageCollection" ? (
                        <Diashow images={field.question.content} view />
                      ) : (
                        <ResourceRenderer
                          resource={field.question}
                          small={board.categories.length >= 4}
                        />
                      )}
                      <div className="overlay">{(index + 1) * 100}</div>
                    </div>
                  ))}
                </div>
                <div className="controls">
                  {index !== 0 ? (
                    <button
                      className="move left"
                      onClick={() => move(index, -1)}
                    >
                      <img src={arrowIcon} alt="drag dots" />
                    </button>
                  ) : null}
                  <button className="delete" onClick={() => remove(index)}>
                    <img src={deleteIcon} alt="trash can" />
                  </button>
                  {index !== board.categories.length - 1 ? (
                    <button
                      className="move right"
                      onClick={() => move(index, 1)}
                    >
                      <img src={arrowIcon} alt="drag dots" />
                    </button>
                  ) : null}
                </div>
              </div>
            ),
          )}
          <div className="category add">
            <button onClick={() => setAddCategoryOpen(true)}>
              <img src={addIcon} alt="addIcon" />
            </button>
          </div>
        </div>
      </div>
      <div
        className={
          "addCategoryContainer" + (addCategoryOpen ? " visible" : " hidden")
        }
      >
        <div className="addCategory">
          <button className="close" onClick={() => setAddCategoryOpen(false)}>
            <img src={closeIcon} alt="close icon" />
          </button>
          <CategoryBrowser
            chooseOne
            choose={(category) => {
              setBoard((prev) => ({
                ...prev,
                categories: [...prev.categories, category],
              }));
              setAddCategoryOpen(false);
            }}
            exclude={board.categories.map((c) => c.dbIndex)}
          />
        </div>
      </div>
    </div>
  );
};

export default BoardEditor;
