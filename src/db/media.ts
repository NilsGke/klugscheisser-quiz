import { MediaType, IndexedFile } from "../types/categoryTypes";
import { db } from "./indexeddb";

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
