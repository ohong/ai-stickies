import Link from "next/link";
import { PageContainer } from "./page-container";

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-muted/30">
      <PageContainer>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-primary flex items-center justify-center">
              <svg
                className="size-4 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="font-semibold text-foreground">AI Stickies</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground focus:outline-none focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground focus:outline-none focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground focus:outline-none focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4">
              Contact
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} AI Stickies
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
