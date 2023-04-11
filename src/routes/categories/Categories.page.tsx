import HomeButton from "../../components/HomeButton";
import "./Categories.page.scss";
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

export default Categories;
