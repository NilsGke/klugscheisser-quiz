import HomeButton from "../../components/HomeButton";
import "./Categories.page.scss";
import { Category as CategoryType } from "../../types/categoryTypes";
import CategoryBrowser from "../../components/CategoryBrowser";

const Categories = () => {
    return (
        <div id="categoriesPage">
            <HomeButton />
            <h1>Browse your local categories</h1>
            <CategoryBrowser />
        </div>
    );
};

const Category = ({ data: category }: { data: CategoryType }) => {
    return (
        <div className="category">
            <h2>{category.name}</h2>
        </div>
    );
};

export default Categories;
