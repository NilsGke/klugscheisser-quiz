import {
    disableNetwork,
    enableIndexedDbPersistence,
    getFirestore,
} from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == "failed-precondition") {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        // ...
        console.warn(err.code, err);
    } else if (err.code == "unimplemented") {
        // The current browser does not support all of the
        // features required to enable persistence
        // ...
        console.warn(err.code, err);
    }
});

export default db;
