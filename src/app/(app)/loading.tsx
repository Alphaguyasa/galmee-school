export default function Loading() {
  return (
    <div className="grid animate-pulse gap-4" aria-hidden>
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="h-12 rounded-md bg-muted" />
      <div className="grid gap-px">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted" />
        ))}
      </div>
    </div>
  );
}
