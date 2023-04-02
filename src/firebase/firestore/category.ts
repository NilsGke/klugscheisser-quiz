import {
    CollectionReference,
    QueryConstraint,
    QueryDocumentSnapshot,
    collection,
    getDocs,
    limit,
    query,
    startAfter,
    where,
} from "firebase/firestore";
import db from "./firestore";
import { Category } from "../../helpers/categoryTypes";

export const searchCategories = async (
    searchTerm: string,
    lastDoc: QueryDocumentSnapshot<Category> | undefined
) => {
    const constrains: QueryConstraint[] = [
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + "~"),
    ];
    if (lastDoc !== undefined) constrains.push(startAfter(lastDoc));

    const q = query<Category>(
        collection(db, "categories") as CollectionReference<Category>,
        ...constrains,
        limit(5)
    );

    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({ ...data, id: doc.id } as Category);
    });

    return { categories, lastDoc: querySnapshot.docs.at(-1) };
};
