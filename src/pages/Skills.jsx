import React from 'react';
import { Code } from 'lucide-react';

export default function Skills({ handleNext, skillsActive }) {
  return (
    <div className="page-side front">
      <div className="page-crease"></div>
      <div className="page-edges-effect right-edge"></div>

      <h2 className="page-title">
        <Code className="page-title-icon" size={24} />
        KỸ NĂNG
      </h2>

      <div className="skills-container">
        <div className="skills-section">
          <h3>Frontend Development</h3>
          <div className="skill-item">
            <div className="skill-info">
              <span>HTML5 / CSS3 / JavaScript</span>
            </div>
            <div className="skill-bar">
              <div className="skill-progress" style={{ width: skillsActive ? '90%' : '0%' }}></div>
            </div>
          </div>

          <div className="skill-item">
            <div className="skill-info">
              <span>ReactJS</span>
            </div>
            <div className="skill-bar">
              <div className="skill-progress" style={{ width: skillsActive ? '85%' : '0%' }}></div>
            </div>
          </div>

          <div className="skill-item">
            <div className="skill-info">
              <span>Tailwind CSS / Sass</span>
            </div>
            <div className="skill-bar">
              <div className="skill-progress" style={{ width: skillsActive ? '80%' : '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="skills-section">
          <h3>Backend Development</h3>
          <div className="skill-item">
            <div className="skill-info">
              <span>Node.js / Express.js</span>
            </div>
            <div className="skill-bar">
              <div className="skill-progress" style={{ width: skillsActive ? '75%' : '0%' }}></div>
            </div>
          </div>

          <div className="skill-item">
            <div className="skill-info">
              <span>MongoDB / PostgreSQL</span>
            </div>
            <div className="skill-bar">
              <div className="skill-progress" style={{ width: skillsActive ? '70%' : '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="skills-section">
          <h3>Công cụ khác</h3>
          <div className="skills-tags">
            <span className="skill-tag">Git / GitHub</span>
            <span className="skill-tag">Docker</span>
            <span className="skill-tag">Vite</span>
            <span className="skill-tag">REST API</span>
            <span className="skill-tag">Figma</span>
            <span className="skill-tag">VS Code</span>
          </div>
        </div>
      </div>

      <span className="page-number">3</span>
    </div>
  );
}
