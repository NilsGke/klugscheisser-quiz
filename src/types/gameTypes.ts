import { Category, Ressource } from "./categoryTypes";

export interface Game {
    teams: Team[];
    categories: Category[];
}

export interface GameCategory {
    name: string;
    fields: [GameField, GameField, GameField, GameField, GameField];
}

export interface GameField {
    answered: false | Team["name"];
    question: Ressource;
    answer: Ressource;
}

interface Team {
    name: string;
    color: string;
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
