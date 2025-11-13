import { useEffect, useState } from "react";

export default function useFavicon(url: string) {
    const [favicon, setFavicon] = useState(url);
    let link: HTMLLinkElement | null =
        document.querySelector(`link[rel~="icon"]`);

    useEffect(() => {
        if (!link) {
            link = document.createElement("link");
            link.type = "image/x-icon";
            link.rel = "icon";
            link.href = url;
            document.head.appendChild(link);
        } else link.href = url;
    }, [url]);

    return [favicon, setFavicon];
}
