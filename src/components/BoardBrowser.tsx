import { useEffect, useRef, useState } from "react";
import { getStoredBoards, removeBoardFromDB } from "$db/boards";
import { Indexed } from "$db/indexeddb";
import { Board, categoryIsDeleted } from "$types/boardTypes";
import deleteIcon from "$assets/trash.svg";
import editIcon from "$assets/edit.svg";
import "./BoardBrowser.scss";
import { useNavigate } from "react-router-dom";
import autoAnimate from "@formkit/auto-animate";
import { SortingMethod } from "$db/categories";
import sortAZIcon from "$assets/sortAZ.svg";
import sortZAIcon from "$assets/sortZA.svg";
import clockIcon from "$assets/clock.svg";

type props = {
    select?: (board: Indexed<Board>) => void;
};

const BoardBrowser = ({ select }: props) => {
    const [boards, setBoards] = useState<Indexed<Board>[]>([]);
    const [refresh, setRefresh] = useState(Date.now());
    useEffect(() => {
        getStoredBoards(Infinity, Infinity).then(setBoards);
    }, [refresh]);

    const [searchTerm, setSearchTerm] = useState("");

    const filtered = boards.filter(
        (board) =>
            board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            board.categories.some((category) =>
                categoryIsDeleted(category)
                    ? false
                    : category.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
            )
    );

    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (listRef.current) autoAnimate(listRef.current);
    }, []);

    // sorting
    const [sortingMethod, setSortingMethod] = useState(
        SortingMethod.creationDate
    );
    const sorted = filtered.toSorted((a, b) => {
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

    return (
        <div className="boardBrowser">
            <div className="searchHeader">
                <input
                    type="text"
                    className="search"
                    placeholder="search"
                    value={searchTerm}
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
                                : sortingMethod === SortingMethod.creationDate
                                ? clockIcon
                                : "error"
                        }
                        alt={sortingMethod}
                    />
                </button>
            </div>
            <div className="boardsContainer">
                <div className="boards" ref={listRef}>
                    {sorted.map((board) => (
                        <BoardElement
                            key={board.dbIndex}
                            board={board}
                            select={select}
                            refresh={() => setRefresh(Date.now())}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const BoardElement = ({
    board,
    select,
    refresh,
}: {
    board: Indexed<Board>;
    select?: (board: Indexed<Board>) => void;
    refresh?: () => void;
}) => {
    const navigate = useNavigate();
    return (
        <div className="board">
            <h2>{board.name}</h2>
            <div className="categoriesWrapper">
                <div className="categories">
                    {board.categories.map((category) =>
                        categoryIsDeleted(category) ? (
                            <div
                                className="category deleted"
                                key={category.dbIndex}
                            >
                                deleted Category
                            </div>
                        ) : (
                            <div className="category" key={category.dbIndex}>
                                <h3>{category.name}</h3>
                            </div>
                        )
                    )}
                </div>
            </div>
            <div className="actions">
                {select === undefined ? (
                    <>
                        <button
                            className="delete"
                            onClick={() =>
                                removeBoardFromDB(board.dbIndex).then(refresh)
                            }
                        >
                            <img src={deleteIcon} alt="delete icon" />
                        </button>
                        <button
                            className="edit"
                            onClick={() =>
                                navigate(`/boards/editor/${board.dbIndex}`)
                            }
                        >
                            <img src={editIcon} alt="edit icon" />
                        </button>
                    </>
                ) : (
                    <button className="select" onClick={() => select(board)}>
                        select
                    </button>
                )}
            </div>
        </div>
    );
};

export default BoardBrowser;
