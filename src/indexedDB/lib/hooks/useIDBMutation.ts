import {
  QueryFunction,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import useIDB from "./useIDB";

interface CustomUseQueryOptions<T>
  extends Omit<UseMutationOptions<T>, "mutationFn"> {
  mutationFn: (db: IDBDatabase) => ReturnType<QueryFunction<T>>;
}

export default function useIDBMutation<T>(options: CustomUseQueryOptions<T>) {
  const db = useIDB();

  return useMutation<T>({
    ...options,
    mutationFn: () =>
      new Promise((resolve, reject) => {
        if (db === null) return reject("database is not yet avalible");
        resolve(Promise.resolve(options.mutationFn(db)));
      }),
  });
}
