import { useState } from "react";
// styles
import "./Game.page.scss";
import { Game } from "../../types/gameTypes";
import Setup from "./setup/Setup";

const Game = () => {
    const [gameData, setGameData] = useState<Game | null>(null);

    return (
        <div className="gamePage">
            {gameData === null ? (
                <Setup
                    setGameData={(gameData: Game) => setGameData(gameData)}
                />
            ) : (
                <>
                    <h1>game</h1>
                </>
            )}
        </div>
    );
};

export default Game;
