import { useEffect, useState } from "react";
import Switch from "react-switch";
import {
    SettingsType,
    changeSetting as changeSettingFun,
    getSettings,
} from "$helpers/settings";

import "./SettingsPane.scss";

import sun from "$assets/sun.svg";
import moon from "$assets/moon.svg";
import closeIcon from "$assets/close.svg";
import cursorClickIcon from "$assets/cursorClick.svg";
import cycleIcon from "$assets/cycle.svg";
import stopwatchIcon from "$assets/stopwatch.svg";

const Settings = ({
    onChange,
    close,
}: {
    onChange: () => void;
    close: () => void;
}) => {
    const [settings, setSettings] = useState<SettingsType>(getSettings());

    const refresh = () => setSettings(getSettings());

    const changeSetting = (settings: Partial<SettingsType>) => {
        changeSettingFun(settings);
        refresh();
    };

    useEffect(() => onChange, [settings]);

    useEffect(() => {
        window.addEventListener("storage", refresh);
        return () => window.removeEventListener("storage", refresh);
    }, []);

    return (
        <div className="settingsWrapper">
            <div className="settings">
                <button className="close" onClick={close}>
                    <img src={closeIcon} alt="close" />
                </button>
                <h2>settings</h2>
                <div className="content">
                    <div className="setting">
                        <p className="description">Light Theme</p>
                        <Switch
                            onColor="#ccc"
                            offColor="#aaa"
                            checkedIcon={<img src={sun} />}
                            uncheckedIcon={<img src={moon} />}
                            onChange={(light) =>
                                changeSetting({
                                    theme: light ? "light" : "dark",
                                })
                            }
                            checked={settings.theme === "light"}
                        />
                    </div>

                    <div className="setting">
                        <p className="description">Auto-Skip description</p>
                        <Switch
                            checkedIcon={
                                <img src={cycleIcon} alt="cycle icon" />
                            }
                            uncheckedIcon={
                                <img src={cursorClickIcon} alt="click icon" />
                            }
                            onChange={(auto) =>
                                changeSetting({
                                    descriptionNext: auto ? "auto" : "click",
                                })
                            }
                            checked={settings.descriptionNext === "auto"}
                        />
                    </div>

                    <div className="setting">
                        <p className="description">
                            Auto-Skip on multiple images
                        </p>
                        <Switch
                            checkedIcon={
                                <img src={cycleIcon} alt="cycle icon" />
                            }
                            uncheckedIcon={
                                <img src={cursorClickIcon} alt="click icon" />
                            }
                            onChange={(auto) =>
                                changeSetting({
                                    diashowNext: auto ? "auto" : "click",
                                })
                            }
                            checked={settings.diashowNext === "auto"}
                        />
                    </div>

                    <div className="setting">
                        <p className="description">Use Answer time</p>
                        <Switch
                            checkedIcon={
                                <img
                                    src={stopwatchIcon}
                                    alt="stopwatchIcon icon"
                                />
                            }
                            uncheckedIcon={
                                <img src={closeIcon} alt="no stopwatch icon" />
                            }
                            onChange={(value) =>
                                changeSetting({
                                    useAnswerTime: value,
                                })
                            }
                            checked={settings.useAnswerTime}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

window.addEventListener("storage", (e) => console.log("storage event: ", e));
