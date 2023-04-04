import { FC, useEffect, useRef, useState, useCallback } from "react";
import "./Setup.scss";
import { Game, GameCategory, TeamColors } from "../../../types/gameTypes";
import autoAnimate from "@formkit/auto-animate";
import { importCategoryFromZip } from "../../../helpers/zip";
import { Category } from "../../../types/categoryTypes";
import AudioPlayer from "../../../components/AudioPlayer";
import VideoPlayer from "../../../components/VideoPlayer";
import Spinner from "../../../components/Spinner";
import useKeyboard from "../../../hooks/keyboard";
// assets
import add from "../../../assets/add.svg";
import addGroup from "../../../assets/addGroup.svg";
import trashIcon from "../../../assets/trash.svg";
import remove from "../../../assets/remove.svg";
import colorPaletteIcon from "../../../assets/colorPalette.svg";
import useClick from "../../../hooks/useClick";

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
        console.log("finished building game", { teams, categories });
    };

    return (
        <div className="setupPage">
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
                parseInt(key) === teamIndex + 1 &&
                memberList.current.parentElement
            )
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
                            boxShadow:
                                "inset 0 0 0 transparent, 0 0 0 transparent",
                            border: "1px solid unset",
                        },
                    ],
                    { duration: 1000, easing: "ease-out" }
                );
        },
        [memberList]
    );

    useKeyboard(keyCallback);

    const [showColors, setShowColors] = useState(false);
    useClick(() => setShowColors(false));

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
                            ></button>
                        ))}
                    </div>
                </div>
                <button
                    className="colorInput"
                    onClick={() => setShowColors((prev) => !prev)}
                >
                    <img src={colorPaletteIcon} alt="color palette" />
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
    const [file, setFile] = useState<File | null>(null);
    const addCategory = useCallback(
        (category: Category) => {
            const gameCategory = {
                ...category,
                fields: category.fields.map((field) => ({
                    ...field,
                    answered: false,
                })),
            } as GameCategory;
            const newCategories = categories.slice();
            newCategories.push(gameCategory);
            setCategories(newCategories);
        },
        [categories]
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (file === null) return;
        importCategoryFromZip(file).then((category) => {
            addCategory(category);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.files = null;
        });
    }, [file]);

    const categoryListRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (categoryListRef.current) autoAnimate(categoryListRef.current);
    }, [categoryListRef]);

    return (
        <div className="categorySelector">
            <button className="previous" onClick={previous}>
                &lt;- Teams
            </button>
            <h2>select categories</h2>
            <div className="categoriesWrapper" ref={categoryListRef}>
                {categories.map((category, categoryIndex) => (
                    <div
                        className="category"
                        key={category.name + categoryIndex}
                    >
                        <div className="head">
                            <h3>{category.name}</h3>

                            <button
                                className="remove"
                                onClick={() => {
                                    const newCategories = categories.slice();
                                    newCategories.splice(categoryIndex, 1);
                                    setCategories(newCategories);
                                }}
                            >
                                <img src={trashIcon} alt="trash can" />
                            </button>
                        </div>
                        <div className="fields">
                            {category.fields.map((field, index) => (
                                <div className="field" key={index}>
                                    {(() => {
                                        if (field.question.type === "text")
                                            return (
                                                <div className="text">
                                                    {field.question.content}
                                                </div>
                                            );
                                        else if (
                                            field.question.type === "image"
                                        ) {
                                            const url = URL.createObjectURL(
                                                field.question.content
                                            );
                                            return (
                                                <div className="image">
                                                    <img src={url} alt="" />
                                                </div>
                                            );
                                        } else if (
                                            field.question.type === "audio"
                                        )
                                            return (
                                                <div className="image">
                                                    <AudioPlayer
                                                        file={
                                                            field.question
                                                                .content
                                                        }
                                                    />
                                                </div>
                                            );
                                        else if (
                                            field.question.type === "video"
                                        )
                                            return (
                                                <VideoPlayer
                                                    file={
                                                        field.question.content
                                                    }
                                                />
                                            );
                                    })()}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="category add">
                    {(fileInputRef.current?.files || []).length >= 1 ? (
                        <Spinner />
                    ) : (
                        <img src={add} alt="add icon" />
                    )}
                    <input
                        type="file"
                        name="category zip input"
                        id="fileInput"
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files === null || files.length === 0) return;
                            setFile(files[0]);
                        }}
                    />
                </div>
            </div>
            <button className="done" onClick={finish}>
                Done! -&gt;
            </button>
        </div>
    );
};

export default Setup;
