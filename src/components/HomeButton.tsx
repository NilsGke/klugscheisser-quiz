import { Link } from "react-router-dom";
import homeIcon from "$assets/home.svg";
import "./HomeButton.scss";
import { FC } from "react";

type props = {
    confirm?: boolean;
};

const HomeButton: FC<props> = ({ confirm }) => {
    return (
        <Link
            to={"/"}
            onClick={(e) =>
                confirm &&
                !window.confirm("Are you sure? Unsafed Progress will be lost!")
                    ? e.preventDefault()
                    : null
            }
            className="homeButton"
        >
            <img src={homeIcon} alt="home icon" />
        </Link>
    );
};
export default HomeButton;
