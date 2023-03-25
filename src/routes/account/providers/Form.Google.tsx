import { Auth } from "firebase/auth";
import { FC } from "react";
import google from "../../../assets/google.svg";

type props = {
    auth: Auth;
};

const GoogleForm: FC<props> = ({ auth }) => {
    return (
        <>
            <div className="info google">
                <img src={google} alt="" className="logo" />
                <div className="value">
                    {auth.currentUser?.email || "[no auth user]"}
                </div>
            </div>
        </>
    );
};

export default GoogleForm;
