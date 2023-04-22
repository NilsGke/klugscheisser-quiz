import { CSSProperties, useEffect, useState } from "react";
import { Resource } from "$types/categoryTypes";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import Spinner from "./Spinner";
import getFileUrl from "$helpers/getFileUrl";

const ResourceRenderer = ({
    resource,
    autoplay = false,
    small = false,
    onVolumeChange,
    style,
}: {
    resource: Resource;
    autoplay?: boolean;
    small?: boolean;
    onVolumeChange?: (value: number) => void;
    style?: CSSProperties;
}) => {
    if (resource.type === "image") {
        const [loading, setLoading] = useState(true);
        const [url, setUrl] = useState("");
        useEffect(() => {
            getFileUrl(resource.content).then((url) => {
                setUrl(url);
                setLoading(false);
            });
        }, []);

        return (
            <div className="image" style={style}>
                {loading ? <Spinner /> : <img src={url} alt="" />}
            </div>
        );
    } else if (resource.type === "audio")
        return (
            <div className="audio" style={style}>
                <AudioPlayer
                    file={resource.content}
                    initialVolume={resource.volume}
                    autoplay={autoplay}
                />
            </div>
        );
    else if (resource.type === "video")
        return (
            <VideoPlayer
                file={resource.content}
                initialVolume={resource.volume}
                autoplay={autoplay}
                small={small}
                onVolumeChange={onVolumeChange}
                style={style}
            />
        );
    else if (resource.type === "text")
        return (
            <div className="text" style={style}>
                {resource.content}
            </div>
        );
    // else if(resource.type === "imageCollection")
    // return <Diashow />

    return <div className="resource">unknwon content type?</div>;
};

export default ResourceRenderer;
