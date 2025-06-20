import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Team from '../components/Team';
import Support from '../components/Support';
import '../styles/HomePage.css'; 

const HomePage = () => {
  return (
    <>
      <Hero />
      <Features />
      <Team />
      <Support />
    </>
  );
};

export default HomePage;