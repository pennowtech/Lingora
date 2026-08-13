export interface WordLemma {
  id: string;
  form: string;
  pos: string;
  cefr: string;
  gender?: 'der' | 'die' | 'das';
  frequency: number;
  grammar: {
    partOfSpeech: string;
    cases?: string;
    preposition?: string;
    conjugation?: {
      praesens: string;
      praeteritum: string;
      perfekt: string;
    };
    prefixType?: string;
    cefrNotes: string;
  };
  clusters: {
    id: string;
    context: string;
    translation: string;
    definition: string;
    examples: { de: string; en: string }[];
  }[];
  surfaceForms: string[];
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  totalCards: number;
  dueToday: number;
  newToday: number;
  retention: number;
  icon: string;
  color: string;
}

export interface MiningItem {
  id: string;
  sentence: string;
  source: 'web' | 'youtube' | 'clipboard';
  sourceTitle: string;
  targetWords: string[];
  extractedContext?: string;
  status: 'pending' | 'processed';
  createdAt: string;
}

export interface CardReview {
  id: string;
  word: string;
  pos: string;
  cefr: string;
  context: string;
  front: string;
  back: string;
  exampleDe: string;
  exampleEn: string;
  audioUrl?: string;
}

export const MOCK_DECKS: Deck[] = [
  {
    id: 'deck-1',
    title: 'German Core B2 Vocabulary',
    description: 'High frequency words and phrases for upper-intermediate German mastery.',
    totalCards: 480,
    dueToday: 18,
    newToday: 5,
    retention: 92.4,
    icon: 'BookOpen',
    color: '#6366f1'
  },
  {
    id: 'deck-2',
    title: 'Subtitles & Media Mining',
    description: 'Sentences captured directly from YouTube German channels & Nachrichten.',
    totalCards: 142,
    dueToday: 7,
    newToday: 3,
    retention: 88.0,
    icon: 'Tv',
    color: '#10b981'
  },
  {
    id: 'deck-3',
    title: 'Tech & Business German',
    description: 'Professional terminology, office context, and software engineering terms.',
    totalCards: 95,
    dueToday: 4,
    newToday: 2,
    retention: 95.1,
    icon: 'Cpu',
    color: '#8b5cf6'
  }
];

export const MOCK_WORDS: WordLemma[] = [
  {
    id: 'w-1',
    form: 'ausgehen',
    pos: 'verb',
    cefr: 'B1',
    frequency: 340,
    grammar: {
      partOfSpeech: 'Starkes Verb (Strong Verb)',
      cases: 'von + Dativ (when assuming)',
      preposition: 'von + Dativ / mit + Dativ',
      conjugation: {
        praesens: 'er/sie/es geht aus',
        praeteritum: 'er/sie/es ging aus',
        perfekt: 'ist ausgegangen'
      },
      prefixType: 'Trennbares Verb (Separable Prefix: aus-)',
      cefrNotes: 'B1/B2 grammar point: Trennbare Verben split in main clauses ("Er geht abends aus") and reattach in Perfekt ("ist ausgegangen"). When paired with "von", it takes Dative.'
    },
    clusters: [
      {
        id: 'cluster-101',
        context: 'Social / Going out',
        translation: 'to go out socially',
        definition: 'Mit Freunden das Haus verlassen, um sich zu amüsieren.',
        examples: [
          { de: 'Wir gehen am Samstagabend zusammen ausgehen.', en: 'We are going out together on Saturday evening.' },
          { de: 'Hast du Lust, heute Abend auszugehen?', en: 'Do you feel like going out tonight?' }
        ]
      },
      {
        id: 'cluster-102',
        context: 'Devices / Power',
        translation: 'to turn off / go out',
        definition: 'Das Erlöschen oder Ausschalten einer Lichtquelle oder eines Geräts.',
        examples: [
          { de: 'Das Licht ging plötzlich mitten im Satz aus.', en: 'The light suddenly went out in the middle of the sentence.' }
        ]
      },
      {
        id: 'cluster-103',
        context: 'Assumptions / Premise',
        translation: 'to assume / start from',
        definition: 'Etwas als Voraussetzung annehmen.',
        examples: [
          { de: 'Wir gehen davon aus, dass das Ergebnis korrekt ist.', en: 'We assume that the result is correct.' }
        ]
      }
    ],
    surfaceForms: ['ausgehen', 'geht aus', 'ging aus', 'ausgegangen', 'ginge aus']
  },
  {
    id: 'w-2',
    form: 'Voraussetzung',
    pos: 'noun',
    gender: 'die',
    cefr: 'B2',
    frequency: 610,
    grammar: {
      partOfSpeech: 'Feminines Nomen (Feminine Noun)',
      cases: 'Genitiv: der Voraussetzung | Plural: die Voraussetzungen',
      preposition: 'unter der Voraussetzung, dass... (on condition that)',
      cefrNotes: 'B2 Noun collocation: Commonly used in formal business & academic German. Formed with prefix "voraus-" + "Setzung".'
    },
    clusters: [
      {
        id: 'cluster-201',
        context: 'Prerequisite / Condition',
        translation: 'requirement, prerequisite',
        definition: 'Eine Bedingung, die erfüllt sein muss, bevor etwas geschehen kann.',
        examples: [
          { de: 'Gute Deutschkenntnisse sind eine wichtige Voraussetzung für die Stelle.', en: 'Good German skills are an important prerequisite for the job.' }
        ]
      }
    ],
    surfaceForms: ['Voraussetzung', 'Voraussetzungen']
  },
  {
    id: 'w-3',
    form: 'entscheidend',
    pos: 'adjective',
    cefr: 'B2',
    frequency: 780,
    grammar: {
      partOfSpeech: 'Partizip I als Adjektiv (Present Participle used as Adjective)',
      cases: 'Deklination: ein entscheidender Vorteil / die entscheidende Frage',
      preposition: 'entscheidend für + Akkusativ',
      cefrNotes: 'B2 Adjective: Derived from "entscheiden" (to decide). Declines according to standard strong/weak adjective endings.'
    },
    clusters: [
      {
        id: 'cluster-301',
        context: 'Importance / Impact',
        translation: 'crucial, decisive',
        definition: 'Von sehr großer Bedeutung für einen Ausgang oder Erfolg.',
        examples: [
          { de: 'Das war eine entscheidende Rolle in unserem Projekt.', en: 'That was a crucial role in our project.' }
        ]
      }
    ],
    surfaceForms: ['entscheidend', 'entscheidender', 'entscheidende', 'entscheidendste']
  }
];

export const MOCK_CARDS_QUEUE: CardReview[] = [
  {
    id: 'c-101',
    word: 'ausgehen',
    pos: 'verb',
    cefr: 'B1',
    context: 'Assumptions / Premise',
    front: 'Wir gehen davon ___, dass das Ergebnis korrekt ist.',
    back: 'aus',
    exampleDe: 'Wir gehen davon aus, dass das Ergebnis korrekt ist.',
    exampleEn: 'We assume that the result is correct.'
  },
  {
    id: 'c-102',
    word: 'Voraussetzung',
    pos: 'noun',
    cefr: 'B2',
    context: 'Prerequisite / Condition',
    front: 'Gute Deutschkenntnisse sind eine wichtige ___ für die Stelle.',
    back: 'Voraussetzung',
    exampleDe: 'Gute Deutschkenntnisse sind eine wichtige Voraussetzung für die Stelle.',
    exampleEn: 'Good German skills are an important prerequisite for the job.'
  },
  {
    id: 'c-103',
    word: 'entscheidend',
    pos: 'adjective',
    cefr: 'B2',
    context: 'Importance / Impact',
    front: 'Was war der ___ Faktor für den Erfolg?',
    back: 'entscheidende',
    exampleDe: 'Was war der entscheidende Faktor für den Erfolg?',
    exampleEn: 'What was the decisive factor for the success?'
  }
];

export const MOCK_MINING_QUEUE: MiningItem[] = [
  {
    id: 'm-1',
    sentence: 'Die Bundesregierung plant umfassende Maßnahmen zur Digitalisierung der Schulen.',
    source: 'web',
    sourceTitle: 'Tagesschau — Nachrichten',
    targetWords: ['umfassende', 'Maßnahmen'],
    extractedContext: 'Government / Policy',
    status: 'pending',
    createdAt: '10 mins ago'
  },
  {
    id: 'm-2',
    sentence: 'Es ist wichtig, bei der Softwareentwicklung auf Wartbarkeit und Skalierbarkeit zu achten.',
    source: 'clipboard',
    sourceTitle: 'Clipboard Capture',
    targetWords: ['Wartbarkeit', 'Skalierbarkeit'],
    extractedContext: 'Tech & Engineering',
    status: 'pending',
    createdAt: '1 hour ago'
  },
  {
    id: 'm-3',
    sentence: 'In diesem Video sprechen wir über die Vor- und Nachteile von Remote-Arbeit.',
    source: 'youtube',
    sourceTitle: 'Easy German — Ep. 482',
    targetWords: ['Vor- und Nachteile'],
    extractedContext: 'General Conversation',
    status: 'processed',
    createdAt: 'Yesterday'
  }
];
