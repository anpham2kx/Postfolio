import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './App.css';

// Import Pages
import Cover from './pages/Cover';
import Hobbies from './pages/Hobbies';
import Skills from './pages/Skills';
import Education from './pages/Education';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import BackCover from './pages/BackCover';

function App() {
  const [currentPage, setCurrentPage] = useState(0); // 0: Closed, 1: Sheet 1 flipped, 2: Sheet 2 flipped, 3: Sheet 3 flipped
  const [skillsActive, setSkillsActive] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Trigger skill bars animation when Skills page becomes visible
  useEffect(() => {
    if (currentPage === 1) {
      const timer = setTimeout(() => setSkillsActive(true), 400);
      return () => clearTimeout(timer);
    } else {
      setSkillsActive(false);
    }
  }, [currentPage]);

  const totalSheets = 4; // Sheet 1: Cover/Hobbies, Sheet 2: Skills/Education, Sheet 3: Projects/Contact, Sheet 4: BackCover/Blank

  const handleNext = () => {
    if (currentPage < totalSheets - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const navigateToPageSequentially = (targetPage) => {
    if (currentPage === targetPage) return;
    const isForward = targetPage > currentPage;
    const steps = Math.abs(targetPage - currentPage);
    
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        setCurrentPage(prev => {
          if (isForward) {
            return prev + 1;
          } else {
            return prev - 1;
          }
        });
      }, i * 250); // 250ms delay per page flip for a smooth staggered cascade
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

    if (!serviceId || !templateId || !publicKey) {
      setAlert({
        type: 'error',
        message: 'Lỗi cấu hình: Vui lòng cài đặt Service ID, Template ID và Public Key trong file .env!'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
      };

      const result = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      if (result.status === 200) {
        setAlert({
          type: 'success',
          message: 'Tin nhắn của bạn đã được gửi thành công!'
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error('Gửi thư không thành công.');
      }
    } catch (err) {
      console.error('EmailJS Send Error:', err);
      setAlert({
        type: 'error',
        message: `Lỗi: ${err.text || err.message || 'Không thể gửi tin nhắn. Vui lòng kiểm tra lại thông tin cấu hình trong file .env.'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interactive Page Drag State
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    pageIndex: null,
    direction: null,
  });

  const handlePointerDown = (e, index) => {
    // Only allow left click or touch
    if (e.button !== 0 && e.button !== undefined) return;
    
    // Only allow dragging the top-most page on the right (next) or top-most on the left (prev)
    if (index !== currentPage + 1 && index !== currentPage) return;

    // Prevent dragging the very last sheet (Back Cover) to the left
    if (index === totalSheets && currentPage === totalSheets - 1) return;

    // Capture pointer to track dragging outside bounds
    e.target.setPointerCapture(e.pointerId);
    
    const isFlipped = currentPage >= index;
    setDragState({
      isDragging: true,
      startX: e.clientX,
      currentX: e.clientX,
      pageIndex: index,
      direction: isFlipped ? 'prev' : 'next',
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging) return;
    setDragState(prev => ({
      ...prev,
      currentX: e.clientX
    }));
  };

  const handlePointerUp = (e) => {
    if (!dragState.isDragging) return;
    
    e.target.releasePointerCapture(e.pointerId);
    
    const deltaX = dragState.currentX - dragState.startX;
    const threshold = 60; // Pixels required to trigger a flip
    
    if (dragState.direction === 'next' && deltaX < -threshold) {
      handleNext();
    } else if (dragState.direction === 'prev' && deltaX > threshold) {
      handlePrev();
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      startX: 0,
      currentX: 0,
      pageIndex: null,
      direction: null,
    });
  };

  const handleDownloadCV = (e) => {
    e.preventDefault();
    alert('Bắt đầu tải xuống hồ sơ CV của Phạm Thanh An (Mô phỏng)...');
  };

  // Determine z-indexes dynamically to keep the pages overlay order clean during flip
  const getZIndex = (sheetIndex) => {
    if (currentPage < sheetIndex) {
      // Sheet is stacked on the right side
      return totalSheets - sheetIndex;
    } else {
      // Sheet is flipped to the left side
      return sheetIndex;
    }
  };

  const getPageStyle = (index) => {
    const isFlipped = currentPage >= index;
    const baseZIndex = getZIndex(index);
    const baseStyle = { zIndex: baseZIndex };

    if (!dragState.isDragging || dragState.pageIndex !== index) {
      return baseStyle; // Fallback to CSS transitions
    }

    // Apply interactive rotation while dragging
    const deltaX = dragState.currentX - dragState.startX;
    let dragRotation = 0;

    // Slower rotation for realistic heavy page feel (divide by 350)
    if (dragState.direction === 'next') {
      // Dragging right to left (0 -> -180)
      dragRotation = Math.max(-180, Math.min(0, (deltaX / 350) * 180));
      return {
        ...baseStyle,
        transform: `rotateY(${dragRotation}deg)`,
        transition: 'none',
        zIndex: 50 // Bring to absolute front while dragging
      };
    } else {
      // Dragging left to right (-180 -> 0)
      dragRotation = Math.min(180, Math.max(0, (deltaX / 350) * 180));
      return {
        ...baseStyle,
        transform: `rotateY(${-180 + dragRotation}deg)`,
        transition: 'none',
        zIndex: 50
      };
    }
  };


  return (
    <div className="portfolio-container">
      {/* Visual background lights */}
      <div className="bg-circles">
        <div className="circle-1"></div>
        <div className="circle-2"></div>
      </div>

      {/* Floating Navigation Arrows on Left and Right of the book */}
      <div className="nav-arrows">
        <button
          className="nav-arrow-btn"
          onClick={handlePrev}
          disabled={currentPage === 0}
          title="Trang trước"
          aria-label="Previous Page"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className="nav-arrow-btn"
          onClick={handleNext}
          disabled={currentPage === totalSheets - 1}
          title="Trang sau"
          aria-label="Next Page"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 3D Book Layout Container */}
      <div className="book-wrapper">
        <div className="book-container">

          {/* Spine center crease element */}
          <div className="book-spine"></div>

          {/* Hard cover backdrops to give realistic thickness */}
          <div className="book-cover left"></div>
          <div className="book-cover right"></div>

          {/* SHEET 1: Cover (Front) & Hobbies (Back) */}
          <div
            className={`page-sheet ${currentPage >= 1 && (!dragState.isDragging || dragState.pageIndex !== 1) ? 'flipped' : ''}`}
            style={getPageStyle(1)}
            onPointerDown={(e) => handlePointerDown(e, 1)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <Cover
              handleNext={handleNext}
              handleDownloadCV={handleDownloadCV}
              navigateToPageSequentially={navigateToPageSequentially}
            />
            <Hobbies
              handlePrev={handlePrev}
            />
          </div>

          {/* SHEET 2: Skills (Front) & Education (Back) */}
          <div
            className={`page-sheet ${currentPage >= 2 && (!dragState.isDragging || dragState.pageIndex !== 2) ? 'flipped' : ''}`}
            style={getPageStyle(2)}
            onPointerDown={(e) => handlePointerDown(e, 2)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <Skills
              handleNext={handleNext}
              skillsActive={skillsActive}
            />
            <Education
              handlePrev={handlePrev}
            />
          </div>

          {/* SHEET 3: Projects (Front) & Contact (Back) */}
          <div
            className={`page-sheet ${currentPage >= 3 && (!dragState.isDragging || dragState.pageIndex !== 3) ? 'flipped' : ''}`}
            style={getPageStyle(3)}
            onPointerDown={(e) => handlePointerDown(e, 3)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <Projects
              handleNext={handleNext}
            />
            <Contact
              handlePrev={handlePrev}
              handleSendEmail={handleSendEmail}
              formData={formData}
              handleFormChange={handleFormChange}
              isSubmitting={isSubmitting}
              alert={alert}
              navigateToPageSequentially={navigateToPageSequentially}
            />
          </div>

          {/* SHEET 4: Back Cover (Front) & End (Back) */}
          <div
            className="page-sheet"
            style={{ zIndex: getZIndex(4), cursor: 'default' }}
          >
            <BackCover
              handlePrev={handlePrev}
            />
            <div className="page-side back">
              <div className="page-crease"></div>
              <div className="page-edges-effect left-edge"></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default App;
