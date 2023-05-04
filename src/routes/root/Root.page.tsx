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
        </div>
    );
};

export default Root;
