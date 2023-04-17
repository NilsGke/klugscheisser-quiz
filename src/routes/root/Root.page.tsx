import "./Root.page.scss";
import { Link } from "react-router-dom";
// assets
import playIcon from "../../assets/playOutline.svg";
import helpIcon from "../../assets/help.svg";
import boardIcon from "../../assets/board.svg";
import categoryIcon from "../../assets/category.svg";
import backgroundImage from "../../assets/background.excalidraw.svg";

const Root = () => {
    return (
        <div className="root">
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
            <Link to={"/help"} className="helpIcon">
                <img src={helpIcon} alt="question mark icon" />
            </Link>
            <div
                id="background"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                }}
            ></div>
        </div>
    );
};

export default Root;
