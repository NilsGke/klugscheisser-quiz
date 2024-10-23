import { ReactNode, useEffect } from "react";
import { IDBClient, IDBClientContext } from "./IDBClient";

export const IDBClientProvider = ({
  client,
  children,
}: {
  client: IDBClient;
  children: ReactNode;
}) => {
  useEffect(() => {
    client.mount();
    return () => client.unmount();
  }, [client]);

  return (
    <IDBClientContext.Provider value={client}>
      {children}
    </IDBClientContext.Provider>
  );
};
