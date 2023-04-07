import { Category, Ressource } from "./categoryTypes";

export interface Game {
    teams: GameTeam[];
    categories: GameCategory[];
}

export interface GameCategory {
    name: string;
    fields: [GameField, GameField, GameField, GameField, GameField];
}

export interface GameField {
    answered: false | GameTeam["name"];
    question: Ressource;
    answer: Ressource;
}

export interface GameTeam {
    name: string;
    color: typeof TeamColors[number];
    members: string[];
    score: number;
}

export const TeamColors = [
    "#0f7",
    "#fe5",
    "#fa0",
    "#f32",
    "#f0f",
    "#05f",
    "#0ff",
] as const;
