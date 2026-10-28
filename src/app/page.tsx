import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/hero";
import { ProductPreview } from "@/components/sections/product-preview";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Trust } from "@/components/sections/trust";
import { Pricing } from "@/components/sections/pricing";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full bg-white text-[#252525] flex flex-col justify-between selection:bg-[#EAF4FF] selection:text-[#147DD8]">
      {/* Navigation */}
      <Navbar />

      {/* Main Page Flow */}
      <main className="flex-1">
        <Hero />
        <ProductPreview />
        <Features />
        <HowItWorks />
        <Trust />
        <Pricing />
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
