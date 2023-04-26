import {
    Category,
    MediaTypes,
    addVolumeToAudioResource,
    addVolumeToVideoResource,
} from "$types/categoryTypes";

/** ### version documentation
 *
 * @version 3 all media stores
 * @version 4 added category store
 * @version 5 added volume to audio and video
 * @version 6 added board store
 * @version 7 added game store
 */
export let db: IDBDatabase;

export type Indexed<T> = T & {
    dbIndex: number;
};

const DB_VERSION = 7;

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
                        objectStore.transaction.oncomplete = resolve;
                        objectStore.transaction.onerror = reject;
                    })
                );

            // create game store and delete indexes
            if (event.oldVersion === 0 || event.newVersion === 7)
                proms.push(
                    new Promise((resolve, reject) => {
                        const objectStore = db.createObjectStore("games", {
                            autoIncrement: true,
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
