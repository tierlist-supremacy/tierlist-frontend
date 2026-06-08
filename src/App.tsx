import { useState, useEffect } from "react";
import { Home } from "./pages/Home";
import { Editor } from "./pages/Editor";
import { TierList } from "./types";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [currentList, setCurrentList] = useState<TierList | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleStartEditor = (list: TierList) => {
    setCurrentList(list);
  };

  return (
    <>
      {path.startsWith("/editor") ? (
        <Editor currentList={currentList} onSetCurrentList={setCurrentList} />
      ) : (
        <Home onStartEditor={handleStartEditor} />
      )}
    </>
  );
}
