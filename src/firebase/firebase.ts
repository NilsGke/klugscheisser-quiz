import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyDAK6QV4q_AqZarHaz3aBwhofy5tc3xcNY",
    authDomain: "klugscheisser-quiz.firebaseapp.com",
    projectId: "klugscheisser-quiz",
    storageBucket: "klugscheisser-quiz.appspot.com",
    messagingSenderId: "84365752647",
    appId: "1:84365752647:web:94c7d9f3d30b6306f7b462",
};

export const app = initializeApp(firebaseConfig);
