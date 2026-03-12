import { MainLayout } from '@/components/layout/MainLayout';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import './Contact.css';

/* Business hours data */
const hours = [
  { day: 'Mon - Fri', hours: '9:00 AM - 6:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
  { day: 'Holidays', hours: 'By Appointment' },
];

export default function Contact() {
  return (
    <MainLayout snap>
      {/* ===== Section 1: Hero header ===== */}
      <section className="snap-section contact-hero-section">
        <div className="contact-hero-bg" />
        <div className="contact-hero-content">
          <span className="contact-label">Get in Touch</span>
          <h1 className="contact-hero-title">Let's Create Together</h1>
          <p className="contact-hero-desc">
            Whether you need specific fabric specifications or custom textile development,
            our team is ready to assist you.
          </p>
        </div>
      </section>

      {/* ===== Section 2: Contact info + consultation ===== */}
      <section className="snap-section contact-info-section">
        <div className="contact-grid-inner">

          {/* Left: contact details */}
          <div className="contact-info">
            <h2 className="contact-info-title">Contact Information</h2>
            <div className="contact-info-items">
              <div className="contact-info-item">
                <div className="contact-icon-wrap"><MapPin /></div>
                <div>
                  <h3 className="contact-info-label">Mill Address</h3>
                  <p className="contact-info-text">123 Textile Industrial Zone<br />Manufacturing District, 54000<br />Pakistan</p>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon-wrap"><Phone /></div>
                <div>
                  <h3 className="contact-info-label">Phone</h3>
                  <p className="contact-info-text">+92 42 123 4567</p>
                  <p className="contact-info-subtext">Mon-Sat: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon-wrap"><Mail /></div>
                <div>
                  <h3 className="contact-info-label">Email</h3>
                  <p className="contact-info-text">sales@fanaarfabrics.com</p>
                  <p className="contact-info-text">inquiry@fanaarfabrics.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: consultation card */}
          <div className="consultation-card">
            <div className="consultation-header">
              <Calendar />
              <h2 className="consultation-title">Book a Consultation</h2>
            </div>
            <p className="consultation-text">
              Schedule a virtual meeting with our textile experts to discuss your requirements,
              share samples, and find the perfect fabric.
            </p>
            <ul className="consultation-list">
              <li><span className="consultation-bullet" />30-minute video consultation</li>
              <li><span className="consultation-bullet" />Technical specification review</li>
              <li><span className="consultation-bullet" />Sample arrangement discussion</li>
            </ul>
            <button
              onClick={() => window.open('https://calendar.google.com/calendar/appointments', '_blank')}
              className="consultation-btn"
            >
              <Calendar /> Schedule on Google Meet
            </button>
          </div>
        </div>
      </section>

      {/* ===== Section 3: Business hours ===== */}
      <section className="snap-section contact-hours-section">
        <div className="contact-hours-inner">
          <h2 className="contact-hours-title">Business Hours</h2>
          <div className="contact-hours-grid">
            {hours.map((item, i) => (
              <div key={item.day} className="contact-hours-item" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="contact-hours-day">{item.day}</p>
                <p className="contact-hours-time">{item.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
