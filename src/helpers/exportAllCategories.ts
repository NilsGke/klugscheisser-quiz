import { countCategories, getStoredCategories } from "$db/categories";
import JSZip from "jszip";
import { generateZipFromCategory } from "./zip";

const exportAllCategories = (
    update: (info: {
        categoriesDone: number;
        categoriesTotal: number;
        currentPercent: number;
        currentAction: string;
    }) => void
) =>
    new Promise<Blob>(async (resolve, reject) => {
        const zip = new JSZip();

        const categoriesCount = await countCategories();
        let categoriesDone = 0;

        let i = 100;
        let run = true;

        const categories = await getStoredCategories(Infinity, Infinity);

        for (const category of categories)
            await generateZipFromCategory(category, (updateInfo) => {
                update({
                    currentAction: "converting file: " + updateInfo.currentFile,
                    currentPercent: updateInfo.percent,
                    categoriesDone: categoriesDone,
                    categoriesTotal: categoriesCount,
                });
            })
                .then((file) => {
                    zip.file(
                        `${category.name}_${category.dbIndex}.ksq.zip`,
                        file
                    );
                    categoriesDone++;
                })
                .catch((error) => {
                    console.error(error);
                    run = false;
                });

        zip.generateAsync({ type: "blob" }, (info) =>
            update({
                currentAction: "packing category: " + info.currentFile,
                currentPercent: info.percent,
                categoriesDone: categoriesDone,
                categoriesTotal: categoriesCount,
            })
        ).then(resolve);
    });

export default exportAllCategories;
