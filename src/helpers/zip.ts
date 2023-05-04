import JSZip from "jszip";
import {
    AnyMedia,
    Audio,
    Category,
    Image,
    MediaType,
    PartialCategory,
    TextResource,
    Video,
} from "$types/categoryTypes";

interface CategoryConfig extends Omit<Category, "fields" | "description"> {
    description:
        | {
              type: "text";
              content: string;
          }
        | {
              type: "image";
              content: FileName;
          };
    fields: [ConfigField, ConfigField, ConfigField, ConfigField, ConfigField];
}
type ConfigField = {
    question: ConfigResource;
    answer: ConfigResource;
};
type ConfigResource = {
    type: MediaType;
    volume?: number;
    content: string | FileName | FileName[];
};

interface FileName extends String {}

export const generateZipFromCategory = async (
    category: Category,
    onUpdate: (data: JSZip.JSZipMetadata) => void
) => {
    const zip = new JSZip();

    const categoryInfo: CategoryConfig = {
        name: category.name,
        description:
            typeof category.description === "string"
                ? { type: "text", content: category.description }
                : {
                      type: "image",
                      content: "0" + "_" + category.description.name,
                  },
        answerTime: category.answerTime,
        fields: [] as any,
    };

    const media: AnyMedia[] = [];

    if (typeof category.description !== "string")
        media.push(category.description);

    let questionContent: ConfigResource["content"];
    let answerContent: ConfigResource["content"];

    category.fields.forEach((field, i) => {
        //#region question

        if (field.question.type === "text") {
            questionContent = field.question.content;
        } else if (field.question.type === "imageCollection") {
            const names: FileName[] = [];
            field.question.content.forEach((image) => {
                names.push(media.length + "_" + image.name);
                media.push(image);
            });
            questionContent = names;
        } else {
            questionContent = media.length + "_" + field.question.content.name;
            media.push(field.question.content);
        }

        const question: ConfigResource = {
            type: field.question.type,
            content: questionContent,
        };

        if (field.question.type === "audio" || field.question.type === "video")
            question.volume = field.question.volume;

        //#endregion question

        //#region answer

        if (field.answer.type === "text") {
            answerContent = field.answer.content;
        } else if (field.answer.type === "imageCollection") {
            const names: FileName[] = [];
            field.answer.content.forEach((image) => {
                names.push(media.length + "_" + image.name);
                media.push(image);
            });
            answerContent = names;
        } else {
            answerContent = media.length + "_" + field.answer.content.name;
            media.push(field.answer.content);
        }

        const answer: ConfigResource = {
            type: field.answer.type,
            content: answerContent,
        };

        if (field.answer.type === "audio" || field.answer.type === "video")
            answer.volume = field.answer.volume;

        //#endregion answer

        categoryInfo.fields.push({
            question,
            answer,
        });
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

            let description: PartialCategory["description"];
            if (config.description.type === "text") {
                description = config.description.content;
            } else {
                console.log(zip.file(`media/${config.description.content}`));
                const mediaBlob = await zip
                    .file(`media/${config.description.content}`)
                    ?.async("blob");
                if (mediaBlob === undefined)
                    throw new Error("media blob is undefined");

                description = new File(
                    [mediaBlob],
                    config.description.content.split(/_(.*)/s)[1],
                    {
                        type: mediaBlob.type,
                        lastModified: new Date().getTime(),
                    }
                );
            }

            const category: PartialCategory = {
                name: config.name,
                description,
                answerTime: config.answerTime,
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
                        configField["question"],
                        category,
                        index
                    ),
                    applyMediaFromZipFile(
                        zip,
                        "answer",
                        configField["answer"],
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
    configResource: ConfigResource,
    category: PartialCategory,
    fieldIndex: number
) =>
    new Promise<void>(async (resolve, reject) => {
        if (configResource.type === "text")
            category.fields[fieldIndex][fieldType] =
                configResource as TextResource;
        else {
            // image collection
            if (
                configResource.type === "imageCollection" &&
                Array.isArray(configResource.content)
            ) {
                category.fields[fieldIndex][fieldType] = {
                    type: "imageCollection",
                    content: [],
                };
                await Promise.all(
                    configResource.content.map(async (fileName) => {
                        const mediaBlob = await zip
                            .file(`media/${fileName}`)
                            ?.async("blob");
                        if (mediaBlob === undefined)
                            throw new Error("media blob is undefined");

                        const file: AnyMedia = new File(
                            [mediaBlob],
                            fileName.split(/_(.*)/s)[1],
                            {
                                type: mediaBlob.type,
                                lastModified: new Date().getTime(),
                            }
                        );

                        (
                            category.fields[fieldIndex][fieldType]
                                ?.content as Image[]
                        ).push(file as Image);
                    })
                );

                // every other media type (image, audio, video)
            } else if (!Array.isArray(configResource.content)) {
                const mediaBlob = await zip
                    .file(`media/${configResource.content}`)
                    ?.async("blob");
                if (mediaBlob === undefined)
                    throw new Error("media blob is undefined");

                const file: AnyMedia = new File(
                    [mediaBlob],
                    configResource.content.split(/_(.*)/s)[1],
                    {
                        type: mediaBlob.type,
                        lastModified: new Date().getTime(),
                    }
                );

                if (configResource.type === "audio")
                    category.fields[fieldIndex][fieldType] = {
                        type: "audio",
                        volume: configResource.volume || 50,
                        content: file as Audio,
                    };
                else if (configResource.type === "image")
                    category.fields[fieldIndex][fieldType] = {
                        type: "image",
                        content: file as Image,
                    };
                else if (configResource.type === "video")
                    category.fields[fieldIndex][fieldType] = {
                        type: "video",
                        volume: configResource.volume || 50,

                        content: file as Video,
                    };
            }
        }
        resolve();
    });
