import { Category, Field } from "./categoryTypes";

export interface Game {
    teams: GameTeam[];
    categories: GameCategory[];
}

export interface GameCategory extends Omit<Category, "fields"> {
    fields: [GameField, GameField, GameField, GameField, GameField];
}

export interface GameField extends Omit<Field, "answered"> {
    answered: false | GameTeam["name"];
}

export interface GameTeam {
    name: string;
    color: typeof TeamColors[number];
    members: string[];
    score: number;
}

export const TeamColors = [
    "#ff6464",
    "#fa0",
    "#fe5",
    "#0f7",
    "#0ff",
    "#05f",
    "#f0f",
] as const;
