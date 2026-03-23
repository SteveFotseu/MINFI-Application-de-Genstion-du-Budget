// ============================================================
// FICHIER  : src/data/registerMockData.ts
// RÔLE     : Données de référence provisoires pour le formulaire
//            d'inscription (rôles, sections, programmes).
//
// ⚠️  Ces données seront remplacées par des appels API quand
//     le back-end exposera les endpoints correspondants.
//     Ex : GET /api/v1/roles, /api/v1/sections, /api/v1/programmes
// ============================================================

import { Role, Section, Programme } from '@/types/auth';

export const MOCK_ROLES: Role[] = [
  { id: 'r1', label: 'Ordonnateur' },
  { id: 'r2', label: 'Controleur financier' },
  { id: 'r3', label: 'Comptable' },
  
];

export const MOCK_SECTIONS: Section[] = [
  { id: 's1',  code: '01', label: 'Présidence de la République' },
  { id: 's2',  code: '02', label: 'Primature' },
  { id: 's3',  code: '03', label: 'Ministère des Finances (MINFI)' },
  { id: 's4',  code: '04', label: 'Ministère du Plan et du Développement' },
  { id: 's5',  code: '05', label: 'Ministère de la Santé Publique' },
  { id: 's6',  code: '06', label: 'Ministère de l\'Éducation de Base' },
  { id: 's7',  code: '07', label: 'Ministère des Enseignements Secondaires' },
  { id: 's8',  code: '08', label: 'Ministère de l\'Enseignement Supérieur' },
  { id: 's9',  code: '09', label: 'Ministère de l\'Agriculture' },
  { id: 's10', code: '10', label: 'Ministère des Travaux Publics' },
  { id: 's11', code: '11', label: 'Ministère des Transports' },
  { id: 's12', code: '12', label: 'Ministère de l\'Eau et de l\'Énergie' },
  { id: 's13', code: '13', label: 'Ministère de la Justice' },
  { id: 's14', code: '14', label: 'Ministère de la Défense' },
  { id: 's15', code: '15', label: 'Ministère de l\'Administration Territoriale' },
  { id: 's16', code: '16', label: 'Ministère du Commerce' },
  { id: 's17', code: '17', label: 'Ministère des Mines et du Développement Industriel' },
  { id: 's18', code: '18', label: 'Ministère de la Communication' },
  { id: 's19', code: '19', label: 'Ministère des Relations Extérieures' },
  { id: 's20', code: '20', label: 'Direction Générale du Budget (DGB)' },
];

export const MOCK_PROGRAMMES: Programme[] = [
  { id: 'p1',  code: 'P-001', label: 'Gouvernance et Institutions' },
  { id: 'p2',  code: 'P-002', label: 'Gestion des Finances Publiques' },
  { id: 'p3',  code: 'P-003', label: 'Développement Rural et Agriculture' },
  { id: 'p4',  code: 'P-004', label: 'Santé Publique et Lutte contre les Maladies' },
  { id: 'p5',  code: 'P-005', label: 'Éducation de Base et Alphabétisation' },
  { id: 'p6',  code: 'P-006', label: 'Enseignement Supérieur et Recherche' },
  { id: 'p7',  code: 'P-007', label: 'Infrastructures Routières et Transport' },
  { id: 'p8',  code: 'P-008', label: 'Eau, Assainissement et Énergie' },
  { id: 'p9',  code: 'P-009', label: 'Développement Industriel et PME' },
  { id: 'p10', code: 'P-010', label: 'Sécurité Publique et Justice' },
  { id: 'p11', code: 'P-011', label: 'Environnement et Développement Durable' },
  { id: 'p12', code: 'P-012', label: 'Coopération Internationale' },
  { id: 'p13', code: 'P-013', label: 'Numérique et Innovation Technologique' },
  { id: 'p14', code: 'P-014', label: 'Culture, Sports et Loisirs' },
  { id: 'p15', code: 'P-015', label: 'Protection Sociale et Travail' },
];