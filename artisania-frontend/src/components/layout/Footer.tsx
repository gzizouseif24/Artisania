import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <footer className="footer-content">
          <div className="footer-links">
            <a className="footer-link" href="#">About Artisania</a>
            <a className="footer-link" href="#">Our Mission</a>
            <a className="footer-link" href="#">Artisan Stories</a>
            <a className="footer-link" href="#">Customer Service</a>
            <a className="footer-link" href="#">Shipping & Returns</a>
            <a className="footer-link" href="#">Contact Us</a>
          </div>
          <div className="footer-social">
            <a href="#" className="footer-social-link">
              <div>
                <svg className="footer-social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                  <path
                    d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"
                  ></path>
                </svg>
              </div>
            </a>
            <a href="#" className="footer-social-link">
              <div>
                <svg className="footer-social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                  <path
                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"
                  ></path>
                </svg>
              </div>
            </a>
          </div>
          <p className="footer-copyright">© 2024 Artisania. All rights reserved.</p>
        </footer>
      </div>
    </footer>
  );
};

export default Footer; 