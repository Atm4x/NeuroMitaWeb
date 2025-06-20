import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <>
      <Header />
      <div className="noise"></div>
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;