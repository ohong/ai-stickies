import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { Hero } from "./components/landing/hero";
import { ChatDemo } from "./components/landing/chat-demo";
import { Features } from "./components/landing/features";
import { StyleGallery } from "./components/landing/style-gallery";
import { FAQ } from "./components/landing/faq";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <Header />
      <main id="main-content">
        <Hero />
        <ChatDemo />
        <Features />
        <StyleGallery />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
