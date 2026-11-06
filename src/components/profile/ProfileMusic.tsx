import LinkEmbed from "@/components/post/LinkEmbed";
import { parseEmbedUrl, type MediaEmbed } from "@/lib/mediaEmbeds";

/** Playable YouTube / Spotify links of a profile (channel or other non-playable links are skipped). */
export const profileMusicEmbeds = (links: { platform: string; url: string }[]): MediaEmbed[] =>
  links
    .filter((l) => l.platform === "youtube" || l.platform === "spotify")
    .map((l) => parseEmbedUrl(l.url))
    .filter((e): e is MediaEmbed => !!e);

/**
 * The artist's music, played right on the profile instead of linking out
 * (keeps visitors — and bookings — on Muzicalist).
 */
const ProfileMusic = ({ embeds }: { embeds: MediaEmbed[] }) => {
  if (!embeds.length) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {embeds.map((e) => (
        <div key={e.url} className="overflow-hidden rounded-xl border border-border/60 bg-card [&>div]:mt-0 [&>div]:px-0">
          <LinkEmbed embed={e} />
        </div>
      ))}
    </div>
  );
};

export default ProfileMusic;
