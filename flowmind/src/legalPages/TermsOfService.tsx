import React, { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ArrowLeft, FileText } from 'lucide-react'
import flowmindLogo from '../assets/flowmind.png'
import styles from './Legal.module.css'

export default function TermsOfService() {
  const { navigate } = useApp()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Terms of Service - FlowMind'
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
            <FileText size={26} color="var(--accent, #14b8a6)" />
            <h1 className={styles.title} style={{ margin: 0 }}>Terms of Service</h1>
          </div>
          <div className={styles.effectiveDate}>
            Last updated: November 14, 2026 • Effective Date: November 14, 2026
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p className={styles.paragraph}>
              By accessing or using <strong>FlowMind</strong> at <a href="https://flowwithmind.vercel.app/" className={styles.link} target="_blank" rel="noreferrer">https://flowwithmind.vercel.app</a>, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you may not access or use our services.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Description of Service</h2>
            <p className={styles.paragraph}>
              FlowMind provides software tools for intelligent project management, real-time audio collaboration, automated task assignment, AI-generated sprint summaries, team decision logs, and GitHub repository activity tracking. We reserve the right to modify, enhance, or discontinue any feature at any time without prior notice.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. User Accounts & Responsibilities</h2>
            <ul className={styles.list}>
              <li>You must provide accurate, complete information when registering an account via email or third-party OAuth providers (e.g., Google).</li>
              <li>You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.</li>
              <li>You agree to notify us immediately of any unauthorized use or security compromise regarding your account.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Acceptable Use Policy</h2>
            <p className={styles.paragraph}>You agree not to use FlowMind to:</p>
            <ul className={styles.list}>
              <li>Violate any applicable local, state, national, or international laws or regulations.</li>
              <li>Interfere with, disrupt, or compromise the integrity or performance of the service or its underlying infrastructure.</li>
              <li>Attempt to gain unauthorized access to other team accounts, repositories, or system resources.</li>
              <li>Upload malicious code, viruses, worms, or harmful content.</li>
              <li>Engage in abusive, harassing, or deceptive behavior against other team members.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Intellectual Property</h2>
            <p className={styles.paragraph}>
              <strong>Your Content:</strong> You retain full ownership of all data, text, files, tasks, code, and materials that you upload or produce within FlowMind workspaces.
            </p>
            <p className={styles.paragraph}>
              <strong>FlowMind Property:</strong> The FlowMind software, branding, user interfaces, documentation, logos, and designs are the exclusive property of FlowMind and its creators, protected by copyright and intellectual property laws.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Third-Party Integrations</h2>
            <p className={styles.paragraph}>
              FlowMind integrates with third-party platforms including Google, GitHub, Supabase, and Agora. Your use of third-party features is subject to the respective terms and privacy policies of those providers. FlowMind is not responsible for any downtime, API modifications, or policies enforced by third-party services.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Disclaimer of Warranties</h2>
            <p className={styles.paragraph}>
              FlowMind is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the service will be uninterrupted, error-free, or entirely secure.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Limitation of Liability</h2>
            <p className={styles.paragraph}>
              To the fullest extent permitted by applicable law, FlowMind and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or business opportunities arising out of or related to your use of the service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Termination</h2>
            <p className={styles.paragraph}>
              We reserve the right to suspend or terminate your access to FlowMind at our discretion, without prior notice, if you breach these Terms or engage in conduct detrimental to other users or the platform.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Contact Information</h2>
            <p className={styles.paragraph}>
              If you have any questions or feedback regarding these Terms of Service, please contact us at:
            </p>
            <p className={styles.paragraph}>
              <strong>Email:</strong> <a href="mailto:piyushyenorkar1@gmail.com" className={styles.link}>piyushyenorkar1@gmail.com</a><br />
              <strong>Website:</strong> <a href="https://flowwithmind.vercel.app/" className={styles.link} target="_blank" rel="noreferrer">https://flowwithmind.vercel.app</a>
            </p>
          </section>
        </main>

        <footer className={styles.footerLinks}>
          <span>© 2026 FlowMind. All rights reserved.</span>
          <button className={styles.link} style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => navigate('privacy')}>
            Privacy Policy
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
