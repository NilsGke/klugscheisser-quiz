import { Link } from "react-router-dom";
import { UserData } from "../firebase/firestore/user";
import "./Header.scss";
import { FC, useState } from "react";
import HeaderMenu from "./Header.menu";

type props = {
    userData: UserData | null;
};

const Header: FC<props> = ({ userData }) => {
    const loggedIn = userData !== null;

    const [menu, setMenu] = useState(false);

    return (
        <div
            id="header"
            className={
                (menu ? "expand" : "small") + (loggedIn ? " loggedIn" : "")
            }
        >
            <div className="account">
                {!loggedIn ? (
                    <div className="loginButtons">
                        <Link to={"/login"} state={{ createAccount: false }}>
                            <div className="content">login</div>
                        </Link>
                        <Link to={"/login"} state={{ createAccount: true }}>
                            <div className="content">Sign up</div>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="profilePic">
                            <div className="name">{userData.username}</div>
                            <img
                                src={userData.avatarUrl}
                                alt=""
                                onClick={() => setMenu((prev) => !prev)}
                            />
                        </div>
                        <HeaderMenu visible={menu} />
                    </>
                )}
            </div>
        </div>
    );
};

export default Header;
