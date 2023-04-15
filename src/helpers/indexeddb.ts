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
 *
 */
let db: IDBDatabase;

export type Indexed<T> = T & {
    dbIndex: number;
};

export const initIndexedDB = () =>
    new Promise<void>((resolve, reject) => {
        const request = window.indexedDB.open("LocalFileDatabase", 5);

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

            await Promise.all(proms);
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

export const storeCategoryInDB = (category: Category) =>
    new Promise<number>(async (resolve, reject) => {
        console.log("upload category", category);

        const request = db
            .transaction("categories", "readwrite")
            .objectStore("categories")
            .add(category);

        request.onsuccess = (e) => resolve((e.target as IDBRequest).result);
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
