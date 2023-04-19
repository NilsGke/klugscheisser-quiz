import { Indexed } from "../db/indexeddb";
import { Category } from "./categoryTypes";

export type DeletedCategory = {
    dbIndex: number;
    deleted: true;
};

export const categoryIsDeleted = (
    category: DeletedCategory | Category
): category is DeletedCategory => category.hasOwnProperty("deleted");

export interface Board {
    name: string;
    categories: (Indexed<Category> | DeletedCategory)[];
}

export interface StoredBoard extends Omit<Board, "categories"> {
    categoryIndexes: Indexed<Category>["dbIndex"][];
}
