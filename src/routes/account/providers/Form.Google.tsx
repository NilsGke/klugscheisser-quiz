import { Auth } from "firebase/auth";
import { FC } from "react";
import google from "../../../assets/google.svg";

type props = {
    auth: Auth;
};

const GoogleForm: FC<props> = ({ auth }) => {
    return (
        <>
            <div className="provider google">
                <img src={google} alt="google logo" className="logo" />
                <div className="info google">
                    <div className="value">
                        {auth.currentUser?.email || "[no auth user]"}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GoogleForm;
