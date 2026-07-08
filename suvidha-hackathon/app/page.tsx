import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Prizes from "@/components/sections/Prizes";
import Judges from "@/components/sections/Judges";
import Faq from "@/components/sections/Faq";
import RegisterCta from "@/components/sections/RegisterCta";
import Footer from "@/components/sections/Footer";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Prizes />
        <Judges />
        <Faq />
        <RegisterCta />
      </main>
      <Footer />
    </>
  );
}
