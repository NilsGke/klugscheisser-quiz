import { FC, useEffect, useState } from "react";
import { UserData, changeUsername } from "../../firebase/firestore/user";
import { Link } from "react-router-dom";
import edit from "../../assets/edit.svg";
import "./Account.page.scss";
import { changeEmail } from "../../firebase/auth/auth";
import toast from "react-simple-toasts";
import { ProviderId, fetchSignInMethodsForEmail, getAuth } from "firebase/auth";
import Spinner from "../../components/Spinner";
import PassForm from "./providers/Form.Pass";
import GoogleForm from "./providers/Form.Google";
import ImageUploader from "../../components/FileUploader";
import { ref, uploadBytesResumable } from "firebase/storage";
import storage from "../../firebase/storage/storage";
import changeProfilePicture from "../../firebase/storage/profilePicture";
import { updateAvatarUrl } from "../../firebase/firestore/avatar";

type props = {
    userData: UserData | null;
};
export enum Action {
    nothing,
    changeEmail,
    changeUsername,
    changePassword,
    changeAvatar,
}
type FormData = {
    oldEmail: UserData["email"];
    newEmail: UserData["email"];
    oldUsername: UserData["username"];
    newUsername: UserData["username"];
    oldPass: string;
    newPass: string;
    newPassRep: string;
    newAvatar: File | null;
};

const Account: FC<props> = ({ userData }) => {
    const auth = getAuth();

    const [imageUploaderVisible, setImageUploaderVisible] = useState(false);

    const [authProviderIds, setAuthProviderIds] = useState<string[] | null>(
        null
    );

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalAction, setModalAction] = useState<Action>(Action.nothing);

    const [loadingChange, setLoadingChange] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormData>({
        oldEmail: "",
        newEmail: "",
        oldUsername: "",
        newUsername: "",
        oldPass: "",
        newPass: "",
        newPassRep: "",
        newAvatar: null,
    });

    useEffect(() => {
        if (userData)
            fetchSignInMethodsForEmail(auth, userData.email).then(
                setAuthProviderIds
            );
    }, []);

    const openModal = (action: Action) => {
        setFormData({
            oldEmail: "",
            newEmail: "",
            oldUsername: "",
            newUsername: "",
            oldPass: "",
            newPass: "",
            newPassRep: "",
            newAvatar: null,
        });
        setModalAction(action);
        setModalOpen(true);
    };

    if (userData === null) {
        return (
            <div id="accountPage" className="error">
                <h2>you dont have an account yet</h2>
                <p>
                    you can create one or login <Link to={"/login"}>here</Link>
                </p>
            </div>
        );
    }

    let modalContent = <></>;

    const authFields = (authProviderIds || []).map((provider) => {
        switch (provider) {
            case ProviderId.PASSWORD:
                return (
                    <PassForm
                        auth={auth}
                        openModal={openModal}
                        userData={userData}
                        key={provider}
                    />
                );
            case ProviderId.GOOGLE:
                return <GoogleForm auth={auth} key={provider} />;
            default:
                break;
        }
        return <div className={"provider " + provider}>{provider}</div>;
    });

    switch (modalAction) {
        case Action.changeEmail:
            modalContent = (
                <div className="changeEmail">
                    <h2>Change Email</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <label htmlFor="oldEmail">
                            Old Email:
                            <input
                                type="email"
                                name=""
                                id="oldEmail"
                                value={formData.oldEmail}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        oldEmail: e.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label htmlFor="">
                            New Email:
                            <input
                                type="email"
                                name=""
                                id="newEmail"
                                value={formData.newEmail}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        newEmail: e.target.value,
                                    }))
                                }
                            />
                        </label>
                        <label htmlFor="passInput">
                            Password:
                            <input
                                type="password"
                                name="passInput"
                                id="passInput"
                                value={formData.oldPass}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        oldPass: e.target.value,
                                    }))
                                }
                            />
                        </label>
                        <button
                            type="submit"
                            onClick={() => {
                                setLoadingChange(true);
                                changeEmail(
                                    formData.oldEmail,
                                    formData.newEmail,
                                    formData.oldPass
                                )
                                    .then(() => {
                                        setModalOpen(false);
                                        setLoadingChange(false);
                                        toast("successful 😀");
                                    })
                                    .catch((error) => {
                                        console.error(error);
                                        toast(error);
                                    });
                            }}
                        >
                            Change Email
                        </button>
                    </form>
                </div>
            );
            break;
        case Action.changeUsername:
            modalContent = (
                <div className="changeUsername">
                    <h2>Change Username</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <label htmlFor="newUsername">
                            New Username:
                            <input
                                type="text"
                                name="newUsername"
                                id="newUsername"
                                value={formData.newUsername}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        newUsername: e.target.value,
                                    }))
                                }
                            />
                        </label>
                        <button
                            type="submit"
                            onClick={() => {
                                setLoadingChange(true);
                                changeUsername(
                                    userData.uid,
                                    formData.newUsername
                                )
                                    .then(() => {
                                        setModalOpen(false);
                                        setLoadingChange(false);
                                        toast("successful 😀");
                                    })
                                    .catch((error) => {
                                        console.error(error);
                                        toast(error);
                                    });
                            }}
                        >
                            Change Username
                        </button>
                    </form>
                </div>
            );
        default:
            break;
    }

    return (
        <div id="accountPage">
            <div className="container">
                <div className="top">
                    <h1>{userData.username}</h1>
                    <button
                        className="profilePicture"
                        onClick={() => setImageUploaderVisible(true)}
                    >
                        <div className="overlay">
                            <img src={edit} alt="edit icon" />
                        </div>
                        <img
                            src={userData.avatarUrl}
                            alt="your profile picture"
                            className="avatar"
                        />
                    </button>
                </div>
                {authFields}
                <button className="deleteAccount" onClick={() => {}}>
                    Delete your account 😲
                </button>
            </div>
            <div
                id="modal"
                className={"modal" + (modalOpen ? " visible" : " hidden")}
            >
                {loadingChange ? (
                    <Spinner />
                ) : (
                    <>
                        <button
                            className="close"
                            onClick={() => setModalOpen(false)}
                        >
                            ⨉
                        </button>
                        {modalContent}
                    </>
                )}
            </div>
            <ImageUploader
                callback={(file) => changeProfilePicture(file, userData.uid)}
                visible={imageUploaderVisible}
                closeFun={() => setImageUploaderVisible(false)}
                finished={(fullPath) => {
                    updateAvatarUrl(fullPath, userData.uid);
                }}
                imageStyles={{
                    aspectRatio: "1",
                    borderRadius: "100%",
                }}
            />
        </div>
    );
};

export default Account;
