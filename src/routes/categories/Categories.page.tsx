import { FC, useCallback, useEffect, useRef, useState } from "react";
import { UserData } from "../../firebase/firestore/user";
import Header from "../../components/Header";
import HomeButton from "../../components/HomeButton";
import { Category, searchCategories } from "../../firebase/firestore/category";
import "./Categories.page.scss";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import Spinner from "../../components/Spinner";
import DotSpinner from "../../components/DotSpinner";

export enum CategoriesPagePurpose {
    VIEW_CATEGORIES,
    SELECT_CATEGORIES,
}

type props = {
    userData: UserData | null;
    defaultPurpose: CategoriesPagePurpose;
};

const Categories: FC<props> = ({ userData, defaultPurpose }) => {
    const [purpose, setPurpose] =
        useState<CategoriesPagePurpose>(defaultPurpose);

    // #region search
    const [lastDoc, setLastDoc] = useState<
        QueryDocumentSnapshot<Category> | undefined
    >(undefined);

    const [searchTerm, setSearchTerm] = useState("");

    const search = useCallback(async () => {
        setGotAllCategories(false);
        const { categories: newCategories, lastDoc: newLastDoc } =
            await searchCategories(searchTerm, undefined);

        setLastDoc(newLastDoc);
        setResults(newCategories);
    }, [searchTerm]);

    const [loadMore, setLoadMore] = useState(false);

    const [gotAllCategories, setGotAllCategories] = useState(false);
    useEffect(() => {
        if (!loadMore) return;
        if (lastDoc === undefined) {
            setGotAllCategories(true);
            return;
        }

        (async () => {
            const { categories: newCategories, lastDoc: newLastDoc } =
                await searchCategories(searchTerm, lastDoc);

            if (lastDoc !== undefined) setLastDoc(newLastDoc);
            setResults((prev) => [...prev, ...newCategories]);
            setLoadMore(false);
        })();
    }, [loadMore]);

    const [results, setResults] = useState<Category[]>([]);

    // #endregion

    const bottomRef = useRef<HTMLDivElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollHandler = (e: Event) => {
            if (bottomRef.current === null || resultsRef.current === null)
                return;

            const containerRect = resultsRef.current.getBoundingClientRect();
            const bottomRect = bottomRef.current.getBoundingClientRect();

            if (containerRect.bottom >= bottomRect.top - 50) setLoadMore(true);
        };

        if (bottomRef.current && resultsRef.current)
            resultsRef.current.addEventListener("scroll", scrollHandler);

        return () => {
            if (resultsRef.current)
                resultsRef.current.removeEventListener("scroll", scrollHandler);
        };
    }, [bottomRef, resultsRef, results]);

    console.log(lastDoc);

    return (
        <div id="categoriesPage">
            <Header userData={userData} />
            <HomeButton />
            <h1>
                {purpose === CategoriesPagePurpose.VIEW_CATEGORIES
                    ? "Browse Categories"
                    : "Select your Categories"}
            </h1>
            <div className="browser">
                <div className="searchForm">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="textInput">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setResults([]);
                                    setLastDoc(undefined);
                                    setSearchTerm(e.target.value);
                                    setGotAllCategories(false);
                                    search();
                                }}
                            />
                            <button onClick={search}>search</button>
                        </div>
                        <div className="filters"></div>
                    </form>
                </div>
                <div className="resultsContainer" ref={resultsRef}>
                    <div className="results">
                        {results.length === 0 ? (
                            <button className="showAll">show all</button>
                        ) : (
                            <>
                                {results.map((category) => (
                                    <Category
                                        key={category.id}
                                        data={category}
                                    />
                                ))}
                                {!gotAllCategories ? (
                                    <div ref={bottomRef}>
                                        <DotSpinner />
                                    </div>
                                ) : (
                                    "Thats it 😊"
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Category = ({ data: category }: { data: Category }) => {
    return (
        <div className="category">
            <h2>{category.name}</h2>
        </div>
    );
};

export default Categories;
