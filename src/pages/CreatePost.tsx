import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PostComposerDialog from "@/components/PostComposerDialog";

const POSTS_PATH = "/dashboard?tab=profile&section=posts";

const CreatePost = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <PostComposerDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) navigate(POSTS_PATH, { replace: true });
        }}
        onPublished={() => navigate(POSTS_PATH, { replace: true })}
      />
    </div>
  );
};

export default CreatePost;