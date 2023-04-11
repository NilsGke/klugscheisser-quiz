import {
    RefObject,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import Setup from "./setup/Setup";
// types
import {
    Game,
    GameField,
    GameTeam,
    TeamColors,
    GameTeam as TeamType,
    categoryToGameCategory,
} from "../../types/gameTypes";
import { Category, Ressource } from "../../types/categoryTypes";
// helpers
import { getStoredCategory } from "../../helpers/indexeddb";
// hooks
import useKeyboard from "../../hooks/keyboard";
import { useParams } from "react-router-dom";
// components
import AudioPlayer from "../../components/AudioPlayer";
import VideoPlayer from "../../components/VideoPlayer";
import Spinner from "../../components/Spinner";
import TimeBar from "../../components/TimeBar";
// styles
import "./Game.page.scss";
//assets
import closeIcon from "../../assets/close.svg";

const testGame = {
    teams: [
        {
            name: "Team1",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#0f7",
        },
        {
            name: "Team2",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#fe5",
        },
        {
            name: "Team3",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#fa0",
        },
        {
            name: "Team4",
            members: ["Nils", "Lars", "Mima"],
            score: 0,
            color: "#f32",
        },
    ],
    categories: [
        {
            name: "text",
            description:
                "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum numquam blanditiis harum quisquam ",
            fields: [
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer" },
                    answered: "fghj",
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer2" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer3" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asf" },
                    answer: { type: "text", content: "dfgh" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer4" },
                    answered: false,
                },
            ],
        },
        {
            name: "text",
            description: "category description",
            fields: [
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer" },
                    answered: "fghj",
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer2" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer3" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asf" },
                    answer: { type: "text", content: "dfgh" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer4" },
                    answered: false,
                },
            ],
        },
        {
            name: "text",
            description: "category description",
            fields: [
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer" },
                    answered: "fghj",
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer2" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer3" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "asf" },
                    answer: { type: "text", content: "dfgh" },
                    answered: false,
                },
                {
                    question: { type: "text", content: "question" },
                    answer: { type: "text", content: "answer4" },
                    answered: false,
                },
            ],
        },
    ],
} as Game;

enum State {
    idle = "idle",
    goingBig = "goingBig",
    showDescription = "showDescription",
    showQuestion = "showQuestion",
    showAnswer = "showAnswer",
    goingSmall = "goingSmall",
}

const Game = () => {
    const [gameData, setGameData] = useState<Game | null>(null);
    // const [gameData, setGameData] = useState<Game | null>(testGame);

    const [selected, setSelected] = useState<null | {
        categoryIndex: number;
        fieldIndex: number;
    }>(null);

    const [buzzeredTeamIndex, setBuzzeredTeamIndex] = useState<null | number>(
        null
    );

    const categoriesRef = useRef<HTMLDivElement>(null);

    const keyboardCallback = useCallback(
        (key: string, e: KeyboardEvent) => {
            if (
                e.target &&
                Array.from((e.target as HTMLInputElement).classList).includes(
                    "dontBuzzer"
                )
            )
                return;

            if (key === "Escape" || key === "0")
                return setBuzzeredTeamIndex(null);
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
        },
        [gameData]
    );

    // load testgame if specified in url
    const { dbIndex } = useParams();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (dbIndex === undefined) return;
        const index = parseInt(dbIndex);
        if (isNaN(index)) return;
        setLoading(true);
        if (dbIndex)
            getStoredCategory(parseInt(dbIndex)).then((category) => {
                setGameData({
                    teams: [
                        {
                            name: "Team 1",
                            color: TeamColors[0],
                            members: ["player 1", "player 2"],
                            score: 0,
                        },
                        {
                            name: "Team 2",
                            color: TeamColors[1],
                            members: ["player 3", "player 4"],
                            score: 0,
                        },
                        {
                            name: "Team 3",
                            color: TeamColors[2],
                            members: ["player 5", "player 6"],
                            score: 0,
                        },
                    ],
                    categories: [categoryToGameCategory(category)],
                });
                setLoading(false);
            });
    }, []);

    useKeyboard(keyboardCallback);

    useLayoutEffect(() => {
        if (gameData === null) return;
        if (categoriesRef.current === null)
            throw new Error("categoriesRef is null, cannot apply grid styles");
        categoriesRef.current.style.gridTemplateColumns = `repeat(${gameData?.categories.length}, 1fr)`;

        return () => {};
    }, [gameData]);

    const activeTimers = useRef<NodeJS.Timeout[]>([]);
    const abortTimers = () => {
        activeTimers.current.forEach(clearTimeout);
        activeTimers.current = [];
    };

    // game stuff
    const [gameState, setGameState] = useState<State>(State.idle);
    const startGameSequence = (categoryIndex: number, fieldIndex: number) => {
        abortTimers();

        setSelected({
            categoryIndex,
            fieldIndex,
        });
        setGameState(State.goingBig);
        activeTimers.current = [
            setTimeout(() => setGameState(State.showDescription), 500),
            setTimeout(() => setGameState(State.showQuestion), 4500),
        ];
    };

    if (loading) return <Spinner />;

    if (gameData === null)
        return (
            <div id="gamePage">
                <Setup
                    setGameData={(gameData: Game) => setGameData(gameData)}
                />
            </div>
        );

    return (
        <div id="gamePage" className={gameState}>
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
                                    unselect={() => {
                                        abortTimers();
                                        setSelected(null);
                                        setGameState(State.idle);
                                    }}
                                    onClick={() => {
                                        abortTimers();
                                        startGameSequence(
                                            categoryIndex,
                                            fieldIndex
                                        );
                                    }}
                                    setGameState={(newState: State) =>
                                        setGameState(newState)
                                    }
                                    containerRef={categoriesRef}
                                    gameState={gameState}
                                    category={category}
                                    buzzeredTeamIndex={buzzeredTeamIndex}
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
    unselect,
    onClick,
    setGameState,
    containerRef,
    gameState,
    category,
    buzzeredTeamIndex,
}: {
    field: GameField;
    points: number;
    selected: boolean;
    unselect: () => void;
    onClick: () => void;
    setGameState: (newState: State) => void;
    containerRef: RefObject<HTMLDivElement>;
    gameState: State;
    category: Category;
    buzzeredTeamIndex: number | null;
}) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const activeTimer = useRef<NodeJS.Timeout | null>(null);

    // going big animation
    useEffect(() => {
        if (fieldRef.current === null) throw new Error("fieldRef is null");
        if (containerRef.current === null)
            throw new Error("containerRef is null");
        if (!selected) return;

        const height = fieldRef.current.clientHeight;
        const width = fieldRef.current.clientWidth;
        const offsetLeft = fieldRef.current.offsetLeft;
        const offsetTop = fieldRef.current.offsetTop;

        const containerHeight = containerRef.current.clientHeight;
        const containerWidth = containerRef.current.clientWidth;

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
        activeTimer.current = setTimeout(() => {
            if (fieldRef.current !== null)
                fieldRef.current.classList.add("transitioned");
        }, 500);
    }, [selected]);

    const fieldContainerRef = useRef<HTMLDivElement>(null);

    // going small animation
    const close = () => {
        if (fieldRef.current === null) throw new Error("fieldRef is null");
        if (fieldContainerRef.current === null)
            throw new Error("fieldContainerRef is null");
        if (containerRef.current === null)
            throw new Error("containerRef is null");

        const height = fieldContainerRef.current.clientHeight;
        const width = fieldContainerRef.current.clientWidth;
        const offsetLeft = fieldContainerRef.current.offsetLeft;
        const offsetTop = fieldContainerRef.current.offsetTop;

        const containerHeight = containerRef.current.clientHeight;
        const containerWidth = containerRef.current.clientWidth;

        clearTimeout(activeTimer.current || undefined);

        setGameState(State.idle);

        fieldRef.current.classList.remove("transitioned");

        fieldRef.current.style.position = "absolute";
        fieldRef.current.animate(
            [
                {
                    height: containerHeight + "px",
                    width: containerWidth + "px",
                    left: "0px",
                    top: "0px",
                },
                {
                    height: `${height}px`,
                    width: `${width}px`,
                    left: offsetLeft + "px",
                    top: offsetTop + "px",
                },
            ],
            { duration: 500, easing: "ease-out" }
        );

        setTimeout(() => {
            unselect();
            if (fieldRef.current) fieldRef.current.style.position = "relative";
        }, 500);
    };

    return (
        <div className="fieldContainer" ref={fieldContainerRef}>
            <div
                className={
                    "field" +
                    (selected ? " selected" : "") +
                    (field.answered ? " answered" : "")
                }
                onClick={!field.answered && !selected ? onClick : undefined}
                ref={fieldRef}
            >
                <div className="contentContainer">
                    <button className="close" onClick={close}>
                        <img src={closeIcon} alt="close icon" />
                    </button>
                    <div className="content">
                        <div
                            className="points"
                            style={{
                                opacity:
                                    gameState === State.idle ||
                                    gameState === State.goingBig ||
                                    !selected
                                        ? 1
                                        : 0,
                            }}
                        >
                            {points}
                        </div>

                        {selected ? (
                            <>
                                <div
                                    className="description"
                                    style={{
                                        opacity:
                                            gameState === State.showDescription
                                                ? 1
                                                : 0,
                                    }}
                                >
                                    {category.description}
                                    {gameState === State.showDescription ? (
                                        <TimeBar time={4000} />
                                    ) : null}
                                </div>

                                {gameState === State.showDescription ||
                                gameState === State.showQuestion ? (
                                    <div
                                        className="question"
                                        style={{
                                            opacity:
                                                gameState === State.showQuestion
                                                    ? 1
                                                    : 0,
                                        }}
                                    >
                                        {field.question.type === "text" ? (
                                            <div className="text">
                                                {field.question.content}
                                            </div>
                                        ) : (
                                            <ResourceDisplay
                                                resource={field.question}
                                            />
                                        )}
                                        <button
                                            className="answer"
                                            style={{
                                                opacity:
                                                    buzzeredTeamIndex === null
                                                        ? 0
                                                        : 1,
                                            }}
                                            onClick={() =>
                                                setGameState(State.showAnswer)
                                            }
                                        >
                                            show Answer
                                        </button>
                                    </div>
                                ) : null}

                                {gameState === State.showAnswer ? (
                                    <div
                                        className="answer"
                                        style={{
                                            opacity:
                                                gameState === State.showAnswer
                                                    ? 1
                                                    : 0,
                                        }}
                                    >
                                        <ResourceDisplay
                                            resource={field.answer}
                                        />
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResourceDisplay = ({ resource }: { resource: Ressource }) => {
    if (resource.type === "image") {
        const url = URL.createObjectURL(resource.content);
        return (
            <div className="image">
                <img src={url} alt="" />
            </div>
        );
    } else if (resource.type === "audio")
        return (
            <div className="audio">
                <AudioPlayer file={resource.content} autoplay />
            </div>
        );
    else if (resource.type === "video")
        return <VideoPlayer file={resource.content} autoplay />;
    else if (resource.type === "text")
        return <div className="text">{resource.content}</div>;
    // else if(resource.type === "imageCollection")
    // return <Diashow />
    return <div className="resource">unknwon content type?</div>;
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
