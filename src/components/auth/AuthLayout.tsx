// ============================================================
// FICHIER  : src/components/auth/AuthLayout.tsx
// ============================================================

import React from 'react';
import Link  from 'next/link';
import AuthHeader from './AuthHeader';

interface AuthLayoutProps {
  title:     string;
  subtitle:  string;
  children:  React.ReactNode;
  /** Si true, la carte s'élargit à 620px (page inscription) */
  wide?:     boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children, wide = false }) => {
  return (
    <div className="auth-page">
      <AuthHeader />

      <main className="auth-main">
        <div
          className="auth-card"
          style={wide ? { maxWidth: 640 } : undefined}
        >
          <div className="auth-card__header">
            <h2 className="auth-card__title">{title}</h2>
            <p  className="auth-card__subtitle">{subtitle}</p>
          </div>

          <div className="auth-card__body">
            {children}
          </div>
        </div>

        <footer className="auth-footer">
          <p>© {new Date().getFullYear()} MINFI – République du Cameroun</p>
          <p>
            <Link href="/aide"    className="auth-footer__link">Aide</Link>
            {' · '}
            <Link href="/contact" className="auth-footer__link">Contact</Link>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AuthLayout;