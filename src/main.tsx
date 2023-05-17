import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root/Root.page";
import "./index.scss";
import OfflineBanner from "./components/OfflineBanner";
import Help from "./routes/help/Help.page";
import Categories from "./routes/categories/Categories.page";
import CategoryEditor from "./routes/edit/Editor.page";
import Game from "./routes/game/Game.page";
import { initIndexedDB } from "./db/indexeddb";
import Spinner from "./components/Spinner";
import { registerSW } from "virtual:pwa-register";
import NewVersionbanner from "./components/NewVersionbanner";
import Boards from "./routes/boards/Boards.page";
import BoardEditor from "./routes/boards/editor/BoardEditor.page";
import { getSettings } from "$helpers/settings";
import "light.scss";
import "./confirm-alert.scss";

enum NetworkStatus {
    ONLINE = "online",
    OFFLINE = "offline",
}

const themes = ["light", "dark", "senior"] as const;
export type Theme = (typeof themes)[number];

const App = () => {
    const [network, setNetwork] = useState<NetworkStatus>(
        navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE
    );

    const [indexedDbIsReady, setIndexedDbIsReady] = useState(false);
    const [migrationsTotal, setMigrationsTotal] = useState(0);
    const [migrationsLeft, setMigrationsLeft] = useState(0);

    useEffect(() => {
        initIndexedDB(setMigrationsTotal, setMigrationsLeft).then(() =>
            setIndexedDbIsReady(true)
        );
    }, []);

    // theme
    const [theme, setTheme] = useState<Theme>(getSettings().theme);
    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.body.classList.remove(...themes);
        document.body.classList.add(theme);

        setTimeout(() => {
            document
                .querySelector('meta[name="theme-color"]')
                ?.setAttribute(
                    "content",
                    theme === "dark" ? "#262626" : "#dadada"
                );
        }, 100);
    }, [theme]);

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
            element: (
                <Root
                    theme={theme}
                    themeChange={() => setTheme(getSettings().theme)}
                />
            ),
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
            element: (
                <Game
                    theme={theme}
                    themeChange={() => setTheme(getSettings().theme)}
                />
            ),
        },
        {
            path: "/categories/test/:dbIndex/destroy",
            element: (
                <Game
                    theme={theme}
                    themeChange={() => setTheme(getSettings().theme)}
                />
            ),
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
            element: (
                <Game
                    theme={theme}
                    themeChange={() => setTheme(getSettings().theme)}
                />
            ),
        },
    ]);

    if (!indexedDbIsReady)
        return (
            <div className="loading">
                <Spinner />
                <div className="text">migrating local database</div>
                <div className="info">
                    {migrationsTotal - migrationsLeft}/{migrationsTotal}
                </div>
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
    <App />
);
