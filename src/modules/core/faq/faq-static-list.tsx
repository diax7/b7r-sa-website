/** Server-rendered questions and answers shown until the accordion island mounts (crawlers, no-JS). */
export function FaqStaticList({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <dl className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.question} className="py-5">
          <dt className="font-medium text-text">{item.question}</dt>
          <dd className="mt-2 text-text-muted">{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
