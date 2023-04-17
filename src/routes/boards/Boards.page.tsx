import BoardBrowser from "../../components/BoardBrowser";
import HomeButton from "../../components/HomeButton";
import addIcon from "../../assets/addRound.svg";
import "./Boards.page.scss";
import { useNavigate } from "react-router-dom";

const Boards = () => {
    const navigate = useNavigate();
    return (
        <div id="boardsPage">
            <HomeButton />
            <h1>Browse your local Boards</h1>
            <div className="content">
                <BoardBrowser />
                <button
                    className="add"
                    onClick={() => navigate("/boards/editor")}
                >
                    <img src={addIcon} alt="" />
                    <p>create board</p>
                </button>
            </div>
        </div>
    );
};

export default Boards;
