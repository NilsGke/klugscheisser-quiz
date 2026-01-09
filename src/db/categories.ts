import { StoredBoard } from "$types/boardTypes";
import { Category } from "$types/categoryTypes";
import { db, Indexed } from "./indexeddb";

export enum SortingMethod {
    creationDate = "creationDate",
    abcNormal = "abcNormal",
    abcReverse = "abcReverse",
}

export const storeCategoryInDB = (category: Category) =>
    new Promise<number>(async (resolve, reject) => {
        const request = db
            .transaction("categories", "readwrite")
            .objectStore("categories")
            .add(category);

        request.onsuccess = (e) =>
            resolve(
                (e.target as IDBRequest)
                    .result as Indexed<StoredBoard>["dbIndex"],
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

        let i = 0;
        const categories: Indexed<Category>[] = [];

        request.onsuccess = (event) => {
            const cursor = request.result;
            if (cursor && i < length) {
                const category = cursor.value as Indexed<Category>;
                category.dbIndex = parseInt(cursor.primaryKey as string) || -1;
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

export const countCategories = () =>
    new Promise<number>((resolve, reject) => {
        const request = db
            .transaction("categories", "readonly")
            .objectStore("categories")
            .count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
