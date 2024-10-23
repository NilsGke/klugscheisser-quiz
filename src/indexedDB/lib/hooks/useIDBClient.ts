import { useContext } from "react";
import { IDBClientContext } from "../IDBClient";

export default function useIDBClient() {
  const client = useContext(IDBClientContext);

  if (!client)
    throw new Error("No IDBCLient set, use IDBClientProvider to set one");

  return client;
}
