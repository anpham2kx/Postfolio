import React from 'react';
import { Heart, Code, Gamepad2, Compass, Music } from 'lucide-react';

export default function Hobbies({ handlePrev }) {
  return (
    <div className="page-side back">
      <div className="page-crease"></div>
      <div className="page-edges-effect left-edge"></div>

      <h2 className="page-title">
        <Heart className="page-title-icon" size={24} />
        SỞ THÍCH
      </h2>

      <div className="hobbies-grid">
        <div className="hobby-card">
          <div className="hobby-info">
            <h3>Lập trình web/app</h3>
            <p>Yêu thích code các ứng dụng, website, mobile app để giải quyết các vấn đề thực tế trong cuộc sống.</p>
          </div>
        </div>

        <div className="hobby-card">
          <div className="hobby-info">
            <h3>Chơi Game</h3>
            <p>Thích chơi các tựa game chiến thuật, giải trí để xả stress.</p>
          </div>
        </div>

        <div className="hobby-card">
          <div className="hobby-info">
            <h3>Nghe nhạc</h3>
            <p>Thích nghe nhạc, đặc biệt là nhạc Lofi, giúp tăng hiệu suất tập trung cao khi làm việc và học tập.</p>
          </div>
        </div>
      </div>

      <span className="page-number">2</span>
    </div>
  );
}
