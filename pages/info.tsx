import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { footerContent } from '../mock/footer';
import { useLanguage } from '../hooks/useLanguage';

const InfoPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t.information || 'Informações'}</title>
      </Head>
      <main className="min-h-screen px-4 md:px-8 lg:px-20 py-10 scroll-smooth">
        <div id="top" />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold mb-6">{t.information || 'Informações'}</h1>

          <nav className="mb-6">
            <ul className="flex flex-wrap gap-3">
              {footerContent.map((col) =>
                col.subtitles.map((s) => (
                  <li key={s.title}>
                    <Link href={`/info#${s.title}`}>
                      <a className="text-sm text-palette-primary hover:underline">{t[s.title] || s.title}</a>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </nav>

          <section className="space-y-10">
            {footerContent.map((col) => (
              <div key={col.title}>
                <h2 className="text-xl font-medium mb-4">{t[col.title] || col.title}</h2>
                <div className="space-y-6">
                  {col.subtitles.map((s) => (
                    <article
                      id={s.title}
                      key={s.title}
                      className="py-4 border-b border-slate-300/30"
                      style={{ scrollMarginTop: '96px' }}
                    >
                      <h3 className="text-lg font-semibold mb-4">{t[s.title] || s.title}</h3>
                      <div className="text-sm text-palette-base/90 whitespace-pre-wrap leading-relaxed">
                        {s.text || t[`${s.title}Text`] || 'Aqui você pode colocar o texto explicativo relativo a esta seção.'}
                      </div>
                      <div className="mt-4">
                        <Link href="#top">
                          <a className="text-xs text-palette-primary hover:underline">{t.backToTop || 'Voltar ao topo'}</a>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
};

export default InfoPage;
