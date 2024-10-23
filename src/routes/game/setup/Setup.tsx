import { FC, useEffect, useRef, useState, useCallback } from "react";
import { Game, TeamColors, categoryToGameCategory } from "$types/gameTypes";
import autoAnimate from "@formkit/auto-animate";
import { Category } from "$types/categoryTypes";
import useKeyboard from "$hooks/keyboard";
import { toast } from "react-toastify";
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
import ResourceRenderer from "$components/ResourceRenderer";

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

    teams.forEach((team, index) =>
      team.name.trim() === "" ? (team.name = `Team #${index + 1}`) : null,
    );

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
          setCategories={(newCategories) => setCategories(newCategories)}
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
                  (color) => !teams.map((t) => t.color).includes(color),
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
                                 inset 0 0 20px 0px ${team.color},
                                 0 0 150px 40px ${team.color}
                            `,
          },
          {
            boxShadow: "inset 0 0 0 transparent, 0 0 0 transparent",
          },
        ],
        { duration: 1500, easing: "ease-out" },
      );
    },
    [memberList],
  );

  useKeyboard(keyCallback);

  const [showColors, setShowColors] = useState(false);
  useClick((e) => {
    if (e.target === null) throw new Error("event target is null");
    if (
      !Array.from((e.target as HTMLElement).classList).includes(
        "dontCloseOnClick",
      )
    )
      setShowColors(false);
  });

  const team = teams[teamIndex];

  const avalibleColors = TeamColors.filter(
    (c) => !teams.map((t) => t.color).includes(c),
  );

  return (
    <div
      className="team"
      style={{
        borderColor: team.color,
      }}
    >
      <div className="head">
        <div
          className={
            "colorsContainer" + (showColors ? " visible " : " hidden ")
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
                newTeams[teamIndex].members[memberIndex] = e.target.value;
                setTeams(newTeams);
              }}
            />
            <button
              className="remove"
              onClick={() => {
                const newTeams = teams.slice();
                newTeams[teamIndex].members.splice(memberIndex, 1);
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

  // highlight fields
  const [highlightFieldsOpen, setHighlightFieldsOpen] = useState(false);

  return (
    <>
      <div className="categorySelector">
        <button className="previous" onClick={previous}>
          &lt;- Teams
        </button>
        <button onClick={() => setLoadBoardOpen(true)} className={"openBoards"}>
          select board
        </button>

        <button
          className="highlightFields"
          onClick={() => setHighlightFieldsOpen(true)}
        >
          highlight fields
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
      <div className={"selectBoardWrapper" + (loadBoardOpen ? " visible" : "")}>
        <div className="selectBoard">
          <button className="close" onClick={() => setLoadBoardOpen(false)}>
            <img src={closeIcon} alt="" />
          </button>
          <BoardBrowser
            select={(board) => {
              const categories = board.categories.filter(
                (c) => !categoryIsDeleted(c),
              ) as Indexed<Category>[];

              setSelected((prev) => [
                ...prev,
                ...categories.filter((category) => !prev.includes(category)),
              ]);
              setLoadBoardOpen(false);
            }}
          />
        </div>
      </div>
      {highlightFieldsOpen ? (
        <div className="highlightFieldsWrapper">
          <div className="highlightFields">
            <button
              className="close"
              onClick={() => setHighlightFieldsOpen(false)}
            >
              <img src={closeIcon} alt="close" />
            </button>
            <div
              className="categories"
              style={{
                justifyContent: selected.length === 0 ? "center" : undefined,
              }}
            >
              {selected.map((category, categoryIndex) => (
                <div className="category" key={category.dbIndex}>
                  <h3>{category.name}</h3>
                  {category.fields.map((field, fieldIndex) => (
                    <div className="field" key={fieldIndex}>
                      <ResourceRenderer resource={field.question} small />
                      <button
                        className={
                          "overlay" + (field.highlighted ? " highlighted" : "")
                        }
                        onClick={() => {
                          const categories = selected.slice();

                          categories[categoryIndex].fields[
                            fieldIndex
                          ].highlighted = !(
                            categories[categoryIndex].fields[fieldIndex]
                              .highlighted ?? false
                          );

                          setSelected(categories);
                        }}
                      ></button>
                    </div>
                  ))}
                </div>
              ))}
              {selected.length === 0 ? "no category selected!" : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Setup;
