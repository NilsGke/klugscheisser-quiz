const mimes = [
    { mime: "image/png", extension: "png" },
    { mime: "image/tiff", extension: "tif" },
    { mime: "image/vnd.wap.wbmp", extension: "wbmp" },
    { mime: "image/x-icon", extension: "ico" },
    { mime: "image/x-jng", extension: "jng" },
    { mime: "image/x-ms-bmp", extension: "bmp" },
    { mime: "image/svg+xml", extension: "svg" },
    { mime: "image/webp", extension: "webp" },
];

export const getExtensionFromMimeType = (type: string): string =>
    mimes.find((m) => m.mime === type)?.extension || "null";
