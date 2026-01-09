import { Board, StoredBoard, DeletedCategory } from "$types/boardTypes";
import { Category } from "$types/categoryTypes";
import { getStoredCategory } from "./categories";
import { Indexed, db } from "./indexeddb";

export const getStoredBoard = (dbIndex: Indexed<Board>["dbIndex"]) =>
    new Promise<Indexed<Board>>((resolve, reject) => {
        const request = db
            .transaction(["boards"], "readonly")
            .objectStore("boards")
            .get(dbIndex);

        request.onsuccess = async (event) => {
            // request still succeeds if index is not in db
            // check for that and trigger onerror manually
            if (request.result === undefined)
                return request.dispatchEvent(new Event("error"));

            const storedBoard: Indexed<StoredBoard> = {
                ...(request.result as StoredBoard),
                dbIndex: dbIndex,
            };
            const board: Indexed<Board> = {
                name: storedBoard.name,
                dbIndex,
                categories: await Promise.all(
                    storedBoard.categoryIndexes.map(
                        (index) =>
                            new Promise<Indexed<Category> | DeletedCategory>(
                                (resolve, reject) =>
                                    getStoredCategory(index)
                                        .then((category) => {
                                            resolve(category);
                                        })
                                        .catch((error) =>
                                            resolve({
                                                dbIndex: index,
                                                deleted: true,
                                            } as DeletedCategory),
                                        ),
                            ),
                    ),
                ),
            };
            resolve(board);
        };

        request.onerror = (event) => {
            reject({ error: (event.target as IDBRequest).error || null });
        };
    });

export const getStoredBoards = (startIndex: number, length: number) =>
    new Promise<Indexed<Board>[]>(async (resolve, reject) => {
        const request = db
            .transaction(["boards"], "readonly")
            .objectStore("boards")
            .openCursor(IDBKeyRange.upperBound(startIndex), "prev");

        // NOTE cursor is going in reverse!
        let i = 0;
        const promisedBoards: Promise<Indexed<Board>>[] = [];

        request.onsuccess = async (event) => {
            const cursor = request.result;
            if (cursor && i < length) {
                const storedBoard = cursor.value as Indexed<StoredBoard>;
                storedBoard.dbIndex =
                    parseInt(cursor.primaryKey as string) || -1;

                const board = getStoredBoard(storedBoard.dbIndex);

                promisedBoards.push(board);

                i++;
                cursor.continue();
            } else {
                const boards = await Promise.all(promisedBoards);
                resolve(boards);
            }
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });

export const storeBoardInDB = (board: Board) =>
    new Promise<Indexed<StoredBoard>["dbIndex"]>((resolve, reject) => {
        console.log("store board", board);

        const boardToStore: StoredBoard = {
            name: board.name,
            categoryIndexes: board.categories.map((c) => c.dbIndex),
        };

        const request = db
            .transaction("boards", "readwrite")
            .objectStore("boards")
            .add(boardToStore);

        request.onsuccess = (e) => resolve((e.target as IDBRequest).result);
        request.onerror = reject;
    });

export const updateBoardInDB = (board: Indexed<Board>) =>
    new Promise<Indexed<StoredBoard>["dbIndex"]>((resolve, reject) => {
        console.log("update category", board);

        const boardToStore: StoredBoard = {
            name: board.name,
            categoryIndexes: board.categories.map((c) => c.dbIndex),
        };

        const request = db
            .transaction(["boards"], "readwrite")
            .objectStore("boards")
            .put(boardToStore, board.dbIndex);

        request.onsuccess = (e) => resolve((e.target as IDBRequest).result);
        request.onerror = reject;
    });
export const removeBoardFromDB = (index: Indexed<Board>["dbIndex"]) =>
    new Promise((resolve, reject) => {
        const request = db
            .transaction("boards", "readwrite")
            .objectStore("boards")
            .delete(index);

        request.onsuccess = resolve;
        request.onerror = reject;
    });
