import { UploadTask, ref, uploadBytesResumable } from "firebase/storage";
import { UserData } from "../firestore/user";
import storage from "./storage";

const fileEndingRegex = /\.webp$/;

export const changeProfilePicture = (file: File, uid: UserData["uid"]) => {
    if (!fileEndingRegex.test(file.name)) throw new Error("wrong filetype");

    const newImageRef = ref(storage, "users" + "/" + uid + "/" + "avatar.webp");

    return uploadBytesResumable(newImageRef, file);
};

export default changeProfilePicture;
