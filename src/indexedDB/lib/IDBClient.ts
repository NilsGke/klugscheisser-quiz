import { createContext } from "react";
import {
    getCurrentDBVersion,
    IDBMigrationFunction,
    initIndexedDB,
    upgradeDB,
} from "./dbHelpers";

export const IDBClientContext = createContext<IDBClient | undefined>(undefined);

type IDBClientConfig = {
    name: string;
    migrations: IDBMigrationFunction[];
};

interface IDBEventMap {
    statuschange: IDBStatus;
}

enum IDBStatus {
    INITIALIZING = "initializing",
    MIGRATING = "migrating",
    READY = "ready",
}

export class IDBClient {
    #dbName: string;
    #migrations: IDBMigrationFunction[];
    #db: IDBDatabase | null = null;

    // prevent database being accessed before migrations are done
    get db() {
        if (this.#status !== "ready") return null;
        return this.#db;
    }

    #status: IDBStatus;

    #eventTarget: EventTarget;
    #initiatedDB = false;
    #mountCount = 0;

    constructor(config: IDBClientConfig) {
        this.#dbName = config.name;
        this.#migrations = [async () => {}, ...config.migrations]; // need to add an empty migration function because db is initialized at version 0 so it wont run the first migration function
        this.#eventTarget = new EventTarget();
        this.#status = IDBStatus.INITIALIZING;
    }

    async mount() {
        this.#mountCount++;
        if (this.#mountCount !== 1) return;
        if (!this.#initiatedDB) {
            this.#initiatedDB = true;
            initIndexedDB(
                this.#dbName,
                this.#migrations.length,
                this.#migrations
            ).then((db) => {
                this.#db = db;
                this.status = IDBStatus.READY;
            });
        }
    }

    unmount() {
        this.#mountCount--;
        if (this.#mountCount !== 0) return;
        this.#db?.close();
    }

    initIndexedDB(DB_VERSION: number, migrations: IDBMigrationFunction[]) {
        return new Promise<void>((resolve) => {
            getCurrentDBVersion(this.#dbName).then(async (currentVersion) => {
                await upgradeDB(this.#dbName, currentVersion, migrations);

                const request = window.indexedDB.open(this.#dbName, DB_VERSION);

                request.onsuccess = (event) => {
                    if (event.target === null)
                        throw new Error(
                            "indexeddb: event.target on succsess is null"
                        );

                    this.#db = (event.target as IDBOpenDBRequest).result;

                    // Generic error handler for all errors targeted at this database's
                    // requests!
                    this.db!.onerror = (event) => {
                        if (event.target === null)
                            throw new Error(
                                "in db.onerror: event.target is null"
                            );

                        console.error(
                            `Database error: ${
                                (
                                    event.target as unknown as {
                                        errorCode: string;
                                    }
                                ).errorCode
                            }`
                        );
                    };

                    resolve();
                };
            });
        });
    }

    get status(): IDBStatus {
        return this.#status;
    }
    private set status(newStatus) {
        this.#status = newStatus;
        this.dispatchEvent("statuschange", newStatus);
    }

    subscribe = <K extends keyof IDBEventMap>(
        type: K,
        listener: (
            event: K extends void ? Event : CustomEvent<IDBEventMap[K]>
        ) => void
    ) => {
        this.#eventTarget.addEventListener(type, listener as EventListener);
        return () => this.unsubscribe(type, listener as EventListener);
    };

    unsubscribe = <K extends keyof IDBEventMap>(
        type: K,
        listener: (
            event: K extends void ? Event : CustomEvent<IDBEventMap[K]>
        ) => void
    ) => this.#eventTarget.removeEventListener(type, listener as EventListener);

    private dispatchEvent<K extends keyof IDBEventMap>(
        type: K,
        detail?: IDBEventMap[K]
    ): void {
        const event = detail
            ? new CustomEvent(type, { detail })
            : new Event(type);
        this.#eventTarget.dispatchEvent(event);
    }
}
