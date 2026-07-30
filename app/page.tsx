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
import { getGalleryImages } from "@/lib/gallery"

export default async function WeddingPage() {
  const galleryImages = await getGalleryImages()

  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <OurStorySection />
      <EventSection />
      <GallerySection images={galleryImages} />
      <RSVPSection />
      <GiftsSection />
      <RecommendationsSection />
      <FAQSection />
      <Footer />
    </main>
  )
}
