import { FC } from "react";
import Header from "../../components/Header";
import { UserData } from "../../firebase/firestore/user";
import "./Root.page.scss";
import { Link } from "react-router-dom";
// assets
import playIcon from "../../assets/play.svg";
import gridIcon from "../../assets/grid.svg";
import helpIcon from "../../assets/help.svg";

type props = {
    userData: UserData | null;
};

const Root: FC<props> = ({ userData }) => {
    return (
        <div className="root">
            <Header userData={userData} />
            <h1>Quiz-Game</h1>
            <div className="pages">
                <Link to={"/categories"}>
                    <h2 className="desc">Browse Collections</h2>
                    <img src={gridIcon} alt="" />
                </Link>
                <Link to={"/game"}>
                    <h2 className="desc">Play the game</h2>
                    <img src={playIcon} alt="" />
                </Link>
                <Link to={"help"}>
                    <h2 className="desc">How to play</h2>
                    <img src={helpIcon} alt="question mark icon" />
                </Link>
            </div>
        </div>
    );
};

export default Root;
