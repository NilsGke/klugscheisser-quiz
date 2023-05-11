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
import colorfulIcon from "$assets/colorPalette.svg";
import { changeSetting } from "$helpers/settings";
import fileToBase64 from "$helpers/fileToBase64";
import { base64ToFile } from "$helpers/base64ToFile";
import toast from "react-simple-toasts";

const Root = ({
    theme,
    themeChange,
}: {
    theme: Theme;
    themeChange: () => void;
}) => {
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
                    src={colorfulIcon}
                    alt=""
                />
            </button>

            <Link to={"/help"} className="helpIcon">
                <img src={helpIcon} alt="question mark icon" />
            </Link>

            {theme === "senior" ? (
                <div className="extraOptions">
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
                            const files = (e.target as HTMLInputElement).files;
                            if (files === null) return;
                            const file = files[0];
                            if (file === undefined) return; // for ts seems redundent but it does not check if this is null
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
            ) : null}
        </div>
    );
};

export default Root;
