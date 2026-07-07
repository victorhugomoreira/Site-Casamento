import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { OurStorySection } from "@/components/our-story-section"
import { EventSection } from "@/components/event-section"
import { GallerySection } from "@/components/gallery-section"
import { RSVPSection } from "@/components/rsvp-section"
import { GiftsSection } from "@/components/gifts-section"
import { RecommendationsSection } from "@/components/recommendations-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function WeddingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <OurStorySection />
      <EventSection />
      <GallerySection />
      <RSVPSection />
      <GiftsSection />
      <RecommendationsSection />
      <FAQSection />
      <Footer />
    </main>
  )
}
