const exampleObject: Category = {
    name: "example",
    fields: [
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: {
                    ...new File([new Blob()], "image.png"),
                    dbIndex: 23,
                } as IndexedFile,
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: {
                    ...new File([new Blob()], "image.png"),
                    dbIndex: 23,
                } as IndexedFile,
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: {
                    ...new File([new Blob()], "image.png"),
                    dbIndex: 23,
                } as IndexedFile,
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: {
                    ...new File([new Blob()], "image.png"),
                    dbIndex: 23,
                } as IndexedFile,
            },
        },
        {
            question: {
                type: "text",
                content: "what is the capital of germany",
            },
            answer: {
                type: "image",
                content: {
                    ...new File([new Blob()], "image.png"),
                    dbIndex: 23,
                } as IndexedFile,
            },
        },
    ],
};

export const emptyCategory: PartialCategory = {
    name: "",
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
    fields: [Field, Field, Field, Field, Field];
}

// fields
export interface Field {
    question: Ressource;
    answer: Ressource;
}

export type Ressource =
    | TextRessource
    | (ImageRessource | ImageRessourceCollection)
    | VideoRessource
    | AudioRessource;

export interface TextRessource {
    type: "text";
    content: string;
}
export interface ImageRessource {
    type: "image";
    content: Image;
}
export interface ImageRessourceCollection {
    type: "imageCollection";
    content: Image[];
}
export interface VideoRessource {
    type: "video";
    content: Video;
}
export interface AudioRessource {
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

// interfaces for editor:

/**
 * this is for the editor. It allows fields to have no value or type
 */
export interface PartialCategory {
    name: string;
    fields: [
        PartialField,
        PartialField,
        PartialField,
        PartialField,
        PartialField
    ];
}

export interface PartialField {
    question: PartialRessource;
    answer: PartialRessource;
}

export type PartialRessource = undefined | Ressource;
