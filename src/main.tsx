import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root/Root.page";
import "./index.scss";
import OfflineBanner from "./components/OfflineBanner";
import Help from "./routes/help/Help.page";
import Categories, {
    CategoriesPagePurpose,
} from "./routes/categories/Categories.page";
import Editor from "./routes/edit/Editor.page";
import Game from "./routes/game/Game.page";
import { initIndexedDB } from "./helpers/indexeddb";
import Spinner from "./components/Spinner";
import Viewer from "./routes/viewer/View.page";

enum NetworkStatus {
    ONLINE = "online",
    OFFLINE = "offline",
}

const App = () => {
    const [network, setNetwork] = useState<NetworkStatus>(
        navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE
    );

    const [indexedDbIsReady, setIndexedDbIsReady] = useState(false);
    useEffect(() => {
        initIndexedDB().then(() => setIndexedDbIsReady(true));
    }, []);

    // offline detection
    useEffect(() => {
        const online = () => {
            console.log("%cclient online", "color:blue;");
            setNetwork(NetworkStatus.ONLINE);
        };
        const offline = () => {
            console.log("%cclient offline", "color:blue;");
            setNetwork(NetworkStatus.OFFLINE);
        };
        window.addEventListener("online", online);
        window.addEventListener("offline", offline);

        return () => {
            window.removeEventListener("online", online);
            window.removeEventListener("offline", offline);
        };
    }, []);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <Root />,
        },
        {
            path: "/help",
            element: <Help />,
        },
        {
            path: "/editor",
            element: <Editor />,
        },
        {
            path: "/categories",
            element: (
                <Categories
                    defaultPurpose={CategoriesPagePurpose.VIEW_CATEGORIES}
                />
            ),
        },
        {
            path: "/game",
            element: <Game />,
        },
    ]);

    return (
        <>
            {network === NetworkStatus.OFFLINE ? <OfflineBanner /> : null}
            <RouterProvider router={router} />
        </>
    );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
