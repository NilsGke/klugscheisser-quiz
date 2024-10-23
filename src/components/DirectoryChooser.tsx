import "./DirectoryChooser.scss";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import useIDB from "indexedDB/lib/hooks/useIDB";
import useIDBQuery from "indexedDB/lib/hooks/useIDBQuery";
import {
    addFSDHToDb,
    FSDH,
    FSDHWithKey,
    getLatestFSDH,
    updateFSDHLastOpened,
} from "indexedDB/db";
import RelativeTime from "./RelativeTime";

export default function DirectoryChooser({
    useLatest,
    setFSDH: setFileSystemDirectoryHandle,
}: {
    useLatest: boolean;
    setFSDH: (fsdh: FileSystemDirectoryHandle) => void;
}) {
    const [fsdh, setFsdh] = useState<FileSystemDirectoryHandle | null>(null);
    const [needPermission, setNeedPermission] = useState(false);

    const db = useIDB();
    const { data: handles, refetch: refetchRecent } = useIDBQuery({
        queryKey: ["fsdhQuery"],
        queryFn: (db) =>
            new Promise<FSDHWithKey[]>(async (resolve, reject) => {
                const [keys, FSDHs] = await Promise.all([
                    new Promise<IDBValidKey[]>((resolve, reject) => {
                        const request = db
                            .transaction("fsdh", "readonly")
                            .objectStore("fsdh")
                            .getAllKeys();

                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    }),
                    new Promise<FSDH[]>((resolve, reject) => {
                        const request = db
                            .transaction("fsdh", "readonly")
                            .objectStore("fsdh")
                            .getAll();

                        request.onsuccess = () =>
                            resolve(request.result as FSDHWithKey[]);
                        request.onerror = () => reject(request.error);
                    }),
                ]);

                const merged = FSDHs.map((fsdh, index) => ({
                    ...fsdh,
                    key: keys.at(index)!,
                })) satisfies FSDHWithKey[];

                resolve(merged);
            }),
    });

    // choose latest directory if initial load
    useEffect(() => {
        if (db === null || !useLatest) return;
        getLatestFSDH(db).then((fsdh) => {
            setFsdh(fsdh.fileSystemDirectoryHandle);
            // updateFSDHLastOpened(db, fsdh.key).then(() => refetchRecent());
        });
    }, [db]);

    const supported = window.hasOwnProperty("showDirectoryPicker");

    const checkPermissions = () =>
        new Promise<void>(async (resolve, reject) => {
            setNeedPermission(true);
            if (fsdh === null) return resolve();
            const perms = await fsdh.queryPermission();

            if (perms === "granted") return resolve();

            fsdh.requestPermission({ mode: "readwrite" })
                .then((perms) => {
                    if (perms === "granted") return resolve();
                    if (perms === "prompt")
                        return checkPermissions().then(resolve);
                    if (perms === "denied") {
                        toast(
                            "⚠️ Du musst der Webseite Berechtigungen auf das Verzeichnis geben!"
                        );
                        checkPermissions().then(resolve);
                    }
                })
                .catch((error) => {
                    // dont throw security error as it is expected if page is initialized
                    if (error.name !== "SecurityError") throw error;
                });
        });

    useEffect(() => {
        if (fsdh !== null)
            checkPermissions().then(() => {
                if (db)
                    addFSDHToDb(db, {
                        fileSystemDirectoryHandle: fsdh,
                        lastOpened: Date.now(),
                    }).then(() => refetchRecent());
                setFileSystemDirectoryHandle(fsdh);
            });
    }, [fsdh, db]);

    if (needPermission && fsdh)
        return (
            <div id="directoryChooser">
                <h2>
                    Bitte gib der Webseite die benötigten Berechtigungen für
                    Ordner: "{fsdh.name}"
                </h2>
                <button
                    onClick={() =>
                        checkPermissions().then(() =>
                            setFileSystemDirectoryHandle(fsdh)
                        )
                    }
                >
                    Berechtigung erteilen
                </button>
                <button className="small" onClick={() => setFsdh(null)}>
                    anderen ordner wählen
                </button>
            </div>
        );

    return (
        <div id="directoryChooser">
            {!supported && (
                <>
                    Dein Browser supportet das Lokale Dateisystem nicht <br />
                    Bitte benutze Chrome, Edge oder Opera (oder einen Chromium
                    browser) <br />
                    <a
                        href="https://caniuse.com/mdn-api_window_showdirectorypicker"
                        target="_blank"
                    >
                        Hier
                    </a>{" "}
                    siehst du welche Browser-Versionen supportet sind
                </>
            )}
            {supported && (
                <>
                    <button
                        onClick={() => {
                            window
                                .showDirectoryPicker()
                                .then(setFsdh)
                                .catch((err) => {
                                    if (err.name === "AbortError")
                                        return toast(
                                            "❌ Du hast kein Verzeichnis ausgewählt"
                                        );
                                    else toast(`❌ Error: ${err}`);
                                    throw Error(err);
                                });
                        }}
                    >
                        Explorer öffnen
                    </button>
                    <div id="lastHandles">
                        <h2>Letzte Verzeichnisse:</h2>
                        <div className="list">
                            {handles
                                ?.sort((a, b) => b.lastOpened - a.lastOpened)
                                .map((handle) => (
                                    <button
                                        className="handle"
                                        key={String(handle.key)}
                                        onClick={() => {
                                            setFsdh(
                                                handle.fileSystemDirectoryHandle
                                            );
                                            if (db)
                                                updateFSDHLastOpened(
                                                    db,
                                                    handle.key
                                                ).then(() => refetchRecent());
                                        }}
                                    >
                                        {handle.fileSystemDirectoryHandle.name}
                                        <p>
                                            <RelativeTime
                                                time={handle.lastOpened}
                                            />
                                        </p>
                                    </button>
                                ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
