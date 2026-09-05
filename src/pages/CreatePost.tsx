import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostComposerDialog from "@/components/PostComposerDialog";
import { supabase } from "@/integrations/supabase/client";

const POSTS_PATH = "/dashboard?tab=profile&section=posts";

const CreatePost = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if ((roleRow?.user_type as string) === "user") navigate("/user-dashboard", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <PostComposerDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) navigate(POSTS_PATH, { replace: true });
        }}
      />
    </div>
  );
};

export default CreatePost;