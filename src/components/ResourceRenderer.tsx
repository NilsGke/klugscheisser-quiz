import { useMemo } from "react";
import { Resource } from "$types/categoryTypes";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";

const ResourceRenderer = ({
    resource,
    autoplay = false,
    small = false,
    onVolumeChange,
}: {
    resource: Resource;
    autoplay?: boolean;
    small?: boolean;
    onVolumeChange?: (value: number) => void;
}) => {
    if (resource.type === "image") {
        const url = useMemo(
            () => URL.createObjectURL(resource.content),
            [resource.content]
        );
        return (
            <div className="image">
                <img src={url} alt="" />
            </div>
        );
    } else if (resource.type === "audio")
        return (
            <div className="audio">
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
            />
        );
    else if (resource.type === "text")
        return <div className="text">{resource.content}</div>;
    // else if(resource.type === "imageCollection")
    // return <Diashow />

    return <div className="resource">unknwon content type?</div>;
};

export default ResourceRenderer;
