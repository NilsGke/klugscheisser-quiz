import "./Root.page.scss";
import { Link } from "react-router-dom";
// assets
import playIcon from "$assets/playOutline.svg";
import helpIcon from "$assets/help.svg";
import boardIcon from "$assets/board.svg";
import categoryIcon from "$assets/category.svg";
import backgroundImage from "$assets/background.excalidraw.svg";
import { Theme } from "main";

import lightIcon from "$assets/sun.svg";
import darkIcon from "$assets/moon.svg";
import elderlyIcon from "$assets/elderly.svg";
import { changeSetting } from "$helpers/settings";
import fileToBase64 from "$helpers/fileToBase64";
import toast from "react-simple-toasts";
import useTitle from "$hooks/useTitle";
import { removeThing, setThing, getAllThingsWithPrefix } from "$db/things";
import removeIcon from "$assets/trash.svg";
import { useEffect, useState } from "react";

const Root = ({
    theme,
    themeChange,
}: {
    theme: Theme;
    themeChange: () => void;
}) => {
    useTitle("Klugscheißer-Quiz");
    const [buzzerSounds, setBuzzerSounds] = useState<string[]>([]);

    // Load existing buzzer sounds
    useEffect(() => {
        if (theme === "senior") {
            loadBuzzerSounds();
        }
    }, [theme]);

    const loadBuzzerSounds = () => {
        getAllThingsWithPrefix("buzzerSound-")
            .then((sounds) => {
                const sortedKeys = sounds
                    .map((s) => s.key)
                    .sort((a, b) => {
                        const numA = parseInt(a.replace("buzzerSound-", ""));
                        const numB = parseInt(b.replace("buzzerSound-", ""));
                        return numA - numB;
                    });
                setBuzzerSounds(sortedKeys);
            })
            .catch((error) => {
                console.error("Error loading buzzer sounds:", error);
                setBuzzerSounds([]);
            });
    };

    const getNextBuzzerSoundKey = () => {
        if (buzzerSounds.length === 0) return "buzzerSound-0";
        const maxIndex = buzzerSounds.reduce((max, key) => {
            const num = parseInt(key.replace("buzzerSound-", ""));
            return Math.max(max, num);
        }, -1);
        return `buzzerSound-${maxIndex + 1}`;
    };

    return (
        <div className="root">
            <div
                id="background"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                }}
            ></div>
            <h1>Klugscheißer Quiz</h1>
            <div className="pages">
                <Link to={"/boards"}>
                    <h2 className="desc">Boards</h2>
                    <img src={boardIcon} alt="grid icon (board)" />
                </Link>
                <Link to={"/game"}>
                    <h2 className="desc">Play</h2>
                    <img src={playIcon} alt="play icon" />
                </Link>
                <Link to={"/categories"}>
                    <h2 className="desc">Categories</h2>
                    <img src={categoryIcon} alt="category icon" />
                </Link>
            </div>

            <button
                className="themeSwitch"
                onClick={(e) => {
                    if (e.shiftKey) changeSetting({ theme: "senior" });
                    else
                        changeSetting({
                            theme: theme === "light" ? "dark" : "light",
                        });
                    themeChange();
                }}
            >
                <img
                    className="light"
                    style={{
                        opacity: theme === "light" ? 1 : 0,
                    }}
                    src={lightIcon}
                    alt=""
                />
                <img
                    className="dark"
                    style={{
                        opacity: theme === "dark" ? 1 : 0,
                    }}
                    src={darkIcon}
                    alt=""
                />
                <img
                    className="colorful"
                    style={{
                        opacity: theme === "senior" ? 1 : 0,
                    }}
                    src={elderlyIcon}
                    alt=""
                />
            </button>

            <Link to={"/help"} className="helpIcon">
                <img src={helpIcon} alt="question mark icon" />
            </Link>

            {theme === "senior" ? (
                <div className="extraOptions">
                    <div className="audioImage">
                        <button>
                            <label htmlFor="audioImageInput">
                                change audio image
                            </label>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem("audioImage");
                                toast("🚮image removed");
                            }}
                        >
                            delete audio image
                        </button>
                        <input
                            type="file"
                            name="audioImageInput"
                            id="audioImageInput"
                            accept="image/*"
                            onChange={async (e) => {
                                const files = (e.target as HTMLInputElement)
                                    .files;
                                if (files === null) return;
                                const file = files[0];
                                if (file === undefined) return;
                                if (!file.type.startsWith("image/"))
                                    return toast(
                                        "❌File is not a standard image file"
                                    );

                                const base64 = await fileToBase64(file);
                                try {
                                    localStorage.setItem("audioImage", base64);
                                    toast("✅image saved");
                                } catch (error) {
                                    console.error(error);
                                    toast("❌failed, File might be too big!");
                                }
                            }}
                        />
                    </div>

                    <div className="introMusic">
                        <button>
                            <label htmlFor="introMusicInput">
                                change intro music
                            </label>
                        </button>
                        <button
                            onClick={() => {
                                removeThing("introMusic")
                                    .then(() => toast("🚮intro music removed"))
                                    .catch((e) => toast("❌removing failed"));
                            }}
                        >
                            delete intro music
                        </button>
                        <AudioInput
                            id="introMusicInput"
                            onChange={async (file) => {
                                try {
                                    setThing("introMusic", file);
                                    toast("✅music saved 🎵");
                                } catch (error) {
                                    console.error(error);
                                    toast("❌failed, File might be too big!");
                                }
                            }}
                        />
                    </div>
                    <div className="buzzerSounds">
                        {buzzerSounds.map((soundKey, i) => (
                            <div className="sound" key={soundKey}>
                                <span className="soundLabel">
                                    Buzzer-Sound #{i + 1}
                                </span>
                                <button
                                    className="remove"
                                    onClick={() =>
                                        removeThing(soundKey)
                                            .then(() => {
                                                toast("🚮Buzzer sound removed");
                                                loadBuzzerSounds();
                                            })
                                            .catch(() =>
                                                toast("❌removing failed")
                                            )
                                    }
                                >
                                    <img src={removeIcon} alt="remove" />
                                </button>
                            </div>
                        ))}
                        <div className="sound addSound">
                            <button>
                                <label htmlFor="addBuzzerSound">
                                    + Add Buzzer Sound
                                </label>
                            </button>
                            <AudioInput
                                id="addBuzzerSound"
                                onChange={async (file) => {
                                    const newKey = getNextBuzzerSoundKey();
                                    setThing(newKey, file)
                                        .then(() => {
                                            toast("✅sound saved");
                                            loadBuzzerSounds();
                                        })
                                        .catch((e) => {
                                            console.error(e);
                                            toast("❌something went wrong");
                                        });
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default Root;

const AudioInput = ({
    onChange,
    id,
}: {
    onChange: (file: File) => void;
    id: string;
}) => {
    return (
        <input
            type="file"
            name={id}
            id={id}
            accept="audio/*"
            onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files === null) return;
                const file = files[0];
                if (file === undefined) return;
                if (!file.type.startsWith("audio/"))
                    return toast("❌File is not a standard audio file");

                onChange(file);
            }}
        />
    );
};
