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
import DirectoryChooser from "$components/DirectoryChooser";
import { IDBClient } from "./indexedDB/lib/IDBClient";
import { migrations } from "./indexedDB/db";
import { IDBClientProvider } from "./indexedDB/lib/IDBClientProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useIDBStatus from "indexedDB/lib/hooks/useIDBStatus";
import useIDB from "indexedDB/lib/hooks/useIDB";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  // new IDB Status
  const dbStatus = useIDBStatus();
  const db = useIDB();

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
        ?.setAttribute("content", theme === "dark" ? "#262626" : "#dadada");
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

  // User Directofy
  const [fileSystemDirectoryHandle, setFileSystemDirectoryHandle] = useState<
    FileSystemDirectoryHandle | "useLatest" | "choose"
  >("useLatest");

  if (typeof fileSystemDirectoryHandle === "string")
    return (
      <div id="directoryChooserPage">
        <h1>Wähle dein KSQ Verzeichnis</h1>
        <DirectoryChooser
          useLatest={fileSystemDirectoryHandle === "useLatest"}
          setFSDH={(fsdh) => {
            setFileSystemDirectoryHandle(fsdh);
            toast(`Verzeichnis "${fsdh.name}" gewählt`);
          }}
        />
      </div>
    );

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Root
          theme={theme}
          themeChange={() => setTheme(getSettings().theme)}
          changeDirectory={() => setFileSystemDirectoryHandle("choose")}
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
      element: <Categories fsdh={fileSystemDirectoryHandle} />,
      loader: async ({ request }) => {
        // getAllCategoryNames(fileSystemDirectoryHandle);
        const perms = await fileSystemDirectoryHandle.queryPermission({
          mode: "readwrite",
        });
        console.log(perms);
        return perms;
      },
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
        <Game theme={theme} themeChange={() => setTheme(getSettings().theme)} />
      ),
    },
    {
      path: "/categories/test/:dbIndex/destroy",
      element: (
        <Game theme={theme} themeChange={() => setTheme(getSettings().theme)} />
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
        <Game theme={theme} themeChange={() => setTheme(getSettings().theme)} />
      ),
    },
  ]);

  if (!indexedDbIsReady)
    return (
      <div className="loading">
        <Spinner />
        <div className="text">migrating local database</div>
        <div className="text sub">this might take a while</div>
        <div className="text sub">please do not close the tab!</div>
        <div className="info">
          {migrationsTotal - migrationsLeft}/{migrationsTotal}
        </div>
      </div>
    );

  if (dbStatus !== "ready")
    return (
      <div className="loading">
        <div className="text">Migrating Local Database...</div>

        <div className="text sub">
          This might take some time <br />
          Please do not close this tab
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

// reactQuery for IDB lib
const queryClient = new QueryClient();
// new IDB
const dbClient = new IDBClient({ name: "fsdh", migrations });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <IDBClientProvider client={dbClient}>
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <App />
    </QueryClientProvider>
  </IDBClientProvider>
);
