import React from 'react';
import { Send, Phone } from 'lucide-react';
import { FacebookIcon, GithubIcon } from '../components/BrandIcons';

export default function Cover({ handleNext, handleDownloadCV, navigateToPageSequentially }) {
  return (
    <div className="page-side front">
      <div className="page-crease"></div>
      <div className="page-edges-effect right-edge"></div>

      <div className="cover-page">
        <div className="cover-avatar-container">
          <img
            src="/avatar.png"
            alt="Phạm Thanh An Avatar"
            className="cover-avatar"
          />
        </div>
        <h1 className="cover-title">Pham Thanh An</h1>
        <p className="cover-subtitle">Software Engineer</p>

        <div className="social-links">
          <a href="https://www.facebook.com/pham.thanh.an.2550" target="_blank" rel="noreferrer" className="social-icon-btn" title="Facebook">
            <FacebookIcon size={20} />
          </a>
          <a href="https://t.me" target="_blank" rel="noreferrer" className="social-icon-btn" title="Telegram">
            <Send size={20} />
          </a>
          <a href="https://zalo.me/0375480845" target='_blank' className="social-icon-btn" title="Điện thoại">
            <Phone size={20} />
          </a>
          <a href="https://github.com/AnPham1820" target="_blank" rel="noreferrer" className="social-icon-btn" title="GitHub">
            <GithubIcon size={20} />
          </a>
        </div>

        <p className="cover-bio">
          Hi, I'm An, a passionate Software Engineer with a strong foundation in full-stack development. I love creating elegant, user-friendly applications and am always eager to learn new technologies that push the boundaries of what's possible on the web.
        </p>

        <div className="cover-actions">
          {/* <button className="btn-primary" onClick={handleDownloadCV}>CV</button> */}
          <button className="btn-secondary" onClick={() => navigateToPageSequentially(3)}>Liên hệ</button>
        </div>
      </div>
      <span className="page-number">1</span>
    </div>
  );
}
