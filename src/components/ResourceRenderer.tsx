import { CSSProperties, useRef } from "react";
import { Resource } from "$types/categoryTypes";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";

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
        const url = useRef(URL.createObjectURL(resource.content));
        return (
            <div className="image" style={style}>
                <img
                    loading="lazy"
                    src={url.current}
                    alt=""
                    onDragStart={(e) => {
                        url.current = URL.createObjectURL(resource.content);
                        e.dataTransfer.setData("text/uri-list", url.current);
                    }}
                    onLoad={() => URL.revokeObjectURL(url.current)}
                    onDragEnd={() => URL.revokeObjectURL(url.current)}
                />
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
    else if (resource.type === "imageCollection")
        <p>
            Resource Renderer is not supposed to render an ImageCollection. Use
            the <code>&lt;Diashow /&gt; component instead!</code>
        </p>;

    return <div className="resource">unknwon content type?</div>;
};

export default ResourceRenderer;
