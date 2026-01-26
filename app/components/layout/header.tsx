import Link from "next/link";
import { PageContainer } from "./page-container";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <PageContainer>
        <nav className="flex items-center justify-between h-16">
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
          >
            Skip to main content
          </a>

          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <svg
                className="size-5 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">
              AI Stickies
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
            >
              How it Works
            </Link>
            <Link
              href="#styles"
              className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
            >
              Styles
            </Link>
            <Link
              href="#faq"
              className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4"
            >
              FAQ
            </Link>
          </div>

          <Link
            href="/create"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 md:px-5 py-2 rounded-full text-xs md:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Get Started
          </Link>
        </nav>
      </PageContainer>
    </header>
  );
}
