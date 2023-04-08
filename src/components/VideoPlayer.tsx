import { FC, useEffect, useMemo, useRef, useState } from "react";
import ReactSlider from "react-slider";
import getTimeFromSeconds from "../helpers/timeFromSeconds";

// styles
import "./VideoPlayer.scss";
// assets
import playIcon from "../assets/play.svg";
import pauseIcon from "../assets/pause.svg";
import volume0 from "../assets/volume0.svg";
import volume1 from "../assets/volume1.svg";
import volume2 from "../assets/volume2.svg";
import volume3 from "../assets/volume3.svg";
import fullScreenIcon from "../assets/fullscreen.svg";

type props = {
    file: File;
    small?: boolean;
    autoplay?: boolean;
};

const VideoPlayer: FC<props> = ({ file, small = false, autoplay = false }) => {
    const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
    const [playing, setPlaying] = useState(autoplay);
    const [volume, setVolume] = useState(40);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const videoElementRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoElementRef.current === null) return;
        // metadata
        const handleMetadata = () => {
            if (videoElementRef.current === null) return;
            setDuration(videoElementRef.current.duration);
        };
        if (videoElementRef.current.readyState > 0) {
            // element is ready
            handleMetadata();
        } else {
            videoElementRef.current.addEventListener(
                "loadedmetadata",
                handleMetadata
            );
        }

        // time update
        const timeUpdate = () =>
            setCurrentTime(videoElementRef.current?.currentTime || 0);

        videoElementRef.current.addEventListener("timeupdate", timeUpdate);

        return () => {
            videoElementRef.current?.removeEventListener(
                "loadedmetadata",
                handleMetadata
            );
            videoElementRef.current?.removeEventListener(
                "timeupdate",
                timeUpdate
            );
        };
    }, [videoElementRef]);

    const seekSliderRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const handleInput = (e: Event) => {
            const time = seekSliderRef.current?.value;
            if (time === undefined) return;
            setCurrentTime(parseInt(time) || 0);
        };
        seekSliderRef.current?.addEventListener("input", handleInput);
        return () =>
            seekSliderRef.current?.removeEventListener("input", handleInput);
    }, []);

    useEffect(() => {
        if (videoElementRef.current)
            videoElementRef.current.volume = volume / 100;
    }, [volume]);

    const play = (play: boolean) => {
        if (videoElementRef.current === null)
            throw new Error("video element ref is null -> could not play");

        if (play) videoElementRef.current.play();
        else videoElementRef.current.pause();

        setPlaying((prev) => !prev);
    };

    const changeTime = (currentTime: number) => {
        if (videoElementRef.current === null)
            throw new Error(
                "audio element ref is null -> could not change time"
            );

        videoElementRef.current.currentTime = currentTime;
    };

    return (
        <div
            className={
                "videoPlayer" +
                (playing ? " playing " : " paused ") +
                (small ? " small " : "")
            }
        >
            <div className="volume">
                <ReactSlider
                    className={"volume-slider"}
                    thumbClassName="thumb"
                    trackClassName="track"
                    value={small ? volume : 100 - volume}
                    min={0}
                    max={100}
                    onChange={(value) => setVolume(small ? value : 100 - value)}
                    orientation={small ? "horizontal" : "vertical"}
                />
                <button
                    className="mute"
                    onClick={() => {
                        if (volume === 0) setVolume(40);
                        else setVolume(0);
                    }}
                >
                    {volume === 0 ? (
                        <img src={volume0} alt="volume off" draggable="false" />
                    ) : volume <= 33 ? (
                        <img src={volume1} alt="volume 1/3" draggable="false" />
                    ) : volume <= 66 ? (
                        <img src={volume2} alt="volume 2/3" draggable="false" />
                    ) : (
                        <img src={volume3} alt="volume 3/3" draggable="false" />
                    )}
                </button>
            </div>
            <div className="videoContainer">
                <video src={videoUrl} ref={videoElementRef} autoPlay={autoplay}>
                    asdf
                </video>
                <button className="playPause" onClick={() => play(!playing)}>
                    <img
                        src={playing ? pauseIcon : playIcon}
                        draggable="false"
                        alt=""
                    />
                </button>
                <button
                    className="fullScreen"
                    onClick={() => videoElementRef.current?.requestFullscreen()}
                >
                    <img src={fullScreenIcon} alt="" />
                </button>
                <div className="time">
                    <span id="current-time" className="time">
                        {getTimeFromSeconds(currentTime)}
                    </span>

                    <ReactSlider
                        className="seek-slider"
                        value={currentTime}
                        min={0}
                        max={Math.floor(duration)}
                        onChange={(value) => changeTime(value)}
                    />
                    <span id="duration" className="time">
                        {getTimeFromSeconds(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
