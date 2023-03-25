import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root/Root.page";
import "./index.css";
import auth from "./firebase/auth/auth";
import { User, onAuthStateChanged } from "firebase/auth";
import {
    UserData,
    getUser,
    subscribeToOwnAccount,
} from "./firebase/firestore/user";
import Login from "./routes/login/Login.page";
import Account from "./routes/account/Account.page";
import Spinner from "./components/Spinner";

const App = () => {
    const [loaded, setLoaded] = useState(false);
    const [authUser, setAuthUser] = useState<User | null>(auth.currentUser);
    const [userData, setUserData] = useState<UserData | null>(null);

    // auth changes
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (!loaded) setLoaded(true);
            if (user) setAuthUser(user);
        });
    }, []);

    // request data on successfull auth
    useEffect(() => {
        if (authUser) getUser(authUser.uid).then((data) => setUserData(data));
    }, [authUser]);

    // subscribe to own user
    useEffect(() => {
        if (authUser !== null)
            return subscribeToOwnAccount(authUser.uid, setUserData);
    }, [authUser]);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <Root userData={userData} />,
        },
        {
            path: "/login",
            element: <Login loggedIn={authUser !== null} />,
        },
        {
            path: "/account",
            element: <Account userData={userData} />,
        },
    ]);

    // show loading div to prevent flash of logged out user
    if (!loaded || (authUser !== null && userData === null)) return <Spinner />; //TODO enhance this

    return <RouterProvider router={router} />;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
