/** fetch current DB Version */
export const getCurrentDBVersion = (DB_NAME: string) =>
    new Promise<number>((resolve) => {
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

/** initializes IndexedDB
 */
export const initIndexedDB = (
    DB_NAME: string,
    DB_VERSION: number,
    migrations: IDBMigrationFunction[]
) =>
    new Promise<IDBDatabase>((resolve) => {
        let db: IDBDatabase;
        getCurrentDBVersion(DB_NAME).then(async (currentVersion) => {
            await upgradeDB(DB_NAME, currentVersion, migrations);

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onsuccess = (event) => {
                if (event.target === null)
                    throw new Error(
                        "indexeddb: event.target on succsess is null"
                    );

                db = (event.target as IDBOpenDBRequest).result;

                // Generic error handler for all errors targeted at this database's
                // requests!
                db.onerror = (event) => {
                    if (event.target === null)
                        throw new Error("in db.onerror: event.target is null");

                    console.error(
                        `Database error: ${
                            (event.target as unknown as { errorCode: string })
                                .errorCode
                        }`
                    );
                };

                resolve(db);
            };
        });
    });

/** This function executes all needed migrations to upgrade db to newest state
 * @param infoUpdate function that will be executed after each migration is complete to provide info to user
 */
export const upgradeDB = async (
    DB_NAME: string,
    currentVersion: number,
    migrations: IDBMigrationFunction[]
) => {
    const targetVersion = migrations.length;
    if (targetVersion > currentVersion) {
        await migrateDB(DB_NAME, migrations, currentVersion + 1);

        const newVersion = await getCurrentDBVersion(DB_NAME);

        await upgradeDB(DB_NAME, newVersion, migrations);
    }
};

export type IDBMigrationFunction = (
    db: IDBDatabase,
    event: IDBVersionChangeEvent
) => Promise<MutationFunction | void>;
type MutationFunction = (db: IDBDatabase) => Promise<void>;

/** executes one migration function to bring db version up to `newVersion`
 * @param newVersion new version of the db after the migration
 * @returns
 */
export const migrateDB = async (
    DB_NAME: string,
    migrationFunctions: IDBMigrationFunction[],
    newVersion: number
) =>
    new Promise<void>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, newVersion);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const migrationFunction = migrationFunctions.at(newVersion - 1);
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

        request.onsuccess = () => resolve();
    });
