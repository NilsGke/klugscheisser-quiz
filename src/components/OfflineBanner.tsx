import { useState } from "react";
import "./OfflineBanner.scss";

const OfflineBanner = () => {
  const [hidden, setHidden] = useState(false);
  if (!hidden)
    return (
      <div id="offlineBanner">
        you are currently offline, some things might not be avalible
        <button onClick={() => setHidden(true)}>ok</button>
      </div>
    );

  return null;
};

export default OfflineBanner;
