type Props = {
  videoId: string | null;
  title: string;
};

export default function YouTubeEmbed({ videoId, title }: Props) {
  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-md bg-slate-100 ring-1 ring-line flex items-center justify-center text-xs text-muted">
        No video attached
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-black ring-1 ring-line">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full"
      />
    </div>
  );
}
