import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { legalNotice as legalNoticeFr } from "@/content/legal/fr";
import { legalNotice as legalNoticeEn } from "@/content/legal/en";

interface PageParams {
  locale: string;
}

function getContent(locale: string) {
  return locale === "fr" ? legalNoticeFr : legalNoticeEn;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${getContent(locale).title} | KartHopper` };
}

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = getContent(locale);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-slate-900">{content.title}</h1>
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="font-heading text-lg font-semibold text-slate-900">
            {section.heading}
          </h2>
          <p className="mt-1 text-slate-700">{section.body}</p>
        </section>
      ))}
    </div>
  );
}
