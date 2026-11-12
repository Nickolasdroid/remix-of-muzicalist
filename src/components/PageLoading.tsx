import Navigation from "@/components/Navigation";
import GuestSidebar from "@/components/GuestSidebar";

/** Signed-in users have their sidebar profile cached by Navigation. */
const looksSignedIn = () => {
  try {
    return !!sessionStorage.getItem("nav_profile");
  } catch {
    return false;
  }
};

/**
 * What shows while a page loads: the same black frame, menus and empty panel as the
 * finished page, so moving between pages doesn't flash a blank screen or a spinner.
 */
const PageLoading = ({ overlay = false }: { overlay?: boolean }) => {
  const guest = !looksSignedIn();
  return (
    <div
      className={`min-h-screen bg-black ${
        guest ? "md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]" : "md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]"
      }`}
      aria-busy="true"
    >
      <Navigation mobileOverlay={overlay} hideMobileNotifications={overlay} />
      {guest && <GuestSidebar />}
      <div className="min-h-screen min-w-0 flex-1 bg-background md:min-h-[calc(100vh-80px)] md:rounded-lg" />
    </div>
  );
};

export default PageLoading;
