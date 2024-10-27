import { z } from "zod";

export enum SortingMethod {
  creationDate = "creationDate",
  abcNormal = "abcNormal",
  abcReverse = "abcReverse",
}

export type FieldNew = {
  question: Resource[];
  answer: Resource[];
  value: number;
};

export type CategoryNew = {
  name: string;

  dirHandle: FileSystemDirectoryHandle;
  mediaDirHandle: FileSystemDirectoryHandle;
  infoHandle: FileSystemFileHandle;
  lastModified: Date;

  description: Image | string;
  thumbnail: Image | null;
  answerTime: number;

  fields: FieldNew[];
};

export type Resource = {
  autoSkip: false | number;
} & (Text | Image | Video | Audio);

interface Media {
  type: string;
}
interface VolumeMedia extends Media {
  volume: number;
}

export interface Text extends Media {
  type: "text";
  content: string;
}
export interface Image extends Media {
  type: "image";
  handle: FileSystemFileHandle;
}
export interface Video extends VolumeMedia {
  type: "video";
  handle: FileSystemFileHandle;
}
export interface Audio extends VolumeMedia {
  type: "audio";
  handle: FileSystemFileHandle;
}

const jsonRessourceSchema = z.union([
  z.object({
    autoSkip: z.union([z.literal(false), z.number().min(0)]),
    type: z.enum(["text", "image"]),
    content: z.string(),
  }),
  z.object({
    autoSkip: z.union([z.literal(false), z.number().min(0)]),
    type: z.enum(["video", "audio"]),
    volume: z.number(),
    content: z.string(),
  }),
]);

const infoFileSchema = z.object({
  name: z.string(),
  description: z.object({
    type: z.enum(["image", "text"]),
    content: z.string(),
  }),
  thumbnail: z.string().nullable(),
  answerTime: z.number(),
  fields: z.array(
    z.object({
      value: z.number(),
      question: z.array(jsonRessourceSchema),
      answer: z.array(jsonRessourceSchema),
    })
  ),
});

class CategoryParseError extends Error {
  categoryName: string;
  initialError: Error;
  constructor(message: string, initialError: Error, categoryName: string) {
    super(message);
    this.categoryName = categoryName;
    this.initialError = initialError;
  }
}
class InfoFileNotFoundError extends CategoryParseError {}
class InfoFieldError extends CategoryParseError {}
class MediaDirNotFoundError extends CategoryParseError {}
class MissingMediaError extends CategoryParseError {}

type ParseError =
  | InfoFileNotFoundError
  | InfoFieldError
  | MediaDirNotFoundError
  | MissingMediaError
  | CategoryParseError;

export const getAllCategories = async (fsdh: FileSystemDirectoryHandle) => {
  const dirNames: CategoryNew["name"][] = [];

  // get all folders in ksq directory
  for await (const [_, handle] of fsdh.entries())
    if (handle.kind === "directory") dirNames.push(handle.name);

  // get category info file
  const results = await Promise.allSettled<CategoryNew>(
    dirNames.map(async (name) => getCategoryByDirectoryName(fsdh, name))
  );

  const usable: CategoryNew[] = [];
  const errors: ParseError[] = [];

  results.forEach((result) => {
    if (result.status === "rejected") errors.push(result.reason);
    else usable.push(result.value);
  });

  return { errors, usable };
};

export const getCategoryByDirectoryName = async (
  fsdh: FileSystemDirectoryHandle,
  name: string
) => {
  const dirHandle = await fsdh.getDirectoryHandle(name).catch((error) => {
    if (error.name === "NotFoundError")
      throw new CategoryParseError(
        `Directory for category "${name}" not found`,
        error,
        name
      );
    else throw new CategoryParseError(error, error, name);
  });

  const infoFileHandle = await dirHandle.getFileHandle("info.json");
  // get info file
  const infoFile = await infoFileHandle.getFile().catch((error) => {
    if (error.name === "NotFoundError")
      throw new InfoFileNotFoundError(
        `info.json fild missing for category "${name}"`,
        error,
        name
      );
    else throw new CategoryParseError(error, error, name);
  });

  // read and parse info file
  const fileContents = await infoFile.text();
  const infoObject = infoFileSchema.safeParse(await JSON.parse(fileContents));
  // handle errors
  if (!infoObject.success) {
    const errors = infoObject.error.errors
      .map(
        (error) =>
          error.message +
          " at " +
          error.path.filter((t) => typeof t === "string").join(" > ")
      )
      .join("\n");
    throw new InfoFieldError(
      `incorrect info fields in info.json for category "${name}":\n${errors}`,
      infoObject.error,
      name
    );
  }

  const info = infoObject.data;

  // get media directory
  const mediaDirHandle = await dirHandle
    .getDirectoryHandle("media")
    .catch((error) => {
      if (error.name === "NotFoundError")
        throw new MediaDirNotFoundError(
          `Media directory for category "${name}" is missing!`,
          error,
          name
        );
      else throw new CategoryParseError(error, error, name);
    });

  // get thumbnail if it has one
  let thumbnail: CategoryNew["thumbnail"] = null;
  if (info.thumbnail !== null)
    thumbnail = {
      type: "image",
      handle: await mediaDirHandle
        .getFileHandle(info.thumbnail)
        .catch((error) => {
          if (error.name === "NotFoundError")
            throw new MissingMediaError(
              `Missing Thumbnail ("${info.thumbnail}") inside media folder from category: "${name}"`,
              error,
              name
            );
          else throw new CategoryParseError(error, error, name);
        }),
    };
  // get description if it has one
  let description: CategoryNew["description"] = info.description.content;
  if (info.description.type === "image")
    description = {
      type: "image",
      handle: await mediaDirHandle
        .getFileHandle(info.description.content)
        .catch((error) => {
          if (error.name === "NotFoundError")
            throw new MissingMediaError(
              `Missing Description image ("${info.description.content}") inside media folder from category: "${name}"`,
              error,
              name
            );
          else throw new CategoryParseError(error, error, name);
        }),
    };

  // get fields
  const fields = (await Promise.all(
    info.fields.map(async (field) => {
      const getRessourceContent = async (
        media: z.infer<typeof jsonRessourceSchema>
      ): Promise<Resource> => {
        if (media.type === "text")
          return {
            autoSkip: media.autoSkip,
            type: "text",
            content: media.content,
          };
        else {
          const handle = await mediaDirHandle
            .getFileHandle(media.content)
            .catch((error) => {
              if (error.name === "NotFoundError")
                throw new MissingMediaError(
                  `Missing Media of type "${media.type}" inside media folder from category: "${name}.\nName of Media stored as: "${media.content}"`,
                  error,
                  name
                );
              else throw new CategoryParseError(error, error, name);
            });

          if (media.type === "video" || media.type === "audio")
            return {
              volume: media.volume,
              autoSkip: media.autoSkip,
              type: media.type,
              handle: handle,
            };
          else
            return {
              autoSkip: media.autoSkip,
              type: media.type,
              handle: handle,
            };
        }
      };

      const question: Resource[] = await Promise.all(
        field.question.map(getRessourceContent)
      );
      const answer: Resource[] = await Promise.all(
        field.answer.map(getRessourceContent)
      );

      return { question, answer, value: field.value };
    })
  )) satisfies CategoryNew["fields"];

  const result: CategoryNew = {
    name: info.name,
    dirHandle: fsdh,
    mediaDirHandle,
    fields,
    description,
    thumbnail,
    answerTime: info.answerTime,
    infoHandle: infoFileHandle,
    lastModified: new Date(infoFile.lastModified),
  };

  return result;
};

export const deleteCategory = async (
  fsdh: FileSystemDirectoryHandle,
  categoryName: string
) => {};
