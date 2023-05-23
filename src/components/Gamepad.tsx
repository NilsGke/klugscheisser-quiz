import { useState, useEffect, useCallback } from "react";
import "./Gamepad.scss";
import gamepadIcon from "$assets/gamepad.svg";
import closeIcon from "$assets/close.svg";
import useGamepad from "$hooks/useGamepad";
import { GameTeam } from "$types/gameTypes";
import { getThing, setThing } from "$db/things";
import useKeyboard from "$hooks/keyboard";

const Gamepad = ({
    teams,
    buzzer,
}: {
    teams: GameTeam[];
    buzzer: (team: GameTeam, teamIndex: number) => void;
}) => {
    const [overlayVisible, setOverlayVisible] = useState(false);

    const [mapping, setMapping] = useState<number[]>([0, 5, 10, 15]);

    // get mapping
    useEffect(() => {
        getThing<typeof mapping>("gamepadMapping")
            .then(setMapping)
            .catch(() => setThing("gamepadMapping", mapping));
    }, []);

    // gamepad stuff
    const buttonpress = (id: number) => {
        const teamIndex = mapping.findIndex((keyId) => keyId === id);

        if (teamIndex >= 0) {
            buzzer(teams[teamIndex], teamIndex);
        }
    };

    const { connected } = useGamepad(buttonpress);

    if (!connected) return null;

    return (
        <>
            <button
                id="gamepadButton"
                onClick={() => setOverlayVisible((prev) => !prev)}
            >
                <img src={gamepadIcon} alt="gampad" />
            </button>

            {overlayVisible ? (
                <div className="gamepadOverlayWrapper">
                    <div className="gamepadOverlay">
                        <button
                            className="close"
                            onClick={() => setOverlayVisible(false)}
                        >
                            <img src={closeIcon} alt="close" />
                        </button>
                        <Mapping
                            mapping={mapping}
                            teams={teams}
                            update={setMapping}
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default Gamepad;

const Mapping = ({
    teams,
    mapping,
    update,
}: {
    teams: GameTeam[];
    mapping: number[];
    update: (newMapping: number[]) => void;
}) => {
    // edit mapping
    const [editing, setEditing] = useState<false | number>(false);

    useKeyboard((key) => key === "Escape" && setEditing(false));

    return (
        <div className="mapping">
            <h2>Controller support</h2>
            {teams.map((team, i) => {
                const keyId = mapping[i];
                return (
                    <div className="team" key={team.name + i}>
                        <div className="id">#{i + 1}</div>
                        <div
                            className="name"
                            style={{
                                color: team.color,
                            }}
                        >
                            {team.name}
                        </div>
                        {editing === i ? (
                            <EditButton
                                select={(buttonId) => {
                                    const newMapping = mapping.slice();
                                    newMapping[i] = buttonId;
                                    setThing("gamepadMapping", newMapping).then(
                                        () => {
                                            update(newMapping);
                                            setEditing(false);
                                        }
                                    );
                                }}
                            />
                        ) : (
                            <button
                                className={
                                    "button" + (editing === i ? " editing" : "")
                                }
                                onClick={() => setEditing(i)}
                            >
                                {keyId === undefined ? "not assigned" : keyId}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const EditButton = ({ select }: { select: (buttonId: number) => void }) => {
    const { connected } = useGamepad((id) => select(id));
    if (connected) return <button className="active">press key</button>;
    else return <button disabled>no controller connected</button>;
};
