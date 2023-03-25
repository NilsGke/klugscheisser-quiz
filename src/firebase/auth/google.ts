import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import auth, { generateUserInDb } from "./auth";
import { getUser } from "../firestore/user";
import storage, { uploadProfileImageToStorage } from "../storage/storage";
import { getDownloadURL, ref } from "firebase/storage";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
    return new Promise<User>((resolve, reject) => {
        signInWithPopup(auth, provider)
            .then(async (result) => {
                try {
                    const existingUser = await getUser(result.user.uid);
                    console.log("existing user found: ", { existingUser });
                    return existingUser;
                } catch (err) {
                    console.info("no user found, creating new user");
                }

                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential =
                    GoogleAuthProvider.credentialFromResult(result);
                if (credential === null) return reject("credential is null");
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;

                if (user.email === null)
                    reject("⚠ no email provided by google login!");

                console.log(user);

                const username =
                    user.displayName ||
                    "User" + Math.floor(Math.random() * 10000000).toString(36);

                let photoURL = `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURI(
                    username
                )}`;

                if (user.photoURL) {
                    const res = await fetch(user.photoURL);
                    const imageBlob = await res.blob();
                    console.log(imageBlob);

                    const imageFile = new File(
                        [imageBlob],
                        "profileImage." + imageBlob.type.split("/").at(-1)
                    );

                    let refPath = await uploadProfileImageToStorage(
                        imageFile,
                        user.uid
                    );
                    photoURL = await getDownloadURL(ref(storage, refPath));
                }

                generateUserInDb(user.uid, {
                    username,
                    email: user.email || "null",
                    avatarUrl: photoURL,
                });

                resolve(user);
            })
            .catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                // const email = error.customData.email;
                // // The AuthCredential type that was used.
                // const credential =
                //     GoogleAuthProvider.credentialFromError(error);
                // ...
                reject({ errorCode, errorMessage });
            });
    });
};
