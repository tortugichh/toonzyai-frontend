export const ShowcaseSection = () => {
  return (
    <section className="py-16 bg-neutral-100 overflow-hidden">
      <div className="max-w-none">
        <div className="marquee flex gap-24 px-6 text-4xl font-black whitespace-nowrap">
          {Array.from({ length: 10 }).map((_, idx) => (
            <span
              key={idx}
              className={
                [
                  'text-brand',
                  'text-accent',
                  'text-purple-600',
                  'text-blue-600',
                  'text-pink-600',
                ][idx % 5]
              }
            >
              ToonzyAI
            </span>
          ))}
        </div>
      </div>
    </section>
  );
} 