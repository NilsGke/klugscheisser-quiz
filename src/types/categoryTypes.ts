import { Indexed } from "$db/indexeddb";

export const emptyCategory: PartialCategory = {
    name: "",
    description: "",
    answerTime: 10,
    fields: [
        {
            question: undefined,
            answer: undefined,
        },
        {
            question: undefined,
            answer: undefined,
        },
        {
            question: undefined,
            answer: undefined,
        },
        {
            question: undefined,
            answer: undefined,
        },
        {
            question: undefined,
            answer: undefined,
        },
    ],
};
Object.freeze(emptyCategory);

export interface Category {
    name: string;
    description: string | Image;
    answerTime: number;
    fields: [Field, Field, Field, Field, Field];
}

// fields
export interface Field {
    question: Resource;
    answer: Resource;
}

export type Resource =
    | TextResource
    | (ImageResource | ImageResourceCollection)
    | VideoResource
    | AudioResource;

export interface TextResource {
    type: "text";
    content: string;
}
export interface ImageResource {
    type: "image";
    content: Image;
}
export interface ImageResourceCollection {
    type: "imageCollection";
    content: Image[];
}
export interface VideoResource extends Volume {
    type: "video";
    content: Video;
}
export interface AudioResource extends Volume {
    type: "audio";
    content: Audio;
}

// media
export type MediaType =
    | "text"
    | "image"
    | "imageCollection"
    | "video"
    | "audio";
export const MediaTypes = [
    "text",
    "image",
    "imageCollection",
    "video",
    "audio",
] as const;

export interface IndexedFile extends File {
    dbIndex: number;
}

export type AnyMedia = Image | Video | Audio;

export interface Text extends String {}
export interface Image extends File {}
export interface Video extends File {}
export interface Audio extends File {}

export type AnyIndexedMedia = IndexedImage | IndexedVideo | IndexedAudio;
export interface IndexedImage extends IndexedFile {}
export interface IndexedVideo extends IndexedFile {}
export interface IndexedAudio extends IndexedFile {}

export interface Volume {
    volume: number;
}

// interfaces for editor:

/**
 * this is for the editor. It allows fields to have no value or type
 */
export interface PartialCategory extends Omit<Category, "fields"> {
    fields: [
        PartialField,
        PartialField,
        PartialField,
        PartialField,
        PartialField
    ];
}

export interface PartialField extends Omit<Field, "question" | "answer"> {
    question: PartialResource;
    answer: PartialResource;
}

export type PartialResource = undefined | Resource;

export const isField = (partialField: PartialField): partialField is Field =>
    partialField.question !== undefined && partialField.answer !== undefined;

export const isCategory = (
    partialCategory: PartialCategory
): partialCategory is Category => partialCategory.fields.every(isField);

export const indexCategory = (
    category: Category,
    index: number
): Indexed<Category> =>
    Object.assign(category, {
        dbIndex: index,
    });

export const addVolumeToVideoResource = (
    resource: Omit<VideoResource, "volume"> | VideoResource
): VideoResource => Object.assign(resource, { volume: 50 });

export const addVolumeToAudioResource = (
    resource: Omit<AudioResource, "volume"> | AudioResource
): AudioResource => Object.assign(resource, { volume: 50 });

const convertDataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(",");
    if (arr[0] === null) throw new Error("arr[0] from file url is null");

    const temp = arr[0].match(/:(.*?);/);
    if (temp === null) throw new Error("mime is null");
    const mime = temp[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
};

const base64Image1 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAYWlUWHRDb3B5cmlnaHQAAAAAACJJbml0aWFscyIgYnkgIkZsb3JpYW4gS8O2cm5lciIsIGxpY2Vuc2VkIHVuZGVyICJDQzAgMS4wIi4gLyBSZW1peCBvZiB0aGUgb3JpZ2luYWwuSjpnjQAAAxppVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0nYWRvYmU6bnM6bWV0YS8nIHg6eG1wdGs9J0ltYWdlOjpFeGlmVG9vbCAxMi41Nic+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpjYz0naHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjJz4KICA8Y2M6bGljZW5zZSByZGY6cmVzb3VyY2U9J2h0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9wdWJsaWNkb21haW4vemVyby8xLjAvJy8+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOmRjPSdodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyc+CiAgPGRjOmNyZWF0b3I+CiAgIDxyZGY6U2VxPgogICAgPHJkZjpsaT5GbG9yaWFuIEvDtnJuZXI8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvZGM6Y3JlYXRvcj4KICA8ZGM6c291cmNlPmh0dHBzOi8vZ2l0aHViLmNvbS9kaWNlYmVhci9kaWNlYmVhcjwvZGM6c291cmNlPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPkluaXRpYWxzPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9J3InPz5Im/H8AAABKmVYSWZNTQAqAAAACAAGAQ4AAgAAAHAAAABWARoABQAAAAEAAADGARsABQAAAAEAAADOASgAAwAAAAEAAgAAAhMAAwAAAAEAAQAAgpgAAgAAAFQAAADWAAAAACJJbml0aWFscyIgYnkgIkZsb3JpYW4gS8O2cm5lciIsIGxpY2Vuc2VkIHVuZGVyICJDQzAgMS4wIi4gLyBSZW1peCBvZiB0aGUgb3JpZ2luYWwuIC0gQ3JlYXRlZCB3aXRoIGRpY2ViZWFyLmNvbQAAAABIAAAAAQAAAEgAAAABIkluaXRpYWxzIiBieSAiRmxvcmlhbiBLw7ZybmVyIiwgbGljZW5zZWQgdW5kZXIgIkNDMCAxLjAiLiAvIFJlbWl4IG9mIHRoZSBvcmlnaW5hbC4AGUfikgAABiFJREFUeJzt2jGqZVUahuHTNHTQYNZJOwxFQYegwxBB0eEIBuIsLIdgIKijsMpAI6FEsdATGtzgrFM/1F3rfZ7gssP62ft7Kzn/+vGdt/66AEkCAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGECAGHHBuDf/3/98t/33r8+8U9//vTs8tuTr65PL+e1Dz68/j3X86+fXF48e3p9OtuxAfjPG29e/vfZ59cn/un3H76//PLJR9enl/P6N99e/57r508/vvzx/XfXp7MJQIwA3EYANicADxOA2wjA5gTgYQJwGwHYnAA8TABuIwCbE4CHCcBtBGBzAvAwAbiNAGxOAB4mALcRgM0JwMME4DYCsLlX9UvAlV/IvYpfm039EnAlAK/izpe147/5HscG4FVZGcbO/8tU7jydAAyrDKNy5+kEYFhlGJU7TycAwyrDqNx5OgEYVhlG5c7TCcCwyjAqd55OAIZVhlG583QCMKwyjMqdpxOAYZVhVO48nQAMqwyjcufpBGBYZRiVO08nAMMqw6jceToBGFYZRuXO0wnAsMowKneeTgCGVYZRufN0AjCsMozKnacTgGGVYVTuPJ0ADKsMo3Ln6QRgWGUYlTtPJwDDKsOo3Hk6ARhWGUblztMJwLDKMCp3nk4AhlWGUbnzdAIwrDKMyp2nE4BhlWFU7jydAAyrDKNy5+kEYFhlGJU7TycAwyrDqNx5OgEYVhlG5c7TCcCwyjAqd55OAIZVhlG583QCMKwyjJU7d7Hz+7iXAAxbGcbOH9zKnbvY+X3cSwCGrQxj5w9u5c5d7Pw+7iUAw1aGsfMHt3LnLnZ+H/cSgGErw9j5g1u5cxc7v497CcCwlWHs/MGt3LmLnd/HvQRg2Mowdv7gVu7cxc7v414CMGxlGDt/cCt37mLn93EvARi2MoydP7iVO3ex8/u4lwAMWxnGzh/cyp272Pl93EsAhq0MY+cPrnLn6QRgWGUYlTtPJwDDKsOo3Hk6ARhWGUblztMJwLDKMCp3nk4AhlWGUbnzdAIwrDKMyp2nE4BhlWFU7jydAAyrDKNy5+kEYFhlGJU7TycAwyrDqNx5OgEYVhlG5c7TCcCwyjAqd55OAIZVhlG583QCMKwyjMqdpxOAYZVhVO48nQAMqwyjcufpBGBYZRiVO08nAMMqw6jceToBGFYZRuXO0wnAsMowKneeTgCGVYZRufN0AjCsMozKnacTgGGVYVTuPJ0ADKsMo3Ln6QRgWGUYlTtPJwDDKsOo3Hk6ARhWGUblztMJwLDKMCp3nk4AhlWGUbnzdAIwrDKMyp2nE4BhlWGs3Pn8yVeXFz89uz7t5dcvv7j+PZsADFsZRiUAu3r67tvXv2cTgGErwxCAx00AWLYyDAF43ASAZSvDEIDHTQBYtjIMAXjcBIBlK8MQgMdNAFi2MgwBeNwEgGUrwxCAx00AWLYyDAF43ASAZa998OH1722ef/3k8uLZ0+vTflbu3JVfAgJHEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAI+xuQIqxbD6crSAAAAABJRU5ErkJggg==",
    base64Image2 =
        "data:image/jpeg;base64,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";

export const testCategory: Indexed<Category> = {
    dbIndex: 10000,
    answerTime: 10,
    description: "description",
    fields: [
        {
            question: {
                type: "imageCollection",
                content: [
                    new File([convertDataUrlToBlob(base64Image1)], "test1.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test2.png"),
                    new File([convertDataUrlToBlob(base64Image1)], "test1.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test2.png"),
                ],
            },
            answer: {
                type: "image",
                content: new File(
                    [convertDataUrlToBlob(base64Image1)],
                    "test.png"
                ),
            },
        },
        {
            question: {
                type: "imageCollection",
                content: [
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                ],
            },
            answer: {
                type: "image",
                content: new File(
                    [convertDataUrlToBlob(base64Image1)],
                    "test.png"
                ),
            },
        },
        {
            question: {
                type: "imageCollection",
                content: [
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                ],
            },
            answer: {
                type: "image",
                content: new File(
                    [convertDataUrlToBlob(base64Image1)],
                    "test.png"
                ),
            },
        },
        {
            question: {
                type: "imageCollection",
                content: [
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                ],
            },
            answer: {
                type: "image",
                content: new File(
                    [convertDataUrlToBlob(base64Image1)],
                    "test.png"
                ),
            },
        },
        {
            question: {
                type: "imageCollection",
                content: [
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image1)], "test.png"),
                    new File([convertDataUrlToBlob(base64Image2)], "test.png"),
                ],
            },
            answer: {
                type: "image",
                content: new File(
                    [convertDataUrlToBlob(base64Image1)],
                    "test.png"
                ),
            },
        },
    ],
    name: "test diashow",
};
