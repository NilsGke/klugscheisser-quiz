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
                const input = e.target as HTMLInputElement;
                const files = input.files;
                if (files === null) {
                    input.value = "";
                    return;
                }
                const file = files[0];
                if (file === undefined) {
                    input.value = "";
                    return;
                }
                if (!file.type.startsWith("audio/")) {
                    toast("❌File is not a standard audio file");
                    input.value = "";
                    return;
                }

                onChange(file);
                input.value = "";
            }}
        />
    );
};

export default AudioInput;
