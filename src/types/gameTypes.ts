import { CategoryNew, FieldNew } from "filesystem/categories";

export interface Game {
  teams: GameTeam[];
  categories: GameCategory[];
}

export interface GameCategory extends Omit<CategoryNew, "fields"> {
  fields: GameFieldNew[];
}
export interface GameFieldNew extends FieldNew {
  answered: false | string;
  highlighted: boolean;
}

export interface GameTeam {
  name: string;
  color: (typeof TeamColors)[number];
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

export const categoryToGameCategory = (category: CategoryNew): GameCategory => {
  const gameCategory: GameCategory = {
    ...category,
    fields: category.fields.map((field) => ({
      ...field,
      answered: false,
      highlighted: false,
    })),
  };

  return gameCategory;
};
