import { generateThumbnail } from "$helpers/thumbnail";
import {
    Category,
    MediaTypes,
    addVolumeToAudioResource,
    addVolumeToVideoResource,
} from "$types/categoryTypes";
import { Game } from "$types/gameTypes";
import { Thing } from "./things";

/** ### version documentation
 *
 * @version 3 all media stores
 * @version 4 added category store
 * @version 5 added volume to audio and video
 * @version 6 added board store
 * @version 7 added game store
 * @version 8 added thing store
 * @version 9 remove old game store (@version 7)
 * @version 10 generate thumbnails for categories
 */
export let db: IDBDatabase;

export type Indexed<T> = T & {
    dbIndex: number;
};

const DB_VERSION = 10;
const DB_NAME = "LocalFileDatabase";

export const initIndexedDB = (
    migrationsNeededCallback: (amount: number) => void,
    infoUpdate: (migrationsLeft: number) => void
) =>
    new Promise<void>((resolve, reject) => {
        getCurrentVersion().then(async (currentVersion) => {
            migrationsNeededCallback(DB_VERSION - currentVersion);
            await upgrade(currentVersion, infoUpdate);

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onsuccess = (event) => {
                if (event.target === null)
                    throw new Error(
                        "indexeddb: event.target on succsess is null"
                    );

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
        });
    });

const upgrade = async (
    currentVersion: number,
    infoUpdate: (migrationsLeft: number) => void
) => {
    if (DB_VERSION > currentVersion) {
        infoUpdate(DB_VERSION - currentVersion);
        await migrate(currentVersion + 1);
        const newVersion = await getCurrentVersion();
        await upgrade(newVersion, infoUpdate);
    }
};

const migrate = async (newVersion: number) =>
    new Promise<void>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, newVersion);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const migrationFunction = migrations.at(newVersion);
            if (migrationFunction === undefined)
                throw new Error(
                    `migration function is undefined for version: ${newVersion}`
                );

            migrationFunction(db, event).then(async (asyncMutationFunction) => {
                db.close();

                if (asyncMutationFunction) {
                    const request = window.indexedDB.open(DB_NAME, newVersion);
                    request.onsuccess = async () => {
                        const db = request.result;
                        await asyncMutationFunction(db);
                        resolve();
                    };
                    request.onerror = () => {
                        console.error(request.error);
                        reject(request.error);
                    };
                } else resolve();
            });
        };

        // request.onsuccess = () => resolve();
    });

type MigrationFunction = (
    db: IDBDatabase,
    event: IDBVersionChangeEvent
) => Promise<mutationFunction | void>;
type mutationFunction = (db: IDBDatabase) => Promise<void>;

const migrations: MigrationFunction[] = [
    // version 0
    () => new Promise<void>((resolve) => resolve()),
    // version 1
    () => new Promise<void>((resolve) => resolve()),
    // version 2
    () => new Promise<void>((resolve) => resolve()),
    // add media type object stores
    (db) =>
        new Promise<void>((resolve, reject) => {
            const proms = MediaTypes.map(
                (type) =>
                    new Promise<void>((resolve, reject) => {
                        const objectStore = db.createObjectStore(type, {
                            autoIncrement: true,
                        });
                        objectStore.transaction.addEventListener(
                            "complete",
                            () => resolve()
                        );
                        objectStore.transaction.onerror = reject;
                    })
            );

            Promise.all(proms).then(() => resolve());
        }),
    // add categories store
    (db) =>
        new Promise<void>((resolve, reject) => {
            const objectStore = db.createObjectStore("categories", {
                autoIncrement: true,
            });

            objectStore.transaction.oncomplete = () => resolve();

            objectStore.transaction.onerror = reject;
        }),
    // add volume store
    (db, event) =>
        new Promise<void>((resolve, reject) => {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction === null)
                return reject("event.target.transaction is null");

            const request = transaction.objectStore("categories").openCursor();

            request.onsuccess = (e: Event) => {
                const cursor = request.result;
                if (cursor === null) return resolve();

                const category: Category = cursor.value;

                const newFields = category.fields.map((field) => ({
                    question:
                        field.question.type === "audio"
                            ? addVolumeToAudioResource(field.question)
                            : field.question.type === "video"
                            ? addVolumeToVideoResource(field.question)
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
        }),
    // board store
    (db) =>
        new Promise<void>((resolve, reject) => {
            const objectStore = db.createObjectStore("boards", {
                autoIncrement: true,
            });

            objectStore.transaction.oncomplete = () => resolve();

            objectStore.transaction.onerror = reject;
        }),
    // game store
    (db) =>
        new Promise<void>((resolve, reject) => {
            const objectStore = db.createObjectStore("games", {
                autoIncrement: true,
            });

            objectStore.transaction.oncomplete = () => resolve();

            objectStore.transaction.onerror = reject;
        }),
    // create new things store
    (db) =>
        new Promise<void>((resolve, reject) => {
            const objectStore = db.createObjectStore("things", {
                autoIncrement: true,
            });

            objectStore.createIndex("thingKey", "thingKey", {
                unique: true,
            });

            objectStore.transaction.oncomplete = async () => {
                // get old game if one is running
                const game = await new Promise<Game>((resolve, reject) => {
                    const request = db
                        .transaction("games", "readonly")
                        .objectStore("games")
                        .get(0);

                    request.onsuccess = () => {
                        if (request.result === undefined)
                            return request.dispatchEvent(new Event("error"));

                        resolve(request.result as Game);
                    };
                    request.onerror = () => reject();
                }).catch(() => undefined); // if it errors, we ignore the running game (there probably is no game running)

                // save previous game in new things store
                if (game !== undefined) {
                    const setGameRequest = db
                        .transaction("things", "readwrite")
                        .objectStore("things")
                        .put({
                            thingKey: "activeGame",
                            value: game,
                        } as Thing);

                    setGameRequest.onsuccess = () => resolve();
                } else {
                    resolve();
                }
            };
        }),

    // delete old game store
    (db) =>
        new Promise<void>((resolve, reject) => {
            db.deleteObjectStore("games");
            resolve();
        }),
    // generate thumbnails for categories
    () =>
        new Promise<mutationFunction>((resolve, reject) =>
            resolve(
                (db) =>
                    new Promise((resolve, reject) => {
                        const transaction = db
                            .transaction("categories", "readwrite")
                            .objectStore("categories")
                            .openCursor();

                        const proms: Promise<void>[] = [];

                        transaction.onsuccess = async (e: Event) => {
                            const cursor = transaction.result;
                            if (cursor === null) {
                                await Promise.all(proms);
                                return resolve();
                            }

                            const category: Category = cursor.value;
                            const key = cursor.key;

                            // dont wait for cursor update to finish because transaction will close :(
                            cursor.continue();

                            proms.push(
                                new Promise<void>(async (resolve, reject) => {
                                    const thumbnail: Category["thumbnail"] =
                                        typeof category.description === "string"
                                            ? null
                                            : await generateThumbnail(
                                                  category.description
                                              );

                                    const request = db
                                        .transaction("categories", "readwrite")
                                        .objectStore("categories")
                                        .put(
                                            {
                                                ...category,
                                                thumbnail,
                                            } as Category,
                                            key
                                        );

                                    request.onsuccess = () => resolve();
                                    request.onerror = () => {
                                        console.error(request.error);
                                        reject(request.error);
                                    };
                                })
                            );
                        };
                        transaction.onerror = reject;
                    })
            )
        ),
];

const getCurrentVersion = () =>
    new Promise<number>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME);
        request.addEventListener("success", (event) => {
            if (event.target === null)
                throw new Error(
                    "indexeddb: event.target on succsess is null. (trying to look up version)"
                );
            const db = (event.target as IDBOpenDBRequest).result;
            const version = db.version;
            db.close();
            resolve(version);
        });
    });
