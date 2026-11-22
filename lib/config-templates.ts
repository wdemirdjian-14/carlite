// Modèles de catégories prédéfinis pour accélérer la création du configurateur.
// Chaque modèle crée une catégorie et ses options en un clic. L'admin peut ensuite
// ajouter / retirer / modifier librement les options générées.

export type ConfigTemplateOption = {
  name: string;
  priceModifier?: number;
  colorHex?: string;
  description?: string;
};

export type ConfigTemplate = {
  key: string;
  label: string;
  icon: string; // doit correspondre à ICON_MAP du config-manager
  selectionType: 'radio' | 'checkbox' | 'dropdown';
  required?: boolean;
  description?: string;
  summary: string; // court résumé affiché dans le sélecteur
  options: ConfigTemplateOption[];
};

export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  {
    key: 'couleur',
    label: 'Couleur de carrosserie',
    icon: 'Palette',
    selectionType: 'radio',
    required: true,
    description: 'Choisissez la teinte de votre véhicule.',
    summary: 'Palette de 8 teintes prêtes à l\'emploi',
    options: [
      { name: 'Blanc Alpin', colorHex: '#F5F5F5', priceModifier: 0 },
      { name: 'Noir Onyx', colorHex: '#1A1A1A', priceModifier: 0 },
      { name: 'Gris Titane', colorHex: '#7A7D80', priceModifier: 250 },
      { name: 'Argent Métal', colorHex: '#C0C4C8', priceModifier: 250 },
      { name: 'Bleu Nuit', colorHex: '#1E3A5F', priceModifier: 350 },
      { name: 'Rouge Passion', colorHex: '#C1272D', priceModifier: 350 },
      { name: 'Vert Carlite', colorHex: '#16A34A', priceModifier: 350 },
      { name: 'Orange Solaire', colorHex: '#E8792B', priceModifier: 350 },
    ],
  },
  {
    key: 'batterie',
    label: 'Batterie / Autonomie',
    icon: 'Battery',
    selectionType: 'radio',
    required: true,
    description: 'Sélectionnez la capacité de batterie adaptée à vos trajets.',
    summary: '3 capacités (standard, confort, longue distance)',
    options: [
      { name: 'Batterie Standard', priceModifier: 0, description: 'Autonomie de base' },
      { name: 'Batterie Confort +', priceModifier: 1500, description: 'Autonomie renforcée' },
      { name: 'Batterie Longue Distance', priceModifier: 2900, description: 'Autonomie maximale' },
    ],
  },
  {
    key: 'sellerie',
    label: 'Sellerie / Confort',
    icon: 'Sofa',
    selectionType: 'radio',
    description: 'Habillage intérieur et niveau de confort.',
    summary: 'Tissu, simili-cuir, cuir + sièges chauffants',
    options: [
      { name: 'Tissu Standard', priceModifier: 0 },
      { name: 'Simili-cuir', priceModifier: 690 },
      { name: 'Cuir Premium', priceModifier: 1490 },
    ],
  },
  {
    key: 'jantes',
    label: 'Jantes',
    icon: 'Settings',
    selectionType: 'radio',
    description: 'Style et finition des jantes.',
    summary: 'Tôle, alliage, alliage bi-ton',
    options: [
      { name: 'Jantes Tôle', priceModifier: 0 },
      { name: 'Jantes Alliage', priceModifier: 490 },
      { name: 'Jantes Alliage Bi-ton', priceModifier: 790 },
    ],
  },
  {
    key: 'toit',
    label: 'Toit',
    icon: 'Package',
    selectionType: 'radio',
    description: 'Type de toit.',
    summary: 'Rigide, panoramique, ouvrant',
    options: [
      { name: 'Toit Rigide', priceModifier: 0 },
      { name: 'Toit Panoramique', priceModifier: 990 },
      { name: 'Toit Ouvrant', priceModifier: 1290 },
    ],
  },
  {
    key: 'securite',
    label: 'Pack Sécurité',
    icon: 'ShieldCheck',
    selectionType: 'checkbox',
    description: 'Équipements de sécurité (plusieurs choix possibles).',
    summary: 'Aides à la conduite (choix multiple)',
    options: [
      { name: 'Caméra de recul', priceModifier: 390 },
      { name: 'Capteurs de stationnement', priceModifier: 290 },
      { name: 'Alarme + antivol', priceModifier: 350 },
      { name: 'Airbag conducteur', priceModifier: 450 },
    ],
  },
  {
    key: 'options-confort',
    label: 'Options de confort',
    icon: 'Zap',
    selectionType: 'checkbox',
    description: 'Équipements de confort (plusieurs choix possibles).',
    summary: 'Clim, chauffage, écran… (choix multiple)',
    options: [
      { name: 'Climatisation', priceModifier: 890 },
      { name: 'Chauffage renforcé', priceModifier: 390 },
      { name: 'Écran tactile / GPS', priceModifier: 590 },
      { name: 'Bluetooth / Radio', priceModifier: 190 },
      { name: 'Vitres électriques', priceModifier: 290 },
    ],
  },
  {
    key: 'montage',
    label: 'Livraison / Montage',
    icon: 'Wrench',
    selectionType: 'radio',
    required: true,
    description: 'Mode de réception du véhicule.',
    summary: 'Retrait, livraison, montage inclus',
    options: [
      { name: 'Retrait en atelier', priceModifier: 0 },
      { name: 'Livraison à domicile', priceModifier: 290 },
      { name: 'Livraison + mise en main', priceModifier: 490 },
    ],
  },
];
