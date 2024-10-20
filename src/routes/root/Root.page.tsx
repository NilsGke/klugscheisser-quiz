import "./Root.page.scss";
import { Link } from "react-router-dom";
import { Theme } from "main";
import { changeSetting } from "$helpers/settings";
import fileToBase64 from "$helpers/fileToBase64";
import toast from "react-simple-toasts";
import useTitle from "$hooks/useTitle";
import { removeThing, setThing } from "$db/things";
import { useAutoAnimate } from "@formkit/auto-animate/react";
// assets
import playIcon from "$assets/playOutline.svg";
import helpIcon from "$assets/help.svg";
import boardIcon from "$assets/board.svg";
import categoryIcon from "$assets/category.svg";
import backgroundImage from "$assets/background.excalidraw.svg";
import removeIcon from "$assets/trash.svg";
import lightIcon from "$assets/sun.svg";
import darkIcon from "$assets/moon.svg";
import elderlyIcon from "$assets/elderly.svg";
import changeDirIcon from "$assets/editDirectory.svg";

const Root = ({
    theme,
    themeChange,
    changeDirectory,
}: {
    theme: Theme;
    themeChange: () => void;
    changeDirectory: () => void;
}) => {
    useTitle("Klugscheißer-Quiz");
    const [rootContainerRef] = useAutoAnimate();

    return (
        <div className="root" ref={rootContainerRef}>
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

            <Link to={"/help"} className="actionButton help">
                <img src={helpIcon} alt="question mark icon" />
            </Link>

            {/* change directory button */}
            <button
                className="actionButton changeDir"
                title="KSQ Ordner ändern"
                onClick={changeDirectory}
            >
                <img src={changeDirIcon} alt="change directory" />
            </button>

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
                        {new Array(4).fill("").map((a, i) => (
                            <div className="sound" key={i}>
                                <button>
                                    <label htmlFor={"buzzerSound" + i}>
                                        Buzzer-Sound #{i + 1}
                                    </label>
                                </button>
                                <button
                                    className="remove"
                                    onClick={() =>
                                        removeThing("buzzerSound" + i)
                                            .then(() =>
                                                toast("🚮Buzzer sound removed")
                                            )
                                            .catch(() =>
                                                toast("❌removing failed")
                                            )
                                    }
                                >
                                    <img src={removeIcon} alt="remove" />
                                </button>
                                <AudioInput
                                    id={"buzzerSound" + i}
                                    onChange={async (file) => {
                                        setThing("buzzerSound" + i, file)
                                            .then(() => toast("✅sound saved"))
                                            .catch((e) => {
                                                console.error(e);
                                                toast("❌something went wrong");
                                            });
                                    }}
                                />
                            </div>
                        ))}
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
