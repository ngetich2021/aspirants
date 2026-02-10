// app/page.tsx
import { ModalProvider } from '@/components/ModalContext';
import About from '@/components/About';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import Quotes from '@/components/Quotes';
import Sticky from '@/components/Sticky';
import Target from '@/components/Target';
import Team from '@/components/Team';
import prisma from '@/lib/prisma';
import EventsSlider from '@/components/Events';

export default async function Home() {
  const stations = await prisma.pollingStation.findMany({
    select: { id: true, name: true, ward: true },
  });

  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ModalProvider>
      <div className="scroll-smooth">
        <Navbar stations={stations} />
        <Hero />
        <section id="about">
          <About />
        </section>
        <section id="events">
          <EventsSlider initialData={activities} />
        </section>
        <Quotes />
        <Team />
        <section id="contact">
          <Footer />
        </section>
        <Sticky stations={stations} />
      </div>
    </ModalProvider>
  );
}