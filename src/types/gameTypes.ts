import { Indexed } from "../helpers/indexeddb";
import { Category, Field } from "./categoryTypes";

export interface Game {
    teams: GameTeam[];
    categories: GameCategory[];
}

export interface GameCategory extends Omit<Indexed<Category>, "fields"> {
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

export const categoryToGameCategory = (
    category: Indexed<Category>
): GameCategory => {
    const gameCategory: GameCategory = {
        ...category,
        fields: [
            { ...category.fields[0], answered: false },
            { ...category.fields[1], answered: false },
            { ...category.fields[2], answered: false },
            { ...category.fields[3], answered: false },
            { ...category.fields[4], answered: false },
        ],
    };

    return gameCategory;
};
