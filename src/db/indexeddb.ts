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

            migrationFunction(db, event).then(() => {
                db.close();
                resolve();
            });
        };

        // request.onsuccess = () => resolve();
    });

type MigrationFunction = (
    db: IDBDatabase,
    event: IDBVersionChangeEvent
) => Promise<any>;

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
