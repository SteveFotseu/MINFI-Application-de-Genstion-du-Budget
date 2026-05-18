// ============================================================
// FICHIER  : src/data/nomenclatureBudgetaire.ts
// RÔLE     : Données de référence statiques de la Nomenclature
//            Budgétaire de l'État (NBE), issues du :
//            Décret N° 2019/3187/PM du 9 septembre 2019.
//
// ⚠️  CES DONNÉES SONT TEMPORAIRES.
//     Elles seront remplacées par des appels API vers la BD
//     dès que le back-end aura exposé les routes correspondantes.
//
// CONTENU :
//   1. TYPES_DE_SERVICE       — codes 2x/3x/4x/5x/6x/7x
//   2. REGIONS_CAMEROUN       — 10 régions + dpts + arrts (extrait)
//   3. DIVISIONS_FONCTIONNELLES — 10 divisions + groupes + classes
//   4. TITRES_ECONOMIQUES     — 6 titres + articles + paragraphes + rubriques
//   5. Helpers : getGroupesByDivision, getClassesByGroupe, etc.
// ============================================================

import type {
  TypeService,
  Region,
  Division,
  TitreEconomique,
} from '@/types/imputation';

// ─────────────────────────────────────────────────────────────
// 1. TYPES DE SERVICE
// Source : Art. 11 + Tableau général du type et de la catégorie
//          de service (Annexe II.1.2.1 du décret)
// Format : 2 chiffres — 1er chiffre = type, 2e chiffre = catégorie
// ─────────────────────────────────────────────────────────────
export const TYPES_DE_SERVICE: TypeService[] = [
  // ── Cabinets (2x) ──
  { code: '21', libelle: 'Secrétariats particuliers des présidences des grandes institutions' },
  { code: '22', libelle: 'Secrétariats particuliers des ministres, secrétaires d\'État, ambassadeurs' },
  { code: '23', libelle: 'Inspecteurs généraux' },
  { code: '24', libelle: 'Conseillers spéciaux et conseillers des cabinets' },
  { code: '25', libelle: 'Commissions, conseils, comités rattachés aux cabinets' },
  { code: '26', libelle: 'Services et cellules des cabinets' },
  { code: '27', libelle: 'Services et cellules des cabinets (7)' },
  { code: '28', libelle: 'Services et cellules des cabinets (8)' },
  { code: '29', libelle: 'Dépenses non réparties des services des cabinets' },
  // ── Administration générale (3x) ──
  { code: '31', libelle: 'Secrétariats généraux et services des grandes institutions' },
  { code: '32', libelle: 'Secrétariats généraux des ministères, divisions, cellules rattachées' },
  { code: '33', libelle: 'Directions et divisions centrales techniques, états-majors militaires' },
  { code: '34', libelle: 'Directions et divisions centrales de moyens' },
  { code: '35', libelle: 'Commissions, conseils, comités rattachés au secrétariat général' },
  { code: '36', libelle: 'Services et activités rattachés aux directions techniques' },
  { code: '37', libelle: 'Services et activités rattachés aux directions techniques (7)' },
  { code: '38', libelle: 'Services et activités rattachés aux directions techniques (8)' },
  { code: '39', libelle: 'Dépenses non réparties de l\'administration centrale' },
  // ── Administration déconcentrée (4x) ──
  { code: '41', libelle: 'Ambassades' },
  { code: '42', libelle: 'Gouvernorats, cours d\'appel, tribunaux de Grande Instance' },
  { code: '43', libelle: 'Préfectures, tribunaux de première instance, consulats' },
  { code: '44', libelle: 'Délégations régionales et services rattachés' },
  { code: '45', libelle: 'Délégations départementales et services rattachés' },
  { code: '46', libelle: 'Autres administrations locales, districts de santé' },
  { code: '47', libelle: 'Sous-préfectures, délégations et services d\'arrondissement' },
  { code: '48', libelle: 'Sous-préfectures, délégations et services de district, autres services' },
  { code: '49', libelle: 'Dépenses non réparties de l\'administration en province' },
  // ── Unités opérationnelles (5x) ──
  { code: '51', libelle: 'Unités techniques opérationnelles (51)' },
  { code: '52', libelle: 'Unités techniques opérationnelles (52)' },
  { code: '53', libelle: 'Unités techniques opérationnelles (53)' },
  { code: '54', libelle: 'Unités techniques opérationnelles (54)' },
  { code: '55', libelle: 'Unités techniques opérationnelles (55)' },
  { code: '56', libelle: 'Unités techniques opérationnelles (56)' },
  { code: '57', libelle: 'Unités techniques opérationnelles (57)' },
  { code: '58', libelle: 'Unités techniques opérationnelles (58)' },
  { code: '59', libelle: 'Unités techniques opérationnelles (59)' },
  // ── Agences d'exécution (6x) ──
  { code: '61', libelle: 'Agences d\'exécution de projets plurisectoriels' },
  { code: '62', libelle: 'Agences d\'exécution de projets intégrés' },
  { code: '63', libelle: 'Agences d\'exécution de projets d\'organisation ou de recherches' },
  { code: '64', libelle: 'Agences d\'exécution de projets d\'infrastructures' },
  { code: '65', libelle: 'Agences d\'exécution de projets de construction ou réhabilitation' },
  { code: '66', libelle: 'Agences d\'exécution de projets sectoriels' },
  { code: '67', libelle: 'Agences d\'exécution de projets de rénovation et d\'équipement' },
  { code: '68', libelle: 'Projets de formation et d\'encadrement' },
  { code: '69', libelle: 'Autres agences d\'exécution de projets d\'investissement' },
  // ── Administration décentralisée (7x) ──
  { code: '71', libelle: 'Fonds spéciaux' },
  { code: '72', libelle: 'Budgets annexes' },
  { code: '73', libelle: 'Établissements publics administratifs (EPA)' },
  { code: '75', libelle: 'Sociétés à capital public' },
  { code: '76', libelle: 'Sociétés d\'économie mixte' },
  { code: '77', libelle: 'Collectivités locales' },
  { code: '79', libelle: 'Autres organismes nationaux' },
];

// ─────────────────────────────────────────────────────────────
// 2. RÉGIONS, DÉPARTEMENTS ET ARRONDISSEMENTS DU CAMEROUN
// Source : Annexe II.1.2.2 du décret
// Extrait représentatif couvrant les 10 régions.
// Les données complètes seront chargées depuis la BD.
// ─────────────────────────────────────────────────────────────
export const REGIONS_CAMEROUN: Region[] = [
  {
    code: '10', libelle: 'Adamaoua',
    departements: [
      {
        code: '100', libelle: 'Djérem (Tibati)',
        arrondissements: [
          { code: '1000', libelle: 'Ngaoundal' },
          { code: '1001', libelle: 'Tibati' },
        ],
      },
      {
        code: '101', libelle: 'Faro et Déo (Tignère)',
        arrondissements: [
          { code: '1010', libelle: 'Galim-Tignère' },
          { code: '1011', libelle: 'Kontcha' },
          { code: '1012', libelle: 'Mayo-Baléo' },
          { code: '1013', libelle: 'Tignère' },
        ],
      },
      {
        code: '104', libelle: 'Vina (Ngaoundéré)',
        arrondissements: [
          { code: '1044', libelle: 'Ngaoundéré 1er' },
          { code: '1045', libelle: 'Ngaoundéré 2e' },
          { code: '1046', libelle: 'Ngaoundéré 3e' },
        ],
      },
    ],
  },
  {
    code: '11', libelle: 'Centre',
    departements: [
      {
        code: '116', libelle: 'Mfoundi (Yaoundé)',
        arrondissements: [
          { code: '1160', libelle: 'Yaoundé 1er' },
          { code: '1161', libelle: 'Yaoundé 2e' },
          { code: '1162', libelle: 'Yaoundé 3e' },
          { code: '1163', libelle: 'Yaoundé 4e' },
          { code: '1164', libelle: 'Yaoundé 5e' },
          { code: '1165', libelle: 'Yaoundé 6e' },
          { code: '1166', libelle: 'Yaoundé 7e' },
        ],
      },
      {
        code: '110', libelle: 'Haute Sanaga (Nanga-Eboko)',
        arrondissements: [
          { code: '1100', libelle: 'Bibey' },
          { code: '1101', libelle: 'Lembé-Yézoum' },
          { code: '1102', libelle: 'Mbandjock' },
          { code: '1103', libelle: 'Minta' },
          { code: '1104', libelle: 'Nanga-Eboko' },
          { code: '1105', libelle: 'Nkoteng' },
        ],
      },
    ],
  },
  {
    code: '12', libelle: 'Est',
    departements: [
      {
        code: '123', libelle: 'Lom et Djérem',
        arrondissements: [
          { code: '1231', libelle: 'Bertoua 1er' },
          { code: '1232', libelle: 'Bertoua 2e' },
          { code: '1233', libelle: 'Bétaré-Oya' },
          { code: '1234', libelle: 'Diang' },
          { code: '1235', libelle: 'Garoua-Boulaï' },
        ],
      },
    ],
  },
  {
    code: '13', libelle: 'Extrême-Nord',
    departements: [
      {
        code: '130', libelle: 'Diamaré',
        arrondissements: [
          { code: '1303', libelle: 'Maroua 1er' },
          { code: '1304', libelle: 'Maroua 2e' },
          { code: '1305', libelle: 'Maroua 3e' },
          { code: '1306', libelle: 'Méri' },
        ],
      },
    ],
  },
  {
    code: '14', libelle: 'Littoral',
    departements: [
      {
        code: '143', libelle: 'Wouri',
        arrondissements: [
          { code: '1430', libelle: 'Douala Ier' },
          { code: '1431', libelle: 'Douala IIe' },
          { code: '1432', libelle: 'Douala IIIe' },
          { code: '1433', libelle: 'Douala IVe' },
          { code: '1434', libelle: 'Douala Ve' },
          { code: '1435', libelle: 'Douala VIe' },
        ],
      },
      {
        code: '140', libelle: 'Moungo',
        arrondissements: [
          { code: '1403', libelle: 'Loum' },
          { code: '1405', libelle: 'Mbanga' },
          { code: '1409', libelle: 'Nkongsamba 1er' },
        ],
      },
    ],
  },
  {
    code: '15', libelle: 'Nord',
    departements: [
      {
        code: '150', libelle: 'Bénoué',
        arrondissements: [
          { code: '1504', libelle: 'Garoua 1er' },
          { code: '1505', libelle: 'Garoua 2e' },
          { code: '1506', libelle: 'Garoua 3e' },
        ],
      },
    ],
  },
  {
    code: '16', libelle: 'Nord-Ouest',
    departements: [
      {
        code: '164', libelle: 'Mezam',
        arrondissements: [
          { code: '1642', libelle: 'Bamenda 1er' },
          { code: '1643', libelle: 'Bamenda 2e' },
          { code: '1644', libelle: 'Bamenda 3e' },
        ],
      },
    ],
  },
  {
    code: '17', libelle: 'Ouest',
    departements: [
      {
        code: '175', libelle: 'Mifi',
        arrondissements: [
          { code: '1750', libelle: 'Bafoussam 1er' },
          { code: '1751', libelle: 'Bafoussam 2e' },
          { code: '1752', libelle: 'Bafoussam 3e' },
        ],
      },
      {
        code: '174', libelle: 'Ménoua',
        arrondissements: [
          { code: '1740', libelle: 'Dschang' },
          { code: '1741', libelle: 'Fokoué' },
        ],
      },
    ],
  },
  {
    code: '18', libelle: 'Sud',
    departements: [
      {
        code: '181', libelle: 'Mvila',
        arrondissements: [
          { code: '1812', libelle: 'Ebolowa 1er' },
          { code: '1813', libelle: 'Ebolowa 2e' },
        ],
      },
    ],
  },
  {
    code: '19', libelle: 'Sud-Ouest',
    departements: [
      {
        code: '190', libelle: 'Fako',
        arrondissements: [
          { code: '1900', libelle: 'Buea' },
          { code: '1901', libelle: 'Limbe 1er' },
          { code: '1902', libelle: 'Limbe 2e' },
          { code: '1905', libelle: 'Tiko' },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 3. CLASSIFICATIONS FONCTIONNELLES
// Source : Art. 15-16 + Annexe IV du décret
// Structure : Division (2 car.) → Groupe (1 car.) → Classe (1 car.)
// ─────────────────────────────────────────────────────────────
export const DIVISIONS_FONCTIONNELLES: Division[] = [
  {
    code: '01', libelle: 'Services généraux des administrations publiques',
    groupes: [
      {
        code: '1', libelle: 'Fonctionnement des organes exécutifs, affaires financières et étrangères',
        classes: [
          { code: '1', libelle: 'Fonctionnement des organes exécutifs et législatifs' },
          { code: '2', libelle: 'Affaires financières et fiscales' },
          { code: '3', libelle: 'Affaires étrangères' },
        ],
      },
      {
        code: '2', libelle: 'Aide économique extérieure',
        classes: [
          { code: '1', libelle: 'Aide économique aux pays en développement ou en transition' },
          { code: '2', libelle: 'Aide économique par l\'intermédiaire d\'organisations internationales' },
        ],
      },
      {
        code: '3', libelle: 'Services généraux',
        classes: [
          { code: '1', libelle: 'Services généraux de personnel' },
          { code: '2', libelle: 'Services généraux de planification et de statistique' },
          { code: '3', libelle: 'Autres services généraux' },
        ],
      },
      {
        code: '4', libelle: 'Recherche fondamentale',
        classes: [
          { code: '0', libelle: 'Recherche fondamentale' },
        ],
      },
      {
        code: '5', libelle: 'R-D concernant les services généraux des administrations publiques',
        classes: [
          { code: '0', libelle: 'R-D concernant les services généraux des administrations publiques' },
        ],
      },
      {
        code: '6', libelle: 'Services généraux des administrations publiques n.c.a',
        classes: [
          { code: '0', libelle: 'Services généraux publics n.c.a' },
        ],
      },
      {
        code: '7', libelle: 'Opérations concernant la dette publique',
        classes: [
          { code: '0', libelle: 'Opérations concernant la dette publique' },
        ],
      },
      {
        code: '8', libelle: 'Transferts de caractère général entre les administrations publiques',
        classes: [
          { code: '0', libelle: 'Transferts de caractère général entre les administrations publiques' },
        ],
      },
    ],
  },
  {
    code: '02', libelle: 'Défense',
    groupes: [
      {
        code: '1', libelle: 'Défense militaire',
        classes: [{ code: '0', libelle: 'Défense militaire' }],
      },
      {
        code: '2', libelle: 'Défense civile',
        classes: [{ code: '0', libelle: 'Défense civile' }],
      },
      {
        code: '3', libelle: 'Aide militaire à des pays étrangers',
        classes: [{ code: '0', libelle: 'Aide militaire à des pays étrangers' }],
      },
      {
        code: '4', libelle: 'R-D concernant la défense',
        classes: [{ code: '0', libelle: 'R-D concernant la défense' }],
      },
      {
        code: '5', libelle: 'Défense n.c.a',
        classes: [{ code: '0', libelle: 'Défense n.c.a' }],
      },
    ],
  },
  {
    code: '03', libelle: 'Ordre et sécurité publics',
    groupes: [
      {
        code: '1', libelle: 'Services de police',
        classes: [{ code: '0', libelle: 'Services de police' }],
      },
      {
        code: '2', libelle: 'Services de protection civile',
        classes: [{ code: '0', libelle: 'Services de protection civile' }],
      },
      {
        code: '3', libelle: 'Tribunaux',
        classes: [{ code: '0', libelle: 'Tribunaux' }],
      },
      {
        code: '4', libelle: 'Administration pénitentiaire',
        classes: [{ code: '0', libelle: 'Administration pénitentiaire' }],
      },
      {
        code: '5', libelle: 'R-D concernant l\'ordre et la sécurité publics',
        classes: [{ code: '0', libelle: 'R-D concernant l\'ordre et la sécurité publics' }],
      },
      {
        code: '6', libelle: 'Ordre et sécurité publics n.c.a',
        classes: [{ code: '0', libelle: 'Ordre et sécurité publics n.c.a' }],
      },
    ],
  },
  {
    code: '04', libelle: 'Affaires économiques',
    groupes: [
      {
        code: '1', libelle: 'Tutelle de l\'économie générale, des échanges et de l\'emploi',
        classes: [
          { code: '1', libelle: 'Tutelle de l\'économie générale et des échanges' },
          { code: '2', libelle: 'Affaires générales concernant l\'emploi' },
        ],
      },
      {
        code: '2', libelle: 'Agriculture, sylviculture, pêche et chasse',
        classes: [
          { code: '1', libelle: 'Agriculture' },
          { code: '2', libelle: 'Sylviculture' },
          { code: '3', libelle: 'Pêche et chasse' },
        ],
      },
      {
        code: '3', libelle: 'Combustibles et énergie',
        classes: [
          { code: '1', libelle: 'Charbon et autres combustibles minéraux solides' },
          { code: '2', libelle: 'Pétrole et gaz naturel' },
          { code: '3', libelle: 'Combustibles nucléaires' },
          { code: '4', libelle: 'Autres combustibles' },
          { code: '5', libelle: 'Électricité' },
          { code: '6', libelle: 'Énergie non électrique' },
        ],
      },
      {
        code: '4', libelle: 'Industries extractives et manufacturières, construction',
        classes: [
          { code: '1', libelle: 'Extraction de ressources minérales autres que combustibles' },
          { code: '2', libelle: 'Industries manufacturières' },
          { code: '3', libelle: 'Construction' },
        ],
      },
      {
        code: '5', libelle: 'Transports',
        classes: [
          { code: '1', libelle: 'Transports routiers' },
          { code: '2', libelle: 'Transports par voie d\'eau' },
          { code: '3', libelle: 'Transports par voie ferrée' },
          { code: '4', libelle: 'Transports aériens' },
          { code: '5', libelle: 'Pipelines et systèmes de transports divers' },
        ],
      },
      {
        code: '6', libelle: 'Communications',
        classes: [
          { code: '0', libelle: 'Communication' },
        ],
      },
      {
        code: '7', libelle: 'Autres branches d\'activité',
        classes: [
          { code: '1', libelle: 'Distribution, entrepôts et magasins' },
          { code: '2', libelle: 'Hôtellerie et restauration' },
          { code: '3', libelle: 'Tourisme' },
          { code: '4', libelle: 'Projets de développement polyvalents' },
        ],
      },
      {
        code: '9', libelle: 'Affaires économiques n.c.a',
        classes: [
          { code: '0', libelle: 'Affaires économiques n.c.a' },
        ],
      },
    ],
  },
  {
    code: '05', libelle: 'Protection de l\'environnement',
    groupes: [
      { code: '1', libelle: 'Gestion des déchets', classes: [{ code: '0', libelle: 'Gestion des déchets' }] },
      { code: '2', libelle: 'Gestion des eaux usées', classes: [{ code: '0', libelle: 'Gestion des eaux usées' }] },
      { code: '3', libelle: 'Lutte contre la pollution', classes: [{ code: '0', libelle: 'Lutte contre la pollution' }] },
      { code: '4', libelle: 'Préservation de la biodiversité et protection de la nature', classes: [{ code: '0', libelle: 'Préservation de la biodiversité et protection de la nature' }] },
      { code: '5', libelle: 'R-D concernant la protection de l\'environnement', classes: [{ code: '0', libelle: 'R-D concernant la protection de l\'environnement' }] },
      { code: '6', libelle: 'Protection de l\'environnement n.c.a', classes: [{ code: '0', libelle: 'Protection de l\'environnement n.c.a' }] },
    ],
  },
  {
    code: '06', libelle: 'Logements et équipements collectifs',
    groupes: [
      { code: '1', libelle: 'Logement', classes: [{ code: '0', libelle: 'Logement' }] },
      { code: '2', libelle: 'Équipements collectifs', classes: [{ code: '0', libelle: 'Équipements collectifs' }] },
      { code: '3', libelle: 'Alimentation en eau', classes: [{ code: '0', libelle: 'Alimentation en eau' }] },
      { code: '4', libelle: 'Éclairage public', classes: [{ code: '0', libelle: 'Éclairage public' }] },
      { code: '5', libelle: 'R-D dans le domaine du logement et des équipements collectifs', classes: [{ code: '0', libelle: 'R-D dans le domaine du logement et des équipements collectifs' }] },
      { code: '6', libelle: 'Logements et équipements collectifs n.c.a', classes: [{ code: '0', libelle: 'Logements et équipements collectifs n.c.a' }] },
    ],
  },
  {
    code: '07', libelle: 'Santé',
    groupes: [
      {
        code: '1', libelle: 'Produits, appareils et matériels médicaux',
        classes: [
          { code: '1', libelle: 'Produits pharmaceutiques' },
          { code: '2', libelle: 'Produits médicaux divers' },
          { code: '3', libelle: 'Appareils et matériel thérapeutiques' },
        ],
      },
      {
        code: '2', libelle: 'Services ambulatoires',
        classes: [
          { code: '1', libelle: 'Services de médecine générale' },
          { code: '2', libelle: 'Services de médecine spécialisée' },
          { code: '3', libelle: 'Services dentaires' },
          { code: '4', libelle: 'Services paramédicaux' },
        ],
      },
      {
        code: '3', libelle: 'Services hospitaliers',
        classes: [
          { code: '1', libelle: 'Services hospitaliers généraux' },
          { code: '2', libelle: 'Services hospitaliers spécialisés' },
          { code: '3', libelle: 'Services des dispensaires et des maternités' },
          { code: '4', libelle: 'Services des maisons de repos et de santé' },
        ],
      },
      { code: '4', libelle: 'Services de santé publique', classes: [{ code: '0', libelle: 'Services de santé publique' }] },
      { code: '5', libelle: 'R-D dans le domaine de la santé', classes: [{ code: '0', libelle: 'R-D dans le domaine de la santé' }] },
      { code: '6', libelle: 'Santé n.c.a', classes: [{ code: '0', libelle: 'Santé n.c.a' }] },
    ],
  },
  {
    code: '08', libelle: 'Loisirs, culture et culte',
    groupes: [
      { code: '1', libelle: 'Services récréatifs et sportifs', classes: [{ code: '0', libelle: 'Services récréatifs et sportifs' }] },
      { code: '2', libelle: 'Services culturels', classes: [{ code: '0', libelle: 'Services culturels' }] },
      { code: '3', libelle: 'Services de radiodiffusion, télévision et édition', classes: [{ code: '0', libelle: 'Services de radiodiffusion, télévision et édition' }] },
      { code: '4', libelle: 'Culte et autres services communautaires', classes: [{ code: '0', libelle: 'Culte et autres services communautaires' }] },
      { code: '5', libelle: 'R-D dans le domaine des loisirs, culture et culte', classes: [{ code: '0', libelle: 'R-D dans le domaine des loisirs, culture et culte' }] },
      { code: '6', libelle: 'Loisirs, culture et culte n.c.a', classes: [{ code: '0', libelle: 'Loisirs, culture et culte n.c.a' }] },
    ],
  },
  {
    code: '09', libelle: 'Enseignement',
    groupes: [
      {
        code: '1', libelle: 'Enseignement préélémentaire et primaire',
        classes: [
          { code: '1', libelle: 'Enseignement préélémentaire' },
          { code: '2', libelle: 'Enseignement primaire' },
        ],
      },
      {
        code: '2', libelle: 'Enseignement secondaire',
        classes: [
          { code: '1', libelle: 'Premier cycle de l\'enseignement secondaire' },
          { code: '2', libelle: 'Deuxième cycle de l\'enseignement secondaire' },
        ],
      },
      { code: '3', libelle: 'Enseignement post-secondaire non supérieur', classes: [{ code: '0', libelle: 'Enseignement post-secondaire non supérieur' }] },
      {
        code: '4', libelle: 'Enseignement supérieur',
        classes: [
          { code: '1', libelle: 'Enseignement supérieur non doctoral' },
          { code: '2', libelle: 'Enseignement supérieur doctoral' },
        ],
      },
      { code: '5', libelle: 'Enseignement non défini par niveau', classes: [{ code: '0', libelle: 'Enseignement non défini par niveau' }] },
      { code: '6', libelle: 'Services annexes à l\'enseignement', classes: [{ code: '0', libelle: 'Services annexes à l\'enseignement' }] },
      { code: '7', libelle: 'R-D dans le domaine de l\'enseignement', classes: [{ code: '0', libelle: 'R-D dans le domaine de l\'enseignement' }] },
      { code: '8', libelle: 'Enseignement n.c.a', classes: [{ code: '0', libelle: 'Enseignement n.c.a' }] },
    ],
  },
  {
    code: '10', libelle: 'Protection sociale',
    groupes: [
      {
        code: '1', libelle: 'Maladie et invalidité',
        classes: [
          { code: '1', libelle: 'Maladie' },
          { code: '2', libelle: 'Invalidité' },
        ],
      },
      { code: '2', libelle: 'Vieillesse', classes: [{ code: '0', libelle: 'Vieillesse' }] },
      { code: '3', libelle: 'Survivants', classes: [{ code: '0', libelle: 'Survivants' }] },
      { code: '4', libelle: 'Famille et enfants', classes: [{ code: '0', libelle: 'Famille et enfants' }] },
      { code: '5', libelle: 'Chômage', classes: [{ code: '0', libelle: 'Chômage' }] },
      { code: '6', libelle: 'Logement', classes: [{ code: '0', libelle: 'Logement' }] },
      { code: '7', libelle: 'Exclusion sociale n.c.a', classes: [{ code: '0', libelle: 'Exclusion sociale n.c.a' }] },
      { code: '8', libelle: 'R-D dans le domaine de la protection sociale', classes: [{ code: '0', libelle: 'R-D dans le domaine de la protection sociale' }] },
      { code: '9', libelle: 'Protection sociale n.c.a', classes: [{ code: '0', libelle: 'Protection sociale n.c.a' }] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 4. CLASSIFICATIONS ÉCONOMIQUES
// Source : Art. 17-19 + Annexe V.3 du décret (Plan Comptable État)
// Structure : Titre (1 car.) → Article (2 car.) → Paragraphe (1 car.) → Rubrique (2 car.)
// ─────────────────────────────────────────────────────────────
export const TITRES_ECONOMIQUES: TitreEconomique[] = [
  {
    code: '1', libelle: 'Charges financières de la dette',
    articles: [
      {
        code: '67', libelle: 'Charges financières de la dette',
        paragraphes: [
          {
            code: '1', libelle: 'Intérêts et frais financiers sur la dette',
            rubriques: [
              { code: '71', libelle: 'Intérêts sur dette intérieure' },
              { code: '72', libelle: 'Intérêts sur dette extérieure' },
            ],
          },
          {
            code: '2', libelle: 'Pertes sur cessions de titres de placement',
            rubriques: [
              { code: '00', libelle: 'Pertes sur cessions de titres' },
            ],
          },
          {
            code: '6', libelle: 'Pertes de changes',
            rubriques: [
              { code: '00', libelle: 'Pertes de changes' },
            ],
          },
          {
            code: '9', libelle: 'Autres intérêts et frais financiers',
            rubriques: [
              { code: '00', libelle: 'Autres intérêts et frais financiers' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '2', libelle: 'Dépenses de personnel',
    articles: [
      {
        code: '66', libelle: 'Charges de personnel',
        paragraphes: [
          {
            code: '0', libelle: 'Traitements bruts du personnel sous statut général',
            rubriques: [
              { code: '00', libelle: 'Salaire brut du personnel sous statut général' },
              { code: '01', libelle: 'Indemnités liées au statut général' },
              { code: '02', libelle: 'Avantages en nature liés à la fonction' },
              { code: '03', libelle: 'Prise en charge des nouveaux postes à créer' },
            ],
          },
          {
            code: '1', libelle: 'Traitements bruts du personnel sous statut particulier',
            rubriques: [
              { code: '10', libelle: 'Salaire brut du personnel sous statut particulier' },
              { code: '11', libelle: 'Indemnités liées aux statuts particuliers' },
              { code: '12', libelle: 'Avantages en nature liés à la fonction' },
            ],
          },
          {
            code: '4', libelle: 'Traitements bruts du personnel hors statut',
            rubriques: [
              { code: '40', libelle: 'Contractuels' },
              { code: '41', libelle: 'Décisionnaires et auxiliaires' },
              { code: '42', libelle: 'Cotisations CNPS sur traitements des contractuels' },
            ],
          },
          {
            code: '5', libelle: 'Primes, gratifications et autres indemnités hors solde',
            rubriques: [
              { code: '50', libelle: 'Heures supplémentaires' },
              { code: '51', libelle: 'Gratifications' },
              { code: '52', libelle: 'Indemnités spécifiques' },
              { code: '53', libelle: 'Indemnités forfaitaires de tournées et de risques' },
              { code: '56', libelle: 'Primes de rendement' },
              { code: '57', libelle: 'Primes pour travaux spéciaux' },
            ],
          },
          {
            code: '9', libelle: 'Autres dépenses de personnel',
            rubriques: [
              { code: '90', libelle: 'Allocations familiales' },
              { code: '91', libelle: 'Assistance décès' },
              { code: '93', libelle: 'Aides et secours exceptionnels au personnel' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '3', libelle: 'Dépenses de biens et services',
    articles: [
      {
        code: '60', libelle: 'Achats de biens',
        paragraphes: [
          {
            code: '1', libelle: 'Matières, matériels et fournitures',
            rubriques: [
              { code: '10', libelle: 'Fournitures de bureau et petit entretien (unités déconcentrées)' },
              { code: '11', libelle: 'Achats de fournitures et petit entretien de bureau' },
              { code: '12', libelle: 'Achat de matériels courants informatiques et bureautiques' },
              { code: '13', libelle: 'Achats de mobilier de bureau' },
              { code: '14', libelle: 'Achats d\'autres fournitures courantes des services' },
            ],
          },
          {
            code: '5', libelle: 'Eau, électricité, gaz et autres sources d\'énergie',
            rubriques: [
              { code: '50', libelle: 'Abonnements et consommation d\'eau' },
              { code: '51', libelle: 'Abonnements et consommation d\'électricité' },
              { code: '53', libelle: 'Consommation de gaz et autres énergies' },
              { code: '56', libelle: 'Carburants et lubrifiants des véhicules automobiles' },
            ],
          },
          {
            code: '6', libelle: 'Matériel et fournitures spécifiques',
            rubriques: [
              { code: '60', libelle: 'Documentation technique, abonnements de presse' },
              { code: '62', libelle: 'Pièces de rechange' },
              { code: '63', libelle: 'Achats de vaccins ou tests et autres préventions' },
              { code: '64', libelle: 'Fournitures pédagogiques et scolaires' },
              { code: '66', libelle: 'Achats de médicaments et fournitures médicales' },
              { code: '67', libelle: 'Frais d\'habillement spécifiques aux activités des services' },
            ],
          },
        ],
      },
      {
        code: '61', libelle: 'Achat de services',
        paragraphes: [
          {
            code: '1', libelle: 'Frais de transport et de mission',
            rubriques: [
              { code: '10', libelle: 'Frais de transport des agents en mission à l\'intérieur' },
              { code: '11', libelle: 'Frais de transport des agents en mission à l\'étranger' },
              { code: '15', libelle: 'Indemnités de mission des agents à l\'intérieur' },
              { code: '16', libelle: 'Indemnités de mission des agents à l\'étranger' },
            ],
          },
          {
            code: '2', libelle: 'Loyers',
            rubriques: [
              { code: '20', libelle: 'Locations de véhicules' },
              { code: '21', libelle: 'Loyers des immeubles des services publics' },
              { code: '22', libelle: 'Baux administratifs des logements de fonction' },
              { code: '25', libelle: 'Locations des salles de congrès et de conférences' },
            ],
          },
          {
            code: '3', libelle: 'Honoraires et études',
            rubriques: [
              { code: '30', libelle: 'Honoraires et frais annexes' },
              { code: '31', libelle: 'Études et recherches' },
            ],
          },
          {
            code: '4', libelle: 'Entretien et maintenance',
            rubriques: [
              { code: '40', libelle: 'Entretien ordinaire des bâtiments' },
              { code: '43', libelle: 'Entretien et maintenance des machines et matériels techniques' },
              { code: '45', libelle: 'Entretien et réparation des véhicules courants' },
              { code: '47', libelle: 'Grosses réparations des bâtiments et nettoyage industriel' },
            ],
          },
          {
            code: '7', libelle: 'Frais de relations publiques et communication',
            rubriques: [
              { code: '70', libelle: 'Frais de représentation, frais d\'hôtel des cabinets' },
              { code: '71', libelle: 'Frais de réception' },
              { code: '72', libelle: 'Fêtes officielles et cérémonies' },
              { code: '74', libelle: 'Abonnements téléphone, fax, télex, portables' },
              { code: '75', libelle: 'Sites web, abonnements et consommations internet' },
            ],
          },
          {
            code: '8', libelle: 'Frais de formation du personnel',
            rubriques: [
              { code: '80', libelle: 'Frais de formation, stages' },
              { code: '81', libelle: 'Organisation de séminaires, colloques et conférences' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '4', libelle: 'Dépenses de transfert',
    articles: [
      {
        code: '63', libelle: 'Subventions',
        paragraphes: [
          {
            code: '0', libelle: 'Subventions d\'équilibre aux établissements marchands',
            rubriques: [
              { code: '00', libelle: 'Subventions de soutien de prix' },
              { code: '03', libelle: 'Subventions aux entreprises d\'État' },
              { code: '04', libelle: 'Subventions aux entreprises privées' },
            ],
          },
          {
            code: '1', libelle: 'Subventions de fonctionnement aux établissements non marchands',
            rubriques: [
              { code: '10', libelle: 'Subventions de fonctionnement aux EPA et autres organismes' },
              { code: '11', libelle: 'Subventions de fonctionnement aux ONG et associations' },
              { code: '12', libelle: 'Subventions de fonctionnement aux formations sanitaires' },
              { code: '13', libelle: 'Subventions de fonctionnement aux universités et grandes écoles' },
              { code: '14', libelle: 'Subventions de fonctionnement aux établissements scolaires' },
            ],
          },
          {
            code: '2', libelle: 'Subventions d\'équipement',
            rubriques: [
              { code: '20', libelle: 'Subventions en capital aux EPA et autres organismes' },
              { code: '21', libelle: 'Subventions en capital aux entreprises d\'État' },
              { code: '25', libelle: 'Subventions en capital aux universités et grandes écoles' },
              { code: '26', libelle: 'Subventions en capital aux établissements scolaires' },
            ],
          },
        ],
      },
      {
        code: '64', libelle: 'Transferts',
        paragraphes: [
          {
            code: '0', libelle: 'Prestations sociales',
            rubriques: [
              { code: '00', libelle: 'Pensions civiles' },
              { code: '01', libelle: 'Pensions militaires' },
              { code: '04', libelle: 'Capital décès' },
              { code: '05', libelle: 'Frais d\'hospitalisation d\'urgence et d\'évacuation sanitaire' },
              { code: '06', libelle: 'Aides et secours' },
            ],
          },
          {
            code: '1', libelle: 'Transferts courants aux autres unités administratives',
            rubriques: [
              { code: '10', libelle: 'Transferts aux collectivités locales' },
              { code: '11', libelle: 'Transferts au fonds routier' },
              { code: '15', libelle: 'Transferts aux autres unités administratives' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '5', libelle: 'Dépenses d\'investissement',
    articles: [
      {
        code: '21', libelle: 'Immobilisations incorporelles',
        paragraphes: [
          {
            code: '1', libelle: 'Frais de recherche et de développement',
            rubriques: [{ code: '00', libelle: 'Frais de recherche et de développement' }],
          },
          {
            code: '3', libelle: 'Conception de systèmes d\'organisation — Progiciels',
            rubriques: [{ code: '00', libelle: 'Progiciels et systèmes d\'information' }],
          },
        ],
      },
      {
        code: '23', libelle: 'Acquisitions, constructions et grosses réparations des immeubles',
        paragraphes: [
          {
            code: '1', libelle: 'Bâtiments administratifs à usage de bureau',
            rubriques: [
              { code: '10', libelle: 'Bâtiments administratifs non résidentiels à usage de bureau' },
              { code: '11', libelle: 'Bâtiments destinés aux hôpitaux et centres de santé' },
              { code: '12', libelle: 'Bâtiments destinés aux salles de classe' },
              { code: '15', libelle: 'Bâtiments destinés à d\'autres usages de services publics' },
            ],
          },
          {
            code: '5', libelle: 'Infrastructures',
            rubriques: [
              { code: '00', libelle: 'Routes et autoroutes' },
              { code: '01', libelle: 'Ponts et ouvrages d\'art' },
              { code: '02', libelle: 'Barrages et ouvrages hydrauliques' },
            ],
          },
        ],
      },
      {
        code: '24', libelle: 'Acquisitions et grosses réparations du matériel et mobilier',
        paragraphes: [
          {
            code: '2', libelle: 'Matériel informatique de bureau',
            rubriques: [
              { code: '00', libelle: 'Ordinateurs et serveurs' },
              { code: '01', libelle: 'Périphériques et accessoires informatiques' },
            ],
          },
          {
            code: '3', libelle: 'Matériel de transport',
            rubriques: [
              { code: '31', libelle: 'Matériels de transport de service et de fonction' },
              { code: '32', libelle: 'Matériels de transport en commun et de marchandises' },
            ],
          },
          {
            code: '4', libelle: 'Matériel et outillage technique',
            rubriques: [
              { code: '00', libelle: 'Matériel médical et de laboratoire' },
              { code: '01', libelle: 'Matériel agricole et d\'élevage' },
              { code: '02', libelle: 'Autre matériel technique spécialisé' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '6', libelle: 'Autres dépenses',
    articles: [
      {
        code: '65', libelle: 'Charges exceptionnelles',
        paragraphes: [
          {
            code: '1', libelle: 'Annulations de produits constatés — admission en non-valeur',
            rubriques: [{ code: '00', libelle: 'Annulations de produits constatés au cours des années antérieures' }],
          },
          {
            code: '2', libelle: 'Condamnations et transactions',
            rubriques: [{ code: '00', libelle: 'Condamnations et transactions judiciaires' }],
          },
          {
            code: '8', libelle: 'Autres charges exceptionnelles',
            rubriques: [{ code: '00', libelle: 'Autres charges exceptionnelles' }],
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 5. HELPERS — FONCTIONS DE NAVIGATION DANS LES DONNÉES
// Ces fonctions permettent de filtrer les sous-listes en cascade
// dans le formulaire de saisie de l'imputation.
// ─────────────────────────────────────────────────────────────

/**
 * Retourne les groupes d'une division donnée.
 * Utilisé pour alimenter le 2e sélecteur de la classification fonctionnelle.
 */
export function getGroupesByDivision(codeDivision: string) {
  return DIVISIONS_FONCTIONNELLES
    .find(d => d.code === codeDivision)
    ?.groupes ?? [];
}

/**
 * Retourne les classes d'un groupe dans une division donnée.
 * Utilisé pour alimenter le 3e sélecteur de la classification fonctionnelle.
 */
export function getClassesByGroupe(codeDivision: string, codeGroupe: string) {
  return getGroupesByDivision(codeDivision)
    .find(g => g.code === codeGroupe)
    ?.classes ?? [];
}

/**
 * Retourne les articles d'un titre économique donné.
 */
export function getArticlesByTitre(codeTitre: string) {
  return TITRES_ECONOMIQUES
    .find(t => t.code === codeTitre)
    ?.articles ?? [];
}

/**
 * Retourne les paragraphes d'un article dans un titre donné.
 */
export function getParagraphesByArticle(codeTitre: string, codeArticle: string) {
  return getArticlesByTitre(codeTitre)
    .find(a => a.code === codeArticle)
    ?.paragraphes ?? [];
}

/**
 * Retourne les rubriques d'un paragraphe dans un article/titre donné.
 */
export function getRubriquesByParagraphe(
  codeTitre: string,
  codeArticle: string,
  codeParagraphe: string,
) {
  return getParagraphesByArticle(codeTitre, codeArticle)
    .find(p => p.code === codeParagraphe)
    ?.rubriques ?? [];
}

/**
 * Retourne les départements d'une région donnée.
 */
export function getDepartementsByRegion(codeRegion: string) {
  return REGIONS_CAMEROUN
    .find(r => r.code === codeRegion)
    ?.departements ?? [];
}

/**
 * Retourne les arrondissements d'un département dans une région donnée.
 */
export function getArrondissementsByDepartement(
  codeRegion: string,
  codeDepartement: string,
) {
  return getDepartementsByRegion(codeRegion)
    .find(d => d.code === codeDepartement)
    ?.arrondissements ?? [];
}

/**
 * Calcule le prochain code d'action disponible pour un programme.
 * Le code s'incrémente séquentiellement : "0", "1", "2"... jusqu'à "9".
 * @param actionsExistantes - Liste des actions déjà créées pour ce programme
 */
export function getNextCodeAction(actionsExistantes: { code: string }[]): string {
  if (actionsExistantes.length === 0) return '0';
  const max = Math.max(...actionsExistantes.map(a => parseInt(a.code, 10)));
  return String(max + 1);
}

/**
 * Calcule le prochain numéro d'ordre disponible pour une combinaison
 * (type de service + localisation).
 * @param unitesExistantes - Unités déjà répertoriées pour ce couple
 */
export function getNextNumeroOrdre(unitesExistantes: { numeroOrdre: string }[]): string {
  if (unitesExistantes.length === 0) return '01';
  const max = Math.max(...unitesExistantes.map(u => parseInt(u.numeroOrdre, 10)));
  return String(max + 1).padStart(2, '0');
}

// ─────────────────────────────────────────────────────────────
// 6. FAKES DATA — PROGRAMMES ET ACTIONS (pour développement)
// Seront remplacés par l'API /api/referentiel/programmes
// ─────────────────────────────────────────────────────────────
export const FAKE_PROGRAMMES = [
  {
    id: 'prog-001',
    code: '232',
    libelle: 'Gestion budgétaire et financière',
    actions: [
      { id: 'act-001', code: '0', libelle: 'Élaboration et exécution du budget', programmeId: 'prog-001' },
      { id: 'act-002', code: '1', libelle: 'Contrôle et suivi de l\'exécution', programmeId: 'prog-001' },
    ],
  },
  {
    id: 'prog-002',
    code: '233',
    libelle: 'Mobilisation des ressources de l\'État',
    actions: [
      { id: 'act-003', code: '0', libelle: 'Recettes fiscales et douanières', programmeId: 'prog-002' },
      { id: 'act-004', code: '1', libelle: 'Recettes non fiscales', programmeId: 'prog-002' },
    ],
  },
  {
    id: 'prog-003',
    code: '234',
    libelle: 'Trésorerie et comptabilité publique',
    actions: [
      { id: 'act-005', code: '0', libelle: 'Gestion de la trésorerie', programmeId: 'prog-003' },
    ],
  },
];