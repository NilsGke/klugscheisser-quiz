import { IDBMigrationFunction } from "./lib/dbHelpers";

export interface FSDH {
  fileSystemDirectoryHandle: FileSystemDirectoryHandle;
  lastOpened: number; // Date.now()
}

export interface FSDHWithKey extends FSDH {
  key: IDBValidKey;
}

export const migrations: IDBMigrationFunction[] = [
  // add FSDH Store
  (db) =>
    new Promise<void>((resolve, reject) => {
      const objectStore = db.createObjectStore("fsdh", {
        autoIncrement: true,
      });

      objectStore.createIndex("lastOpened", "lastOpened", {
        multiEntry: true,
      });

      objectStore.transaction.oncomplete = () => resolve();
      objectStore.transaction.onerror = reject;
    }),
];

export const getLatestFSDH = (db: IDBDatabase) =>
  new Promise<FSDHWithKey>((resolve, reject) => {
    const request = db
      .transaction("fsdh", "readonly")
      .objectStore("fsdh")
      .index("lastOpened" satisfies keyof FSDH)
      .openCursor(null, "prev");

    request.onsuccess = function (event) {
      if (event.target === null) return reject();
      const cursor = request.result;
      if (cursor === null) return reject();
      resolve({ ...cursor.value, key: cursor.primaryKey });
    };
  });

export const updateFSDHLastOpened = (db: IDBDatabase, key: IDBValidKey) =>
  new Promise<void>(async (resolve, reject) => {
    const fsdh = await getFSDHFromKey(db, key);
    if (fsdh === null) return reject();

    const transaction = db
      .transaction("fsdh", "readwrite")
      .objectStore("fsdh")
      .put(
        {
          ...fsdh,
          lastOpened: Date.now(),
        },
        key,
      );

    transaction.onsuccess = () => resolve();
    transaction.onerror = reject;
  });

export const addFSDHToDb = (db: IDBDatabase, fsdh: FSDH) =>
  new Promise<IDBValidKey>(async (resolve, reject) => {
    const existing = await findFSDHInDb(
      db,
      fsdh.fileSystemDirectoryHandle,
    ).catch(() => null);

    if (existing) return resolve(existing.key);

    const transaction = db
      .transaction("fsdh", "readwrite")
      .objectStore("fsdh")
      .add(fsdh);

    transaction.onsuccess = () => {
      resolve(transaction.result);
    };
    transaction.onerror = reject;
  });

export const getFSDHFromKey = (db: IDBDatabase, key: IDBValidKey) =>
  new Promise<FSDH>((resolve, reject) => {
    const transaction = db
      .transaction("fsdh", "readonly")
      .objectStore("fsdh")
      .get(key);
    transaction.onsuccess = (event) => {
      const fsdh = transaction.result as FSDH | null;
      if (!fsdh) return reject();
      return resolve(fsdh);
    };
    transaction.onerror = reject;
  });

export const findFSDHInDb = (
  db: IDBDatabase,
  fsdh: FSDH["fileSystemDirectoryHandle"],
) =>
  new Promise<FSDHWithKey>((resolve, reject) => {
    const objectStore = db.transaction("fsdh", "readonly").objectStore("fsdh");

    const entriesRequest = objectStore.getAll();
    const keysRequest = objectStore.getAllKeys();

    Promise.all([
      new Promise<FSDH[]>((resolve, reject) => {
        entriesRequest.onsuccess = () =>
          resolve(entriesRequest.result as FSDH[]);
        entriesRequest.onerror = () => reject(entriesRequest.error);
      }),
      new Promise<IDBValidKey[]>((resolve, reject) => {
        keysRequest.onsuccess = () =>
          resolve(keysRequest.result as FSDHWithKey["key"][]);
        keysRequest.onerror = () => reject(keysRequest.error);
      }),
    ])
      .then(async ([entries, keys]) => {
        for (let i = 0; i <= entries.length; i++) {
          const entry = entries[i];
          if (await entry.fileSystemDirectoryHandle.isSameEntry(fsdh)) {
            resolve({ ...entry, key: keys[i] });
            return;
          }
        }

        reject("not found");
        entriesRequest.onerror = () => reject(entriesRequest.error);
      })
      .catch((error) => {
        reject(error);
      });
  });

export const removeFSDHFromDb = (db: IDBDatabase, key: IDBValidKey) =>
  new Promise<void>((resolve, reject) => {
    const request = db
      .transaction("fsdh", "readwrite")
      .objectStore("fsdh")
      .delete(key);

    request.onsuccess = () => resolve();
    request.onerror = (error) => reject(error);
  });
