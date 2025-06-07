// components/landing/Footer.tsx
import Link from "next/link";
import { BookOpenText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <BookOpenText className="h-6 w-6 text-primary" />
            <span className="font-semibold">School AI Assistant</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link>
            <Link href="#contact" className="hover:text-primary">Contact Us</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} School AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}