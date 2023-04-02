/**
 * only temporary
 * note this should be removed and not used in production
 * @source [stackoverflow](https://stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f#:~:text=Way%201%3A%20only%20works%20for%20dataURL%2C%20not%20for%20other%20types%20of%20url.)
 */
export function dataURLtoFile(dataurl: string, filename: string) {
    var arr = dataurl.split(","),
        mime = (arr[0].match(/:(.*?);/) as string[])[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}
