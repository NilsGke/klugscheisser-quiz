import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { UserData } from "../firestore/user";

const storage = getStorage();

export const storagePrefix = "gs://instagram-von-wish.appspot.com/";

const fileEndingRegex = /^.+\.(jpg|jpeg|png|gif|bmp|svg)$/gi;

/**
 * @returns public profile image url on db
 */
export const uploadProfileImageToStorage = (
    file: File,
    uid: UserData["uid"]
) => {
    return new Promise<string>(async (resolve, reject) => {
        console.log(file.name);

        if (!fileEndingRegex.test(file.name))
            return reject("unsupported filetype");

        const newImageRef = ref(storage, "users" + "/" + uid + "/" + file.name);

        const result = await uploadBytes(newImageRef, file);
        const downloadURL = await getDownloadURL(
            ref(storage, result.metadata.fullPath)
        );

        resolve(downloadURL);
    });
};

export default storage;
