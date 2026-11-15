import React, { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ArrowLeft, Shield } from 'lucide-react'
import flowmindLogo from '../assets/flowmind.png'
import styles from './Legal.module.css'

export default function PrivacyPolicy() {
  const { navigate } = useApp()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Privacy Policy - FlowMind'
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoArea} onClick={() => navigate('landing')} title="Go to FlowMind Home">
            <img src={flowmindLogo} alt="FlowMind" className={styles.logo} />
          </div>
          <button className={styles.backBtn} onClick={() => navigate('landing')}>
            <ArrowLeft size={14} /> Back to FlowMind
          </button>
        </header>

        <main className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Shield size={26} color="var(--accent, #14b8a6)" />
            <h1 className={styles.title} style={{ margin: 0 }}>Privacy Policy</h1>
          </div>
          <div className={styles.effectiveDate}>
            Last updated: November 14, 2026 • Effective Date: November 14, 2026
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Introduction</h2>
            <p className={styles.paragraph}>
              Welcome to <strong>FlowMind</strong> ("we", "our", or "us"), hosted at <a href="https://flowwithmind.vercel.app/" className={styles.link} target="_blank" rel="noreferrer">https://flowwithmind.vercel.app</a>. FlowMind is an AI-powered project management platform built to help teams collaborate, track deliverables, log decisions, and streamline engineering workflows.
            </p>
            <p className={styles.paragraph}>
              We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, store, and share your information when you use our service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
            <p className={styles.paragraph}>
              We collect information that you voluntarily provide to us when you register on FlowMind, participate in teams, or connect third-party accounts:
            </p>
            <ul className={styles.list}>
              <li><strong>Account Credentials:</strong> Name, email address, password (securely hashed), and profile avatar.</li>
              <li><strong>Google Account Data (OAuth):</strong> When you sign in using Google, we collect your primary Google email address, your display name, and your profile picture URL to verify your identity and generate your FlowMind member profile.</li>
              <li><strong>Workspace & Project Data:</strong> Task titles, descriptions, assignees, deadlines, team decisions, meeting transcripts, and chat interactions generated during collaboration.</li>
              <li><strong>Repository Data:</strong> When linking GitHub repositories, we process public repository metadata (commits, pull requests, stars, and open issues) to display project activity metrics.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
            <p className={styles.paragraph}>We use the information we collect for legitimate product purposes:</p>
            <ul className={styles.list}>
              <li>To create and manage your user account and authenticate your sessions.</li>
              <li>To provide, personalize, and improve the FlowMind team workspace.</li>
              <li>To power AI assistant capabilities, summarize meetings, and generate workflow insights.</li>
              <li>To secure our platform, troubleshoot defects, and prevent unauthorized access or fraud.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Google API User Data & Limited Use Disclosure</h2>
            <p className={styles.paragraph}>
              FlowMind adheres strictly to Google's policies regarding third-party developer access:
            </p>
            <div className={styles.calloutBox}>
              <strong>Google API Services User Data Policy:</strong> FlowMind's use and transfer to any other app of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className={styles.link} target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </div>
            <ul className={styles.list}>
              <li>We only request read access to basic profile and email identity scopes (<code>openid</code>, <code>userinfo.email</code>, <code>userinfo.profile</code>).</li>
              <li>We do <strong>not</strong> sell, rent, or transfer your Google user data to data brokers or advertising networks.</li>
              <li>We do <strong>not</strong> use Google user data to serve targeted advertisements.</li>
              <li>We do <strong>not</strong> use your private personal data to train generalized AI or machine learning models without explicit consent.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Data Storage and Security</h2>
            <p className={styles.paragraph}>
              Your data is stored using industry-standard infrastructure powered by <strong>Supabase</strong> with PostgreSQL database encryption at rest and Transport Layer Security (TLS 1.3) in transit. Access to sensitive resources is protected by Row Level Security (RLS) policies ensuring team data is only accessible to authorized members.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Third-Party Services</h2>
            <p className={styles.paragraph}>
              FlowMind integrates with vetted service providers to deliver core application functionality:
            </p>
            <ul className={styles.list}>
              <li><strong>Supabase:</strong> Authentication, cloud database, and real-time syncing.</li>
              <li><strong>Groq / AI Inference:</strong> Language model inference for team assistants and transcript summaries.</li>
              <li><strong>Agora:</strong> Encrypted audio/video streaming for collaborative meetings.</li>
              <li><strong>Vercel:</strong> Web hosting and static asset delivery.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Your Rights & Data Deletion</h2>
            <p className={styles.paragraph}>
              You have the right to inspect, correct, export, or delete your personal information at any time. If you wish to delete your FlowMind account and remove all associated data from our servers, you may send a deletion request to <a href="mailto:piyushyenorkar1@gmail.com" className={styles.link}>piyushyenorkar1@gmail.com</a>. Requests are fulfilled within 30 days.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Contact Us</h2>
            <p className={styles.paragraph}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our team:
            </p>
            <p className={styles.paragraph}>
              <strong>Email:</strong> <a href="mailto:piyushyenorkar1@gmail.com" className={styles.link}>piyushyenorkar1@gmail.com</a><br />
              <strong>Website:</strong> <a href="https://flowwithmind.vercel.app/" className={styles.link} target="_blank" rel="noreferrer">https://flowwithmind.vercel.app</a>
            </p>
          </section>
        </main>

        <footer className={styles.footerLinks}>
          <span>© 2026 FlowMind. All rights reserved.</span>
          <button className={styles.link} style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => navigate('terms')}>
            Terms of Service
          </button>
          <span>•</span>
          <button className={styles.link} style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => navigate('contact')}>
            Contact Us
          </button>
        </footer>
      </div>
    </div>
  )
}
