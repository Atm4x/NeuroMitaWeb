import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Team from '../components/Team';
import Support from '../components/Support';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <>
      <Hero />
      <main>
        <Features />
        <Team />
        <Support />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;