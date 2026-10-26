import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL_DOCS } from "@/data/legal";

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = LEGAL_DOCS[(await params).slug];
  return doc ? { title: doc.title, description: doc.summary } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const doc = LEGAL_DOCS[(await params).slug];
  if (!doc) notFound();
  return (
    <article className="container-page max-w-3xl pt-28 lg:pt-36">
      <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold text-ivory">{doc.title}</h1>
      <p className="mt-3 text-mist">{doc.summary}</p>
      <p className="mt-6 rounded-xl border border-warning/25 bg-warning/5 px-4 py-3 text-xs text-warning">Template copy for the demo build — to be reviewed by qualified counsel before launch.</p>
      <div className="mt-10 space-y-8">
        {doc.sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-ivory">{i + 1}. {s.heading}</h2>
            <p className="mt-2 leading-relaxed text-mist">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
