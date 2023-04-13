import "./NewVersionbanner.scss";

const NewVersionbanner = ({ update }: { update: () => void }) => {
    return (
        <div id="newVersionBanner">
            A new version of the app is avalible!
            <button onClick={update}>Update</button>
        </div>
    );
};

export default NewVersionbanner;
