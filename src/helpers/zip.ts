import JSZip from "jszip";
import {
    AnyMedia,
    Audio,
    Category,
    Image,
    MediaType,
    PartialCategory,
    TextRessource,
    Video,
} from "./categoryTypes";

type CategoryConfig = {
    name: string;
    fields: [ConfigField, ConfigField, ConfigField, ConfigField, ConfigField];
};
type ConfigField = {
    question: ConfigRessource;
    answer: ConfigRessource;
};
type ConfigRessource = {
    type: MediaType;
    content: string | FileName;
};

interface FileName extends String {}

export const generateZipFromCategory = async (
    category: Category,
    onUpdate: (data: JSZip.JSZipMetadata) => void
) => {
    const zip = new JSZip();

    const categoryInfo = {
        name: category.name,
        fields: [] as any,
    };

    const media: AnyMedia[] = [];

    category.fields.forEach((field, i) => {
        let questionMediaIndex: null | number = null;
        let answerMediaIndex: null | number = null;

        if (field.question.type !== "text") {
            if (field.question.type === "imageCollection") return; // TODO implement this
            questionMediaIndex = media.length;
            media.push(field.question.content);
        }
        if (field.answer.type !== "text") {
            if (field.answer.type === "imageCollection") return; // TODO implement this
            answerMediaIndex = media.length;
            media.push(field.answer.content);
        }

        categoryInfo.fields.push({
            question: {
                type: field.question.type,
                content:
                    field.question.type === "text"
                        ? field.question.content
                        : questionMediaIndex +
                          "_" +
                          field.question.content.name,
            },
            answer: {
                type: field.answer.type,
                content:
                    field.answer.type === "text"
                        ? field.answer.content
                        : answerMediaIndex + "_" + field.answer.content.name,
            },
        });
        if (field.question.type === "text") return;
    });

    console.log(categoryInfo, media);

    zip.file("info.json", JSON.stringify(categoryInfo));

    const mediaFolder = zip.folder("media");
    if (mediaFolder === null) throw new Error("could not create folder on zip");

    media.forEach((file, index) => {
        mediaFolder.file(`${index}_${file.name}`, file);
    });

    const archive = await zip.generateAsync({ type: "blob" }, onUpdate);

    return archive;
};

export const importCategoryFromZip = (file: File) =>
    new Promise<Category>((resolve, reject) => {
        JSZip.loadAsync(file).then(async (zip) => {
            const configFile = zip.file("info.json");
            if (configFile === null) return reject("config file not found");

            const config = JSON.parse(
                await configFile.async("string")
            ) as CategoryConfig;

            console.log(config);

            const category: PartialCategory = {
                name: config.name,
                fields: [
                    { question: undefined, answer: undefined },
                    { question: undefined, answer: undefined },
                    { question: undefined, answer: undefined },
                    { question: undefined, answer: undefined },
                    { question: undefined, answer: undefined },
                ],
            };

            const proms = config.fields
                .map((configField, index) => [
                    applyMediaFromZipFile(
                        zip,
                        "question",
                        configField,
                        category,
                        index
                    ),
                    applyMediaFromZipFile(
                        zip,
                        "answer",
                        configField,
                        category,
                        index
                    ),
                ])
                .flat();
            await Promise.allSettled(proms);

            resolve(category as Category);
        });
    });

const applyMediaFromZipFile = (
    zip: JSZip,
    fieldType: "question" | "answer",
    configField: ConfigField,
    category: PartialCategory,
    index: number
) =>
    new Promise<void>(async (resolve, reject) => {
        if (configField[fieldType].type === "text")
            category.fields[index][fieldType] = configField[
                fieldType
            ] as TextRessource;
        else {
            const mediaBlob = await zip
                .file(`media/${configField[fieldType].content}`)
                ?.async("blob");
            if (mediaBlob === undefined)
                throw new Error("media blob is undefined");

            const file: AnyMedia = new File(
                [mediaBlob],
                configField[fieldType].content.split(/_(.*)/s)[1],
                {
                    type: mediaBlob.type,
                    lastModified: new Date().getTime(),
                }
            );

            if (configField[fieldType].type === "audio")
                category.fields[index][fieldType] = {
                    type: "audio",
                    content: file as Audio,
                };
            else if (configField[fieldType].type === "image")
                category.fields[index][fieldType] = {
                    type: "image",
                    content: file as Image,
                };
            else if (configField[fieldType].type === "video")
                category.fields[index][fieldType] = {
                    type: "video",
                    content: file as Video,
                };
        }
        resolve();
    });
