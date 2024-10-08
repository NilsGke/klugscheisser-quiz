import {
    Fragment,
    RefObject,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import Setup from "./setup/Setup";
import JSConfetti from "js-confetti";
import { confirmAlert } from "react-confirm-alert";

// types
import {
    type Game,
    GameField,
    GameTeam,
    TeamColors,
    GameTeam as TeamType,
    categoryToGameCategory,
} from "$types/gameTypes";
import { Audio, Category, Resource } from "$types/categoryTypes";
// helpers
import { getStoredCategory, removeCategoryFromDb } from "$db/categories";
import { deleteGameFromDb, getGameFromDb, saveGameInDb } from "$db/games";
// hooks
import useKeyboard from "$hooks/keyboard";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// components
import AudioPlayer from "$components/AudioPlayer";
import VideoPlayer from "$components/VideoPlayer";
import Spinner from "$components/Spinner";
import TimeBar from "$components/TimeBar";
import Diashow from "$components/Diashow";
// styles
import "./Game.page.scss";
//assets
import closeIcon from "$assets/close.svg";
import editIcon from "$assets/edit.svg";
import checkIcon from "$assets/check.svg";
import eyeIcon from "$assets/eye.svg";
import gearIcon from "$assets/gear.svg";
import finishFlagIcon from "$assets/finishFlag.svg";
import testIcon from "$assets/test.svg";
import homeIcon from "$assets/home.svg";
import { PieChart } from "react-minimal-pie-chart";
import Settings from "$components/SettingsPane";
import { SettingsType, getSettings } from "$helpers/settings";
import useTitle from "$hooks/useTitle";
import { Theme } from "main";
import ResourceRenderer from "$components/ResourceRenderer";
import { getThing } from "$db/things";
import HomeButton from "$components/HomeButton";
import Gamepad from "$components/Gamepad";
import { useAutoAnimate } from "@formkit/auto-animate/react";

enum State {
    intro = "intro",
    idle = "idle",
    goingBig = "goingBig",
    showDescription = "showDescription",
    showQuestion = "showQuestion",
    showAnswer = "showAnswer",
    goingSmall = "goingSmall",
    done = "done",
}

const jsConfetti = new JSConfetti();

const Game = ({
    theme,
    themeChange,
}: {
    theme: Theme;
    themeChange: () => void;
}) => {
    const [gameData, setGameData] = useState<Game | null>(null);

    const [selected, setSelected] = useState<null | {
        categoryIndex: number;
        fieldIndex: number;
    }>(null);

    const [buzzeredTeamIndex, setBuzzeredTeamIndex] = useState<null | number>(
        null
    );

    const categoriesRef = useRef<HTMLDivElement>(null);

    // remove category from db if url is ./test/:dbIndex/destroy
    const { pathname } = useLocation();

    // load testgame if specified in url
    const { dbIndex: urlDbIndex } = useParams();
    const dbIndex = parseInt(urlDbIndex || "");
    const testMode = !isNaN(dbIndex);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    useEffect(() => {
        if (!testMode) return;
        setLoading(true);
        getStoredCategory(dbIndex)
            .then((category) => {
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

                // remove category from db if url is .../test/:dbIndex/destroy
                if (pathname.includes("/destroy"))
                    removeCategoryFromDb(dbIndex);
                setLoading(false);
            })
            .catch((error) => {
                setErrorMessage("category not found");
                console.error("error", error);
            })
            .finally(() => {
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useTitle(testMode ? "ksq - test-mode" : "ksq - Game");

    // store game on every change
    useEffect(() => {
        if (gameData !== null && !testMode) saveGameInDb(gameData);
    }, [gameData]);

    // retrieve game on first render if it is a thing
    useEffect(
        () => {
            if (testMode) return;
            setLoading(true);
            getGameFromDb()
                .then((game) => {
                    setGameData(game);
                    setLoading(false);
                })
                .catch(() => {
                    console.info("no game found");
                })
                .finally(() => {
                    setLoading(false);
                });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

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

        activeTimers.current.push(
            setTimeout(() => setGameState(State.showDescription), 500)
        );

        if (settings.descriptionNext === "auto")
            activeTimers.current.push(
                setTimeout(() => setGameState(State.showQuestion), 4500)
            );
    };

    const buzzer = useCallback(
        (index: number) => {
            if (!gameData || buzzeredTeamIndex !== null) return;
            const team = gameData.teams[index];
            if (gameState !== State.idle) setBuzzeredTeamIndex(index);
            document.getElementById("gamePage")?.animate(
                [
                    {
                        boxShadow: `inset 0 0 0px 10px ${team.color}`,
                    },
                    {
                        boxShadow: `inset 0 0 400px 190px ${team.color}`,
                    },
                    ...new Array(5).fill({
                        boxShadow: `inset 0 0 400px -30px ${team.color}`,
                    }),
                    {
                        boxShadow: `inset 0 0 0px -30px transparent`,
                    },
                ],
                {
                    duration: 3000,
                    easing: "ease-out",
                }
            );
        },
        [gameData, gameState, buzzeredTeamIndex]
    );

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
            buzzer(index);
        },
        [gameData, buzzer]
    );

    useKeyboard(keyboardCallback);

    const navigate = useNavigate();

    const grantPoints = (points: number) => {
        if (buzzeredTeamIndex === null)
            throw new Error(
                "buzzeredTeamIndex is null while trying to grant points to team"
            );

        setGameData((prev) => {
            if (prev === null)
                throw new Error("game is null while trying to set score");
            if (selected === null)
                throw new Error(
                    "selected team is null while trying to set score and disable field"
                );

            const newTeams = prev.teams;
            newTeams[buzzeredTeamIndex].score += points;

            const newCategories = prev.categories;
            const field =
                newCategories[selected.categoryIndex].fields[
                    selected.fieldIndex
                ];
            field.answered = prev.teams[buzzeredTeamIndex].name;

            jsConfetti.addConfetti({
                confettiColors: [prev.teams[buzzeredTeamIndex].color],
                confettiNumber: points,
                confettiRadius: 4,
            });
            if (points > 0)
                jsConfetti.addConfetti({
                    confettiNumber: 20,
                    emojis: ["✅"],
                    emojiSize: 20,
                });

            if (
                newCategories.every((cat) =>
                    cat.fields.every(
                        (field) => typeof field.answered === "string"
                    )
                )
            ) {
                setTimeout(() => setGameState(State.done), 650);
            } else setGameState(State.idle);

            return {
                categories: newCategories,
                teams: newTeams,
            };
        });
        abortTimers();
        setBuzzeredTeamIndex(null);
        setSelected(null);
    };

    const endGame = () => {
        if (
            !confirm(
                "Do you really want to reset the game? This action cannot be undone!"
            )
        )
            return;
        abortTimers();
        jsConfetti.clearCanvas();
        deleteGameFromDb().then(() => (window.location.href = "/"));
    };

    // confetti on win
    useEffect(() => {
        if (gameState === State.done) {
            const confettiTimer = setTimeout(() => {
                jsConfetti.addConfetti({
                    confettiNumber: 150,
                    emojis: ["👑", "🏁", "🏁", "🏁"],
                    emojiSize: 30,
                });
                const trippleConfetti = setTimeout(() => {
                    let i = 0;
                    const confetti = () => {
                        i++;
                        if (i === 3) clearInterval(intverval);

                        activeTimers.current.push(
                            setTimeout(() => {
                                jsConfetti.addConfetti({
                                    confettiColors: winners.map((t) => t.color),
                                });
                            }, 0),
                            setTimeout(() => {
                                jsConfetti.addConfetti({
                                    confettiColors: winners.map((t) => t.color),
                                });
                            }, 250),
                            setTimeout(() => {
                                jsConfetti.addConfetti({
                                    confettiColors: winners.map((t) => t.color),
                                });
                            }, 500)
                        );
                    };
                    const intverval = setInterval(confetti, 1300);
                }, 1000);
                activeTimers.current.push(trippleConfetti);
            }, 600);
            activeTimers.current.push(confettiTimer);
        }
    }, [gameState]);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settings, setSettings] = useState(getSettings());

    const [gameControlsRef] = useAutoAnimate();

    if (loading) return <Spinner />;

    if (errorMessage !== "")
        return (
            <div id="gamePage" className="error">
                <HomeButton />
                <p>{errorMessage}</p>
            </div>
        );

    // display SETUP if no game data
    if (gameData === null)
        return (
            <div id="gamePage">
                <Setup
                    setGameData={(gameData: Game) => {
                        setGameData(gameData);
                        if (settings.theme === "senior")
                            setGameState(State.intro);
                    }}
                />
            </div>
        );

    const sortedTeams = gameData.teams
        .slice()
        .sort((a, b) => b.score - a.score);

    const winners = sortedTeams.filter(
        (team) => team.score === sortedTeams[0].score
    );

    return (
        <div id="gamePage" className={gameState}>
            <aside>
                <div id="teams">
                    {gameData.teams.map((team, teamIndex) => (
                        <Team
                            key={teamIndex}
                            team={team}
                            theme={theme}
                            index={teamIndex}
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
                            buzzeredTeamIndex={buzzeredTeamIndex}
                        />
                    ))}
                </div>
                <div id="gameControls" ref={gameControlsRef}>
                    <button className="settings" onClick={() => navigate("/")}>
                        <img
                            src={homeIcon}
                            className="homeIcon"
                            alt="home icon"
                            title="home page"
                        />
                    </button>

                    <button
                        className="settings"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <img
                            src={gearIcon}
                            alt="settings icon"
                            title="settings"
                        />
                    </button>

                    {testMode ? (
                        <button
                            className="endTest"
                            onClick={() => {
                                setGameData(null);
                                window.close();
                            }}
                        >
                            <img
                                src={testIcon}
                                alt="end test icon"
                                title="end test"
                                className="testIcon"
                            />
                        </button>
                    ) : (
                        <button
                            className="end"
                            onClick={() => {
                                abortTimers();
                                setSelected(null);
                                setGameState(State.done);
                            }}
                        >
                            <img
                                src={finishFlagIcon}
                                alt="finish icon"
                                title="end game"
                            />
                        </button>
                    )}

                    <Gamepad
                        teams={gameData.teams}
                        buzzer={(team, teamIndex) => buzzer(teamIndex)}
                    />
                </div>
            </aside>
            <div id="categories" ref={categoriesRef}>
                {gameData.categories.map((category, categoryIndex) => (
                    <Fragment key={category.name + categoryIndex}>
                        <h2>{category.name}</h2>
                        <>
                            {category.fields.map((field, fieldIndex) => (
                                <Field
                                    theme={theme}
                                    key={fieldIndex}
                                    {...{
                                        settings,
                                        testMode,
                                        buzzeredTeamIndex,
                                        category,
                                        gameState,
                                        categoriesRef,
                                        field,
                                    }}
                                    points={(fieldIndex + 1) * 100}
                                    grantPoints={(points) =>
                                        grantPoints(points)
                                    }
                                    selected={
                                        selected?.categoryIndex ===
                                            categoryIndex &&
                                        selected.fieldIndex === fieldIndex
                                    }
                                    unselect={() => {
                                        abortTimers();
                                        setSelected(null);
                                        setBuzzeredTeamIndex(null);
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
                                />
                            ))}
                        </>
                    </Fragment>
                ))}
            </div>

            {gameState === State.intro ? (
                <Intro start={() => setGameState(State.idle)} />
            ) : null}

            {gameState === State.done ? (
                <div className="doneWrapper">
                    <div className="done">
                        <button
                            className="close"
                            onClick={() => setGameState(State.idle)}
                        >
                            <img src={closeIcon} alt="close icon" />
                        </button>
                        <div className="winners">
                            {sortedTeams[1] !== undefined ? (
                                <div className="team second">
                                    <div className="place">2</div>
                                    <h2
                                        style={{
                                            color: sortedTeams[1].color,
                                        }}
                                    >
                                        {sortedTeams[1].name}
                                    </h2>
                                    <div className="points">
                                        {sortedTeams[1].score}
                                    </div>
                                </div>
                            ) : null}

                            {sortedTeams[0] !== undefined ? (
                                <div className="team first">
                                    <div className="place">1</div>
                                    <h2
                                        style={{
                                            color: sortedTeams[0].color,
                                        }}
                                    >
                                        {sortedTeams[0].name}
                                    </h2>
                                    <div className="points">
                                        {sortedTeams[0].score}
                                    </div>
                                </div>
                            ) : null}

                            {sortedTeams[2] !== undefined ? (
                                <div className="team third">
                                    <div className="place">3</div>
                                    <h2
                                        style={{
                                            color: sortedTeams[2].color,
                                        }}
                                    >
                                        {sortedTeams[2].name}
                                    </h2>
                                    <div className="points">
                                        {sortedTeams[2].score}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className="leaderboard">
                            <table className="leaderboard">
                                <thead>
                                    <tr>
                                        <th>Team</th>
                                        <th>Score</th>
                                        <th>Answered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTeams.map((team, teamIndex) => {
                                        const answeredFields = [
                                            ...gameData.categories.map(
                                                (category) =>
                                                    category.fields.filter(
                                                        (field) =>
                                                            field.answered ===
                                                            team.name
                                                    )
                                            ),
                                        ].flat();

                                        return (
                                            <tr>
                                                <td
                                                    style={{
                                                        color: team.color,
                                                    }}
                                                >
                                                    {team.name}
                                                </td>
                                                <td>{team.score}</td>
                                                <td>
                                                    {answeredFields.length}
                                                    <button
                                                        className="viewAnsweredQuestion"
                                                        onClick={() =>
                                                            confirmAlert({
                                                                title: "Answered Questions",
                                                                childrenElement:
                                                                    () =>
                                                                        answeredFields.map(
                                                                            (
                                                                                field,
                                                                                fieldIndex
                                                                            ) => {
                                                                                return (
                                                                                    <>
                                                                                        <div
                                                                                            key={
                                                                                                fieldIndex
                                                                                            }
                                                                                            className="answeredQuestion"
                                                                                        >
                                                                                            <div className="question">
                                                                                                <ResourceDisplay
                                                                                                    settings={
                                                                                                        settings
                                                                                                    }
                                                                                                    resource={
                                                                                                        field.question
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                            <div className="answer">
                                                                                                <ResourceDisplay
                                                                                                    settings={
                                                                                                        settings
                                                                                                    }
                                                                                                    resource={
                                                                                                        field.answer
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        {fieldIndex !==
                                                                                        answeredFields.length -
                                                                                            1 ? (
                                                                                            <hr />
                                                                                        ) : null}
                                                                                    </>
                                                                                );
                                                                            }
                                                                        ),
                                                                buttons: [
                                                                    {
                                                                        label: "close",
                                                                    },
                                                                ],
                                                                overlayClassName:
                                                                    "answeredQuestions",
                                                                closeOnEscape:
                                                                    true,
                                                                closeOnClickOutside:
                                                                    true,
                                                            })
                                                        }
                                                    >
                                                        <img
                                                            src={eyeIcon}
                                                            alt="view icon"
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="chart">
                            <PieChart
                                data={sortedTeams.map((team) => ({
                                    color: team.color,
                                    value: team.score,
                                    title: team.name,
                                }))}
                            />
                        </div>
                        <button className="closeGame" onClick={endGame}>
                            finish (delete)
                        </button>
                    </div>
                </div>
            ) : null}

            {settingsOpen ? (
                <Settings
                    close={() => setSettingsOpen(false)}
                    onChange={() => {
                        setSettings(getSettings);
                        themeChange();
                    }}
                />
            ) : null}
        </div>
    );
};

const Field = ({
    field,
    points,
    grantPoints,
    selected,
    unselect,
    onClick,
    setGameState,
    containerRef,
    gameState,
    category,
    buzzeredTeamIndex,
    testMode,
    settings,
    theme,
}: {
    field: GameField;
    points: number;
    grantPoints: (points: number) => void;
    selected: boolean;
    unselect: () => void;
    onClick: () => void;
    setGameState: (newState: State) => void;
    containerRef: RefObject<HTMLDivElement>;
    gameState: State;
    category: Category;
    buzzeredTeamIndex: number | null;
    testMode: boolean;
    settings: SettingsType;
    theme: Theme;
}) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const activeTimer = useRef<NodeJS.Timeout | null>(null);

    // animations
    useEffect(() => {
        if (fieldRef.current === null) throw new Error("fieldRef is null");
        if (containerRef.current === null)
            throw new Error("containerRef is null");

        if (selected) goBig();
        else goSmall();
    }, [selected]);

    // trigger answer time timeout
    const [timeUp, setTimeUp] = useState(false);
    useEffect(() => {
        if (
            settings.useAnswerTime &&
            buzzeredTeamIndex !== undefined &&
            gameState === State.showQuestion
        ) {
            const timer = setTimeout(
                () => setTimeUp(true),
                category.answerTime * 1000
            );
            return () => {
                setTimeUp(false);
                clearTimeout(timer);
                console.log("clearTimer");
            };
        }
    }, [buzzeredTeamIndex, gameState]);

    const fieldContainerRef = useRef<HTMLDivElement>(null);

    const goBig = () => {
        if (fieldRef.current === null) throw new Error("fieldRef is null");
        if (containerRef.current === null)
            throw new Error("containerRef is null");

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
    };

    // going small animation
    const goSmall = () => {
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
            if (fieldRef.current) fieldRef.current.style.position = "relative";
        }, 500);
    };

    const close = () => unselect();

    const [showCustomPoints, setShowCustomPoints] = useState(false);
    const [customPoints, setCustomPoints] = useState<number | "">("");

    return (
        <div className="fieldContainer" ref={fieldContainerRef}>
            <div
                className={
                    "field" +
                    (selected ? " selected" : "") +
                    (typeof field.answered === "string" ? " answered" : "") +
                    (field.highlighted ? " highlighted " : "")
                }
                onClick={
                    typeof field.answered !== "string" && !selected
                        ? onClick
                        : undefined
                }
                ref={fieldRef}
                style={{
                    borderColor: selected && timeUp ? "#ff6464" : undefined,
                    boxShadow:
                        selected && timeUp ? "0 0 30px #ff6464" : undefined,
                }}
            >
                <div className="contentContainer">
                    {selected ? (
                        <button className="close" onClick={close}>
                            <img src={closeIcon} alt="close icon" />
                        </button>
                    ) : null}

                    <div className="content">
                        {theme !== "senior" || !field.answered ? (
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
                        ) : (
                            <div className="resource">
                                <ResourceRenderer resource={field.answer} />
                            </div>
                        )}

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
                                    {typeof category.description ===
                                    "string" ? (
                                        category.description
                                    ) : (
                                        <ResourceDisplay
                                            settings={settings}
                                            resource={{
                                                type: "image",
                                                content: category.description,
                                            }}
                                        />
                                    )}
                                    {gameState === State.showDescription &&
                                    settings.descriptionNext === "auto" ? (
                                        <TimeBar time={4000} />
                                    ) : (
                                        <button
                                            className="next"
                                            onClick={() =>
                                                setGameState(State.showQuestion)
                                            }
                                        >
                                            next
                                        </button>
                                    )}
                                </div>

                                {gameState === State.showQuestion ? (
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
                                                settings={settings}
                                                resource={field.question}
                                                stop={
                                                    buzzeredTeamIndex !== null
                                                }
                                            />
                                        )}

                                        <div className="bottom">
                                            {buzzeredTeamIndex !== null &&
                                            settings.useAnswerTime ? (
                                                <TimeBar
                                                    time={
                                                        category.answerTime *
                                                        1000
                                                    }
                                                    reverse
                                                />
                                            ) : null}

                                            <button
                                                className="reveal"
                                                style={{
                                                    opacity:
                                                        buzzeredTeamIndex ===
                                                            null && !testMode
                                                            ? 0
                                                            : 1,
                                                }}
                                                onClick={() =>
                                                    setGameState(
                                                        State.showAnswer
                                                    )
                                                }
                                            >
                                                show Answer
                                            </button>
                                        </div>
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
                                            settings={settings}
                                            resource={field.answer}
                                        />
                                        {buzzeredTeamIndex !== null ? (
                                            <div className="points">
                                                <div className="normal">
                                                    <button
                                                        onClick={() => {
                                                            grantPoints(
                                                                -points
                                                            );
                                                            close();
                                                        }}
                                                    >
                                                        -{points}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setShowCustomPoints(
                                                                (prev) => !prev
                                                            )
                                                        }
                                                    >
                                                        <img
                                                            src={editIcon}
                                                            alt=""
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            grantPoints(points);
                                                            close();
                                                        }}
                                                    >
                                                        {points}
                                                    </button>
                                                </div>

                                                <div
                                                    className={
                                                        "custom" +
                                                        (showCustomPoints
                                                            ? " visible"
                                                            : " hidden")
                                                    }
                                                >
                                                    <button
                                                        onClick={() => {
                                                            grantPoints(
                                                                Math.round(
                                                                    points / 2
                                                                ) * -1
                                                            );
                                                            close();
                                                        }}
                                                    >
                                                        -
                                                        {Math.round(points / 2)}
                                                    </button>
                                                    <input
                                                        type="number"
                                                        placeholder={Math.round(
                                                            points / 3
                                                        ).toString()}
                                                        value={customPoints}
                                                        onChange={(e) =>
                                                            setCustomPoints(
                                                                isNaN(
                                                                    parseInt(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                                    ? ""
                                                                    : parseInt(
                                                                          e
                                                                              .target
                                                                              .value
                                                                      )
                                                            )
                                                        }
                                                        className="custom dontBuzzer"
                                                    />
                                                    <button
                                                        className="submit"
                                                        onClick={() => {
                                                            grantPoints(
                                                                customPoints ||
                                                                    0
                                                            );
                                                            close();
                                                        }}
                                                    >
                                                        <img
                                                            src={checkIcon}
                                                            alt=""
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            grantPoints(
                                                                Math.round(
                                                                    points / 2
                                                                )
                                                            );
                                                            close();
                                                        }}
                                                    >
                                                        {Math.round(points / 2)}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
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

const ResourceDisplay = ({
    resource,
    stop = false,
    settings,
}: {
    resource: Resource;
    stop?: boolean;
    settings: SettingsType;
}) => {
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
                <AudioPlayer
                    file={resource.content}
                    initialVolume={resource.volume}
                    stop={stop}
                    autoplay
                    show
                />
            </div>
        );
    else if (resource.type === "video")
        return (
            <VideoPlayer
                file={resource.content}
                initialVolume={resource.volume}
                stop={stop}
                autoplay
            />
        );
    else if (resource.type === "text")
        return <div className="text">{resource.content}</div>;
    else if (resource.type === "imageCollection")
        return (
            <Diashow
                images={resource.content}
                autoSkip={settings.diashowNext === "auto"}
                stop={stop}
                show
            />
        );

    return <div className="resource">unknown content type?</div>;
};

const Team = ({
    team,
    buzzered,
    setTeam,
    index,
    theme,
    buzzeredTeamIndex,
}: {
    team: TeamType;
    buzzered: boolean;
    setTeam: (newTeam: GameTeam) => void;
    index: number;
    theme: Theme;
    buzzeredTeamIndex: number | null;
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
                },
            ],
            { duration: 600, easing: "ease-in-out", iterations: Infinity }
        );
    }, []);

    // play buzzer sound
    const [sound, setSound] = useState<Audio | null>(null);
    if (theme === "senior") {
        useEffect(() => {
            getThing<Audio>("buzzerSound" + index)
                .then(setSound)
                .catch((error) => {
                    console.log(`No Buzzer sound for Team: ${index}`, error);
                });
        }, []);
    }

    return (
        <div
            className={"team" + (buzzered ? " buzzered" : "")}
            style={{
                borderColor: team.color,
                background:
                    theme === "senior" &&
                    (buzzeredTeamIndex === null || buzzered)
                        ? team.color
                        : undefined,
            }}
            ref={teamRef}
        >
            {buzzered && sound ? (
                <ResourceRenderer
                    style={{
                        display: "none",
                    }}
                    autoplay
                    resource={{
                        type: "audio",
                        content: sound,
                        volume: 70,
                    }}
                />
            ) : null}
            <h2>{team.name === "" ? `Team #${index + 1}` : team.name}</h2>

            <div className="members">
                {team.members.map((memberName, i) => (
                    <div className="member" key={memberName}>
                        {memberName}
                    </div>
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
    );
};

const Intro = ({ start }: { start: () => void }) => {
    const [musicFile, setMusicFile] = useState<File | null>(null);
    useEffect(() => {
        getThing<File>("introMusic")
            .then((file) => setMusicFile(file))
            .catch(() => console.warn("no intro music found"));
    }, []);

    return (
        <div className="intro">
            <h1>Willkommen</h1>
            {musicFile ? (
                <ResourceRenderer
                    resource={{
                        type: "audio",
                        content: musicFile as Audio,
                        volume: 70,
                    }}
                    autoplay
                />
            ) : (
                <code>no intro music provided</code>
            )}
            <button onClick={start}>Start</button>
        </div>
    );
};

export default Game;
