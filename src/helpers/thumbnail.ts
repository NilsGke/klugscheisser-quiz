import { Image as CategoryImage } from "../types/categoryTypes";

const maxSize = 200; // size in px

export const generateThumbnail = (image: CategoryImage) =>
    new Promise<CategoryImage>(async (resolve, reject) => {
        var img = new Image();
        img.onload = async () => {
            const resizedImage = await resizeImageToBlob(
                img,
                maxSize,
                maxSize,
                1,
                image.name,
            );
            resolve(resizedImage);
        };
        img.src = URL.createObjectURL(image);
    });

const resizeImageToBlob = (
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number,
    quality: number,
    fileName: string,
) =>
    new Promise<CategoryImage>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height = Math.round((height *= maxWidth / width));
                width = maxWidth;
            }
        } else if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("canvas context is null");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
            (blob) => {
                if (blob === null) return reject();
                resolve(new File([blob], fileName));
            },
            "image/jpeg",
            quality,
        );
    });
