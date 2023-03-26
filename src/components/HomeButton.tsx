import { Link } from "react-router-dom";
import homeIcon from "../assets/home.svg";
import "./HomeButton.scss";

const HomeButton = () => {
    return (
        <Link to={"/"} className="homeButton">
            <img src={homeIcon} alt="home icon" />
        </Link>
    );
};
export default HomeButton;
