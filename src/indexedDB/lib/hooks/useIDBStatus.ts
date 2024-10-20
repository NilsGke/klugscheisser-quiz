import { useEffect, useState } from "react";
import useIDBClient from "./useIDBClient";
import { IDBClient } from "../IDBClient";

export default function useIDBStatus() {
    const idbClient = useIDBClient();
    const [status, setStatus] = useState<IDBClient["status"]>(idbClient.status);

    useEffect(
        () =>
            idbClient.subscribe("statuschange", ({ detail: newStatus }) =>
                setStatus(newStatus)
            ),
        [idbClient, setStatus]
    );

    return status;
}
