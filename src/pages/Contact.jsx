import React from 'react';
import { Mail, Loader2, Send, Home } from 'lucide-react';

export default function Contact({
  handlePrev,
  handleSendEmail,
  formData,
  handleFormChange,
  isSubmitting,
  alert,
  navigateToPageSequentially
}) {
  return (
    <div className="page-side back">
      <div className="page-crease"></div>
      <div className="page-edges-effect left-edge"></div>

      <h2 className="page-title">
        <Mail className="page-title-icon" size={24} />
        LIÊN HỆ
      </h2>

      <form className="contact-form" onSubmit={handleSendEmail}>
        <div className="form-group">
          <label htmlFor="name">Họ tên *</label>
          <input
            type="text"
            id="name"
            className="form-control"
            placeholder="Nhập họ tên của bạn..."
            value={formData.name}
            onChange={handleFormChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            className="form-control"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleFormChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Nội dung *</label>
          <textarea
            id="message"
            className="form-control"
            placeholder="Viết nội dung..."
            value={formData.message}
            onChange={handleFormChange}
            required
          ></textarea>
        </div>

        {alert && (
          <div className={`form-alert ${alert.type}`}>
            {alert.message}
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send size={16} />
              Gửi
            </>
          )}
        </button>
      </form>

      <span className="page-number">6</span>

      <div className="home-icon-container">
        <span className="home-icon-tooltip">Trang đầu</span>
        <button
          type="button"
          className="btn-home-icon"
          onClick={(e) => {
            e.stopPropagation();
            navigateToPageSequentially(0);
          }}
          aria-label="Quay về trang đầu"
        >
          <Home size={20} />
        </button>
      </div>
    </div>
  );
}
