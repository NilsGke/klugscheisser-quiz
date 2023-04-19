import { FC, useEffect, useRef, useState, useCallback } from "react";
import { Game, TeamColors, categoryToGameCategory } from "$types/gameTypes";
import autoAnimate from "@formkit/auto-animate";
import { Category } from "$types/categoryTypes";
import useKeyboard from "$hooks/keyboard";
import toast from "react-simple-toasts";
import useClick from "$hooks/useClick";
import { Indexed } from "$db/indexeddb";
import { categoryIsDeleted } from "$types/boardTypes";

// components
import HomeButton from "$components/HomeButton";
import CategoryBrowser from "$components/CategoryBrowser";
import BoardBrowser from "$components/BoardBrowser";

// assets
import add from "$assets/add.svg";
import addGroup from "$assets/addGroup.svg";
import trashIcon from "$assets/trash.svg";
import remove from "$assets/remove.svg";
import colorPaletteIcon from "$assets/colorPalette.svg";
import closeIcon from "$assets/close.svg";

// styles
import "./Setup.scss";

enum Step {
    CREATE_TEAMS,
    SELECT_CATEGORIES,
}

type props = {
    setGameData: (gameData: Game) => void;
};

const Setup: FC<props> = ({ setGameData }) => {
    const [step, setStep] = useState<Step>(Step.CREATE_TEAMS);
    const [teams, setTeams] = useState<Game["teams"]>([]);
    const [categories, setCategories] = useState<Game["categories"]>([]);

    const finish = () => {
        if (teams.length === 0) return toast("please create at least one team");
        if (categories.length === 0)
            return toast("please add at least one category");
        console.log("finished building game", { teams, categories });
        setGameData({
            categories,
            teams,
        });
    };

    return (
        <div className="setupPage">
            <HomeButton />
            {step === Step.CREATE_TEAMS ? (
                <CreateTeams
                    teams={teams}
                    setTeams={(newTeams) => setTeams(newTeams)}
                    next={() => setStep(Step.SELECT_CATEGORIES)}
                />
            ) : (
                <SelectCategories
                    previous={() => setStep(Step.CREATE_TEAMS)}
                    finish={finish}
                    categories={categories}
                    setCategories={(newCategories) =>
                        setCategories(newCategories)
                    }
                />
            )}
        </div>
    );
};

const CreateTeams = ({
    teams,
    setTeams,
    next,
}: {
    teams: Game["teams"];
    setTeams: (newTeams: Game["teams"]) => void;
    next: () => void;
}) => {
    const teamsList = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (teamsList.current) autoAnimate(teamsList.current);
    }, []);

    useEffect(() => {
        setTeams([
            {
                color: TeamColors[0],
                members: [],
                name: "",
                score: 0,
            },
            {
                color: TeamColors[1],
                members: [],
                name: "",
                score: 0,
            },
        ]);
    }, []);

    return (
        <div className="createTeams">
            <h2>Create Teams</h2>

            <div className="teams" ref={teamsList}>
                {teams.map((team, teamIndex) => (
                    <Team
                        key={teamIndex}
                        teams={teams}
                        setTeams={setTeams}
                        teamIndex={teamIndex}
                    />
                ))}
                <button
                    className="team add"
                    onClick={() =>
                        setTeams([
                            ...teams,
                            {
                                name: "",
                                members: [],
                                score: 0,
                                color: TeamColors.filter(
                                    (color) =>
                                        !teams
                                            .map((t) => t.color)
                                            .includes(color)
                                )[0],
                            },
                        ])
                    }
                >
                    <img src={addGroup} alt="" />
                </button>
            </div>

            <button className="next" onClick={next}>
                categories -&gt;
            </button>
        </div>
    );
};
const Team = ({
    teams,
    setTeams,
    teamIndex,
}: {
    teams: Game["teams"];
    setTeams: (teams: Game["teams"]) => void;
    teamIndex: number;
}) => {
    const memberList = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (memberList.current) autoAnimate(memberList.current);
    }, [memberList]);

    // keyboard event listeners
    const keyCallback = useCallback(
        (key: string) => {
            if (memberList.current === null) return;
            if (
                parseInt(key) !== teamIndex + 1 ||
                memberList.current.parentElement === null
            )
                return;

            memberList.current.parentElement.animate(
                [
                    {
                        boxShadow: `
                                 inset 0 0 10px 0px ${team.color},
                                 0 0 80px 10px ${team.color}
                            `,
                        border: `1px solid ${team.color}`,
                    },
                    {
                        boxShadow: "inset 0 0 0 transparent, 0 0 0 transparent",
                    },
                ],
                { duration: 1500, easing: "ease-out" }
            );
        },
        [memberList]
    );

    useKeyboard(keyCallback);

    const [showColors, setShowColors] = useState(false);
    useClick((e) => {
        if (e.target === null) throw new Error("event target is null");
        if (
            !Array.from((e.target as HTMLElement).classList).includes(
                "dontCloseOnClick"
            )
        )
            setShowColors(false);
        console.log({ a: e.target });
    });

    const team = teams[teamIndex];

    const avalibleColors = TeamColors.filter(
        (c) => !teams.map((t) => t.color).includes(c)
    );

    return (
        <div className="team">
            <div className="head">
                <div
                    className={
                        "colorsContainer" +
                        (showColors ? " visible " : " hidden ")
                    }
                >
                    <div
                        className="colors"
                        style={{
                            top:
                                -1 * avalibleColors.length * 30 +
                                (avalibleColors.length - 1) * 5 -
                                10,
                        }}
                    >
                        {avalibleColors.map((color) => (
                            <button
                                className="color"
                                style={{ background: color }}
                                onClick={() => {
                                    const newTeams = teams.slice();
                                    newTeams[teamIndex].color = color;
                                    setTeams(newTeams);
                                    setShowColors(false);
                                    console.log("setShowColors");
                                }}
                                tabIndex={showColors ? 0 : -1}
                            ></button>
                        ))}
                    </div>
                </div>
                <button
                    className="colorInput dontCloseOnClick"
                    onClick={() => setShowColors((prev) => !prev)}
                >
                    <img
                        src={colorPaletteIcon}
                        className="dontCloseOnClick"
                        alt="color palette "
                    />
                </button>

                <input
                    type="text"
                    className="teamName"
                    placeholder="Team-Name"
                    value={team.name}
                    onChange={(e) => {
                        const newTeams = teams.slice();
                        newTeams[teamIndex].name = e.target.value;
                        setTeams(newTeams);
                    }}
                    style={{
                        borderBottomColor: team.color,
                    }}
                />
                <button
                    className="remove"
                    onClick={() => {
                        const newTeams = teams.slice();
                        newTeams.splice(teamIndex, 1);
                        console.log(newTeams, teamIndex);
                        setTeams(newTeams);
                    }}
                >
                    <img src={trashIcon} alt="" />
                </button>
            </div>
            <div className="members" ref={memberList}>
                {team.members.map((name, memberIndex) => (
                    <div className="member" key={memberIndex}>
                        <input
                            type="text"
                            className="userName"
                            placeholder="user name"
                            value={name}
                            onChange={(e) => {
                                const newTeams = teams.slice();
                                newTeams[teamIndex].members[memberIndex] =
                                    e.target.value;
                                setTeams(newTeams);
                            }}
                        />
                        <button
                            className="remove"
                            onClick={() => {
                                const newTeams = teams.slice();
                                newTeams[teamIndex].members.splice(
                                    memberIndex,
                                    1
                                );
                                setTeams(newTeams);
                            }}
                        >
                            <img src={remove} alt="remove icon" />
                        </button>
                    </div>
                ))}
                <button
                    className="member add"
                    onClick={() => {
                        const newTeams = teams.slice();
                        newTeams[teamIndex].members.push("");
                        setTeams(newTeams);
                    }}
                >
                    <img src={add} alt="add user" />
                </button>
            </div>
        </div>
    );
};

const SelectCategories = ({
    previous,
    finish,
    categories,
    setCategories,
}: {
    previous: () => void;
    finish: () => void;
    categories: Game["categories"];
    setCategories: (categories: Game["categories"]) => void;
}) => {
    const [loadBoardOpen, setLoadBoardOpen] = useState(false);
    const [selected, setSelected] = useState<Indexed<Category>[]>([]);

    useEffect(() => {
        setCategories(selected.map(categoryToGameCategory));
    }, [selected]);

    console.log(selected);

    return (
        <>
            <div className="categorySelector">
                <button className="previous" onClick={previous}>
                    &lt;- Teams
                </button>
                <button
                    onClick={() => setLoadBoardOpen(true)}
                    className={"openBoards"}
                >
                    select board
                </button>
                <h2>select categories</h2>
                <div className="container">
                    <CategoryBrowser
                        selecting
                        setSelected={(categories) => setSelected(categories)}
                        selected={selected}
                    />
                </div>

                <button className="done" onClick={finish}>
                    Done! -&gt;
                </button>
            </div>
            <div
                className={
                    "selectBoardWrapper" + (loadBoardOpen ? " visible" : "")
                }
            >
                <div className="selectBoard">
                    <button
                        className="close"
                        onClick={() => setLoadBoardOpen(false)}
                    >
                        <img src={closeIcon} alt="" />
                    </button>
                    <BoardBrowser
                        select={(board) => {
                            const categories = board.categories.filter(
                                (c) => !categoryIsDeleted(c)
                            ) as Indexed<Category>[];
                            console.log(categories);

                            setSelected([...selected, ...categories]);
                            setLoadBoardOpen(false);
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default Setup;
