const react = require('react');

import Header from '../components/Header';
import Contribuidors from '../components/Contributors';
import Mvps from '../components/Mvps';
import Instructions from '../components/Instructions';
import SvelteDevToolPlus from '../components/SvelteDevToolPlus';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="homePage">
      <Header />
      <SvelteDevToolPlus />
      <h2>Instructions</h2>
      <Instructions />
      <h2>Features</h2>
      <Mvps />
      <h2>Contributor</h2>
      <Contribuidors />
      <Footer />
    </div>
  );
};

export default HomePage;
