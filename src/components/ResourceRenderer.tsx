import { CSSProperties, useRef, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { Resource } from "filesystem/categories";
import { useQuery } from "@tanstack/react-query";

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
  const {
    data: file,
    isLoading,
    error,
  } = useQuery({
    queryKey: [resource],
    queryFn: async () => {
      if (resource.type === "text") return null;
      return resource.handle.getFile();
    },
  });

  if (resource.type === "text")
    return <div className="text">{resource.content}</div>;

  if (error !== null)
    return (
      <div>
        {error.name}: {error.message}
      </div>
    );
  if (isLoading || file === undefined) return <div>loading resource</div>;
  if (file === null) return <div>error: no file found</div>;

  if (resource.type === "image") {
    const url = URL.createObjectURL(file);
    return (
      <div className="image">
        <img src={url} alt="" onLoad={() => URL.revokeObjectURL(url)} />
      </div>
    );
  } else if (resource.type === "audio")
    return (
      <div className="audio">
        <AudioPlayer
          file={file}
          initialVolume={resource.volume}
          autoplay={autoplay}
        />
      </div>
    );
  else if (resource.type === "video")
    return (
      <VideoPlayer
        file={file}
        initialVolume={resource.volume}
        autoplay={autoplay}
        small={small}
        onVolumeChange={onVolumeChange}
        style={style}
      />
    );

  return <div className="resource">unknown content type</div>;
};

export default ResourceRenderer;
