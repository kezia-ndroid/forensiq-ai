import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/landing/Hero';
import { MediaUploadPreview } from '../components/landing/MediaUploadPreview';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhyTruthLens } from '../components/landing/WhyTruthLens';
import { SupportedMedia } from '../components/landing/SupportedMedia';
import { Footer } from '../components/layout/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0716] text-slate-100 selection:bg-pink-500 selection:text-white">
      {/* Fixed Navigation Header */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-grow">
        <Hero />
        <MediaUploadPreview />
        <HowItWorks />
        <WhyTruthLens />
        <SupportedMedia />
      </main>

      {/* Footer with Mandatory Disclaimer */}
      <Footer />
    </div>
  );
};
