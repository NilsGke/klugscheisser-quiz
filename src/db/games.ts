import { Game } from "$types/gameTypes";
import { getThing, removeThing, setThing } from "./things";

export const saveGameInDb = (game: Game) => setThing("activeGame", game);

export const getGameFromDb = () => getThing<Game>("activeGame");

export const deleteGameFromDb = () => removeThing("activeGame");
