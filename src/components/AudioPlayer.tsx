import { FC, useEffect, useMemo, useRef, useState } from "react";
import getTimeFromSeconds from "$helpers/timeFromSeconds";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
// assets
import playIcon from "$assets/play.svg";
import pauseIcon from "$assets/pause.svg";
import volume0 from "$assets/volume0.svg";
import volume1 from "$assets/volume1.svg";
import volume2 from "$assets/volume2.svg";
import volume3 from "$assets/volume3.svg";
import speakerIcon from "$assets/speaker.svg";
// styles
import "./AudioPlayer.scss";

type props = {
    file: File;
    initialVolume?: number;
    onVolumeChange?: (value: number) => void;
    autoplay?: boolean;
    show?: boolean;
    stop?: boolean;
};

// TODO add album art

const AudioPlayer: FC<props> = ({
    file,
    onVolumeChange,
    initialVolume = 50,
    autoplay = false,
    show,
    stop,
}) => {
    const audioUrl = useMemo(() => URL.createObjectURL(file), [file]);

    const audioElementRef = useRef<HTMLAudioElement>(null);

    const [playing, setPlaying] = useState(autoplay);
    const [volume, setVolume] = useState(initialVolume);
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

    // forward volume change to parent
    useEffect(() => {
        if (onVolumeChange) onVolumeChange(volume);
    }, [volume]);

    const play = (play: boolean) => {
        if (audioElementRef.current === null)
            throw new Error("audio element ref is null -> could not play");

        if (play) audioElementRef.current.play();
        else audioElementRef.current.pause();

        setPlaying((prev) => !prev);
    };

    useEffect(() => {
        if (stop) play(false);
    }, [stop]);

    const changeTime = (currentTime: number) => {
        if (audioElementRef.current === null)
            throw new Error(
                "audio element ref is null -> could not change time"
            );

        audioElementRef.current.currentTime = currentTime;
    };

    const name =
        file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name;

    return (
        <div className={"audioPlayer" + (playing ? " playing" : "")}>
            <audio
                src={audioUrl}
                preload="metadata"
                loop
                ref={audioElementRef}
                autoPlay={autoplay}
            ></audio>
            <div className="top">
                {show ? (
                    <>
                        <img
                            src={speakerIcon}
                            className="speakerIcon"
                            alt="speaker icon"
                        />
                        <button
                            className="playPause"
                            onClick={() => play(!playing)}
                        >
                            <img
                                src={playing ? pauseIcon : playIcon}
                                alt="play/pause"
                            />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="playPause"
                            onClick={() => play(!playing)}
                        >
                            <img src={playing ? pauseIcon : playIcon} alt="" />
                        </button>
                        <div className="title">{name}</div>
                    </>
                )}
            </div>

            <div className="time">
                <span id="current-time" className="time">
                    {getTimeFromSeconds(currentTime)}
                </span>
                <Slider
                    className="seek-slider"
                    value={currentTime}
                    min={0}
                    max={Math.floor(duration)}
                    onChange={(value) =>
                        changeTime(typeof value === "object" ? value[0] : value)
                    }
                />
                <span id="duration" className="time">
                    {getTimeFromSeconds(duration)}
                </span>
            </div>

            <div className="volume">
                <span className="volume">{volume}%</span>
                <Slider
                    className="volume-slider"
                    value={volume}
                    min={0}
                    max={100}
                    onChange={(value) =>
                        setVolume(typeof value === "object" ? value[0] : value)
                    }
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
        </div>
    );
};

export default AudioPlayer;
