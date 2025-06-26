import './Hero.css';

interface HeroProps {
  onExploreArtists: () => void;
}

const Hero: React.FC<HeroProps> = ({ onExploreArtists }) => {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <div
          className="hero-image"
          style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDE_kAV0U1NihI7hi2oZBQUddk-igOHQ-LDcnjhiHIfcCHw_bqr-XN3JsTEaW0SLfMXsrNwEptUMwjEyQ8vMmxg3TEC80cRSeqTUAODnaOCIqLRujPa7JlF43CZSQC61ltYui3uxaMd5yDqIxcg8RX1Tx1w5tQCsWADyZ2xGt9v-y4_D9XuznVbG4q60QQOGLaMGAHqPSGdLri9rhQqHl2-whs_91I7e5tbyWzbGDit6ibyDQzzX0Hdnvixt0-LaSy7FUbJjGkllA8")'}}
        ></div>
        <div className="hero-text">
          <div className="hero-text-content">
            <h1 className="hero-title">
              Discover the Soul of Tunisia
            </h1>
            <h2 className="hero-subtitle">
              Connect with talented Tunisian artisans and explore their unique crafts, each telling a story of tradition and artistry.
            </h2>
          </div>
          <button className="hero-button" onClick={onExploreArtists}>
            <span className="hero-button-text">Explore Artists</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero; 