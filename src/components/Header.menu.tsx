import { Link, useNavigate } from "react-router-dom";
import auth from "../firebase/auth/auth";
import { FC } from "react";

type props = {
    visible: boolean;
};

const HeaderMenu: FC<props> = ({ visible }) => {
    const navigate = useNavigate();
    return (
        <div id="headerMenu" className={visible ? "visible" : "hidden"}>
            <button className="item">
                <Link to={"myCategories"}>my Categories</Link>
            </button>
            <button className="item">Lorem ipsum</button>
            <button className="item">
                <Link to={"account"}>Account Settings</Link>
            </button>
            <button
                className="item"
                onClick={() =>
                    auth.signOut().then(() => {
                        navigate("/");
                        window.location.reload();
                    })
                }
            >
                logout
            </button>
        </div>
    );
};

export default HeaderMenu;
