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
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`book-page ${className}`}
      id={`page-${index}`}
      data-page={index}
      tabIndex={-1}
      aria-label={`Trang ${index + 1}: ${pageTitles[index]}`}
    >
      <div
        className="page-content"
        tabIndex={0}
        aria-label={`Nội dung ${pageTitles[index]}, có thể cuộn`}
      >
        <div className="page-inner">{children}</div>
      </div>
      <footer className="paper-footer">
        <span>
          AN PHAM
          <span className="paper-footer-line" />
          {pageTitles[index]}
        </span>
        <span className="scroll-cue" aria-hidden="true">
          Đọc tiếp
          <Icon name="arrowDown" size={11} />
        </span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </footer>
    </article>
  );
}
function Eyebrow({
  children,
  number,
}: {
  children: ReactNode;
  number: string;
}) {
  return (
    <div className="eyebrow">
      <span className="eyebrow-dot" />
      {children}
      <span className="eyebrow-number">{number}</span>
    </div>
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
      <Paper index={0} className="cover-page">
        <Eyebrow number="EST. IN CURIOSITY">HELLO, WORLD</Eyebrow>
        <div className="cover-intro">
          <div className="avatar-frame">
            <Image
              src={profile.avatar}
              alt="Ảnh đại diện của Phạm Thanh An: mèo trắng đeo kính và nơ"
              width={142}
              height={160}
              sizes="142px"
              preload
            />
            <span className="avatar-star" aria-hidden="true">
              ✳
            </span>
          </div>
          <span className="small-handwriting" aria-hidden="true">
            Hi, I’m An!
            <svg viewBox="0 0 70 40" fill="none">
              <path
                d="M4 5c33 0 52 5 56 26m-9-8 9 9 6-12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <h1>
          Pham
          <br />
          <span>
            Thanh An<span className="title-period">.</span>
          </span>
        </h1>
        <p className="role-label">
          <span />
          {profile.role}
        </p>
        <p className="cover-bio" lang="en">
          {profile.bio}
        </p>
        <div className="cover-actions">
          <Jump page={7} className="primary-button">
            Liên hệ với An
            <Icon name="external" size={17} />
          </Jump>
          <Jump page={1} className="text-link">
            Mở mục lục
            <Icon name="arrowRight" size={16} />
          </Jump>
        </div>
        <div className="cover-bottom">
          <SocialLinks />
          <span className="cover-edition">PERSONAL EDITION / 01</span>
        </div>
        <nav className="mobile-quick-links" aria-label="Các phần của portfolio">
          {chapters.slice(1).map((chapter) => (
            <Jump key={chapter.id} page={chapter.page}>
              {chapter.title}
              <Icon name="external" size={12} />
            </Jump>
          ))}
        </nav>
      </Paper>

      <Paper index={1} className="contents-page">
        <Eyebrow number="THE INDEX">MỤC LỤC</Eyebrow>
        <h2 className="contents-title">
          Một cuốn sách.
          <br />
          <em>Một hành trình.</em>
        </h2>
        <p className="section-intro">
          Lật từng trang, khám phá những điều tạo nên An.
        </p>
        <nav className="contents-list" aria-label="Mục lục sách">
          {chapters.map((chapter, index) => (
            <Jump key={chapter.id} page={chapter.page} className="contents-row">
              <span className="chapter-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="chapter-copy">
                <strong>{chapter.title}</strong>
                <span>{chapter.subtitle}</span>
              </span>
              <span className="toc-page">
                {String(chapter.page + 1).padStart(2, "0")}
              </span>
              <Icon name="external" size={17} />
            </Jump>
          ))}
        </nav>
        <div className="index-note">
          <span className="index-flower" aria-hidden="true">
            ✳
          </span>
          <p>
            Không cần đọc theo thứ tự.
            <br />
            <span>Hãy bắt đầu từ điều bạn tò mò.</span>
          </p>
        </div>
      </Paper>

      <Paper index={2}>
        <Eyebrow number="02">SỞ THÍCH</Eyebrow>
        <h2>
          Ngoài những
          <br />
          <em>dòng code.</em>
        </h2>
        <div className="hobbies-list">
          {hobbies.map((hobby, index) => (
            <section className="hobby" key={hobby.title}>
              <div className="hobby-icon">
                <Icon name={hobby.icon} size={25} />
              </div>
              <div>
                <span className="item-kicker">0{index + 1}</span>
                <h3>{hobby.title}</h3>
                <p>{hobby.description}</p>
              </div>
            </section>
          ))}
        </div>
        <div className="code-note" aria-hidden="true">
          <span>const life = [</span>
          <strong>
            {" "}
            &quot;code&quot;, &quot;games&quot;, &quot;music&quot;{" "}
          </strong>
          <span>];</span>
        </div>
      </Paper>

      <Paper index={3}>
        <Eyebrow number="03">KỸ NĂNG</Eyebrow>
        <h2>
          Từ ý tưởng
          <br />
          <em>đến sản phẩm.</em>
        </h2>
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
        <Eyebrow number="04">HỌC VẤN</Eyebrow>
        <h2>
          Học hỏi.
          <br />
          <em>Không ngừng.</em>
        </h2>
        <div className="education-emblem" aria-hidden="true">
          <Icon name="graduation" size={56} />
          <span>PTIT</span>
        </div>
        <section className="education-info">
          <span className="period">
            <span />
            {education.period}
          </span>
          <h3>{education.institution}</h3>
          <p className="major">{education.major}</p>
          <div className="education-detail">
            <p>{education.gpa}</p>
            <p>{education.credits}</p>
          </div>
        </section>
      </Paper>

      <Paper index={5} className="projects-page">
        <Eyebrow number="05">DỰ ÁN</Eyebrow>
        <h2>
          Không gian
          <br />
          <em>cho những ý tưởng.</em>
        </h2>
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
          <div className="empty-projects">
            <div className="project-sketch" aria-hidden="true">
              <span />
              <Icon name="code" size={40} />
              <div />
              <div />
            </div>
            <h3>Trang này còn để ngỏ.</h3>
            <p>Website gốc hiện chưa đăng nội dung dự án.</p>
          </div>
        )}
        <a
          className="text-link project-github"
          href={socialLinks[3].href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="github" size={18} />
          Khám phá GitHub của An
          <Icon name="external" size={17} />
        </a>
      </Paper>

      <Paper index={6} className="connect-page">
        <Eyebrow number="LET’S CONNECT">KẾT NỐI</Eyebrow>
        <h2>
          Một lời chào.
          <br />
          <em>Nhiều khả năng.</em>
        </h2>
        <div className="connect-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="letter">
            <Icon name="mail" size={58} />
          </span>
          <span className="connect-star">✳</span>
        </div>
        <div className="connect-links">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name={link.icon} size={19} />
              <span>{link.label}</span>
              <Icon name="external" size={17} />
            </a>
          ))}
        </div>
        <p className="connect-note">
          Hoặc để lại lời nhắn ở trang bên.
          <br />
          <Jump page={7} className="text-link">
            Đến form liên hệ
            <Icon name="arrowRight" size={15} />
          </Jump>
        </p>
      </Paper>

      <Paper index={7}>
        <Eyebrow number="06">LIÊN HỆ</Eyebrow>
        <h2>
          Viết cho <em>An.</em>
        </h2>
        <p className="section-intro contact-intro">
          Một lời chào, một ý tưởng, hay một cuộc trò chuyện.
        </p>
        <ContactForm />
        <Jump page={0} className="back-home">
          <Icon name="arrowLeft" size={14} />
          Quay về trang đầu
        </Jump>
      </Paper>
    </>
  );
}
