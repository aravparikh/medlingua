"use client";

import { useRef } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import DrugNotDroga from "@/components/DrugNotDroga";
import TrustBand from "@/components/TrustBand";
import SignUp from "@/components/SignUp";
import Footer from "@/components/Footer";

export default function Home() {
  const signUpRef = useRef<HTMLElement>(null);

  const scrollToSignUp = () => {
    signUpRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ backgroundColor: "var(--paper)" }}>
      <Nav onJoinClick={scrollToSignUp} />
      <main id="main-content">
        <Hero onJoinClick={scrollToSignUp} />
        <Problem />
        <HowItWorks />
        <DrugNotDroga />
        <TrustBand />
        <SignUp ref={signUpRef} />
      </main>
      <Footer />
    </div>
  );
}
