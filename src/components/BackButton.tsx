import "./BackButton.scss";

import { Link } from "react-router-dom";
import arrowIcon from "$assets/arrow.svg";
import "./HomeButton.scss";
import { FC } from "react";

type props = {
    confirm?: boolean;
    to?: string;
};

const BackButton: FC<props> = ({ confirm, to }) => {
    return (
        <Link
            to={to ?? "./../"}
            onClick={(e) =>
                confirm &&
                !window.confirm("Are you sure? Unsafed Progress will be lost!")
                    ? e.preventDefault()
                    : null
            }
            className="backButton"
        >
            <img src={arrowIcon} alt="home icon" />
        </Link>
    );
};
export default BackButton;
