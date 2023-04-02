import { FC, useEffect, useMemo, useRef, useState } from "react";
import ReactSlider from "react-slider";
import getTimeFromSeconds from "../helpers/timeFromSeconds";
// assets
import playIcon from "../assets/play.svg";
import pauseIcon from "../assets/pause.svg";
import volume0 from "../assets/volume0.svg";
import volume1 from "../assets/volume1.svg";
import volume2 from "../assets/volume2.svg";
import volume3 from "../assets/volume3.svg";
// styles
import "./AudioPlayer.scss";

type props = {
    file: File;
    fileName?: string;
};

const AudioPlayer: FC<props> = ({ file }) => {
    const audioUrl = useMemo(() => URL.createObjectURL(file), [file]);

    const audioElementRef = useRef<HTMLAudioElement>(null);

    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(40);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (audioElementRef.current === null) return;
        // metadata
        const handleMetadata = () => {
            if (audioElementRef.current === null) return;
            setDuration(audioElementRef.current.duration);
        };
        if (audioElementRef.current.readyState > 0) {
            // element is ready
            handleMetadata();
        } else {
            audioElementRef.current.addEventListener(
                "loadedmetadata",
                handleMetadata
            );
        }

        // time update
        const timeUpdate = () =>
            setCurrentTime(audioElementRef.current?.currentTime || 0);

        audioElementRef.current.addEventListener("timeupdate", timeUpdate);

        return () => {
            audioElementRef.current?.removeEventListener(
                "loadedmetadata",
                handleMetadata
            );
            audioElementRef.current?.removeEventListener(
                "timeupdate",
                timeUpdate
            );
        };
    }, [audioElementRef]);

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
        if (audioElementRef.current)
            audioElementRef.current.volume = volume / 100;
    }, [volume]);

    const play = (play: boolean) => {
        if (audioElementRef.current === null)
            throw new Error("audio element ref is null -> could not play");

        if (play) audioElementRef.current.play();
        else audioElementRef.current.pause();

        setPlaying((prev) => !prev);
    };

    const changeTime = (currentTime: number) => {
        if (audioElementRef.current === null)
            throw new Error(
                "audio element ref is null -> could not change time"
            );

        audioElementRef.current.currentTime = currentTime;
    };

    const name =
        file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name;

    console.log(volume);

    return (
        <div className={"audioPlayer" + (playing ? " playing" : "")}>
            <audio
                src={audioUrl}
                preload="metadata"
                loop
                ref={audioElementRef}
            ></audio>
            <div className="top">
                <button className="playPause" onClick={() => play(!playing)}>
                    <img src={playing ? pauseIcon : playIcon} alt="" />
                </button>
                <div className="title">{name}</div>
            </div>

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

            <div className="volume">
                <span className="volume">{volume}%</span>
                <ReactSlider
                    className="volume-slider"
                    thumbClassName="thumb"
                    trackClassName="track"
                    value={volume}
                    min={0}
                    max={100}
                    onChange={(value) => setVolume(value)}
                />
                <button
                    className="mute"
                    onClick={() => {
                        if (volume === 0) setVolume(40);
                        else setVolume(0);
                    }}
                >
                    {volume === 0 ? (
                        <img src={volume0} alt="volume off" />
                    ) : volume <= 33 ? (
                        <img src={volume1} alt="" />
                    ) : volume <= 66 ? (
                        <img src={volume2} alt="" />
                    ) : (
                        <img src={volume3} alt="" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default AudioPlayer;
