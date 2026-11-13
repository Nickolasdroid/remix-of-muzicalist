import { useEffect, useState } from "react";

/** Thin banner shown while the device has no internet connection. */
const OfflineBanner = () => {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[110] bg-yellow-500 px-4 py-2 text-center text-sm font-semibold text-black"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      No internet connection. Some things may not work until you are back online.
    </div>
  );
};

export default OfflineBanner;
