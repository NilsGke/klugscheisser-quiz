import { UploadTask } from "firebase/storage";
import {
    CSSProperties,
    FC,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import toast from "react-simple-toasts";
// styles
import "./FileUploader.scss";
// assets
import close from "../assets/close.svg";
import trash from "../assets/trash.svg";
import media from "../assets/media.svg";
import toWebp from "../helpers/toWebp";

type props = {
    visible: boolean;
    callback: (file: File) => UploadTask | void;
    finished?: (fullPath: string) => void;
    closeFun: () => void;
    title?: string;
    imageStyles?: CSSProperties;
};

const ImageUploader: FC<props> = ({
    visible,
    callback,
    finished,
    closeFun,
    title,
    imageStyles = {},
}) => {
    const [file, setFile] = useState<File | null>(null);
    const image = useRef<HTMLImageElement>(null);
    const [previewUrl, setPreviewUrl] = useState("");

    // create local preview url
    useEffect(() => {
        if (!image.current || !file || file.type === "image/webp") return;
        (async () =>
            toWebp(file, { h: 180, w: 180 })
                .then((newImage) => {
                    console.log(newImage);

                    setFile(newImage);

                    setPreviewUrl(URL.createObjectURL(newImage));
                })
                .catch((error) => {
                    console.error(error);
                    setFile(null);
                    toast("we do not suppot this type of file 😕");
                }))();
    }, [file]);

    const upload = useCallback(async () => {
        if (file === null) return;

        const uploadTask = callback(file);

        setUploading(true);

        if (uploadTask)
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const currentProgress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(Math.floor(currentProgress));
                },
                (err) => {
                    console.error(err);
                    toast(err.message);
                },
                async () => {
                    finished
                        ? finished(uploadTask.snapshot.metadata.fullPath)
                        : null;

                    setDone(true);
                    setTimeout(closeFun, 300);
                }
            );
    }, [file, callback]);

    const cancel = () => {
        closeFun();
    };

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);

    if (done)
        return (
            <div
                className={
                    "fileUploaderContainer" + (visible ? " visible" : " hidden")
                }
            >
                <h2>Done 😀</h2>
            </div>
        );

    if (uploading)
        return (
            <div
                className={
                    "fileUploaderContainer" + (visible ? " visible" : " hidden")
                }
            >
                <div className="uploading">
                    <h1>Uploading 🚀</h1>
                    <span>{progress}%</span>
                    <div className="progressBarContainer">
                        <div
                            className="progress"
                            style={{ width: progress + "%" }}
                        ></div>
                    </div>
                </div>
            </div>
        );

    return (
        <div
            className={
                "fileUploaderContainer" + (visible ? " visible" : " hidden")
            }
        >
            <div className="fileUploader">
                {file ? (
                    <button
                        className="retake"
                        onClick={() => {
                            setFile(null);
                            setPreviewUrl("");
                        }}
                    >
                        <img src={trash} alt="trash icon" />
                    </button>
                ) : (
                    <button className="close" onClick={cancel}>
                        <img src={close} alt="close icon" />
                    </button>
                )}

                <h1>{title ? title : "Upload an Image"}</h1>

                <div className="upload">
                    {file ? (
                        <>
                            <div className="preview">
                                <img
                                    src={previewUrl}
                                    alt="preview of your image"
                                    ref={image}
                                    style={{ ...imageStyles }}
                                />
                            </div>
                        </>
                    ) : (
                        <label htmlFor="imageInput" className="label">
                            <div className="illustration">
                                <img src={media} alt="media icon" />
                                <u>Upload Image</u>
                            </div>
                            <input
                                type="file"
                                name="imageUpload"
                                id="imageInput"
                                accept="image/*"
                                onInput={(e) =>
                                    setFile(
                                        (
                                            e.nativeEvent
                                                .target as HTMLInputElement
                                        ).files?.item(0) || null
                                    )
                                }
                                max={1}
                                maxLength={1}
                            />
                        </label>
                    )}
                </div>
                {file ? (
                    <button className="upload" onClick={upload}>
                        Upload
                    </button>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
};

export default ImageUploader;
