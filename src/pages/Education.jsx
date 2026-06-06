import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Education({ handlePrev }) {
  return (
    <div className="page-side back">
      <div className="page-crease"></div>
      <div className="page-edges-effect left-edge"></div>

      <h2 className="page-title">
        <GraduationCap className="page-title-icon" size={24} />
        HỌC VẤN
      </h2>

      <div className="education-timeline">
        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <div className="timeline-date">2023 - Hiện tại</div>
            <h3>Học Viện Công Nghệ Bưu Chính Viễn Thông (PTIT)</h3>
            <h4>Chuyên ngành Công Nghệ Phần Mềm</h4>
            <p className="timeline-description">
              - Điểm trung bình tích lũy hiện tại (GPA): 3.2/4.0.<br />
              - Số tín chỉ đã tích lũy: 85/150.
            </p>
          </div>
        </div>

      </div>

      <span className="page-number">4</span>
    </div>
  );
}
