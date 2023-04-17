import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root/Root.page";
import "./index.scss";
import OfflineBanner from "./components/OfflineBanner";
import Help from "./routes/help/Help.page";
import Categories from "./routes/categories/Categories.page";
import CategoryEditor from "./routes/edit/Editor.page";
import Game from "./routes/game/Game.page";
import { initIndexedDB } from "./helpers/indexeddb";
import Spinner from "./components/Spinner";
import Viewer from "./routes/viewer/View.page";
import { registerSW } from "virtual:pwa-register";
import NewVersionbanner from "./components/NewVersionbanner";
import Boards from "./routes/boards/Boards.page";
import BoardEditor from "./routes/boards/editor/BoardEditor.page";

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

    const [newVersion, setNewVersion] = useState(false);
    const updateSWRef = useRef<
        ((reloadPage?: boolean | undefined) => Promise<void>) | null
    >(null);
    // handle app version update
    useEffect(() => {
        updateSWRef.current = registerSW({
            onNeedRefresh() {
                setNewVersion(true);
            },
            onOfflineReady() {
                console.log("offline ready");
            },
        });
        return () => {};
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
        // categories
        {
            path: "/categories",
            element: <Categories />,
        },
        {
            path: "/categories/editor",
            element: <CategoryEditor />,
        },
        {
            path: "/categories/editor/:dbIndex",
            element: <CategoryEditor />,
        },
        {
            path: "/categories/test/:dbIndex",
            element: <Game />,
        },
        {
            path: "/categories/view/:dbIndex",
            element: <Viewer />,
        },
        {
            path: "/categories/test/:dbIndex/destroy",
            element: <Game />,
        },
        // boards
        {
            path: "/boards",
            element: <Boards />,
        },
        {
            path: "/boards/editor",
            element: <BoardEditor />,
        },
        {
            path: "/boards/editor/:dbIndex",
            element: <BoardEditor />,
        },
        {
            path: "/game",
            element: <Game />,
        },
    ]);

    if (!indexedDbIsReady)
        return (
            <div className="loading">
                <Spinner />
                <div className="text">loading local database</div>
            </div>
        );

    return (
        <>
            {network === NetworkStatus.OFFLINE ? <OfflineBanner /> : null}
            {newVersion ? (
                <NewVersionbanner
                    update={() => updateSWRef.current && updateSWRef.current()}
                />
            ) : null}
            <RouterProvider router={router} />
        </>
    );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
