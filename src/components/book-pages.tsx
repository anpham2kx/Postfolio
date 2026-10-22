import Image from "next/image";
import type { ReactNode } from "react";
import {
  chapters,
  education,
  hobbies,
  otherTools,
  pageTitles,
  profile,
  projects,
  skillGroups,
  socialLinks,
} from "@/data/portfolio";
import { ContactForm } from "./contact-form";
import { Icon } from "./icon";

function Jump({
  page,
  children,
  className = "",
}: {
  page: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={`#page-${page}`} data-book-page={page} className={className}>
      {children}
    </a>
  );
}

function Paper({
  index,
  children,
  className = "",
  cover = false,
}: {
  index: number;
  children: ReactNode;
  className?: string;
  cover?: boolean;
}) {
  return (
    <article
      className={`book-page ${className}`}
      id={`page-${index}`}
      data-page={index}
      tabIndex={-1}
      aria-label={
        cover ? pageTitles[index] : `Trang ${index}: ${pageTitles[index]}`
      }
    >
      <div
        className="page-content"
        tabIndex={0}
        aria-label={`Nội dung ${pageTitles[index]}, có thể cuộn`}
      >
        <div className="page-inner">{children}</div>
      </div>
      {!cover && (
        <footer className="paper-footer">
          <span>{pageTitles[index]}</span>
          <span className="scroll-cue" aria-hidden="true">
            <Icon name="arrowDown" size={12} />
          </span>
          <span>{String(index).padStart(2, "0")}</span>
        </footer>
      )}
    </article>
  );
}

function Cover({ index }: { index: number }) {
  return (
    <Paper index={index} className="book-cover" cover>
      <div className="cover-border">
        <Icon name="book" size={28} />
        <p className="cover-label">PORTFOLIO</p>
        <p className="cover-author">{profile.name}</p>
        <p className="cover-role">{profile.role}</p>
      </div>
    </Paper>
  );
}

function SocialLinks() {
  return (
    <div className="social-links">
      {socialLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${link.name} (mở tab mới)`}
          title={link.name}
        >
          <Icon name={link.icon} size={18} />
        </a>
      ))}
    </div>
  );
}

/** Server-rendered content is passed through the client reader as children. */
export function BookPages() {
  return (
    <>
      <Cover index={0} />

      <Paper index={1} className="intro-page">
        <div className="avatar-frame">
          <Image
            src={profile.avatar}
            alt="Ảnh đại diện của Phạm Thanh An: mèo trắng đeo kính và nơ"
            width={112}
            height={124}
            sizes="112px"
            preload
          />
        </div>
        <h1>{profile.name}</h1>
        <p className="role-label">{profile.role}</p>
        <p className="cover-bio" lang="en">
          {profile.bio}
        </p>
        <div className="intro-actions">
          <Jump page={6} className="primary-button">
            Liên hệ
            <Icon name="arrowRight" size={16} />
          </Jump>
          <SocialLinks />
        </div>
        <nav className="quick-links" aria-label="Các phần của portfolio">
          {chapters.slice(1, -1).map((chapter) => (
            <Jump key={chapter.id} page={chapter.page}>
              {chapter.title}
              <Icon name="arrowRight" size={13} />
            </Jump>
          ))}
        </nav>
      </Paper>

      <Paper index={2}>
        <h2>Sở thích</h2>
        <div className="hobbies-list">
          {hobbies.map((hobby) => (
            <section className="hobby" key={hobby.title}>
              <div className="hobby-icon">
                <Icon name={hobby.icon} size={24} />
              </div>
              <div>
                <h3>{hobby.title}</h3>
                <p>{hobby.description}</p>
              </div>
            </section>
          ))}
        </div>
      </Paper>

      <Paper index={3}>
        <h2>Kỹ năng</h2>
        <div className="skills-groups">
          {skillGroups.map((group) => (
            <section className="skill-group" key={group.title}>
              <h3>
                <Icon name="code" size={17} />
                {group.title}
              </h3>
              {group.skills.map((skill) => (
                <div className="skill" key={skill.name}>
                  <div>
                    <span>{skill.name}</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div
                    className="skill-track"
                    role="meter"
                    aria-label={skill.name}
                    aria-valuenow={skill.level}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${skill.level}%` }} />
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
        <section className="tools">
          <h3>Công cụ khác</h3>
          <div className="tool-tags">
            {otherTools.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </div>
        </section>
      </Paper>

      <Paper index={4}>
        <h2>Học vấn</h2>
        <div className="education-emblem" aria-hidden="true">
          <Icon name="graduation" size={44} />
          <span>PTIT</span>
        </div>
        <section className="education-info">
          <span className="period">{education.period}</span>
          <h3>{education.institution}</h3>
          <p className="major">{education.major}</p>
          <div className="education-detail">
            <p>{education.gpa}</p>
            <p>{education.credits}</p>
          </div>
        </section>
      </Paper>

      <Paper index={5} className="projects-page">
        <h2>Dự án</h2>
        {projects.length ? (
          <div className="project-list">
            {projects.map((project) => (
              <a
                key={project.href}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.image && (
                  <Image
                    src={project.image}
                    width={400}
                    height={240}
                    alt={project.title}
                  />
                )}
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="empty-projects">
            Website gốc hiện chưa đăng nội dung dự án.
          </p>
        )}
        <a
          className="text-link project-github"
          href={socialLinks[3].href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="github" size={18} />
          GitHub
          <Icon name="external" size={16} />
        </a>
      </Paper>

      <Paper index={6}>
        <h2>Liên hệ</h2>
        <ContactForm />
        <Jump page={1} className="back-home">
          <Icon name="arrowLeft" size={14} />
          Quay về trang đầu
        </Jump>
      </Paper>
      <Cover index={7} />
    </>
  );
}
