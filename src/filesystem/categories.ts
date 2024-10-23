import { z } from "zod";

export enum SortingMethod {
  creationDate = "creationDate",
  abcNormal = "abcNormal",
  abcReverse = "abcReverse",
}

export type CategoryNew = {
  name: string;
  dirHandle: FileSystemDirectoryHandle;
  mediaDirHandle: FileSystemDirectoryHandle;
  description: Image | string;
  info: {
    infoHandle: FileSystemFileHandle;
    thumbnail: Image | null;
    answerTime: number;
  };
  fields: { question: Ressource[]; answer: Ressource[] }[];
};

type Ressource = Text | Image | Video | Audio;

interface Media {
  type: string;
}

interface Text extends Media {
  type: "text";
  content: string;
}
interface Image extends Media {
  type: "image";
  handle: FileSystemFileHandle;
}
interface Video extends Media {
  type: "video";
  handle: FileSystemFileHandle;
}
interface Audio extends Media {
  type: "audio";
  handle: FileSystemFileHandle;
}

const jsonRessourceSchema = z.object({
  type: z.enum(["text", "image", "video", "audio"]),
  content: z.string(),
});

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
  const categoryDirectories: Pick<CategoryNew, "dirHandle" | "name">[] = [];

  // get all folders in ksq directory
  for await (const [_, handle] of fsdh.entries())
    if (handle.kind === "directory")
      categoryDirectories.push({
        dirHandle: handle,
        name: handle.name,
      });

  // get category info file
  const results = await Promise.allSettled<CategoryNew>(
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
      if (!infoObject.success) {
        const errors = infoObject.error.issues
          .map((issue) => `${issue.message} ${issue.path}`)
          .join(", ");
        throw new InfoFieldError(
          `incorrect info fields in info.json for category "${category.name}": ${errors}`
        );
      }

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
      let thumbnail: CategoryNew["info"]["thumbnail"] = null;
      if (info.thumbnail !== null)
        thumbnail = {
          type: "image",
          handle: await mediaDirHandle
            .getFileHandle(info.thumbnail)
            .catch((error) => {
              if (error.name === "NotFoundError")
                throw new MissingMediaError(
                  `Missing Thumbnail ("${info.thumbnail}") inside media folder from category: "${category.name}"`
                );
              else throw new CategoryParseError(error);
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
                  `Missing Description image ("${info.description.content}") inside media folder from category: "${category.name}"`
                );
              else throw new CategoryParseError(error);
            }),
        };

      // get fields
      const fields = (await Promise.all(
        info.fields.map(async (field) => {
          const getRessourceContent = async (
            media: z.infer<typeof jsonRessourceSchema>
          ): Promise<Ressource> => {
            if (media.type === "text")
              return {
                type: "text",
                content: media.content,
              };
            else {
              const handle = await mediaDirHandle
                .getFileHandle(media.content)
                .catch((error) => {
                  if (error.name === "NotFoundError")
                    throw new MissingMediaError(
                      `Missing Media of type "${media.type}" inside media folder from category: "${category.name}.\nName of Media stored as: "${media.content}"`
                    );
                  else throw new CategoryParseError(error);
                });

              return {
                type: media.type,
                handle: handle,
              };
            }
          };

          const question: Ressource[] = await Promise.all(
            field.question.map(getRessourceContent)
          );
          const answer: Ressource[] = await Promise.all(
            field.answer.map(getRessourceContent)
          );

          return { question, answer };
        })
      )) satisfies CategoryNew["fields"];

      const result = {
        name: info.name,
        dirHandle: fsdh,
        mediaDirHandle,
        fields,
        description,
        info: {
          thumbnail,
          answerTime: info.answerTime,
          infoHandle: infoFileHandle,
        },
      } satisfies CategoryNew;

      return result;
    })
  );

  const usable: CategoryNew[] = [];
  const errors: CategoryParseError[] = [];

  results.forEach((result) => {
    if (result.status === "rejected") errors.push(result.reason);
    else usable.push(result.value);
  });

  return { errors, usable };
};
