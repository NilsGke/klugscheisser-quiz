const fileTypes = [
    "image/apng",
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/webp",
];

type size = {
    h: number;
    w: number;
};

const toWebp = (file: File, size?: size) =>
    new Promise<File>((resolve, reject) => {
        if (!fileTypes.includes(file.type))
            return reject("unsupported filetype: " + file.type);

        const image = new Image();

        image.onload = () => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (context === null) throw new Error("ctx is null");

            canvas.width = size?.h || image.naturalHeight;
            canvas.height = size?.w || image.naturalWidth;

            context.drawImage(
                image,
                0,
                0,
                size?.h || image.naturalHeight,
                size?.w || image.naturalWidth,
            );

            canvas.toBlob((blob) => {
                if (blob === null)
                    throw new Error("image blob from canvas is null");

                // Use the file rename trick to turn it back into a file

                const newImage = new File([blob], `${file.name}.webp`, {
                    type: blob.type,
                });

                resolve(newImage);
            }, "image/webp");
        };

        image.src = URL.createObjectURL(file);
    });

export default toWebp;
