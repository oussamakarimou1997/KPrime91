import type { SearchedPerfumeProfile } from '../types';

export interface VerifiedFragranceData {
  keys: string[]; // Search triggers / aliases
  name: string;
  brand: string;
  concentration: string;
  fragranceFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  accords: string[];
  genderTarget: 'Men' | 'Women' | 'Unisex';
  description: string;
  potentialAlternatives?: string[];
  sources?: Array<{ title: string; uri: string }>;
}

export const FRAGRANCE_ENCYCLOPEDIA: VerifiedFragranceData[] = [
  // ==========================================
  // DIOR
  // ==========================================
  {
    keys: ['sauvage', 'dior sauvage', 'sauvage dior', 'sauvage edp', 'sauvage edt', 'sauvage elixir', 'sauvage parfum'],
    name: 'Sauvage',
    brand: 'Dior',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Aromatic Fougere / Fresh Spicy',
    topNotes: ['Calabrian Bergamot', 'Pepper'],
    heartNotes: ['Sichuan Pepper', 'Lavender', 'Pink Pepper', 'Vetiver', 'Patchouli', 'Geranium', 'Elemi'],
    baseNotes: ['Ambroxan', 'Cedarwood', 'Labdanum', 'Vanilla'],
    accords: ['Fresh Spicy', 'Amber', 'Citrus', 'Aromatic', 'Musky', 'Woody', 'Warm Spicy'],
    genderTarget: 'Men',
    description: 'A radically fresh composition, dictated by a name that has the ring of a manifesto. Raw and noble all at once, unleashing vibrant Calabrian bergamot and a powerful ambroxan trail.',
    potentialAlternatives: ['Sauvage Eau de Toilette', 'Sauvage Elixir', 'Sauvage Parfum'],
    sources: [
      { title: 'Sauvage Dior - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Dior/Sauvage-31561.html' },
      { title: 'Sauvage - Parfumo', uri: 'https://www.parfumo.com/Perfumes/Dior/Sauvage' },
    ],
  },
  {
    keys: ['dior homme intense', 'homme intense', 'dior homme', 'homme intense dior'],
    name: 'Dior Homme Intense',
    brand: 'Dior',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Floral Musk',
    topNotes: ['Lavender'],
    heartNotes: ['Iris', 'Ambrette (Musk Mallow)', 'Pear'],
    baseNotes: ['Virginia Cedar', 'Vetiver'],
    accords: ['Iris', 'Powdery', 'Earthy', 'Woody', 'Floral', 'Lavender', 'Aromatic'],
    genderTarget: 'Men',
    description: 'The ultimate noble powdery iris fragrance. Sensual and warm, marrying floral sophistication with masculine cedar and ambrette.',
    potentialAlternatives: ['Dior Homme Parfum', 'Dior Homme 2020', 'Dior Homme Original'],
    sources: [
      { title: 'Dior Homme Intense - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Dior/Dior-Homme-Intense-2011-13016.html' },
    ],
  },
  {
    keys: ['fahrenheit', 'dior fahrenheit', 'fahrenheit dior'],
    name: 'Fahrenheit',
    brand: 'Dior',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Aromatic Fougere / Leather',
    topNotes: ['Nutmeg Flower', 'Lavender', 'Cedar', 'Chamomile', 'Mandarin Orange', 'Hawthorn', 'Bergamot', 'Lemon'],
    heartNotes: ['Violet Leaf', 'Nutmeg', 'Cedar', 'Sandalwood', 'Carnation', 'Honeysuckle', 'Jasmine', 'Lily-of-the-Valley'],
    baseNotes: ['Leather', 'Vetiver', 'Musk', 'Amber', 'Patchouli', 'Tonka Bean'],
    accords: ['Leather', 'Ozonated', 'Woody', 'Aromatic', 'Warm Spicy', 'Floral', 'Green'],
    genderTarget: 'Men',
    description: 'A legendary revolutionary fragrance blending distinctive gasoline-leather facets with violet leaf, nutmeg and rich cedarwood.',
    potentialAlternatives: ['Fahrenheit Parfum', 'Fahrenheit Le Parfum'],
    sources: [{ title: 'Fahrenheit Dior - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Dior/Fahrenheit-228.html' }],
  },
  {
    keys: ['jadore', "j'adore", 'dior jadore', "j'adore dior"],
    name: "J'adore",
    brand: 'Dior',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Floral Fruity',
    topNotes: ['Pear', 'Melon', 'Magnolia', 'Peach', 'Mandarin Orange', 'Bergamot'],
    heartNotes: ['Jasmine', 'Lily-of-the-Valley', 'Tuberose', 'Freesia', 'Rose', 'Orchid', 'Plum', 'Violet'],
    baseNotes: ['Musk', 'Vanilla', 'Cedar', 'Blackberry'],
    accords: ['Floral', 'White Floral', 'Fruity', 'Sweet', 'Fresh', 'Aquatic'],
    genderTarget: 'Women',
    description: 'An opulent golden floral bouquet crafted like a custom-made flower, balancing luminous jasmine, ylang-ylang, and Damascus rose.',
    potentialAlternatives: ["J'adore l'Or", "J'adore Parfum d'Eau"],
    sources: [{ title: "J'adore Dior - Fragrantica", uri: 'https://www.fragrantica.com/perfume/Dior/J-adore-210.html' }],
  },
  {
    keys: ['hypnotic poison', 'dior hypnotic poison'],
    name: 'Hypnotic Poison',
    brand: 'Dior',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Amber Vanilla',
    topNotes: ['Coconut', 'Plum', 'Apricot'],
    heartNotes: ['Brazilian Rosewood', 'Jasmine', 'Caraway', 'Tuberose', 'Rose', 'Lily-of-the-Valley'],
    baseNotes: ['Vanilla', 'Almond', 'Sandalwood', 'Musk'],
    accords: ['Vanilla', 'Almond', 'Sweet', 'Nutty', 'Fruity', 'Powdery', 'Woody'],
    genderTarget: 'Women',
    description: 'A magnetic, intoxicating oriental gourmand veiled in bitter almond, sensual caraway, and sumptuous sambac jasmine.',
    potentialAlternatives: ['Hypnotic Poison Eau de Parfum'],
  },
  {
    keys: ['miss dior', 'dior miss dior'],
    name: 'Miss Dior',
    brand: 'Dior',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Chypre Floral',
    topNotes: ['Iris', 'Peony', 'Lily-of-the-Valley'],
    heartNotes: ['Rose', 'Peach', 'Apricot'],
    baseNotes: ['Vanilla', 'Tonka Bean', 'Musk', 'Benzoin', 'Sandalwood'],
    accords: ['Floral', 'Rose', 'Powdery', 'Sweet', 'Vanilla', 'Fruity', 'Woody'],
    genderTarget: 'Women',
    description: 'A luminous millefiori floral bouquet awakening the senses with velvety Centifolia rose, fresh lily-of-the-valley, and comforting musk.',
  },

  // ==========================================
  // CHANEL
  // ==========================================
  {
    keys: ['bleu de chanel', 'bdc', 'chanel bleu', 'bleu chanel', 'bleu de chanel edp', 'bleu de chanel parfum'],
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Aromatic',
    topNotes: ['Grapefruit', 'Lemon', 'Mint', 'Pink Pepper', 'Bergamot', 'Aldehydes', 'Coriander'],
    heartNotes: ['Ginger', 'Jasmine', 'Nutmeg', 'Melon'],
    baseNotes: ['Incense', 'Amber', 'Cedarwood', 'Sandalwood', 'Patchouli', 'Amberwood', 'Labdanum'],
    accords: ['Citrus', 'Amber', 'Warm Spicy', 'Woody', 'Aromatic', 'Smoky', 'Fresh Spicy'],
    genderTarget: 'Men',
    description: 'A tribute to masculine freedom with a captivating woody aromatic trail and radiant citrus top.',
    potentialAlternatives: ['Bleu de Chanel Eau de Toilette', 'Bleu de Chanel Parfum'],
    sources: [
      { title: 'Bleu de Chanel Eau de Parfum - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Chanel/Bleu-de-Chanel-Eau-de-Parfum-25967.html' },
    ],
  },
  {
    keys: ['allure homme sport', 'chanel allure homme sport', 'allure sport'],
    name: 'Allure Homme Sport',
    brand: 'Chanel',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody Aquatic / Fresh Spicy',
    topNotes: ['Orange', 'Sea Notes', 'Aldehydes', 'Blood Mandarin'],
    heartNotes: ['Pepper', 'Neroli', 'Cedar'],
    baseNotes: ['Tonka Bean', 'Vanilla', 'White Musk', 'Amber', 'Vetiver', 'Elemi Resin'],
    accords: ['Citrus', 'Marine', 'Aromatic', 'Vanilla', 'Sweet', 'Fresh Spicy'],
    genderTarget: 'Men',
    description: 'A sensual, fresh composition combining crisp Mediterranean sea notes with Italian mandarin and sensual tonka bean.',
    potentialAlternatives: ['Allure Homme Sport Eau Extreme', 'Allure Homme Edition Blanche'],
  },
  {
    keys: ['coco mademoiselle', 'chanel coco mademoiselle', 'mademoiselle chanel'],
    name: 'Coco Mademoiselle',
    brand: 'Chanel',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral / Modern Chypre',
    topNotes: ['Orange', 'Mandarin Orange', 'Bergamot', 'Orange Blossom'],
    heartNotes: ['Turkish Rose', 'Jasmine', 'Mimosa', 'Ylang-Ylang'],
    baseNotes: ['Patchouli', 'White Musk', 'Vanilla', 'Vetiver', 'Tonka Bean', 'Opoponax'],
    accords: ['Citrus', 'Patchouli', 'White Floral', 'Sweet', 'Rose', 'Earthy', 'Warm Spicy'],
    genderTarget: 'Women',
    description: 'An iconic modern oriental with a vibrant personality, centered around luminous citrus, pure rose petals and noble patchouli.',
    potentialAlternatives: ['Coco Mademoiselle Intense'],
  },
  {
    keys: ['chanel no 5', 'chanel n5', 'chanel number 5', 'no 5 chanel'],
    name: 'Chanel No 5',
    brand: 'Chanel',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Floral Aldehyde',
    topNotes: ['Aldehydes', 'Ylang-Ylang', 'Neroli', 'Bergamot', 'Peach'],
    heartNotes: ['Iris', 'Jasmine', 'Rose', 'Lily-of-the-Valley'],
    baseNotes: ['Sandalwood', 'Vanilla', 'Oakmoss', 'Vetiver', 'Patchouli'],
    accords: ['Aldehydic', 'Woody', 'Fresh', 'Floral', 'Powdery', 'Yellow Floral'],
    genderTarget: 'Women',
    description: 'The epitome of timeless perfumery. A revolutionary abstract bouquet sparkling with soaring aldehydes over a creamy floral heart.',
  },

  // ==========================================
  // LANCOME
  // ==========================================
  {
    keys: ['la vie est belle', 'lavieestbelle', 'lancome la vie est belle', 'la vie est belle lancome'],
    name: 'La Vie Est Belle',
    brand: 'Lancôme',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Floral Fruity Gourmand',
    topNotes: ['Black Currant', 'Pear'],
    heartNotes: ['Iris', 'Jasmine', 'Orange Blossom'],
    baseNotes: ['Praline', 'Vanilla', 'Patchouli', 'Tonka Bean'],
    accords: ['Sweet', 'Vanilla', 'Fruity', 'Patchouli', 'Woody', 'White Floral', 'Iris', 'Powdery'],
    genderTarget: 'Women',
    description: 'A luminous universal declaration of happiness. Features precious Iris Pallida enveloped in spun sugar, warm vanilla, and roasted praline.',
    potentialAlternatives: ['La Vie Est Belle L’Extrait', 'La Vie Est Belle Iris Absolu'],
    sources: [
      { title: 'La Vie Est Belle Lancome - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Lancome/La-Vie-Est-Belle-14982.html' },
    ],
  },
  {
    keys: ['idole', 'idôle', 'lancome idole', 'idole lancome'],
    name: 'Idôle',
    brand: 'Lancôme',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Chypre Floral',
    topNotes: ['Pear', 'Bergamot', 'Pink Pepper'],
    heartNotes: ['Rose', 'Indian Jasmine'],
    baseNotes: ['White Musk', 'Vanilla', 'Patchouli', 'Cedar'],
    accords: ['Rose', 'Fruity', 'Floral', 'Musky', 'Sweet', 'Citrus', 'Powdery'],
    genderTarget: 'Women',
    description: 'A clean and radiant modern chypre designed around radical rose petals, sparkling pear, and luminous clean white musks.',
  },

  // ==========================================
  // MAISON FRANCIS KURKDJIAN (MFK)
  // ==========================================
  {
    keys: ['baccarat rouge 540', 'br540', 'baccarat rouge', 'mfk baccarat rouge', 'baccarat 540'],
    name: 'Baccarat Rouge 540',
    brand: 'Maison Francis Kurkdjian',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral',
    topNotes: ['Saffron', 'Jasmine'],
    heartNotes: ['Amberwood', 'Ambergris'],
    baseNotes: ['Fir Resin', 'Cedarwood'],
    accords: ['Amber', 'Almond', 'Woody', 'Warm Spicy', 'Sweet', 'Metallic', 'Aromatic'],
    genderTarget: 'Unisex',
    description: 'Luminous and sophisticated amber floral breeze with poetic alchemy of saffron, jasmine, ambergris and freshly cut cedarwood.',
    potentialAlternatives: ['Baccarat Rouge 540 Extrait de Parfum'],
    sources: [
      { title: 'Baccarat Rouge 540 MFK - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Baccarat-Rouge-540-33519.html' },
    ],
  },
  {
    keys: ['grand soir', 'mfk grand soir'],
    name: 'Grand Soir',
    brand: 'Maison Francis Kurkdjian',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber',
    topNotes: ['Spanish Labdanum'],
    heartNotes: ['Benzoin Siam', 'Brazilian Tonka Bean'],
    baseNotes: ['Amber', 'Vanilla'],
    accords: ['Amber', 'Vanilla', 'Warm Spicy', 'Balsamic', 'Sweet', 'Powdery'],
    genderTarget: 'Unisex',
    description: 'An invitation to dress up and experience the majestic night life of Paris. Draped in golden amber, opulent benzoin, and Madagascar vanilla.',
  },
  {
    keys: ['oud satin mood', 'mfk oud satin mood'],
    name: 'Oud Satin Mood',
    brand: 'Maison Francis Kurkdjian',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Woody',
    topNotes: ['Bulgarian Rose', 'Turkish Rose'],
    heartNotes: ['Violet', 'Laotian Oud'],
    baseNotes: ['Vanilla', 'Amber', 'Benzoin'],
    accords: ['Vanilla', 'Rose', 'Oud', 'Powdery', 'Violet', 'Amber', 'Warm Spicy'],
    genderTarget: 'Unisex',
    description: 'Conveys the desire to wrap oneself in fine satin. Rare Laotian oud is softened by an abundance of velvety roses and violet.',
  },

  // ==========================================
  // GIORGIO ARMANI
  // ==========================================
  {
    keys: ['acqua di gio', 'adg', 'armani acqua di gio', 'acqua di gio armani', 'acqua di gio edt', 'acqua di gio profumo', 'acqua di gio profondo'],
    name: 'Acqua di Giò',
    brand: 'Giorgio Armani',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Aromatic Aquatic',
    topNotes: ['Lime', 'Lemon', 'Bergamot', 'Jasmine', 'Orange', 'Mandarin Orange', 'Neroli'],
    heartNotes: ['Sea Notes', 'Jasmine', 'Calone', 'Peach', 'Freesia', 'Rosemary', 'Nutmeg', 'Coriander'],
    baseNotes: ['White Musk', 'Cedar', 'Oakmoss', 'Patchouli', 'Amber'],
    accords: ['Marine', 'Citrus', 'Aromatic', 'Fresh Spicy', 'Salty', 'Green', 'Woody'],
    genderTarget: 'Men',
    description: 'A mythical aquatic fragrance capturing the essence of the Mediterranean sun and sea breeze with crisp marine nuances and citrus.',
    potentialAlternatives: ['Acqua di Giò Profondo', 'Acqua di Giò Parfum', 'Acqua di Giò Profumo'],
    sources: [
      { title: 'Acqua di Gio Giorgio Armani - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Giorgio-Armani/Acqua-di-Gio-410.html' },
    ],
  },
  {
    keys: ['stronger with you', 'armani stronger with you', 'stronger with you intensely'],
    name: 'Stronger With You',
    brand: 'Emporio Armani',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Aromatic Fougere / Gourmand',
    topNotes: ['Cardamom', 'Pink Pepper', 'Violet Leaf', 'Mint'],
    heartNotes: ['Pineapple', 'Cinnamon', 'Melon', 'Sage', 'Lavender'],
    baseNotes: ['Vanilla', 'Chestnut', 'Amberwood', 'Cedar', 'Guaiac Wood'],
    accords: ['Vanilla', 'Warm Spicy', 'Sweet', 'Nutty', 'Aromatic', 'Fruity', 'Amber'],
    genderTarget: 'Men',
    description: 'A charming, confident oriental fougere driven by spicy cardamom, smoky crystallized chestnut, and velvety vanilla.',
    potentialAlternatives: ['Stronger With You Intensely', 'Stronger With You Absolutely'],
  },
  {
    keys: ['armani code', 'code armani'],
    name: 'Armani Code',
    brand: 'Giorgio Armani',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Amber Spicy',
    topNotes: ['Bergamot', 'Lemon'],
    heartNotes: ['Star Anise', 'Olive Blossom', 'Guaiac Wood'],
    baseNotes: ['Leather', 'Tobacco', 'Tonka Bean'],
    accords: ['Citrus', 'Leather', 'Anis', 'Aromatic', 'Tobacco', 'Soft Spicy', 'Sweet'],
    genderTarget: 'Men',
    description: 'A seductive blend combining sparkling bergamot and lemon with soft olive blossom and warm gaiac wood over sensual leather.',
    potentialAlternatives: ['Armani Code Parfum', 'Armani Code Profumo'],
  },
  {
    keys: ['my way', 'armani my way', 'my way armani'],
    name: 'My Way',
    brand: 'Giorgio Armani',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Floral',
    topNotes: ['Orange Blossom', 'Bergamot'],
    heartNotes: ['Tuberose', 'Indian Jasmine'],
    baseNotes: ['Madagascar Vanilla', 'White Musk', 'Virginian Cedar'],
    accords: ['White Floral', 'Tuberose', 'Citrus', 'Vanilla', 'Animalic'],
    genderTarget: 'Women',
    description: 'An invitation to broaden horizons. Luminous orange blossom and Egyptian tuberose meet authentic bourbon vanilla and crisp cedar.',
  },

  // ==========================================
  // CREED
  // ==========================================
  {
    keys: ['creed aventus', 'aventus', 'aventus creed'],
    name: 'Aventus',
    brand: 'Creed',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Chypre Fruity / Woody',
    topNotes: ['Bergamot', 'Black Currant', 'Apple', 'Lemon', 'Pink Pepper'],
    heartNotes: ['Pineapple', 'Patchouli', 'Moroccan Jasmine'],
    baseNotes: ['Birch', 'Musk', 'Oakmoss', 'Ambroxan', 'Cedarwood'],
    accords: ['Fruity', 'Woody', 'Smoky', 'Leather', 'Citrus', 'Earthy', 'Fresh'],
    genderTarget: 'Men',
    description: 'Celebrates strength, power, and success. Iconic smoky birch and patchouli base juxtaposed with crisp black currant and vibrant pineapple.',
    potentialAlternatives: ['Aventus Cologne', 'Absolu Aventus'],
    sources: [{ title: 'Aventus Creed - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Creed/Aventus-9828.html' }],
  },
  {
    keys: ['silver mountain water', 'creed silver mountain water'],
    name: 'Silver Mountain Water',
    brand: 'Creed',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Aromatic Fresh',
    topNotes: ['Bergamot', 'Mandarin Orange'],
    heartNotes: ['Green Tea', 'Black Currant'],
    baseNotes: ['Musk', 'Petitgrain', 'Sandalwood', 'Galbanum'],
    accords: ['Green', 'Citrus', 'Fruity', 'Musky', 'Aromatic', 'Fresh'],
    genderTarget: 'Unisex',
    description: 'Crisp and invigorating fragrance capturing the purity and coolness of Swiss alpine streams with green tea and black currant.',
  },
  {
    keys: ['green irish tweed', 'creed green irish tweed', 'git'],
    name: 'Green Irish Tweed',
    brand: 'Creed',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Fougere / Green',
    topNotes: ['Lemon Verbena', 'Iris'],
    heartNotes: ['Violet Leaf'],
    baseNotes: ['Ambergris', 'Sandalwood'],
    accords: ['Ozonic', 'Green', 'Iris', 'Woody', 'Citrus', 'Powdery', 'Aquatic'],
    genderTarget: 'Men',
    description: 'A timeless gentlemanly walk through the lush green Irish countryside, crisp with lemon verbena and fresh cut violet leaves.',
  },

  // ==========================================
  // TOM FORD
  // ==========================================
  {
    keys: ['oud wood', 'tom ford oud wood', 'tf oud wood'],
    name: 'Oud Wood',
    brand: 'Tom Ford',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Spicy / Amber Woody',
    topNotes: ['Rosewood', 'Cardamom', 'Chinese Pepper'],
    heartNotes: ['Oud (Agarwood)', 'Sandalwood', 'Vetiver'],
    baseNotes: ['Tonka Bean', 'Vanilla', 'Amber'],
    accords: ['Woody', 'Warm Spicy', 'Balsamic', 'Aromatic', 'Oud', 'Powdery', 'Sweet'],
    genderTarget: 'Unisex',
    description: 'Rare exotic rosewood and cardamom give way to a smoky blend of rare oud wood, sandalwood and vetiver over tonka and amber.',
    potentialAlternatives: ['Oud Wood Parfum'],
    sources: [{ title: 'Oud Wood Tom Ford - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Tom-Ford/Oud-Wood-1826.html' }],
  },
  {
    keys: ['tobacco vanille', 'tom ford tobacco vanille', 'tf tobacco vanille'],
    name: 'Tobacco Vanille',
    brand: 'Tom Ford',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Spicy',
    topNotes: ['Tobacco Leaf', 'Spicy Notes'],
    heartNotes: ['Vanilla', 'Cacao', 'Tonka Bean', 'Tobacco Blossom'],
    baseNotes: ['Dried Fruits', 'Woody Notes'],
    accords: ['Vanilla', 'Sweet', 'Tobacco', 'Warm Spicy', 'Fruity', 'Woody', 'Cacao'],
    genderTarget: 'Unisex',
    description: 'An opulent artisanal scent reminiscent of an English gentleman’s club, enriched with aromatic tobacco leaf and creamy vanilla.',
  },
  {
    keys: ['black orchid', 'tom ford black orchid', 'tf black orchid'],
    name: 'Black Orchid',
    brand: 'Tom Ford',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral / Oriental',
    topNotes: ['Truffle', 'Gardenia', 'Black Currant', 'Ylang-Ylang', 'Jasmine', 'Bergamot', 'Mandarin Orange', 'Amalfi Lemon'],
    heartNotes: ['Orchid', 'Spices', 'Gardenia', 'Fruity Notes', 'Ylang-Ylang', 'Jasmine', 'Lotus'],
    baseNotes: ['Mexican Chocolate', 'Patchouli', 'Vanille', 'Incense', 'Amber', 'Sandalwood', 'Vetiver', 'White Musk'],
    accords: ['Warm Spicy', 'Sweet', 'Earthy', 'Woody', 'Floral', 'Amber', 'Chocolaty', 'Patchouli'],
    genderTarget: 'Unisex',
    description: 'A luxurious and sensual fragrance of rich, dark accords and an alluring potion of black orchids and spice.',
    potentialAlternatives: ['Black Orchid Parfum'],
  },
  {
    keys: ['ombre leather', 'ombré leather', 'tom ford ombre leather'],
    name: 'Ombré Leather',
    brand: 'Tom Ford',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Leather',
    topNotes: ['Cardamom'],
    heartNotes: ['Leather', 'Jasmine Sambac'],
    baseNotes: ['Amber', 'Moss', 'Patchouli'],
    accords: ['Leather', 'Warm Spicy', 'Animalic', 'Floral', 'Earthy', 'Smoky', 'Mossy'],
    genderTarget: 'Unisex',
    description: 'Captures the vast heart of the American desert, layering rich black leather with floral jasmine and wild cardamom.',
    potentialAlternatives: ['Ombré Leather Parfum'],
  },
  {
    keys: ['lost cherry', 'tom ford lost cherry'],
    name: 'Lost Cherry',
    brand: 'Tom Ford',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral / Gourmand',
    topNotes: ['Bitter Almond', 'Black Cherry', 'Cherry Liqueur'],
    heartNotes: ['Sour Cherry', 'Plum', 'Turkish Rose', 'Jasmine Sambac'],
    baseNotes: ['Vanilla', 'Tonka Bean', 'Cinnamon', 'Peru Balsam', 'Benzoin', 'Sandalwood', 'Cloves', 'Cedar', 'Patchouli', 'Vetiver'],
    accords: ['Cherry', 'Sweet', 'Almond', 'Nutty', 'Fruity', 'Vanilla', 'Warm Spicy'],
    genderTarget: 'Unisex',
    description: 'A luscious journey into the forbidden. Saturated black cherry and bitter almond drip into warm tonka and Peru balsam.',
  },

  // ==========================================
  // YVES SAINT LAURENT (YSL)
  // ==========================================
  {
    keys: ['libre', 'ysl libre', 'libre ysl', 'libre edp', 'libre intense'],
    name: 'Libre',
    brand: 'Yves Saint Laurent',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Fougere / Floral',
    topNotes: ['Lavender', 'Mandarin Orange', 'Black Currant', 'Petitgrain'],
    heartNotes: ['Lavender', 'Orange Blossom', 'Jasmine'],
    baseNotes: ['Madagascar Vanilla', 'Musk', 'Cedar', 'Ambergris'],
    accords: ['White Floral', 'Citrus', 'Lavender', 'Vanilla', 'Sweet', 'Aromatic', 'Powdery'],
    genderTarget: 'Women',
    description: 'The fragrance of freedom. Burning sensuality of orange blossom from Morocco merged with the aromatic boldness of French lavender.',
    potentialAlternatives: ['Libre Intense', 'Libre Le Parfum'],
    sources: [{ title: 'Libre YSL - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Yves-Saint-Laurent/Libre-56077.html' }],
  },
  {
    keys: ['black opium', 'ysl black opium'],
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Vanilla / Gourmand',
    topNotes: ['Pear', 'Pink Pepper', 'Orange Blossom'],
    heartNotes: ['Coffee', 'Jasmine', 'Bitter Almond', 'Licorice'],
    baseNotes: ['Vanilla', 'Patchouli', 'Cashmere Wood', 'Cedar'],
    accords: ['Vanilla', 'Coffee', 'Sweet', 'Warm Spicy', 'White Floral', 'Fruity', 'Woody'],
    genderTarget: 'Women',
    description: 'A shot of pure adrenaline. Captivating black coffee accord collides with crisp white florals and sensual bourbon vanilla.',
    potentialAlternatives: ['Black Opium Le Parfum', 'Black Opium Illicit Green'],
  },
  {
    keys: ['y edp', 'ysl y', 'yves saint laurent y', 'y ysl'],
    name: 'Y Eau de Parfum',
    brand: 'Yves Saint Laurent',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Aromatic Fougere',
    topNotes: ['Apple', 'Ginger', 'Bergamot'],
    heartNotes: ['Sage', 'Juniper Berries', 'Geranium'],
    baseNotes: ['Amberwood', 'Tonka Bean', 'Cedar', 'Vetiver', 'Olibanum'],
    accords: ['Aromatic', 'Woody', 'Fresh Spicy', 'Fruity', 'Warm Spicy', 'Herbal'],
    genderTarget: 'Men',
    description: 'An intense interpretation of the Y signature. Crisp green apple and fresh ginger balanced with deep cedarwood and sage.',
    potentialAlternatives: ['Y Le Parfum', 'Y Eau de Toilette'],
  },
  {
    keys: ['la nuit de lhomme', "la nuit de l'homme", 'ysl la nuit'],
    name: "La Nuit de L'Homme",
    brand: 'Yves Saint Laurent',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody Spicy',
    topNotes: ['Cardamom'],
    heartNotes: ['Lavender', 'Virginia Cedar', 'Bergamot'],
    baseNotes: ['Vetiver', 'Caraway'],
    accords: ['Aromatic', 'Warm Spicy', 'Lavender', 'Woody', 'Fresh Spicy', 'Citrus'],
    genderTarget: 'Men',
    description: 'A veil of mystery and explosive spicy cardamom unfolding into sophisticated lavender and cedarwood.',
  },

  // ==========================================
  // PARFUMS DE MARLY
  // ==========================================
  {
    keys: ['layton', 'pdm layton', 'parfums de marly layton'],
    name: 'Layton',
    brand: 'Parfums de Marly',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral / Oriental Fougere',
    topNotes: ['Apple', 'Lavender', 'Bergamot', 'Mandarin Orange'],
    heartNotes: ['Vanilla', 'Cardamom', 'Jasmine', 'Violet', 'Geranium'],
    baseNotes: ['Vanilla', 'Cardamom', 'Sandalwood', 'Pepper', 'Patchouli', 'Guaiac Wood'],
    accords: ['Warm Spicy', 'Vanilla', 'Woody', 'Aromatic', 'Fruity', 'Fresh Spicy', 'Powdery'],
    genderTarget: 'Unisex',
    description: 'Sensual and oriental composition infused with crisp apple, noble vanilla, and precious spices.',
    potentialAlternatives: ['Layton Exclusif'],
    sources: [{ title: 'Layton Parfums de Marly - Fragrantica', uri: 'https://www.fragrantica.com/perfume/Parfums-de-Marly/Layton-39314.html' }],
  },
  {
    keys: ['delina', 'pdm delina', 'delina exclusif'],
    name: 'Delina',
    brand: 'Parfums de Marly',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Floral',
    topNotes: ['Litchi', 'Rhubarb', 'Bergamot', 'Nutmeg'],
    heartNotes: ['Turkish Rose', 'Peony', 'Musk', 'Petalia', 'Vanilla'],
    baseNotes: ['Cashmeran', 'Cedar', 'Incense', 'Haitian Vetiver'],
    accords: ['Rose', 'Floral', 'Fruity', 'Fresh', 'Sweet', 'Musky', 'Tropical'],
    genderTarget: 'Women',
    description: 'A tribute to luminous femininity sculpted around Turkish rose, crisp lychee, and tart rhubarb over velvety cashmeran.',
    potentialAlternatives: ['Delina Exclusif', 'Delina La Rosée'],
  },
  {
    keys: ['herod', 'pdm herod'],
    name: 'Herod',
    brand: 'Parfums de Marly',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Spicy / Amber',
    topNotes: ['Cinnamon', 'Pepperwood'],
    heartNotes: ['Tobacco Leaf', 'Incense', 'Osmanthus', 'Labdanum'],
    baseNotes: ['Vanilla', 'Iso E Super', 'Cedar', 'Musk', 'Cypriol Oil', 'Vetiver'],
    accords: ['Tobacco', 'Warm Spicy', 'Vanilla', 'Sweet', 'Cinnamon', 'Smoky', 'Woody'],
    genderTarget: 'Men',
    description: 'An echo of 18th-century equestrian royalty, steeped in aromatic tobacco leaves, sweet cinnamon, and bourbon vanilla.',
  },

  // ==========================================
  // VERSACE
  // ==========================================
  {
    keys: ['versace eros', 'eros', 'eros versace', 'eros edp', 'eros flame'],
    name: 'Eros',
    brand: 'Versace',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Aromatic Fougere',
    topNotes: ['Mint', 'Green Apple', 'Lemon'],
    heartNotes: ['Tonka Bean', 'Ambroxan', 'Geranium'],
    baseNotes: ['Madagascar Vanilla', 'Virginian Cedar', 'Atlas Cedar', 'Vetiver', 'Oakmoss'],
    accords: ['Vanilla', 'Aromatic', 'Green', 'Fresh Spicy', 'Sweet', 'Amber', 'Citrus'],
    genderTarget: 'Men',
    description: 'Inspired by Greek mythology and the God of Love. Passionate freshness of Italian lemon and mint paired with warm tonka and cedar.',
    potentialAlternatives: ['Eros Flame', 'Eros Parfum', 'Eros Eau de Parfum'],
  },
  {
    keys: ['dylan blue', 'versace dylan blue'],
    name: 'Dylan Blue',
    brand: 'Versace',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Aromatic Fougere',
    topNotes: ['Calabrian Bergamot', 'Water Notes', 'Grapefruit', 'Fig Leaf'],
    heartNotes: ['Ambroxan', 'Black Pepper', 'Patchouli', 'Violet Leaf', 'Papyrus'],
    baseNotes: ['Incense', 'Musk', 'Tonka Bean', 'Saffron'],
    accords: ['Amber', 'Citrus', 'Fresh Spicy', 'Warm Spicy', 'Musky', 'Aquatic'],
    genderTarget: 'Men',
    description: 'The essence of the contemporary Versace man. Fresh Mediterranean aquatic notes intertwined with deep ambroxan and black pepper.',
  },
  {
    keys: ['bright crystal', 'versace bright crystal'],
    name: 'Bright Crystal',
    brand: 'Versace',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Floral Fruity',
    topNotes: ['Yuzu', 'Pomegranate', 'Ice'],
    heartNotes: ['Peony', 'Lotus', 'Magnolia'],
    baseNotes: ['Musk', 'Mahogany', 'Amber'],
    accords: ['Floral', 'Fresh', 'Citrus', 'Woody', 'Aquatic'],
    genderTarget: 'Women',
    description: 'A precious jewel of luminous beauty with crisp yuzu, succulent pomegranate, and ethereal lotus blossoms.',
  },

  // ==========================================
  // JEAN PAUL GAULTIER (JPG)
  // ==========================================
  {
    keys: ['le male', 'jpg le male', 'ultra male', 'le male le parfum', 'le beau'],
    name: 'Le Male',
    brand: 'Jean Paul Gaultier',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Amber Fougere',
    topNotes: ['Lavender', 'Mint', 'Cardamom', 'Bergamot', 'Artemisia'],
    heartNotes: ['Cinnamon', 'Orange Blossom', 'Caraway'],
    baseNotes: ['Vanilla', 'Tonka Bean', 'Amber', 'Sandalwood', 'Cedar'],
    accords: ['Vanilla', 'Aromatic', 'Fresh Spicy', 'Lavender', 'Warm Spicy', 'Sweet'],
    genderTarget: 'Men',
    description: 'The legendary sailor scent honoring the mythical figure of the sailor. Lavender and fresh mint resting on a sensual bed of vanilla.',
    potentialAlternatives: ['Ultra Male', 'Le Male Le Parfum', 'Le Male Elixir'],
  },
  {
    keys: ['ultra male', 'jpg ultra male'],
    name: 'Ultra Male',
    brand: 'Jean Paul Gaultier',
    concentration: 'Eau de Toilette Intense',
    fragranceFamily: 'Amber Fougere',
    topNotes: ['Pear', 'Lavender', 'Mint', 'Bergamot', 'Lemon'],
    heartNotes: ['Cinnamon', 'Clary Sage', 'Caraway'],
    baseNotes: ['Black Vanilla Husk', 'Amber', 'Cedar', 'Patchouli'],
    accords: ['Sweet', 'Fruity', 'Vanilla', 'Warm Spicy', 'Cinnamon', 'Aromatic'],
    genderTarget: 'Men',
    description: 'An irresistible gourmand twist on Le Male featuring succulent juicy black pear, spicy cinnamon, and deep bourbon vanilla.',
  },

  // ==========================================
  // PACO RABANNE
  // ==========================================
  {
    keys: ['1 million', 'one million', 'paco rabanne 1 million', 'one million paco rabanne'],
    name: '1 Million',
    brand: 'Paco Rabanne',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody Spicy',
    topNotes: ['Blood Mandarin', 'Grapefruit', 'Mint'],
    heartNotes: ['Cinnamon', 'Spicy Notes', 'Rose'],
    baseNotes: ['Amber', 'Leather', 'Woody Notes', 'Indian Patchouli'],
    accords: ['Warm Spicy', 'Cinnamon', 'Citrus', 'Leather', 'Amber', 'Woody', 'Animalic'],
    genderTarget: 'Men',
    description: 'The scent of success and audacity. Blends blood mandarin, peppermint, and sensual cinnamon with blond leather and amber.',
    potentialAlternatives: ['1 Million Parfum', '1 Million Elixir', '1 Million Royal'],
  },
  {
    keys: ['invictus', 'paco rabanne invictus'],
    name: 'Invictus',
    brand: 'Paco Rabanne',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody Aquatic',
    topNotes: ['Sea Notes', 'Grapefruit', 'Mandarin Orange'],
    heartNotes: ['Bay Leaf', 'Jasmine'],
    baseNotes: ['Ambergris', 'Guaiac Wood', 'Oakmoss', 'Patchouli'],
    accords: ['Marine', 'Citrus', 'Aromatic', 'Salty', 'Fresh Spicy', 'Woody'],
    genderTarget: 'Men',
    description: 'The trophy of a champion. A thrilling clash of biting marine citrus notes and triumphant warm guaiac wood.',
  },

  // ==========================================
  // KILIAN PARIS
  // ==========================================
  {
    keys: ['angels share', "angels' share", 'kilian angels share', 'angel share'],
    name: "Angels' Share",
    brand: 'Kilian',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Vanilla / Gourmand',
    topNotes: ['Cognac'],
    heartNotes: ['Cinnamon', 'Tonka Bean', 'Oak'],
    baseNotes: ['Praline', 'Vanilla', 'Sandalwood'],
    accords: ['Warm Spicy', 'Woody', 'Sweet', 'Vanilla', 'Cinnamon', 'Boozy', 'Powdery'],
    genderTarget: 'Unisex',
    description: 'Inspired by the Hennessy cognac heritage. An intoxicating liqueur-infused accord with cinnamon bark, tonka bean, and roasted oak.',
    sources: [{ title: "Angels' Share Kilian - Fragrantica", uri: 'https://www.fragrantica.com/perfume/By-Kilian/Angels-Share-62615.html' }],
  },

  // ==========================================
  // XERJOFF
  // ==========================================
  {
    keys: ['naxos', 'xerjoff naxos', 'casamorati naxos'],
    name: 'XJ 1861 Naxos',
    brand: 'Xerjoff',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Aromatic Spicy',
    topNotes: ['Lavender', 'Bergamot', 'Lemon'],
    heartNotes: ['Honey', 'Cinnamon', 'Cashmeran', 'Jasmine Sambac'],
    baseNotes: ['Tobacco Leaf', 'Tonka Bean', 'Vanilla'],
    accords: ['Sweet', 'Honey', 'Tobacco', 'Warm Spicy', 'Lavender', 'Citrus', 'Aromatic'],
    genderTarget: 'Unisex',
    description: 'A celebration of Sicily. Mediterranean citrus and lavender intertwine with golden honey, spiced cinnamon, and precious tobacco.',
  },
  {
    keys: ['erba pura', 'xerjoff erba pura', 'sospiro erba pura'],
    name: 'Erba Pura',
    brand: 'Xerjoff',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Fruity',
    topNotes: ['Sicilian Orange', 'Calabrian Bergamot', 'Sicilian Lemon'],
    heartNotes: ['Fruits (Mediterranean Fruit Basket)'],
    baseNotes: ['White Musk', 'Madagascar Vanilla', 'Amber'],
    accords: ['Fruity', 'Citrus', 'Sweet', 'Musky', 'Powdery', 'Vanilla'],
    genderTarget: 'Unisex',
    description: 'A mouthwatering basket of sunny Mediterranean fruits layered over an enchanting cloud of sensual white musk and vanilla.',
  },

  // ==========================================
  // INITIO PARFUMS
  // ==========================================
  {
    keys: ['oud for greatness', 'initio oud for greatness'],
    name: 'Oud for Greatness',
    brand: 'Initio Parfums Prives',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Spicy / Oud',
    topNotes: ['Saffron', 'Nutmeg', 'Lavender'],
    heartNotes: ['Natural Agarwood (Oud)'],
    baseNotes: ['Patchouli', 'Musk'],
    accords: ['Warm Spicy', 'Oud', 'Leather', 'Fresh Spicy', 'Metallic', 'Earthy', 'Lavender'],
    genderTarget: 'Unisex',
    description: 'A sacred scent that draws upon the sacred geometry of the universe. Natural oud enveloped in saffron and lavender.',
  },

  // ==========================================
  // HERMES
  // ==========================================
  {
    keys: ['terre dhermes', "terre d'hermes", 'hermes terre', 'terre hermes'],
    name: "Terre d'Hermès",
    brand: 'Hermès',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody Chypre',
    topNotes: ['Orange', 'Grapefruit'],
    heartNotes: ['Pepper', 'Pelargonium', 'Flint'],
    baseNotes: ['Vetiver', 'Cedar', 'Patchouli', 'Benzoin'],
    accords: ['Citrus', 'Woody', 'Fresh Spicy', 'Aromatic', 'Earthy'],
    genderTarget: 'Men',
    description: 'A vertical structure that tells the story of the mythical elements of earth and sky. Bitter orange and flint meeting noble cedarwood.',
  },

  // ==========================================
  // CAROLINA HERRERA
  // ==========================================
  {
    keys: ['good girl', 'carolina herrera good girl', 'good girl ch'],
    name: 'Good Girl',
    brand: 'Carolina Herrera',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral',
    topNotes: ['Almond', 'Coffee', 'Bergamot', 'Lemon'],
    heartNotes: ['Tuberose', 'Jasmine Sambac', 'Orange Blossom', 'Orris', 'Bulgarian Rose'],
    baseNotes: ['Tonka Bean', 'Cacao', 'Vanilla', 'Praline', 'Sandalwood', 'Musk', 'Amber', 'Cashmere Wood', 'Cinnamon', 'Patchouli', 'Cedar'],
    accords: ['Sweet', 'White Floral', 'Warm Spicy', 'Vanilla', 'Cacao', 'Amber', 'Tuberose'],
    genderTarget: 'Women',
    description: 'It is so good to be bad. A daring duality of sweet white tuberose and deep roasted tonka bean with seductive black cacao.',
  },
  {
    keys: ['bad boy', 'carolina herrera bad boy'],
    name: 'Bad Boy',
    brand: 'Carolina Herrera',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Amber Spicy',
    topNotes: ['White Pepper', 'Black Pepper', 'Bergamot'],
    heartNotes: ['Sage', 'Cedarwood'],
    baseNotes: ['Tonka Bean', 'Cacao', 'Amberwood'],
    accords: ['Warm Spicy', 'Amber', 'Aromatic', 'Woody', 'Cacao', 'Sweet'],
    genderTarget: 'Men',
    description: 'A fragrant expression of duality. Bright black and white pepper contrasting with dark tonka bean and rich cocoa.',
  },

  // ==========================================
  // VIKTOR & ROLF
  // ==========================================
  {
    keys: ['spicebomb', 'spicebomb extreme', 'viktor rolf spicebomb'],
    name: 'Spicebomb Extreme',
    brand: 'Viktor & Rolf',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Spicy',
    topNotes: ['Black Pepper', 'Caraway'],
    heartNotes: ['Tobacco', 'Cinnamon'],
    baseNotes: ['Bourbon Vanilla', 'Amber'],
    accords: ['Vanilla', 'Tobacco', 'Warm Spicy', 'Sweet', 'Cinnamon'],
    genderTarget: 'Men',
    description: 'An explosive detonation of intense spices. Fiery cinnamon and spicy black pepper wrapped around intoxicating tobacco and rich vanilla.',
  },
  {
    keys: ['flowerbomb', 'viktor rolf flowerbomb'],
    name: 'Flowerbomb',
    brand: 'Viktor & Rolf',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral',
    topNotes: ['Tea', 'Bergamot', 'Osmanthus'],
    heartNotes: ['Orchid', 'Jasmine', 'Rose', 'Freesia', 'Orange Flower'],
    baseNotes: ['Patchouli', 'Musk', 'Vanilla'],
    accords: ['Floral', 'Patchouli', 'White Floral', 'Sweet', 'Rose', 'Woody'],
    genderTarget: 'Women',
    description: 'A floral whirlwind offering an escape into fantasy. Sambac jasmine, Centifolia rose, and cattleya orchid anchored in warm patchouli.',
  },

  // ==========================================
  // LE LABO
  // ==========================================
  {
    keys: ['santal 33', 'le labo santal 33', 'santal33'],
    name: 'Santal 33',
    brand: 'Le Labo',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Aromatic',
    topNotes: ['Violet Accord', 'Cardamom'],
    heartNotes: ['Iris', 'Ambrox', 'Papyrus'],
    baseNotes: ['Cedarwood', 'Leather', 'Sandalwood'],
    accords: ['Woody', 'Powdery', 'Leather', 'Warm Spicy', 'Violet'],
    genderTarget: 'Unisex',
    description: 'An intoxicating cult icon evoking the spirit of the American West. Smoky sandalwood, leather, and Australian cedarwood with powdery violet.',
  },

  // ==========================================
  // PRADA
  // ==========================================
  {
    keys: ['prada lhomme', "prada l'homme", 'lhomme prada'],
    name: "Prada L'Homme",
    brand: 'Prada',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody Chypre',
    topNotes: ['Neroli', 'Black Pepper', 'Cardamom', 'Carrot Seeds'],
    heartNotes: ['Iris', 'Violet', 'Geranium', 'Mate'],
    baseNotes: ['Amber', 'Cedar', 'Sandalwood', 'Patchouli'],
    accords: ['Iris', 'Powdery', 'Floral', 'Fresh Spicy', 'Woody', 'Clean'],
    genderTarget: 'Men',
    description: 'A scent of juxtaposed pairings. Airy neroli and luxurious powdery iris resting on an impeccably tailored amber and cedar base.',
  },

  // ==========================================
  // BYREDO
  // ==========================================
  {
    keys: ['bal dafrique', "bal d'afrique", 'byredo bal dafrique'],
    name: "Bal d'Afrique",
    brand: 'Byredo',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Woody',
    topNotes: ['Amalfi Lemon', 'Tagetes', 'Black Currant', 'Bergamot', 'African Orange Flower'],
    heartNotes: ['Violet', 'Cyclamen', 'Jasmine'],
    baseNotes: ['Vetiver', 'Musk', 'Amber', 'Virginia Cedar'],
    accords: ['Citrus', 'Woody', 'Aromatic', 'Floral', 'Fruity', 'Powdery'],
    genderTarget: 'Unisex',
    description: 'A warm and romantic celebration of 1920s Paris and African culture, blending sparkling neroli with African marigold and Moroccan cedarwood.',
  },
  {
    keys: ['gypsy water', 'byredo gypsy water'],
    name: 'Gypsy Water',
    brand: 'Byredo',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Aromatic',
    topNotes: ['Juniper', 'Lemon', 'Bergamot', 'Pepper'],
    heartNotes: ['Pine Needles', 'Incense', 'Orris Root'],
    baseNotes: ['Vanilla', 'Sandalwood', 'Amber'],
    accords: ['Woody', 'Aromatic', 'Citrus', 'Fresh Spicy', 'Powdery', 'Balsamic'],
    genderTarget: 'Unisex',
    description: 'An ode to the beauty of Romani culture. Crisp pine needles and smoky incense grounded in warm amber and sweet sandalwood.',
  },

  // ==========================================
  // MANCERA
  // ==========================================
  {
    keys: ['cedrat boise', 'mancera cedrat boise', 'intense cedrat boise'],
    name: 'Cedrat Boise',
    brand: 'Mancera',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Citrus Aromatic',
    topNotes: ['Sicilian Lemon', 'Black Currant', 'Bergamot', 'Spicy Notes'],
    heartNotes: ['Fruity Notes', 'Patchouli Leaf', 'Water Jasmine'],
    baseNotes: ['Cedar', 'Leather', 'Sandalwood', 'Vanilla', 'White Musk', 'Moss'],
    accords: ['Citrus', 'Woody', 'Fruity', 'Aromatic', 'Leather', 'Animalic'],
    genderTarget: 'Unisex',
    description: 'A vibrant burst of sparkling citrus and juicy black currant that transitions into rich woods and luxurious leather.',
  },
  {
    keys: ['red tobacco', 'mancera red tobacco'],
    name: 'Red Tobacco',
    brand: 'Mancera',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Spicy / Amber',
    topNotes: ['Cinnamon', 'Agarwood (Oud)', 'Saffron', 'Incense', 'Nutmeg', 'Green Apple', 'White Peach'],
    heartNotes: ['Patchouli', 'Jasmine'],
    baseNotes: ['Tobacco', 'Madagascar Vanilla', 'Amber', 'Sandalwood', 'Guaiac Wood', 'White Musk', 'Haitian Vetiver'],
    accords: ['Warm Spicy', 'Tobacco', 'Sweet', 'Woody', 'Vanilla', 'Cinnamon', 'Oud'],
    genderTarget: 'Unisex',
    description: 'An extraordinarily potent, fiery fragrance blending cuban tobacco, rich cinnamon, and warm Madagascan vanilla.',
  },

  // ==========================================
  // MONTALE
  // ==========================================
  {
    keys: ['intense cafe', 'montale intense cafe', 'ristretto intense cafe'],
    name: 'Intense Cafe',
    brand: 'Montale',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral / Gourmand',
    topNotes: ['Floral Notes'],
    heartNotes: ['Rose', 'Coffee'],
    baseNotes: ['Vanilla', 'White Musk', 'Amber'],
    accords: ['Coffee', 'Rose', 'Vanilla', 'Floral', 'Sweet', 'Warm Spicy'],
    genderTarget: 'Unisex',
    description: 'A warm cup of freshly brewed black coffee complemented by delicate blooming French rose and a mouthwatering trail of vanilla.',
  },
  {
    keys: ['arabians tonka', 'montale arabians tonka'],
    name: 'Arabians Tonka',
    brand: 'Montale',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Woody',
    topNotes: ['Saffron', 'Bergamot'],
    heartNotes: ['Agarwood (Oud)', 'Bulgarian Rose'],
    baseNotes: ['Tonka Bean', 'Sugar Cane', 'Amber', 'White Musk', 'Oakmoss'],
    accords: ['Sweet', 'Warm Spicy', 'Vanilla', 'Oud', 'Amber', 'Rose'],
    genderTarget: 'Unisex',
    description: 'Dedicated to the Arabian horse. Powerful fiery saffron and precious oud sweetened by roasted tonka bean and brown sugar cane.',
  },

  // ==========================================
  // AMOUAGE
  // ==========================================
  {
    keys: ['reflection man', 'amouage reflection man', 'reflection'],
    name: 'Reflection Man',
    brand: 'Amouage',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Floral Musk',
    topNotes: ['Rosemary', 'Pink Pepper', 'Petitgrain'],
    heartNotes: ['Jasmine', 'Neroli', 'Orris Root', 'Ylang-Ylang'],
    baseNotes: ['Sandalwood', 'Cedar', 'Vetiver', 'Patchouli'],
    accords: ['White Floral', 'Woody', 'Aromatic', 'Fresh Spicy', 'Powdery'],
    genderTarget: 'Men',
    description: 'Refined, timeless elegance. A masterwork of crisp rosemary and petitgrain enveloping soft jasmine, neroli, and sandalwood.',
  },
  {
    keys: ['interlude man', 'amouage interlude man', 'interlude'],
    name: 'Interlude Man',
    brand: 'Amouage',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Woody',
    topNotes: ['Oregano', 'Pepper', 'Bergamot'],
    heartNotes: ['Incense', 'Opoponax', 'Amber', 'Labdanum'],
    baseNotes: ['Leather', 'Agarwood (Oud)', 'Smoke', 'Sandalwood', 'Patchouli'],
    accords: ['Amber', 'Balsamic', 'Smoky', 'Warm Spicy', 'Woody', 'Herbal'],
    genderTarget: 'Men',
    description: 'The "Blue Beast". A majestic revelation of frankincense and myrrh colliding with zesty oregano and dark smoky leather.',
  },

  // ==========================================
  // GUERLAIN
  // ==========================================
  {
    keys: ['lhomme ideal', "l'homme ideal", 'guerlain lhomme ideal', "l'homme idéal"],
    name: "L'Homme Idéal",
    brand: 'Guerlain',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Woody',
    topNotes: ['Almond', 'Spices', 'Lavender', 'Bergamot', 'Rosemary', 'Thyme'],
    heartNotes: ['Cherry', 'Vanilla', 'Incense', 'Bulgarian Rose'],
    baseNotes: ['Leather', 'Tonka Bean', 'Sandalwood'],
    accords: ['Almond', 'Cherry', 'Sweet', 'Vanilla', 'Nutty', 'Leather', 'Warm Spicy'],
    genderTarget: 'Men',
    description: 'The myth of the ideal man made tangible. Irresistible amaretto-almond and seductive dark cherry wrapped in smooth leather.',
  },
  {
    keys: ['shalimar', 'guerlain shalimar'],
    name: 'Shalimar',
    brand: 'Guerlain',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Spicy',
    topNotes: ['Citrus', 'Bergamot', 'Lemon', 'Cedar', 'Mandarin Orange'],
    heartNotes: ['Iris', 'Patchouli', 'Vetiver', 'Jasmine', 'Rose'],
    baseNotes: ['Vanilla', 'Incense', 'Leather', 'Opoponax', 'Civet', 'Sandalwood', 'Tonka Bean', 'Musk'],
    accords: ['Vanilla', 'Amber', 'Powdery', 'Citrus', 'Smoky', 'Woody', 'Balsamic'],
    genderTarget: 'Women',
    description: 'The world’s first great oriental fragrance, inspired by the love of Shah Jahan for Mumtaz Mahal. Sensual vanilla and smoky incense.',
  },

  // ==========================================
  // DOLCE & GABBANA
  // ==========================================
  {
    keys: ['the one', 'dolce gabbana the one', 'the one for men', 'dg the one'],
    name: 'The One for Men',
    brand: 'Dolce & Gabbana',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Woody Spicy',
    topNotes: ['Grapefruit', 'Coriander', 'Basil'],
    heartNotes: ['Ginger', 'Cardamom', 'Orange Blossom'],
    baseNotes: ['Amber', 'Tobacco', 'Cedar'],
    accords: ['Amber', 'Tobacco', 'Warm Spicy', 'Citrus', 'Aromatic', 'Woody'],
    genderTarget: 'Men',
    description: 'A classic of sensual masculinity. Vibrant grapefruit and warm ginger melting into an intoxicating amber and rich tobacco drydown.',
  },
  {
    keys: ['light blue', 'dg light blue', 'light blue intense', 'dolce gabbana light blue'],
    name: 'Light Blue',
    brand: 'Dolce & Gabbana',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Floral Fruity',
    topNotes: ['Sicilian Lemon', 'Apple', 'Cedar', 'Bellflower'],
    heartNotes: ['Bamboo', 'Jasmine', 'White Rose'],
    baseNotes: ['Cedar', 'Musk', 'Amber'],
    accords: ['Citrus', 'Woody', 'Fresh', 'Fruity', 'Aromatic'],
    genderTarget: 'Women',
    description: 'The joy of living the Mediterranean lifestyle. Invigorating Sicilian cedar with the freshness of Granny Smith apple and bluebells.',
  },

  // ==========================================
  // MAISON MARGIELA (REPLICA)
  // ==========================================
  {
    keys: ['by the fireplace', 'replica by the fireplace', 'margiela by the fireplace'],
    name: 'By the Fireplace',
    brand: 'Maison Margiela',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Woody / Amber',
    topNotes: ['Cloves', 'Pink Pepper', 'Orange Blossom'],
    heartNotes: ['Chestnut', 'Guaiac Wood', 'Juniper'],
    baseNotes: ['Vanilla', 'Peru Balsam', 'Cashmeran'],
    accords: ['Woody', 'Warm Spicy', 'Vanilla', 'Balsamic', 'Nutty', 'Sweet'],
    genderTarget: 'Unisex',
    description: 'Chamonix, 1971. The comforting sensation of a crackling fireplace on a snowy morning, with roasted chestnuts and sweet vanilla smoke.',
  },
  {
    keys: ['jazz club', 'replica jazz club', 'margiela jazz club'],
    name: 'Jazz Club',
    brand: 'Maison Margiela',
    concentration: 'Eau de Toilette',
    fragranceFamily: 'Leather / Amber',
    topNotes: ['Pink Pepper', 'Neroli', 'Lemon'],
    heartNotes: ['Rum', 'Java Vetiver Oil', 'Clary Sage'],
    baseNotes: ['Tobacco Leaf', 'Vanilla Bean', 'Styrax'],
    accords: ['Tobacco', 'Sweet', 'Vanilla', 'Rum', 'Warm Spicy', 'Woody'],
    genderTarget: 'Men',
    description: 'Brooklyn, 2013. The heady atmosphere of a private jazz club: cocktails, fine cigars, and deep leather armchairs.',
  },

  // ==========================================
  // AZZARO
  // ==========================================
  {
    keys: ['the most wanted', 'azzaro the most wanted', 'most wanted'],
    name: 'The Most Wanted',
    brand: 'Azzaro',
    concentration: 'Eau de Parfum Intense',
    fragranceFamily: 'Amber Spicy / Gourmand',
    topNotes: ['Cardamom'],
    heartNotes: ['Toffee (Caramel)'],
    baseNotes: ['Amberwood', 'Bourbon Vanilla'],
    accords: ['Sweet', 'Caramel', 'Warm Spicy', 'Vanilla', 'Amber'],
    genderTarget: 'Men',
    description: 'The weapon of ultimate seduction. Fiery cardamom infused with melting toffee and rich, magnetic bourbon vanilla.',
  },

  // ==========================================
  // BVLGARI
  // ==========================================
  {
    keys: ['tygar', 'bvlgari tygar', 'le gemme tygar'],
    name: 'Tygar',
    brand: 'Bvlgari',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Citrus Aromatic',
    topNotes: ['Grapefruit'],
    heartNotes: ['Ginger', 'Ambrette'],
    baseNotes: ['Ambroxan', 'Woody Notes'],
    accords: ['Citrus', 'Amber', 'Musky', 'Fresh Spicy', 'Woody'],
    genderTarget: 'Men',
    description: 'Inspired by the Indian Tiger’s Eye gemstone. An electrifying contrast of sparkling grapefruit and sensual, radiant ambroxan.',
  },
  {
    keys: ['bvlgari man in black', 'man in black bvlgari', 'man in black'],
    name: 'Bvlgari Man In Black',
    brand: 'Bvlgari',
    concentration: 'Eau de Parfum',
    fragranceFamily: 'Amber Floral',
    topNotes: ['Spices', 'Rum', 'Tobacco'],
    heartNotes: ['Leather', 'Iris', 'Tuberose'],
    baseNotes: ['Tonka Bean', 'Guaiac Wood', 'Benzoin'],
    accords: ['Warm Spicy', 'Woody', 'Leather', 'Rum', 'Amber', 'Tobacco', 'Sweet'],
    genderTarget: 'Men',
    description: 'Celebrates the birth of Vulcan, the god of the earth. Intense amber rum and spices merging with nocturnal leather and tuberose.',
  },
];

/**
 * Searches the encyclopedia for a matching perfume using smart fuzzy matching.
 */
export function findInEncyclopedia(searchQuery: string): VerifiedFragranceData | null {
  if (!searchQuery || typeof searchQuery !== 'string') return null;

  const normalized = searchQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length < 2) return null;

  const compactQuery = normalized.replace(/\s+/g, '');

  // 1. Exact match on keys or compact keys
  for (const item of FRAGRANCE_ENCYCLOPEDIA) {
    if (
      item.keys.some((k) => {
        const normKey = k.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        return normKey === normalized || normKey.replace(/\s+/g, '') === compactQuery;
      })
    ) {
      return item;
    }
  }

  // 2. Exact match on brand + name or name (normalized and compact)
  for (const item of FRAGRANCE_ENCYCLOPEDIA) {
    const fullName = `${item.brand} ${item.name}`.toLowerCase();
    const reverseFullName = `${item.name} ${item.brand}`.toLowerCase();
    const justName = item.name.toLowerCase();

    const compactFullName = fullName.replace(/[^\w]/g, '');
    const compactReverse = reverseFullName.replace(/[^\w]/g, '');
    const compactName = justName.replace(/[^\w]/g, '');

    if (
      fullName === normalized ||
      reverseFullName === normalized ||
      justName === normalized ||
      compactFullName === compactQuery ||
      compactReverse === compactQuery ||
      compactName === compactQuery
    ) {
      return item;
    }
  }

  // 3. Substring / compact containment if query is at least 4 characters
  if (normalized.length >= 4) {
    for (const item of FRAGRANCE_ENCYCLOPEDIA) {
      for (const k of item.keys) {
        const normK = k.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const compactK = normK.replace(/\s+/g, '');
        if (normK.length >= 4 && (normalized.includes(normK) || normK.includes(normalized))) {
          return item;
        }
        if (compactK.length >= 4 && (compactQuery.includes(compactK) || compactK.includes(compactQuery))) {
          return item;
        }
      }

      const nameLower = item.name.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
      const compactN = nameLower.replace(/\s+/g, '');
      if (nameLower.length >= 4 && (normalized.includes(nameLower) || nameLower.includes(normalized))) {
        return item;
      }
      if (compactN.length >= 4 && (compactQuery.includes(compactN) || compactN.includes(compactQuery))) {
        return item;
      }
    }
  }

  return null;
}
