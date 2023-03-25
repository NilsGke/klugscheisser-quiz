import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import storage from "../storage/storage";
import { UserData } from "./user";
import db from "./firestore";

export const updateAvatarUrl = async (
    fullPath: string,
    uid: UserData["uid"]
) => {
    console.log(fullPath);

    updateDoc(doc(db, "users", uid), {
        avatarUrl: await getDownloadURL(ref(storage, fullPath)),
    });
};
