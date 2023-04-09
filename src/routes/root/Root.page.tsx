import "./Root.page.scss";
import { Link } from "react-router-dom";
// assets
import playIcon from "../../assets/play.svg";
import gridIcon from "../../assets/grid.svg";
import helpIcon from "../../assets/help.svg";
import editIcon from "../../assets/edit.svg";

const Root = () => {
    return (
        <div className="root">
            <h1>Klugscheißer Quiz</h1>
            <div className="pages">
                <Link to={"/categories"}>
                    <h2 className="desc">Öffentliche Kategorien</h2>
                    <img src={gridIcon} alt="" />
                </Link>
                <Link to={"/game"}>
                    <h2 className="desc">Spielen</h2>
                    <img src={playIcon} alt="" />
                </Link>
                <Link to={"/editor"}>
                    <h2 className="desc">Kategorie Editor</h2>
                    <img src={editIcon} alt="question mark icon" />
                </Link>
            </div>
            <Link to={"help"} className="helpIcon">
                <img src={helpIcon} alt="question mark icon" />
            </Link>
        </div>
    );
};

export default Root;
