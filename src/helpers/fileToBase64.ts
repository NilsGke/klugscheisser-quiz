function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (reader.result === null) reject();
            else if (typeof reader.result === "string") resolve(reader.result);
            else {
                const encoder = new TextDecoder();
                resolve(encoder.decode(reader.result));
            }
        };
        reader.onerror = (error) => reject(error);
    });
}
export default fileToBase64;
