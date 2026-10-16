import type { UseCaseFAQ } from "@/lib/data/use-case-faqs";

interface UseCaseFaqSectionProps {
  faqs: UseCaseFAQ[];
  heading: string;
}

export function UseCaseFaqSection({ faqs, heading }: UseCaseFaqSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <section
      aria-labelledby="use-case-faq-heading"
      className="w-full min-w-0 max-w-[800px] mt-10 flex flex-col gap-5 md:gap-7"
    >
      <h2
        id="use-case-faq-heading"
        className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] font-heading font-semibold text-[24px] leading-[30px] md:text-[38px] md:leading-[48px] text-center text-text-dark"
      >
        {heading}
      </h2>
      <div className="flex min-w-0 flex-col gap-3 md:gap-4">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group min-w-0 max-w-full rounded-[12px] border border-[#F2EDE8] bg-white p-4 md:p-6"
            style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
          >
            <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-4 font-heading text-[16px] font-medium text-text-dark marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{faq.question}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-xl text-brand-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 min-w-0 break-words pr-7 [overflow-wrap:anywhere] font-body text-[14px] leading-6 text-text-muted md:text-[16px]">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
