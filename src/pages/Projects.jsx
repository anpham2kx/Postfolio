import React from 'react';
import { Briefcase, ExternalLink } from 'lucide-react';
import { GithubIcon } from '../components/BrandIcons';

export default function Projects({ handleNext }) {
  return (
    <div className="page-side front">
      <div className="page-crease"></div>
      <div className="page-edges-effect right-edge"></div>

      <h2 className="page-title">
        <Briefcase className="page-title-icon" size={24} />
        DỰ ÁN
      </h2>

      {/* <div className="projects-list">
        <div className="project-card">
          <div className="project-header">
            <h3>Website Quản Lý Công Việc (TaskFlow)</h3>
            <span className="project-date">10/2023 - 12/2023</span>
          </div>
          <p className="project-desc">
            Ứng dụng web giúp quản lý công việc và dự án theo phương pháp Kanban, hỗ trợ kéo thả trực quan.
          </p>
          <div className="project-tags">
            <span className="project-tag">ReactJS</span>
            <span className="project-tag">NodeJS</span>
            <span className="project-tag">MongoDB</span>
          </div>
          <div className="project-links">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="project-link">
              <ExternalLink size={14} /> Demo
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="project-link">
              <GithubIcon size={14} /> Code
            </a>
          </div>
        </div>

        <div className="project-card">
          <div className="project-header">
            <h3>Ứng Dụng Đọc Tin Tức (NewsHub)</h3>
            <span className="project-date">07/2023 - 09/2023</span>
          </div>
          <p className="project-desc">
            Ứng dụng đọc tin tức tổng hợp tự động cào tin từ các trang báo lớn và hiển thị theo sở thích người dùng.
          </p>
          <div className="project-tags">
            <span className="project-tag">ReactJS</span>
            <span className="project-tag">Tailwind CSS</span>
            <span className="project-tag">Firebase</span>
          </div>
          <div className="project-links">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="project-link">
              <ExternalLink size={14} /> Demo
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="project-link">
              <GithubIcon size={14} /> Code
            </a>
          </div>
        </div>
      </div> */}

      <span className="page-number">5</span>
    </div>
  );
}
