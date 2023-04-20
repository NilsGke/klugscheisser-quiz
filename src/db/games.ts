import { Game } from "$types/gameTypes";
import { db } from "./indexeddb";

export const saveGameInDb = (game: Game) =>
    new Promise<void>((resolve, reject) => {
        const request = db
            .transaction("games", "readwrite")
            .objectStore("games")
            .put(game, 0);

        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });

export const getGameFromDb = () =>
    new Promise<Game>((resolve, reject) => {
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
    });

export const deleteGameFromDb = () =>
    new Promise<void>((resolve, reject) => {
        const request = db
            .transaction("games", "readwrite")
            .objectStore("games")
            .delete(0);

        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
