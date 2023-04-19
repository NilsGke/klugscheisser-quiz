import { Board, DeletedCategory, StoredBoard } from "../types/boardTypes";
import {
    Category,
    IndexedFile,
    MediaType,
    MediaTypes,
    addVolumeToAudioResource,
    addVolumeToVideoResource,
} from "../types/categoryTypes";

/** ### version documentation
 *
 * @version 3 all media stores
 * @version 4 added category store
 * @version 5 added volume to audio and video
 * @version 6 added board store
 *
 */
let db: IDBDatabase;

export type Indexed<T> = T & {
    dbIndex: number;
};

const DB_VERSION = 6;

export const initIndexedDB = () =>
    new Promise<void>((resolve, reject) => {
        const request = window.indexedDB.open("LocalFileDatabase", DB_VERSION);

        request.onerror = (event) => {
            console.error("indexed db request threw an error", { event });
            reject((event.target as IDBOpenDBRequest).error);
        };
        // clean init
        request.onsuccess = (event) => {
            if (event.target === null)
                throw new Error("indexeddb: event.target on succsess is null");

            db = (event.target as IDBOpenDBRequest).result;

            db.onerror = (event) => {
                // Generic error handler for all errors targeted at this database's
                // requests!
                if (event.target === null)
                    throw new Error("in db.onerror: event.target is null");

                console.error(
                    `Database error: ${(event.target as any).errorCode}`
                );
            };
            resolve();
        };

        // upgrade db
        request.onupgradeneeded = async (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            console.log(
                "%c" +
                    `Upgrading from version ${event.oldVersion} to version ${db.version}`,
                "color:purple;"
            );

            const proms: Promise<Event | void>[] = [];

            // Create an stores for each media type
            if (event.oldVersion === 0)
                MediaTypes.forEach((type) =>
                    proms.push(
                        new Promise((resolve, reject) => {
                            const objectStore = db.createObjectStore(type, {
                                autoIncrement: true,
                            });
                            objectStore.createIndex("name", "name", {
                                unique: false,
                            });
                            objectStore.transaction.oncomplete = resolve;
                            objectStore.transaction.onerror = reject;
                        })
                    )
                );

            // create category store
            if (event.oldVersion === 0 || event.newVersion === 4)
                proms.push(
                    new Promise((resolve, reject) => {
                        const objectStore = db.createObjectStore("categories", {
                            autoIncrement: true,
                        });
                        objectStore.createIndex("name", "name", {
                            unique: false,
                        });
                        objectStore.transaction.oncomplete = resolve;
                        objectStore.transaction.onerror = reject;
                    })
                );

            // add volume to categories media
            if (event.newVersion === 5)
                proms.push(
                    new Promise((resolve, reject) => {
                        const transaction = (event.target as IDBOpenDBRequest)
                            .transaction;
                        if (transaction === null)
                            return reject("event.target.transaction is null");

                        const request = transaction
                            .objectStore("categories")
                            .openCursor();

                        request.onsuccess = (e: Event) => {
                            const cursor = request.result;
                            if (cursor === null) return resolve();
                            const category: Category = cursor.value;

                            const newFields = category.fields.map((field) => ({
                                question:
                                    field.question.type === "audio"
                                        ? addVolumeToAudioResource(
                                              field.question
                                          )
                                        : field.question.type === "video"
                                        ? addVolumeToVideoResource(
                                              field.question
                                          )
                                        : field.question,

                                answer:
                                    field.answer.type === "audio"
                                        ? addVolumeToAudioResource(field.answer)
                                        : field.answer.type === "video"
                                        ? addVolumeToVideoResource(field.answer)
                                        : field.answer,
                            }));

                            cursor.update({
                                ...category,
                                fields: newFields,
                            });
                            cursor.continue();
                        };
                        request.onerror = reject;
                    })
                );

            // create board store
            if (event.oldVersion === 0 || event.newVersion === 6)
                proms.push(
                    new Promise((resolve, reject) => {
                        const objectStore = db.createObjectStore("boards", {
                            autoIncrement: true,
                        });
                        objectStore.createIndex("name", "name", {
                            unique: false,
                        });
                        objectStore.transaction.oncomplete = resolve;
                        objectStore.transaction.onerror = reject;
                    })
                );

            await Promise.allSettled(proms).catch((error) => {
                throw new Error("dbConversion threw error: ", error);
            });
            console.log("%c" + "all stores created", "color: purple;");
        };
    });

export const storeFileInIndexedDB = (file: File, mediaType: MediaType) => {
    return new Promise<number>(async (resolve, reject) => {
        console.log("upload", mediaType, file);

        const request = db
            .transaction(mediaType, "readwrite")
            .objectStore(mediaType)
            .add(file);

        request.onsuccess = (e) => resolve((e.target as IDBRequest).result);
        request.onerror = reject;
    });
};

export const getStoredFiles = (
    mediaType: MediaType,
    startIndex: number,
    length: number = 5
) =>
    new Promise<IndexedFile[]>(async (resolve, reject) => {
        const request = db
            .transaction([mediaType], "readonly")
            .objectStore(mediaType)
            .openCursor(IDBKeyRange.upperBound(startIndex), "prev");

        // NOTE cursor is going in reverse!

        let i = 0;
        const files: IndexedFile[] = [];

        request.onsuccess = (event) => {
            const cursor = request.result;
            if (cursor && i < length) {
                const file = cursor.value as IndexedFile;
                file.dbIndex = parseInt(cursor.primaryKey as string) || -1;
                files.push(file);
                i++;
                cursor.continue();
            } else {
                resolve(files);
            }
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });

export const getStoredFile = (mediaType: MediaType, index: number) =>
    new Promise<File>((resolve, reject) => {
        const request = db
            .transaction([mediaType], "readonly")
            .objectStore(mediaType)
            .get(index);

        request.onsuccess = (event) => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });

export const getStoredFilesLength = (mediaType: MediaType) =>
    new Promise<number>((resolve, reject) => {
        const request = db
            .transaction(mediaType, "readonly")
            .objectStore(mediaType)
            .count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
    });

export const deleteStoredFile = (mediaType: MediaType, index: number) =>
    new Promise((resolve, reject) => {
        const request = db
            .transaction(mediaType, "readwrite")
            .objectStore(mediaType)
            .delete(index);

        request.onsuccess = resolve;
        request.onerror = reject;
    });

// categories
export const storeCategoryInDB = (category: Category) =>
    new Promise<number>(async (resolve, reject) => {
        console.log("upload category", category);

        const request = db
            .transaction("categories", "readwrite")
            .objectStore("categories")
            .add(category);

        request.onsuccess = (e) =>
            resolve(
                (e.target as IDBRequest)
                    .result as Indexed<StoredBoard>["dbIndex"]
            );
        request.onerror = reject;
    });

export const updateCategoryInDB = (category: Indexed<Category>) =>
    new Promise<number>((resolve, reject) => {
        console.log("update category", category);

        const request = db
            .transaction(["categories"], "readwrite")
            .objectStore("categories")
            .put(category, category.dbIndex);

        request.onsuccess = (e) => resolve((e.target as IDBRequest).result);
        request.onerror = reject;
    });

export const getStoredCategory = (index: number) =>
    new Promise<Indexed<Category>>((resolve, reject) => {
        const request = db
            .transaction(["categories"], "readonly")
            .objectStore("categories")
            .get(index);

        request.onsuccess = (event) => {
            // request still succeeds if index is not in db
            // check for that and trigger onerror manually
            if (request.result === undefined)
                return request.dispatchEvent(new Event("error"));

            const category: Indexed<Category> = {
                ...(request.result as Category),
                dbIndex: index,
            };
            resolve(category);
        };

        request.onerror = (event) => {
            reject({ error: (event.target as IDBRequest).error || null });
        };
    });

export const getStoredCategories = (startIndex: number, length: number = 5) =>
    new Promise<Indexed<Category>[]>(async (resolve, reject) => {
        const request = db
            .transaction(["categories"], "readonly")
            .objectStore("categories")
            .openCursor(IDBKeyRange.upperBound(startIndex), "prev");

        // NOTE cursor is going in reverse!
        let i = 0;
        const categories: Indexed<Category>[] = [];

        request.onsuccess = (event) => {
            const cursor = request.result;
            if (cursor && i < length) {
                const file = cursor.value as Indexed<Category>;
                file.dbIndex = parseInt(cursor.primaryKey as string) || -1;
                categories.push(file);
                i++;
                cursor.continue();
            } else {
                resolve(categories);
            }
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });

export const searchStoredCategories = (searchTerm: string) =>
    new Promise<Indexed<Category>[]>((resolve, reject) => {
        const request = db
            .transaction(["categories"], "readonly")
            .objectStore("categories")
            .openCursor();

        let i = 0;

        const categories: Indexed<Category>[] = [];

        request.onsuccess = (event) => {
            const cursor = request.result;
            if (cursor) {
                const category = cursor.value as Indexed<Category>;
                category.dbIndex = parseInt(cursor.primaryKey as string) || -1;
                if (category.name.includes(searchTerm))
                    categories.push(category);

                i++;
                cursor.continue();
            } else {
                resolve(categories);
            }
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });

export const removeCategoryFromDb = (dbIndex: Indexed<Category>["dbIndex"]) =>
    new Promise((resolve, reject) => {
        const request = db
            .transaction("categories", "readwrite")
            .objectStore("categories")
            .delete(dbIndex);

        request.onsuccess = resolve;
        request.onerror = reject;
    });

//boards
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
                                            } as DeletedCategory)
                                        )
                            )
                    )
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
