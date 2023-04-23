const getFileUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target && evt.target.result) {
                if (typeof evt.target.result === "string")
                    resolve(evt.target.result);
                else {
                    let td = new TextDecoder();
                    let ua = new Uint8Array(evt.target.result);
                    resolve(td.decode(ua));
                }
            } else reject();
        };
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });

export default getFileUrl;
