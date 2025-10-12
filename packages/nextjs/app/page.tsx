"use client";

import Header from "~~/components/Header";
import { AnimatedSection } from "~~/components/animated-section";
import { BentoSection } from "~~/components/bento-section";

export default function ShaderShowcase() {
  return (
    <main>
      <div className=" w-full rounded-md flex flex-col md:items-center md:justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
        <Header />
        <AnimatedSection id="features-section" className="relative z-10 max-w-[1320px] mx-auto" delay={0.2}>
          <BentoSection />
        </AnimatedSection>

        <div className="flex justify-center items-center pb-20 pt-8 sm:pt-12 sm:pb-36 w-full text-center">
          <div className="w-full max-w-[1024px] text-center leading-7 md:leading-10 lg:leading-[64px] font-medium text-3xl md:text-3xl lg:text-6xl bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-transparent px-2 sm:px-0">
            {"Creators. Backers. Traders. Winning Together, that is the space we want to cruise in."}
          </div>
        </div>
      </div>

      <div>
        <AnimatedSection id="pricing-section" className="relative z-10 pb-14" delay={0.2}>
          <div>Campaigns</div>
        </AnimatedSection>
      </div>

      <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto" delay={0.2}>
        <div>ctasection</div>
      </AnimatedSection>

      <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
        <div>footer</div>
      </AnimatedSection>
    </main>
  );
}
