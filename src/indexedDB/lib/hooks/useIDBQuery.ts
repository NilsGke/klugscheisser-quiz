import {
  QueryFunction,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import useIDB from "./useIDB";

interface CustomUseQueryOptions<T> extends Omit<UseQueryOptions<T>, "queryFn"> {
  queryFn: (db: IDBDatabase) => ReturnType<QueryFunction<T>>;
}

export default function useIDBQuery<T>(options: CustomUseQueryOptions<T>) {
  const db = useIDB();

  return useQuery<T>({
    ...options,
    enabled: db !== null && options.enabled,
    queryFn: () =>
      new Promise((resolve, reject) => {
        if (db === null) return reject("database is not yet avalible");
        resolve(Promise.resolve(options.queryFn(db)));
      }),
  });
}
