import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import Setup from "./setup/Setup";
import {
    Game,
    GameCategory,
    GameField,
    GameTeam,
    GameTeam as TeamType,
} from "../../types/gameTypes";
// styles
import "./Game.page.scss";
import useKeyboard from "../../hooks/keyboard";

const testGame = {
    teams: [
        {
            name: "asdf",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#0f7",
        },
        {
            name: "fghj",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#fe5",
        },
        {
            name: "fghj",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#fa0",
        },
        {
            name: "fghj",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#f32",
        },
        // {
        //     name: "fghj",
        //     members: ["Nils", "Lars", "Mima"],
        //     score: 0,
        //     color: "#f0f",
        // },
        // {
        //     name: "fghj",
        //     members: ["Nils", "Lars", "Mima"],
        //     score: 0,
        //     color: "#05f",
        // },
        // {
        //     name: "fghj",
        //     members: ["Nils", "Lars", "Mima"],
        //     score: 0,
        //     color: "#0ff",
        // },
    ],
    categories: [
        {
            name: "text",
            fields: [
                {
                    question: { type: "text", content: "asdfa" },
                    answer: { type: "text", content: "hjkl" },
                    answered: "fghj",
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "ghjk" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "fghj" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asf" },
                    answer: { type: "text", content: "dfgh" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "sd" },
                    answered: false,
                },
            ],
        },
        {
            name: "text",
            fields: [
                {
                    question: { type: "text", content: "asdfa" },
                    answer: { type: "text", content: "hjkl" },
                    answered: "fghj",
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "ghjk" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "fghj" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asf" },
                    answer: { type: "text", content: "dfgh" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "sd" },
                    answered: false,
                },
            ],
        },
        {
            name: "text",
            fields: [
                {
                    question: { type: "text", content: "asdfa" },
                    answer: { type: "text", content: "hjkl" },
                    answered: "fghj",
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "ghjk" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "fghj" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asf" },
                    answer: { type: "text", content: "dfgh" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asdf" },
                    answer: { type: "text", content: "sd" },
                    answered: false,
                },
            ],
        },
    ],
} as Game;

const Game = () => {
    // const [gameData, setGameData] = useState<Game | null>(null);
    const [gameData, setGameData] = useState<Game | null>(testGame);

    const [selected, setSelected] = useState<null | {
        categoryIndex: number;
        fieldIndex: number;
    }>(null);

    const [buzzeredTeamIndex, setBuzzeredTeamIndex] = useState<null | number>(
        null
    );

    const categoriesRef = useRef<HTMLDivElement>(null);

    useKeyboard((key, e) => {
        if (
            e?.target &&
            Array.from((e.target as HTMLInputElement).classList).includes(
                "dontBuzzer"
            )
        )
            return;
        if (key === "Escape" || key === "0") return setBuzzeredTeamIndex(null);
        const index = parseInt(key) - 1;
        if (gameData === null || isNaN(index)) return;
        const team = gameData.teams.at(index);
        if (team === undefined) return;
        setBuzzeredTeamIndex(index);
        document.getElementById("gamePage")?.animate(
            [
                {
                    boxShadow: `inset 0 0 400px -30px ${team.color}`,
                },
                {
                    boxShadow: `inset 0 0 400px -30px ${team.color}`,
                },
                {
                    boxShadow: `inset 0 0 0px -30px transparent`,
                },
            ],
            {
                duration: 1500,
                easing: "ease-in",
            }
        );
    });

    useLayoutEffect(() => {
        if (gameData === null) return;
        if (categoriesRef.current === null)
            throw new Error("categoriesRef is null, cannot apply grid styles");
        categoriesRef.current.style.gridTemplateColumns = `repeat(${gameData?.categories.length}, 1fr)`;

        return () => {};
    }, [gameData]);

    if (gameData === null)
        return (
            <div id="gamePage">
                <Setup
                    setGameData={(gameData: Game) => setGameData(gameData)}
                />
            </div>
        );

    return (
        <div id="gamePage">
            <div id="teams">
                {gameData.teams.map((team, teamIndex) => (
                    <Team
                        key={teamIndex}
                        team={team}
                        setTeam={(newTeam: GameTeam) => {
                            const newTeams =
                                gameData.teams.slice() as Game["teams"];
                            newTeams[teamIndex] = newTeam;
                            setGameData((prev) =>
                                prev === null
                                    ? null
                                    : {
                                          categories: prev?.categories,
                                          teams: newTeams,
                                      }
                            );
                        }}
                        buzzered={teamIndex === buzzeredTeamIndex}
                    />
                ))}
            </div>
            <div id="categories" ref={categoriesRef}>
                {gameData.categories.map((category, categoryIndex) => (
                    <>
                        <h2>{category.name}</h2>
                        <>
                            {category.fields.map((field, fieldIndex) => (
                                <Field
                                    key={fieldIndex}
                                    field={field}
                                    points={(fieldIndex + 1) * 100}
                                    selected={
                                        selected?.categoryIndex ===
                                            categoryIndex &&
                                        selected.fieldIndex === fieldIndex
                                    }
                                    select={() =>
                                        setSelected({
                                            categoryIndex,
                                            fieldIndex,
                                        })
                                    }
                                    containerRef={categoriesRef}
                                />
                            ))}
                        </>
                    </>
                ))}
            </div>
        </div>
    );
};

const Field = ({
    field,
    points,
    selected,
    select,
    containerRef,
}: {
    field: GameField;
    points: number;
    selected: boolean;
    select: () => void;
    containerRef: RefObject<HTMLDivElement>;
}) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (fieldRef.current === null) throw new Error("fieldRef is null");
        if (containerRef.current === null)
            throw new Error("containerRef is null");
        if (!selected) return;

        const height = fieldRef.current.clientHeight;
        const width = fieldRef.current.clientWidth;
        const offsetLeft = fieldRef.current.offsetLeft;
        const offsetTop = fieldRef.current.offsetTop;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerHeight = containerRef.current.clientHeight;
        const containerWidth = containerRef.current.clientWidth;

        console.log({ containerWidth, width, offsetLeft, containerRect });

        fieldRef.current.style.position = "absolute";
        fieldRef.current.animate(
            [
                {
                    height: `${height}px`,
                    width: `${width}px`,
                    left: offsetLeft + "px",
                    top: offsetTop + "px",
                },
                {
                    height: containerHeight + "px",
                    width: containerWidth + "px",
                    left: "0px",
                    top: "0px",
                },
            ],
            { duration: 500, easing: "ease-out" }
        );
        setTimeout(() => {
            if (fieldRef.current !== null)
                fieldRef.current.classList.add("transitioned");
        }, 500);

        return () => {};
    }, [selected]);

    return (
        <div className="fieldContainer">
            <div
                className={
                    "field" +
                    (selected ? " selected" : "") +
                    (field.answered ? " answered" : "")
                }
                onClick={select}
                ref={fieldRef}
            >
                <div className="points">{points}</div>
            </div>
        </div>
    );
};

const Team = ({
    team,
    buzzered,
    setTeam,
}: {
    team: TeamType;
    buzzered: boolean;
    setTeam: (newTeam: GameTeam) => void;
}) => {
    const teamRef = useRef<HTMLDivElement>(null);

    // apply animation on first render, toggleing is done with css
    useEffect(() => {
        if (teamRef.current === null) return;
        teamRef.current.animate(
            [
                {
                    boxShadow: `
                                 inset 0 0 30px 0px ${team.color},
                                 0 0 100px 10px ${team.color}
                            `,
                    border: `1px solid ${team.color}`,
                },
                {
                    boxShadow: `
                        inset 0 0 10px ${team.color}, 
                        0 0 30px ${team.color}`,
                },
                {
                    boxShadow: `
                                 inset 0 0 30px 0px ${team.color},
                                 0 0 100px 10px ${team.color}
                            `,
                    border: `1px solid ${team.color}`,
                },
            ],
            { duration: 600, easing: "ease-in-out", iterations: Infinity }
        );
    }, []);

    return (
        <div
            className={"team" + (buzzered ? " buzzered" : "")}
            style={{
                border: `1px solid ${team.color}`,
            }}
            ref={teamRef}
        >
            <h2>{team.name}</h2>

            <div className="content">
                <div className="members">
                    {team.members.map((memberName) => (
                        <div className="member">{memberName}</div>
                    ))}
                </div>
                <div className="score">
                    <input
                        type="number"
                        className="scoreInput dontBuzzer"
                        value={team.score}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTeam({
                                ...team,
                                score: parseInt(e.target.value),
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
export default Game;
