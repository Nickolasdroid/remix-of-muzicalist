import { Navigate } from "react-router-dom";

/**
 * The dedicated composer page was replaced by the shared PostComposerDialog.
 * Existing deep links keep working by opening the composer over the Dashboard.
 */
const CreatePost = () => <Navigate to="/dashboard?tab=profile&section=posts&new=1" replace />;

export default CreatePost;
