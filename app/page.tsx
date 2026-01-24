import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { PageContainer } from "./components/layout/page-container";
import { Hero } from "./components/landing/hero";
import { Features } from "./components/landing/features";
import { StyleGallery } from "./components/landing/style-gallery";
import { FAQ } from "./components/landing/faq";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <Header />
      <main id="main-content">
        <PageContainer>
          <Hero />
          <Features />
          <StyleGallery />
          <FAQ />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
