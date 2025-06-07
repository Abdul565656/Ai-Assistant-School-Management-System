// app/page.tsx
import Navbar from "@/components/ui/Navbar";
import HeroSection from "@/components/ui/HeroSection";
import FeaturesSection from "@/components/ui/FeaturesSection";
import CallToActionSection from "@/components/ui/CallToActionSection";
import Footer from "@/components/ui/Footer";

// You might also want to add specific metadata for the landing page here
// export const metadata = {
//   title: "School AI Assistant - Revolutionizing Education",
//   description: "AI-powered platform for teachers and students. Create assignments, get AI grading, and personalized tutoring.",
// };

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        {/* You can add more sections here, e.g., Testimonials, How It Works, Pricing */}
        <CallToActionSection />
      </main>
      <Footer />
    </div>
  );
}