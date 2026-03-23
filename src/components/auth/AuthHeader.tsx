// ============================================================
// FICHIER  : src/components/auth/AuthHeader.tsx
// RÔLE     : En-tête institutionnel affiché EN HAUT de toutes
//            les pages d'authentification, au-dessus du formulaire.
//            Contient :
//            - Logo MINFI (gauche)
//            - Textes officiels (centre)
//            - Drapeau camerounais (droite)
//            - Bandes tricolores en bas avec étoile sur le jaune
// ============================================================

import React from 'react';
import Image from 'next/image';

/**
 * En-tête de marque GBE-MINFI.
 * Partagé par toutes les pages d'authentification via AuthLayout.
 */
const AuthHeader: React.FC = () => {
  return (
    <header className="auth-header">

      {/* ── Motifs lumineux en arrière-plan (dégradés radiaux) ── */}
      <div className="auth-header__bg" aria-hidden="true" />

      {/* ── Bandes tricolores camerounaises en bas du header ── */}
      <div className="auth-header__stripes" aria-hidden="true">

        {/* Bande verte */}
        <div className="stripe stripe--green" />

        {/* Bande rouge avec étoile jaune au centre */}
        <div className="stripe stripe--red">
          <span className="stripe__star">
            <svg
              viewBox="0 0 24 24"
              height="8"
              width="8"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <polygon
                fill="#FCD116"
                points="
                  12,2
                  15.09,8.26
                  22,9.27
                  17,14.14
                  18.18,21.02
                  12,17.77
                  5.82,21.02
                  7,14.14
                  2,9.27
                  8.91,8.26
                "
              />
            </svg>
          </span>
        </div>

        {/* Bande jaune */}
        <div className="stripe stripe--yellow" />

      </div>

      {/* ── Contenu principal : logo | textes | drapeau ── */}
      <div className="auth-header__content">

        {/* Drapeau camerounais — remplacer .svg par .png officiel si disponible */}
        <div className="auth-header__flag-wrap">
          <Image
            src="/images/cameroon_flag.jpg"
            alt="Drapeau de la République du Cameroun"
            width={72}
            height={48}
            className="auth-header__flag"
          />
        </div>
        

        {/* Bloc de textes institutionnels centré */}
        <div className="auth-header__texts">

          {/* République */}
          <p className="auth-header__republic">République du Cameroun</p>

          {/* Devise nationale */}
          <p className="auth-header__motto">Paix – Travail – Patrie</p>

          {/* Séparateur tricolore décoratif avec étoile jaune sur le rouge */}
          <div className="auth-header__divider" aria-hidden="true">
            <div className="divider__stripe divider__stripe--green" />
            <div className="divider__stripe divider__stripe--red">
              <svg
                viewBox="0 0 24 24"
                className="divider__star"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon
                  fill="#FCD116"
                  points="
                    12,2
                    15.09,8.26
                    22,9.27
                    17,14.14
                    18.18,21.02
                    12,17.77
                    5.82,21.02
                    7,14.14
                    2,9.27
                    8.91,8.26
                  "
                />
              </svg>
            </div>
            <div className="divider__stripe divider__stripe--yellow" />
          </div>

          {/* Nom du ministère */}
          <h1 className="auth-header__ministry">Ministère des Finances</h1>

          {/* Nom de l'application */}
          <p className="auth-header__app">Direction Générale du Budget de l&apos;État</p>

        </div>

       

         {/* Logo MINFI — remplacer .svg par .png officiel si disponible */}
        <div className="auth-header__logo-wrap">
          <Image
            src="/images/logo-minfi.png"
            alt="Logo du Ministère des Finances du Cameroun – MINFI"
            width={80}
            height={80}
            priority
            className="auth-header__logo"
          />
        </div>


      </div>
    </header>
  );
};

export default AuthHeader;