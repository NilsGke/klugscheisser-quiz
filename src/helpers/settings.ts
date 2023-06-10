import { Theme } from "main";

type keyValue = {
    [key: string]: string;
};

export interface SettingsType {
    diashowNext: "click" | "auto";
    descriptionNext: "click" | "auto";
    theme: Theme;
    maxExportSize: number;
}

export type keyValueSettingsType = keyValue & SettingsType;

export const defaultSettings: SettingsType = {
    descriptionNext: "auto",
    diashowNext: "auto",
    theme: "dark",
    maxExportSize: 1_000_000_000,
};

export const getSettings = () => {
    const storedString = localStorage.getItem("settings");
    if (storedString === null) {
        storeSettings(defaultSettings);
        return defaultSettings;
    }

    try {
        const options = JSON.parse(storedString) as SettingsType;
        return options;
    } catch (error) {
        console.error(
            "options threw error, code is continueing though. Error: " + error
        );
        localStorage.clear();
        storeSettings(defaultSettings);
        return defaultSettings;
    }
};

export const storeSettings = (settings: SettingsType) =>
    localStorage.setItem("settings", JSON.stringify(settings));

export const changeSetting = (settings: Partial<SettingsType>) => {
    const changed = settings as keyValueSettingsType;
    const newSettings = getSettings() as keyValueSettingsType;
    for (const key in changed) {
        if (Object.prototype.hasOwnProperty.call(changed, key)) {
            const value = changed[key];
            newSettings[key] = value;
        }
    }
    storeSettings(newSettings);
};

export const upgradeSettings = () => {
    const stored = getSettings() as keyValueSettingsType;
    const defSettings = defaultSettings as keyValueSettingsType;

    for (var option in defSettings)
        if (defSettings.hasOwnProperty(option))
            if (!stored.hasOwnProperty(option))
                stored[option] = defSettings[option];

    storeSettings(stored);
};

upgradeSettings();
