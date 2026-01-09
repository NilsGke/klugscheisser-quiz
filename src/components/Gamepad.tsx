import { useState, useEffect, useCallback } from "react";
import "./Gamepad.scss";
import gamepadIcon from "$assets/gamepad.svg";
import closeIcon from "$assets/close.svg";
import addIcon from "$assets/add.svg";
import useGamepad from "$hooks/useGamepad";
import { GameTeam } from "$types/gameTypes";
import { getThing, setThing } from "$db/things";
import useKeyboard from "$hooks/keyboard";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React from "react";

const Gamepad = ({
    teams,
    buzzer,
}: {
    teams: GameTeam[];
    buzzer: (team: GameTeam, teamIndex: number) => void;
}) => {
    const [overlayVisible, setOverlayVisible] = useState(false);

    const [mapping, setMapping] = useState<string[][]>([
        ...teams.map((_team) => []),
    ]);

    // get mapping
    useEffect(() => {
        getThing<typeof mapping>("gamepadMapping")
            .then((mapping) => {
                // check for old mapping type
                if (typeof mapping[0] === "number")
                    throw Error("old mapping type");

                console.log({ mapping, m: mapping.length, t: teams.length });

                if (mapping.length < teams.length)
                    mapping.push(
                        ...new Array(teams.length - mapping.length).fill([]),
                    );

                setMapping(mapping);
                setThing("gamepadMapping", mapping);
            })
            .catch(() =>
                setThing("gamepadMapping", new Array(teams.length).fill([])),
            );
    }, []);

    // gamepad stuff
    const buttonpress = ({
        button,
        gamepad,
    }: {
        button: number;
        gamepad: number;
    }) => {
        const teamIndex = mapping.findIndex(
            (keyIdArray) =>
                !!keyIdArray.find((keyId) => keyId === gamepad + "." + button),
        );

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
    mapping: string[][];
    update: (newMapping: typeof mapping) => void;
}) => {
    const [addingButton, setAddingButton] = useState<false | { team: number }>(
        false,
    );

    const { connected } = useGamepad((pressed) => {
        if (!addingButton) return;
        const newMapping = mapping.slice();
        const teamsMapping = newMapping[addingButton.team];
        teamsMapping[newMapping[addingButton.team].length] =
            pressed.gamepad + "." + pressed.button;
        const unique = [...new Set(teamsMapping)];
        newMapping[addingButton.team] = unique;
        setThing("gamepadMapping", newMapping).then(() => {
            update(newMapping);
        });
    });

    useKeyboard((key) => key === "Escape" && setAddingButton(false));

    const [mappingTableRef] = useAutoAnimate();

    return (
        <>
            <div className="mapping">
                <h2>Controller support</h2>
                <div className="mappingTable" ref={mappingTableRef}>
                    {teams.map((team, teamIndex) => {
                        const keyIdArray = mapping[teamIndex] || [];
                        return (
                            <React.Fragment key={teamIndex}>
                                <div className="id">#{teamIndex + 1}</div>
                                <div
                                    className="name"
                                    style={{
                                        color: team.color,
                                    }}
                                >
                                    {team.name}
                                </div>
                                <ButtonList
                                    keyIdArray={keyIdArray}
                                    adding={
                                        addingButton !== false &&
                                        addingButton.team === teamIndex
                                    }
                                    startAdding={() =>
                                        setAddingButton({
                                            team: teamIndex,
                                        })
                                    }
                                    stopAdding={() => setAddingButton(false)}
                                    remove={(keyIndex: number) => {
                                        const newMapping = mapping.slice();
                                        console.log(newMapping);

                                        const newKeyIdArr = keyIdArray.slice();
                                        newKeyIdArr.splice(keyIndex, 1);

                                        newMapping[teamIndex] = newKeyIdArr;

                                        setThing(
                                            "gamepadMapping",
                                            newMapping,
                                        ).then(() => {
                                            update(newMapping);
                                        });
                                    }}
                                />
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
            {!connected ? "no gamepad connected" : null}
        </>
    );
};

const ButtonList = ({
    keyIdArray,
    remove,
    adding,
    startAdding,
    stopAdding,
}: {
    keyIdArray: string[];
    remove: (index: number) => void;
    adding: boolean;
    stopAdding: () => void;
    startAdding: () => void;
}) => {
    const [buttonListRef] = useAutoAnimate();

    return (
        <div className="buttons" ref={buttonListRef}>
            {keyIdArray.map((keyId, keyIndex) => (
                <Button
                    keyId={keyId}
                    onClick={() => remove(keyIndex)}
                    key={keyId}
                />
            ))}
            {adding ? (
                <button
                    key={"add"}
                    className="stop"
                    onClick={stopAdding}
                    title="stop adding buttons to this team"
                >
                    ✅
                </button>
            ) : (
                <button
                    key={"add"}
                    className="add"
                    onClick={startAdding}
                    title="add buttons to this team"
                >
                    +
                </button>
            )}
        </div>
    );
};

const Button = ({ keyId, onClick }: { keyId: string; onClick: () => void }) => {
    return (
        <button
            className={"button"}
            title="remove this button"
            onClick={onClick}
        >
            {keyId === undefined ? "not assigned" : keyId}
        </button>
    );
};
