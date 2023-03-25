import {
    User,
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateEmail,
} from "firebase/auth";
import { app } from "../firebase";
import { UserData } from "../firestore/user";
import { collection, doc, setDoc } from "firebase/firestore";
import db from "../firestore/firestore";
import getDicebearImage from "../../helpers/dicebear";
import { uploadProfileImageToStorage } from "../storage/storage";

const auth = getAuth(app);

export default auth;

export const generateUserInDb = (
    uid: string,
    {
        username,
        email,
        avatarUrl,
    }: {
        username: UserData["username"];
        email: UserData["email"];
        avatarUrl: UserData["avatarUrl"];
    }
) =>
    new Promise((resolve, reject) => {
        const userData: UserData = {
            email,
            avatarUrl,
            uid,
            username,
        };
        setDoc(doc(collection(db, "users"), uid), userData)
            .then(resolve)
            .catch(reject);
    });

export const register = (
    email: UserData["email"],
    password: string,
    passwordRepeat: string,
    username: UserData["username"]
) =>
    new Promise<User>(async (resolve, reject) => {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        ).then(async (userCredential) => {
            // Signed in
            const user = userCredential.user;

            const profileImage = await getDicebearImage(username);

            const avatarUrl = await uploadProfileImageToStorage(
                profileImage,
                user.uid
            );

            await generateUserInDb(user.uid, {
                username,
                email,
                avatarUrl,
            });

            resolve(user);
        });
    });

export const signIn = (email: UserData["email"], password: string) =>
    new Promise((resolve, reject) => {
        signInWithEmailAndPassword(auth, email, password).then(
            (credentials) => {
                console.log(credentials);
            }
        );
    });

export const changeEmail = (
    oldEmail: UserData["email"],
    newEmail: UserData["email"],
    password: string
) =>
    new Promise<void>((resolve, reject) =>
        signInWithEmailAndPassword(auth, oldEmail, password)
            .then((credentials) =>
                updateEmail(credentials.user, newEmail)
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        console.error(error);
                        reject(error);
                    })
            )
            .catch((error) => {
                console.error(error);
                reject(error);
            })
    );

export const changePassword = (
    email: UserData["email"],
    oldPassword: string,
    newPassword: UserData["email"]
) => {};

export const resetPassword = (email: UserData["email"]) =>
    sendPasswordResetEmail(auth, email);
