import BackButton from "$components/BackButton";
import Spinner from "$components/Spinner";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "filesystem/categories";
import "./Errors.page.scss";
import { toast } from "react-toastify";

const Errors = ({ fsdh }: { fsdh: FileSystemDirectoryHandle }) => {
  const {
    data: categoryErrors,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [fsdh],
    queryFn: async () => (await getAllCategories(fsdh)).errors,
  });

  if (isLoading)
    return (
      <div id="errorPage" className="loading">
        <BackButton />
        <Spinner /> Loading...
      </div>
    );

  if (isError)
    return (
      <div id="errorPage" className="loading">
        <BackButton />
        Error while loading errors: <br />
        {error.name}: {error.message}
      </div>
    );

  return (
    <div id="errorPage">
      <BackButton />
      <div className="errors">
        {categoryErrors?.map((error) => {
          return (
            <details>
              <summary>
                {error.constructor.name || error.name}: {error.categoryName}
              </summary>
              {error.stack || error.message}
              <button
                onClick={() => {
                  new Promise(
                    (r) =>
                      navigator.clipboard
                        .writeText(error.initialError.toString())
                        .then(r) // use extra promise to also catch if `.toString()` throws
                  )
                    .then(() => toast.success("Coppied"))
                    .catch((error) => {
                      toast.error("could not copy"), console.error(error);
                    });
                }}
              >
                copy original error to clipboard
              </button>
            </details>
          );
        })}

        {categoryErrors?.length === 0 && (
          <div className="noErrors">no errors, everything fine :)</div>
        )}
      </div>
    </div>
  );
};

export default Errors;
