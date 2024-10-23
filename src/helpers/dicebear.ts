import { getExtensionFromMimeType } from "./mimeTypes";

const getDicebearImage = (name: string) =>
  new Promise<File>(async (resolve, reject) => {
    const res = await fetch(
      `https://api.dicebear.com/5.x/initials/png?seed=${encodeURI(name)}`,
    );
    const blob = await res.blob();
    console.log(blob);

    const file = new File(
      [blob],
      "profileImage." + getExtensionFromMimeType(blob.type),
    );
    resolve(file);
  });

export default getDicebearImage;
