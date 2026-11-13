import Image from "next/image";
import DefaultLayout from "@/components/layout/DefaultLayout";
import FaqList from "@/components/section/FaqList";
import JsonLd from "@/components/section/JsonLd";
import { uiText } from "@/configs/contents/uiContent";
import { mainContent } from "@/configs/contents/mainContent";
import { buildPageJsonLd, pageMeta } from "@/configs/contents/seoContent";

// 섹션 단위로 나눠 DefaultLayout 안에 나열한다. 누가 봐도 어떤 섹션으로 구성됐는지 보이게.
export default function MainServerBlock() {
  return (
    <DefaultLayout>
      <JsonLd data={buildPageJsonLd(pageMeta.main, mainContent.faq)} />
      <HeroSection />
      <ProofSection />
      <FaqSection />
    </DefaultLayout>
  );
}

function HeroSection() {
  const { hero } = mainContent;
  return (
    <section aria-labelledby="hero-title" className="pt-[calc(var(--header-height-desktop)+4rem)] pb-16">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        {/* 페이지당 H1은 하나 */}
        <h1 id="hero-title">
          <span className="block text-4xl font-semibold">{hero.title}</span>
          <span className="mt-3 block text-xl">{hero.titleMuted}</span>
        </h1>
        <p className="mt-6 max-w-xl">{hero.description}</p>
        <a href={hero.primary.href} className="mt-8 inline-flex">
          {hero.primary.label}
        </a>
        <Image src={hero.image.src} width={hero.image.width} height={hero.image.height} alt="" priority className="mt-12 h-auto w-full" />
      </div>
    </section>
  );
}

function ProofSection() {
  const { proof } = mainContent;
  return (
    <section aria-labelledby="proof-title" className="py-16">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <h2 id="proof-title">{proof.label}</h2>
        <dl className="mt-6 grid gap-6 md:grid-cols-4">
          {proof.items.map((item) => (
            <div key={item.label}>
              <dt className="sr-only">{item.label}</dt>
              <dd className="text-3xl font-semibold">{item.value}</dd>
              <dd className="mt-2 text-sm">{item.label}</dd>
              <dd className="text-xs">{item.source}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="py-16">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <h2 id="faq-title">{uiText.faqTitle}</h2>
        <div className="mt-8">
          <FaqList categories={mainContent.faq} />
        </div>
      </div>
    </section>
  );
}
