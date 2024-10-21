import DeepPartial from "$types/deepPartial";
import { z } from "zod";

export enum SortingMethod {
    creationDate = "creationDate",
    abcNormal = "abcNormal",
    abcReverse = "abcReverse",
}

type Category = {
    name: string;
    dirHandle: FileSystemDirectoryHandle;
    mediaDirHandle: FileSystemDirectoryHandle;
    info: {
        infoHandle: FileSystemFileHandle;
        description: Image | string;
        thumbnail: Image | null;
        answerTime: number;
    };
    fields: { question: Ressource[]; answer: Ressource[] }[];
};

type Ressource =
    | { type: "text"; content: string }
    | Image
    | ImageCollection
    | Video
    | Audio;

interface Media {
    type: string;
}

interface Image extends Media {
    type: "image";
    handle: FileSystemFileHandle;
}
interface ImageCollection extends Media {
    type: "imageCollection";
    handles: FileSystemFileHandle[];
}
interface Video extends Media {
    type: "image";
    handle: FileSystemFileHandle;
}
interface Audio extends Media {
    type: "image";
    handle: FileSystemFileHandle;
}

const jsonRessourceSchema = z.union([
    z.object({
        type: z.enum(["text", "image", "video", "audio"]),
        content: z.string(),
    }),
    z.object({
        type: z.literal("imageCollection"),
        content: z.array(z.string()),
    }),
]);

const infoFileSchema = z.object({
    name: z.string(),
    description: z.object({
        type: z.enum(["image", "text"]),
        content: z.string(),
    }),
    thumbnail: z.object({
        type: z.enum(["image", "text"]),
        content: z.string(),
    }),
    anserTime: z.number(),
    fields: z.array(
        z.object({
            question: z.array(jsonRessourceSchema),
            answer: z.array(jsonRessourceSchema),
        })
    ),
});

class CategoryParseError extends Error {}
class InfoFileNotFoundError extends CategoryParseError {}
class InfoFieldError extends CategoryParseError {}
class MediaDirNotFoundError extends CategoryParseError {}
class MissingMediaError extends CategoryParseError {}

export const getAllCategories = async (fsdh: FileSystemDirectoryHandle) => {
    const categoryDirectories: Pick<Category, "dirHandle" | "name">[] = [];

    // get all folders in ksq directory
    for await (const [_, handle] of fsdh.entries())
        if (handle.kind === "directory")
            categoryDirectories.push({
                dirHandle: handle,
                name: handle.name,
            });

    // get category info file
    const settledResult = await Promise.allSettled(
        categoryDirectories.map(async (category) => {
            const infoFileHandle = await category.dirHandle.getFileHandle(
                "info.json"
            );
            // get info file
            const infoFile = await infoFileHandle.getFile().catch((error) => {
                if (error.name === "NotFoundError")
                    throw new InfoFileNotFoundError(
                        `info.json fild missing for category "${category.name}"`
                    );
                else throw new CategoryParseError(error);
            });

            // read and parse info file
            const fileContents = await infoFile.text();
            const infoObject = infoFileSchema.safeParse(
                await JSON.parse(fileContents)
            );
            // handle errors
            if (!infoObject.success)
                throw new InfoFieldError(
                    `incorrect info fields in info.json for category "${
                        category.name
                    }": ${infoObject.error.format()._errors.join("\n")}`
                );

            const info = infoObject.data;

            // get media directory
            const mediaDirHandle = await category.dirHandle
                .getDirectoryHandle("media")
                .catch((error) => {
                    if (error.name === "NotFoundError")
                        throw new MediaDirNotFoundError(
                            `Media directory for category "${category.name}" is missing!`
                        );
                    else throw new CategoryParseError(error);
                });

            // get thumbnail if it has one
            let thumbnail: Category["info"]["thumbnail"] = null;
            if (info.thumbnail.type === "image")
                thumbnail = {
                    type: "image",
                    handle: await mediaDirHandle
                        .getFileHandle(info.thumbnail.content)
                        .catch((error) => {
                            if (error.name === "NotFoundError")
                                throw new MissingMediaError(
                                    `Missing Thumbnail ("${info.thumbnail.content}") inside media folder from category: "${category.name}"`
                                );
                            else throw new CategoryParseError(error);
                        }),
                };
            // get description if it has one
            let description: Category["info"]["description"] =
                info.description.content;
            if (info.description.type === "image")
                description = {
                    type: "image",
                    handle: await mediaDirHandle
                        .getFileHandle(info.description.content)
                        .catch((error) => {
                            if (error.name === "NotFoundError")
                                throw new MissingMediaError(
                                    `Missing Description image ("${info.description.content}") inside media folder from category: "${category.name}"`
                                );
                            else throw new CategoryParseError(error);
                        }),
                };

            // get fields
            const fields = (await Promise.all(
                info.fields.map(async (field) => {
                    //TODO
                    //NOTE: questions and answers can now have multiple different media types. THis is not implemetned anywhere else as of now
                    const question: Ressource = [];
                    const answer: Ressource = [];

                    return { question, answer };
                })
            )) satisfies Category["fields"];

            return {
                name: info.name,
                dirHandle: fsdh,
                mediaDirHandle,
                fields,
                info: {
                    thumbnail,
                    description,
                    answerTime: info.anserTime,
                    infoHandle: infoFileHandle,
                },
            } satisfies Category;
        })
    );

    const errors: (CategoryParseError | InfoFileNotFoundError)[] = [];
};
