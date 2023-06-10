import { countCategories, getStoredCategories } from "$db/categories";
import JSZip from "jszip";
import { generateZipFromCategory } from "./zip";
import { getThing, removeThing, setThing } from "$db/things";
import { Category } from "$types/categoryTypes";
import { Indexed } from "$db/indexeddb";
import downloadFile from "./downloadFile";
import { getSettings } from "./settings";

interface ZippedCategory {
    categoryName: Category["name"];
    dbIndex: Indexed<Category>["dbIndex"];
    file: Blob;
}

const exportAllCategories = (
    update: (info: {
        categoriesDone: number;
        categoriesTotal: number;
        currentPercent: number;
        currentAction: string;
    }) => void
) =>
    new Promise<void>(async (resolve, reject) => {
        const categoriesCount = await countCategories();
        let categoriesDone = 0;

        const { maxExportSize } = getSettings();

        let i = 100;
        let run = true;

        const categories = await getStoredCategories(Infinity, Infinity);

        const zippedNames: string[] = [];

        for (const category of categories)
            await generateZipFromCategory(category, (updateInfo) => {
                update({
                    currentAction: "converting file: " + updateInfo.currentFile,
                    currentPercent: updateInfo.percent,
                    categoriesDone: categoriesDone,
                    categoriesTotal: categoriesCount,
                });
            })
                .then(async (file) => {
                    const name = `zippedCategory#${category.dbIndex}`;
                    await setThing<ZippedCategory>(name, {
                        file,
                        categoryName: category.name,
                        dbIndex: category.dbIndex,
                    });
                    zippedNames.push(name);
                    categoriesDone++;
                })
                .catch((error) => {
                    console.error(error);
                    run = false;
                });

        update({
            currentAction: "constructing zip file",
            currentPercent: 0,
            categoriesDone: 0,
            categoriesTotal: 1,
        });

        let zip = new JSZip();
        let count = 1;
        let size = 0;

        const generate = (zip: JSZip) =>
            zip
                .generateAsync({ type: "blob" }, (info) =>
                    update({
                        currentAction:
                            `packing zip file (${count}): ` + info.currentFile,
                        currentPercent: info.percent,
                        categoriesDone: categoriesDone,
                        categoriesTotal: categoriesCount,
                    })
                )
                .then((file) =>
                    downloadFile(
                        file,
                        `backup_${new Date().toLocaleDateString(
                            navigator.language,
                            {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                            }
                        )}_${count}.ksq.zip`
                    )
                );

        for (let i = 0; i < zippedNames.length; i++) {
            update({
                currentAction: `constructing zip file (category: #${i}`,
                currentPercent: i % 2 === 0 ? 0 : 100, // only for looks, this happens fast so no point in doing it for real
                categoriesDone: i,
                categoriesTotal: zippedNames.length,
            });
            const name = zippedNames[i];
            console.log(name);
            const zipped = await getThing<ZippedCategory>(name);

            size += zipped.file.size;
            console.log({ size, adding: zipped.file.size, maxExportSize });

            if (size >= maxExportSize) {
                await generate(zip);
                count++;
                size = zipped.file.size;
                zip = new JSZip();
            }

            zip.file(
                `${zipped.categoryName}_${zipped.dbIndex}.ksq.zip`,
                zipped.file
            );
            await removeThing(name);
        }

        generate(zip).then(resolve);
    });

export default exportAllCategories;
