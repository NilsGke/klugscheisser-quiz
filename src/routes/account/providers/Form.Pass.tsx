import { Auth } from "firebase/auth";
import { FC } from "react";
import { Action } from "../Account.page";
import edit from "../../../assets/edit.svg";
import { UserData } from "../../../firebase/firestore/user";

type props = {
    auth: Auth;
    userData: UserData;
    openModal: (action: Action) => void;
};

const PassForm: FC<props> = ({ auth, userData, openModal }) => {
    return (
        <>
            <div className="info email">
                <small>Email:</small>
                <div className="value">
                    {auth.currentUser?.email || ""}
                    <button
                        className="edit"
                        onClick={() => openModal(Action.changeEmail)}
                    >
                        <img src={edit} alt="edit icon" />
                    </button>
                </div>
            </div>
            <div className="info username">
                <small>Username:</small>
                <div className="value">
                    {userData.username}
                    <button
                        className="edit"
                        onClick={() => openModal(Action.changeUsername)}
                    >
                        <img src={edit} alt="edit icon" />
                    </button>
                </div>
            </div>
            <div className="info password1">
                <small>Password:</small>
                <div className="value">
                    **********
                    <button
                        className="edit"
                        onClick={() => openModal(Action.changePassword)}
                    >
                        <img src={edit} alt="edit icon" />
                    </button>
                </div>
            </div>
        </>
    );
};

export default PassForm;
