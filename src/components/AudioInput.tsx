import toast from "react-simple-toasts";

const AudioInput = ({
    onChange,
    id,
}: {
    onChange: (file: File) => void;
    id: string;
}) => {
    return (
        <input
            type="file"
            name={id}
            id={id}
            accept="audio/*"
            onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files === null) return;
                const file = files[0];
                if (file === undefined) return;
                if (!file.type.startsWith("audio/"))
                    return toast("❌File is not a standard audio file");

                onChange(file);
            }}
        />
    );
};

export default AudioInput;
