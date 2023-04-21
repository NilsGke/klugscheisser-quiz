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
