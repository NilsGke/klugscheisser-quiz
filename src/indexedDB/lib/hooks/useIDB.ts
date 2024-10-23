import { useContext, useEffect, useState } from "react";
import { IDBClientContext } from "../IDBClient";

export default function useIDB() {
  const client = useContext(IDBClientContext);
  if (!client)
    throw new Error("No IDBClient set, use IDBClientProvider to set one");

  const [db, setDb] = useState(client.db ?? null); // have the nullish coalecense to have a nonreferenced null

  useEffect(() => {
    return client.subscribe("statuschange", ({ detail: newStatus }) => {
      if (newStatus === "ready") setDb(client.db);
    });
  }, [client]);

  return db;
}
