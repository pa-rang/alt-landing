import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

type AboutPageProps = {
  params: { locale: string };
};

export default async function AboutPage({ params }: { params: Promise<AboutPageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="pt-12 pb-16 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-6 text-left">
            <h1 className="text-xl font-bold tracking-tight text-zinc-800">{dictionary.about.title}</h1>

            <div className="text-sm space-y-6 text-zinc-800">
              <div>
                <p className="font-semibold mb-1">{dictionary.about.members.jeongyeon.name}</p>
                <ul className="list-disc list-inside text-zinc-800 ml-1">
                  {dictionary.about.members.jeongyeon.history.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">{dictionary.about.members.sangwoo.name}</p>
                <ul className="list-disc list-inside text-zinc-800 ml-1">
                  {dictionary.about.members.sangwoo.history.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-sm text-zinc-800">
              <p>
                {dictionary.about.mission} <br />
                {dictionary.about.recruit}
              </p>
              <p>
                {dictionary.about.contact}
                <a href="mailto:altalt.team@gmail.com" className="pl-1 text-blue-600 hover:underline">
                  altalt.team@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
