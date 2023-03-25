import { FC } from "react";
import Header from "../../components/Header";
import { UserData } from "../../firebase/firestore/user";

type props = {
    userData: UserData | null;
};

const Root: FC<props> = ({ userData }) => {
    return (
        <div className="root">
            <Header userData={userData} />
            <h1>Homepage</h1>
        </div>
    );
};

export default Root;
