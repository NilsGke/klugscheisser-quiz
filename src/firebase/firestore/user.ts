import {
    getDoc,
    doc,
    collection,
    CollectionReference,
    updateDoc,
    onSnapshot,
} from "firebase/firestore";
import db from "./firestore";

export type UserData = {
    uid: string;
    username: string;
    email: string;
    avatarUrl: string;
};

export const getUser = (uid: UserData["uid"]) =>
    new Promise<UserData>(async (resolve, reject) => {
        const snapshot = await getDoc(doc(db, "users", uid));
        if (snapshot.data() === undefined) reject();
        else resolve(snapshot.data() as UserData);
    });

export const subscribeToOwnAccount = (
    uid: UserData["uid"],
    callback: (newUser: UserData) => void
) => {
    const unsub = onSnapshot(doc(db, "users", uid), (doc) => {
        const data = doc.data();
        if (!data) return;
        callback({
            ...data,
            uid: doc.id,
        } as UserData);
    });

    return unsub;
};

export const changeUsername = (
    uid: UserData["uid"],
    newUsername: UserData["username"]
) =>
    new Promise((resolve, reject) =>
        updateDoc(doc(db, "users", uid), {
            username: newUsername,
        })
            .then(resolve)
            .catch((error) => {
                console.error(error);
                reject(error);
            })
    );
