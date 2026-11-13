// 자주 묻는 질문. 모든 질문과 답을 서버에서 DOM에 그린다(크롤러·AI가 읽음).
// 탭으로 나누는 경우에도 비활성 탭은 hidden으로 숨길 뿐 DOM에서 빼지 않는다.
// 같은 데이터를 buildPageJsonLd(meta, faq)에 넘겨 FAQPage 구조화 데이터와 문장을 맞춘다.

export interface FaqCategory {
  category: string;
  items: readonly { question: string; answer: string }[];
}

export default function FaqList({ categories }: { categories: readonly FaqCategory[] }) {
  return (
    <div className="flex flex-col gap-10">
      {categories.map((group) => (
        <section key={group.category} aria-label={group.category}>
          <h3 className="text-sm font-semibold">{group.category}</h3>
          <ul className="mt-3 border-t border-gray-900">
            {group.items.map((item) => (
              <li key={item.question} className="border-b border-gray-200">
                <details className="group py-4">
                  <summary className="cursor-pointer list-none font-semibold">{item.question}</summary>
                  <p className="mt-3 leading-relaxed">{item.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
