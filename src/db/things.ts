import { db } from "./indexeddb";

export interface Thing<T = any> {
    thingKey: string;
    value: T;
}

export const getThing = <T = any>(thingKey: string) =>
    new Promise<T>((resolve, reject) => {
        const request = db
            .transaction("things", "readonly")
            .objectStore("things")
            .index("thingKey")
            .get(thingKey);

        request.onsuccess = (ev) => {
            const thing = request.result as Thing<T>;

            if (thing && thing.value) resolve(thing.value);
            else reject("thing not found");
        };
        request.onerror = () => reject(request.error);
    });

export const setThing = <T = any>(thingKey: string, value: T) =>
    new Promise<void>(async (resolve, reject) => {
        const primaryKey = await getThingPrimaryKey(thingKey).catch(
            () => undefined
        );

        const thing: Thing = {
            thingKey: thingKey,
            value,
        };

        const request = db
            .transaction("things", "readwrite")
            .objectStore("things")
            .put(thing, primaryKey);

        request.onsuccess = () => resolve();
        request.onerror = (ev) => reject(request.error);
    });

const getThingPrimaryKey = (thingKey: string) =>
    new Promise<number>((resolve, reject) => {
        const request = db
            .transaction("things", "readonly")
            .objectStore("things")
            .index("thingKey")
            .getKey(thingKey);

        request.onsuccess = () => {
            const key = request.result as Thing["thingKey"];
            if (key) resolve(key as any);
            else reject("thing not found");
        };

        request.onerror = () => reject(request.error);
    });

export const removeThing = (thingKey: string) =>
    new Promise<void>(async (resolve, reject) => {
        getThingPrimaryKey(thingKey)
            .then((primaryKey) => {
                const deleteRequest = db
                    .transaction("things", "readwrite")
                    .objectStore("things")
                    .delete(primaryKey);

                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = reject;
            })
            .catch(reject);
    });
