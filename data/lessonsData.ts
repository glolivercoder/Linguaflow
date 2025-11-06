import { Lesson, LessonLevel, LessonTheme, ExpressionType, DictionaryEntry } from '../types/licoes';

export const BASE_DICTIONARY_ENTRIES: Record<string, DictionaryEntry> = {
  'break the ice': {
    word: 'Break the ice',
    translation: 'quebrar o gelo',
    examples: [
      'We played a quick game to break the ice before class started.',
      'Telling a light joke can break the ice during introductions.'
    ],
  },
  'small talk': {
    word: 'Small talk',
    translation: 'conversa fiada, papo informal',
    examples: [
      'Small talk helps new teammates feel comfortable.',
      'She is great at small talk when meeting clients.'
    ],
  },
  'down-to-earth': {
    word: 'Down-to-earth',
    translation: 'pe no chao, acessivel',
    examples: [
      'Lucas is so down-to-earth that everyone feels relaxed around him.',
      'People appreciate leaders who stay down-to-earth.'
    ],
  },
  'hit it off': {
    word: 'Hit it off',
    translation: 'se dar bem de cara',
    examples: [
      'Maya and her new roommate hit it off on the first night.',
      'It is easier to hit it off when you share interests.'
    ],
  },
  'hang out': {
    word: 'Hang out',
    translation: 'passar tempo juntos',
    examples: [
      'They decided to hang out at the cafe after class.',
      "Let us hang out this weekend and watch a movie."
    ],
  },
  'catch up': {
    word: 'Catch up',
    translation: 'colocar a conversa em dia',
    examples: [
      'We grabbed smoothies to catch up after the seminar.',
      "Let us catch up soon; it has been a while!"
    ],
  },
  'game-changer': {
    word: 'Game-changer',
    translation: 'algo revolucionario, divisor de aguas',
    examples: [
      'Her new tablet was a game-changer for her designs.',
      'Learning to delegate was a game-changer for his productivity.'
    ],
  },
  'on a roll': {
    word: 'On a roll',
    translation: 'em uma sequencia de vitorias',
    examples: [
      'Jamal was on a roll and won three rounds in a row.',
      "Keep going, you are on a roll tonight!"
    ],
  },
  'nerd out': {
    word: 'Nerd out',
    translation: 'se empolgar falando de um assunto nerd',
    examples: [
      'They love to nerd out about board game mechanics.',
      'Whenever coding comes up, he starts to nerd out.'
    ],
  },
  'play it cool': {
    word: 'Play it cool',
    translation: 'manter a calma, fazer cara de que nao liga',
    examples: [
      'She tried to play it cool even though she was nervous.',
      'Play it cool and see how the conversation flows.'
    ],
  },
  'butterflies in my stomach': {
    word: 'Butterflies in my stomach',
    translation: 'frio na barriga',
    examples: [
      'I always get butterflies in my stomach before a date.',
      'He felt butterflies in his stomach as he walked toward the table.'
    ],
  },
  'ask someone out': {
    word: 'Ask someone out',
    translation: 'chamar alguem para sair',
    examples: [
      'Jonah finally asked her out for Saturday night.',
      'You should ask him out if you like him.'
    ],
  },
  'spill the tea': {
    word: 'Spill the tea',
    translation: 'contar fofoca, revelar novidades',
    examples: [
      'Okay, spill the tea, what happened at the party?',
      'Every Monday she spills the tea about the weekend.'
    ],
  },
  'in the loop': {
    word: 'In the loop',
    translation: 'por dentro das novidades',
    examples: [
      'Keep me in the loop about the new project.',
      'Lina made a chat group to keep friends in the loop.'
    ],
  },
  'buzzkill': {
    word: 'Buzzkill',
    translation: 'pessoa ou situacao que corta o clima',
    examples: [
      'Complaining about deadlines was a total buzzkill.',
      "Do not be a buzzkill; we are celebrating!"
    ],
  },
};

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Breaking the Ice at Smart Start',
    level: LessonLevel.BASICO,
    theme: LessonTheme.APRESENTACAO,
    story: {
      id: 'story-1',
      title: 'Welcome Mixer',
      level: LessonLevel.BASICO,
      theme: LessonTheme.APRESENTACAO,
      paragraphs: [
        'Emma straightened the name tags on the table and took a steadying breath. "Hey everyone, let us break the ice with a quick game," she said, waving a stack of fun fact cards.',
        'Lucas chuckled and joined in with some small talk, flashing a down-to-earth smile that made the newcomers relax instantly.'
      ],
      content: [
        'Emma straightened the name tags on the table and took a steadying breath. "Hey everyone, let us break the ice with a quick game," she said, waving a stack of fun fact cards.',
        'Lucas chuckled and joined in with some small talk, flashing a down-to-earth smile that made the newcomers relax instantly.'
      ].join('\n\n'),
      expressions: [
        {
          text: 'break the ice',
          type: ExpressionType.IDIOM,
          translation: 'quebrar o gelo',
          examples: ['We played a quick game to break the ice before class started.']
        },
        {
          text: 'small talk',
          type: ExpressionType.IDIOM,
          translation: 'conversa fiada',
          examples: ['Making small talk helps new teammates feel at ease.']
        },
        {
          text: 'down-to-earth',
          type: ExpressionType.IDIOM,
          translation: 'pe no chao, acessivel',
          examples: ['Lucas is so down-to-earth that everyone relaxes around him.']
        }
      ],
    },
    quizQuestions: [
      {
        id: 'lesson-1-q1',
        question: 'What activity does Emma propose to welcome everyone?',
        options: [
          'Start the meeting with formal introductions',
          'Play a quick game using fun fact cards',
          'Watch a short presentation about the club',
          'Split into teams for a challenge'
        ],
        correctAnswer: 1,
        explanation: 'Emma suggests a quick icebreaker game using fun fact cards to help everyone relax.'
      },
      {
        id: 'lesson-1-q2',
        question: 'Why does Emma feel the need to "break the ice"?',
        options: [
          'She wants to test people on their knowledge',
          'The newcomers look tense and unfamiliar with one another',
          'The group has already met several times',
          'Lucas asked her to organize a contest'
        ],
        correctAnswer: 1,
        explanation: 'She notices the newcomers are still tense, so a light activity will help everyone feel comfortable.'
      },
      {
        id: 'lesson-1-q3',
        question: 'How does Lucas help the newcomers relax?',
        options: [
          'By cracking a confident smile and chatting casually',
          'By giving them a list of rules to follow',
          'By leaving the room to bring snacks',
          'By assigning them to teams immediately'
        ],
        correctAnswer: 0,
        explanation: 'Lucas makes casual small talk with a down-to-earth smile, helping newcomers feel welcome.'
      },
      {
        id: 'lesson-1-q4',
        question: 'Which expression from the story best describes casual conversation?',
        options: [
          'Break the ice',
          'Small talk',
          'Down-to-earth',
          'Game-changer'
        ],
        correctAnswer: 1,
        explanation: '"Small talk" refers to light, informal conversation used to make people feel at ease.'
      }
    ],
    writingExercises: [
      {
        id: 'lesson-1-writing-1',
        type: 'reconstruction',
        prompt: 'Reescreva a fala de Emma para convidar todos para o jogo usando "Hey everyone".',
        expectedAnswer: 'Hey everyone, let us break the ice with a quick game.',
        evaluationMode: 'exact',
        hints: ['Comece com "Hey everyone"', 'Inclua a expressão "break the ice"'],
        modelAnswer: 'Hey everyone, let us break the ice with a quick game.'
      },
      {
        id: 'lesson-1-writing-2',
        type: 'translation',
        prompt: 'Traduza para o inglês: "Lucas fez uma conversa leve para deixar todos confortáveis."',
        expectedAnswer: 'Lucas made small talk to make everyone feel comfortable.',
        evaluationMode: 'exact',
        hints: ['Use "small talk"', 'Use o verbo "make"'],
        modelAnswer: 'Lucas made small talk to make everyone feel comfortable.'
      }
    ],
    pronunciationExercises: [],
  },
  {
    id: 'lesson-2',
    title: 'New Roommates, New Vibes',
    level: LessonLevel.BASICO,
    theme: LessonTheme.AMIZADE,
    story: {
      id: 'story-2',
      title: 'Dorm Life',
      level: LessonLevel.BASICO,
      theme: LessonTheme.AMIZADE,
      paragraphs: [
        'Maya and Priya started decorating their dorm wall with postcards. They instantly hit it off when they realized they both loved indie music.',
        'After orientation the duo promised to hang out and catch up over bubble tea, already laughing about the campus gossip.'
      ],
      content: [
        'Maya and Priya started decorating their dorm wall with postcards. They instantly hit it off when they realized they both loved indie music.',
        'After orientation the duo promised to hang out and catch up over bubble tea, already laughing about the campus gossip.'
      ].join('\n\n'),
      expressions: [
        {
          text: 'hit it off',
          type: ExpressionType.IDIOM,
          translation: 'se dar bem de cara',
          examples: ['We hit it off the moment we discovered a shared hobby.']
        },
        {
          text: 'hang out',
          type: ExpressionType.SLANG,
          translation: 'passar tempo juntos',
          examples: ['Let us hang out this weekend and explore the city.']
        },
        {
          text: 'catch up',
          type: ExpressionType.SLANG,
          translation: 'colocar a conversa em dia',
          examples: ['We need to catch up over coffee soon.']
        }
      ],
    },
    quizQuestions: [
      {
        id: 'lesson-2-q1',
        question: 'What made Maya and Priya hit it off right away?',
        options: [
          'They both arrived late to orientation',
          'They realized they share a love for indie music',
          'They were assigned the same homework project',
          'They had already met in high school'
        ],
        correctAnswer: 1,
        explanation: 'They bonded instantly when they discovered a shared passion for indie music.'
      },
      {
        id: 'lesson-2-q2',
        question: 'Where do Maya and Priya plan to hang out after orientation?',
        options: [
          'At the campus gym',
          'At the bubble tea shop',
          'In the library study room',
          'At the club fair'
        ],
        correctAnswer: 1,
        explanation: 'They decide to grab bubble tea together so they can relax and chat more.'
      },
      {
        id: 'lesson-2-q3',
        question: 'Which expression from the story means “put conversation up to date”?',
        options: [
          'Hit it off',
          'Hang out',
          'Catch up',
          'Down-to-earth'
        ],
        correctAnswer: 2,
        explanation: '“Catch up” means talking about everything that has happened recently.'
      },
      {
        id: 'lesson-2-q4',
        question: 'What are Maya and Priya doing when the scene begins?',
        options: [
          'Practicing a song for the talent show',
          'Decorating their dorm wall with postcards',
          'Packing their bags to move out',
          'Studying for an upcoming exam'
        ],
        correctAnswer: 1,
        explanation: 'They are decorating their shared dorm wall using colorful postcards.'
      }
    ],
    writingExercises: [
      {
        id: 'lesson-2-writing-1',
        type: 'translation',
        prompt: 'Traduza: "Vamos colocar a conversa em dia com um bubble tea."',
        expectedAnswer: 'Let us catch up over bubble tea.',
        evaluationMode: 'exact',
        hints: ['Use "catch up"', 'Inclua "over bubble tea"'],
        modelAnswer: 'Let us catch up over bubble tea.'
      },
      {
        id: 'lesson-2-writing-2',
        type: 'free-writing',
        prompt: 'Escreva 2-3 frases explicando por que Maya e Priya se deram tão bem.',
        evaluationMode: 'free',
        wordCountTarget: 35,
        hints: ['Mencione o hobby em comum', 'Use a expressão "hit it off"'],
        modelAnswer: 'Maya and Priya hit it off because they both love indie music. They decorated their dorm together and planned to catch up over bubble tea.'
      }
    ],
    pronunciationExercises: [],
  },
  {
    id: 'lesson-3',
    title: 'Saturday Hobby Swap',
    level: LessonLevel.INTERMEDIARIO,
    theme: LessonTheme.HOBBIES,
    story: {
      id: 'story-3',
      title: 'Game Night',
      level: LessonLevel.INTERMEDIARIO,
      theme: LessonTheme.HOBBIES,
      paragraphs: [
        'Jamal revealed a brand-new cooperative board game that was a total game-changer for their Saturday hangout.',
        'By the third round he was on a roll, and Lina could only nerd out about the clever rules while cheering him on.'
      ],
      content: [
        'Jamal revealed a brand-new cooperative board game that was a total game-changer for their Saturday hangout.',
        'By the third round he was on a roll, and Lina could only nerd out about the clever rules while cheering him on.'
      ].join('\n\n'),
      expressions: [
        {
          text: 'game-changer',
          type: ExpressionType.SLANG,
          translation: 'algo revolucionario',
          examples: ['This new app is a game-changer for language practice.']
        },
        {
          text: 'on a roll',
          type: ExpressionType.IDIOM,
          translation: 'em uma sequencia de vitorias',
          examples: ['You are on a roll, keep playing!']
        },
        {
          text: 'nerd out',
          type: ExpressionType.SLANG,
          translation: 'se empolgar falando de um assunto nerd',
          examples: ['They love to nerd out about sci fi movies.']
        }
      ],
    },
    quizQuestions: [
      {
        id: 'lesson-3-q1',
        question: 'What makes the new board game feel like a “game-changer” for Jamal’s group?',
        options: [
          'It comes with a difficult rulebook they can study',
          'It introduces fresh cooperative mechanics for their hangout',
          'It forces everyone to play individually',
          'It replaces their usual Saturday meetup'
        ],
        correctAnswer: 1,
        explanation: 'The game offers new cooperative mechanics that reinvent their regular Saturday hangout.'
      },
      {
        id: 'lesson-3-q2',
        question: 'How does Lina react while Jamal is on a roll?',
        options: [
          'She complains about the rules being unfair',
          'She leaves the game and sits out',
          'She nerds out about the clever rules and cheers him on',
          'She suggests switching to another game'
        ],
        correctAnswer: 2,
        explanation: 'Lina cheers him on and nerds out about the game’s clever rules.'
      },
      {
        id: 'lesson-3-q3',
        question: 'Which expression best describes Jamal winning several rounds in a row?',
        options: [
          'On a roll',
          'Break the ice',
          'Down-to-earth',
          'Spill the tea'
        ],
        correctAnswer: 0,
        explanation: '“On a roll” means being in a streak of successive wins or successes.'
      },
      {
        id: 'lesson-3-q4',
        question: 'What level is this story targeted at?',
        options: [
          'Básico',
          'Intermediário',
          'Avançado',
          'Profissional'
        ],
        correctAnswer: 1,
        explanation: '“Saturday Hobby Swap” is tagged with LessonLevel.INTERMEDIARIO.'
      }
    ],
    writingExercises: [
      {
        id: 'lesson-3-writing-1',
        type: 'free-writing',
        prompt: 'Em pelo menos 15 palavras, explique por que o novo board game foi um "game-changer".',
        evaluationMode: 'keywords',
        keywords: ['game-changer', 'cooperative', 'on a roll', 'nerd out'],
        wordCountTarget: 15,
        hints: ['Inclua a expressão "game-changer"', 'Mencione como o grupo reagiu'],
        modelAnswer: 'The new cooperative board game was a real game-changer because everyone could nerd out about the clever rules while Jamal stayed on a roll.'
      },
      {
        id: 'lesson-3-writing-2',
        type: 'fill-blank',
        prompt: 'Complete: "By the third round he was ____ and Lina could only nerd out."',
        expectedAnswer: 'on a roll',
        evaluationMode: 'exact',
        hints: ['Use duas palavras', 'Expressão idiomática de sequência de vitórias'],
        modelAnswer: 'on a roll'
      }
    ],
    pronunciationExercises: [],
  },
  {
    id: 'lesson-4',
    title: 'Play It Cool at the Coffee Bar',
    level: LessonLevel.INTERMEDIARIO,
    theme: LessonTheme.PAQUERA,
    story: {
      id: 'story-4',
      title: 'Latte Chemistry',
      level: LessonLevel.INTERMEDIARIO,
      theme: LessonTheme.PAQUERA,
      paragraphs: [
        'Jonah spotted Aria reading in the corner and tried to play it cool as he ordered lattes for two.',
        'He confessed that he had butterflies in his stomach but finally asked her out to the rooftop concert.'
      ],
      content: [
        'Jonah spotted Aria reading in the corner and tried to play it cool as he ordered lattes for two.',
        'He confessed that he had butterflies in his stomach but finally asked her out to the rooftop concert.'
      ].join('\n\n'),
      expressions: [
        {
          text: 'play it cool',
          type: ExpressionType.SLANG,
          translation: 'agir naturalmente, sem demonstrar nervosismo',
          examples: ['Just play it cool and keep the chat light.']
        },
        {
          text: 'butterflies in his stomach',
          type: ExpressionType.IDIOM,
          translation: 'frio na barriga',
          examples: ['I get butterflies in my stomach before public speaking.']
        },
        {
          text: 'asked her out',
          type: ExpressionType.SLANG,
          translation: 'chamou ela para sair',
          examples: ['He finally asked her out after weeks of texting.']
        }
      ],
    },
    quizQuestions: [
      {
        id: 'lesson-4-q1',
        question: 'What does Jonah do to "play it cool" when he notices Aria?',
        options: [
          'He ignores her and studies quietly',
          'He orders two lattes to act casual',
          'He leaves the coffee bar immediately',
          'He loudly announces his feelings'
        ],
        correctAnswer: 1,
        explanation: 'Jonah orders two lattes as if it were a casual gesture, even though he is nervous.'
      },
      {
        id: 'lesson-4-q2',
        question: 'What emotion is Jonah experiencing when he says he has butterflies in his stomach?',
        options: [
          'Calm confidence',
          'Nervous excitement',
          'Anger and frustration',
          'Boredom and fatigue'
        ],
        correctAnswer: 1,
        explanation: '“Butterflies in his stomach” describes nervous excitement, often felt before a date.'
      },
      {
        id: 'lesson-4-q3',
        question: 'Where does Jonah invite Aria to go with him?',
        options: [
          'A rooftop concert',
          'A study session at the library',
          'A weekend hiking trip',
          'A movie premiere'
        ],
        correctAnswer: 0,
        explanation: 'He asks her to join him at a rooftop concert later.'
      },
      {
        id: 'lesson-4-q4',
        question: 'Which expression from the story means inviting someone on a date?',
        options: [
          'Play it cool',
          'Ask her out',
          'Catch up',
          'Hang out'
        ],
        correctAnswer: 1,
        explanation: '“Ask her out” explicitly refers to inviting someone on a date.'
      }
    ],
    writingExercises: [
      {
        id: 'lesson-4-writing-1',
        type: 'fill-blank',
        prompt: 'Complete: "Jonah tried to ____ as he ordered lattes for two."',
        expectedAnswer: 'play it cool',
        evaluationMode: 'exact',
        hints: ['Expressão composta por três palavras'],
        modelAnswer: 'play it cool'
      },
      {
        id: 'lesson-4-writing-2',
        type: 'translation',
        prompt: 'Traduza: "Ele estava com frio na barriga mas decidiu chamar Aria para sair."',
        expectedAnswer: 'He had butterflies in his stomach but decided to ask Aria out.',
        evaluationMode: 'exact',
        hints: ['Use "butterflies in his stomach"', 'Use "ask Aria out"'],
        modelAnswer: 'He had butterflies in his stomach but decided to ask Aria out.'
      }
    ],
    pronunciationExercises: [],
  },
  {
    id: 'lesson-5',
    title: 'Spill the Tea at the Studio',
    level: LessonLevel.AVANCADO,
    theme: LessonTheme.FOFOCA,
    story: {
      id: 'story-5',
      title: 'Creative Break',
      level: LessonLevel.AVANCADO,
      theme: LessonTheme.FOFOCA,
      paragraphs: [
        'During the late-night edit session Lina whispered, "Spill the tea, what did the producer say?"',
        'Ravi promised to keep everyone in the loop, warning not to be a buzzkill with negative vibes.'
      ],
      content: [
        'During the late-night edit session Lina whispered, "Spill the tea, what did the producer say?"',
        'Ravi promised to keep everyone in the loop, warning not to be a buzzkill with negative vibes.'
      ].join('\n\n'),
      expressions: [
        {
          text: 'spill the tea',
          type: ExpressionType.SLANG,
          translation: 'contar fofoca',
          examples: ['She loves to spill the tea about celebrity news.']
        },
        {
          text: 'in the loop',
          type: ExpressionType.IDIOM,
          translation: 'por dentro das novidades',
          examples: ['Please keep me in the loop about any changes.']
        },
        {
          text: 'buzzkill',
          type: ExpressionType.SLANG,
          translation: 'pessoa que corta o clima',
          examples: ['Do not be a buzzkill; the party just started!']
        }
      ],
    },
    quizQuestions: [
      {
        id: 'lesson-5-q1',
        question: 'What does Lina want to know when she says “Spill the tea”?',
        options: [
          'She wants Ravi to keep the information secret',
          'She wants Ravi to share what the producer said',
          'She wants Ravi to delete the latest footage',
          'She wants Ravi to call the producer back'
        ],
        correctAnswer: 1,
        explanation: '“Spill the tea” is an informal way to ask someone to share gossip or hidden information.'
      },
      {
        id: 'lesson-5-q2',
        question: 'What promise does Ravi make to the team?',
        options: [
          'He promises to finish the edit alone',
          'He promises to keep everyone in the loop',
          'He promises to end the project immediately',
          'He promises to reschedule the recording session'
        ],
        correctAnswer: 1,
        explanation: 'Ravi reassures everyone that he will keep them informed about new updates.'
      },
      {
        id: 'lesson-5-q3',
        question: 'Why does Ravi warn the team not to be a “buzzkill”?',
        options: [
          'Because the producer asked for silence',
          'Because he wants to keep the mood positive despite the late session',
          'Because they were laughing too loudly',
          'Because he wants everyone to leave the studio'
        ],
        correctAnswer: 1,
        explanation: 'Ravi reminds them not to kill the vibe so the team can stay motivated while working late.'
      },
      {
        id: 'lesson-5-q4',
        question: 'Which theme melhor descreve esta lição?',
        options: [
          'Apresentações',
          'Hobbies',
          'Fofoca',
          'Amizade'
        ],
        correctAnswer: 2,
        explanation: 'A história gira em torno de fofocas e atualizações, por isso está no tema “Fofoca”.'
      }
    ],
    writingExercises: [
      {
        id: 'lesson-5-writing-1',
        type: 'free-writing',
        prompt: 'Liste duas expressões de fofoca usadas na história.',
        evaluationMode: 'keywords',
        keywords: ['spill the tea', 'in the loop', 'buzzkill'],
        hints: ['Expressões compostas', 'Uma delas significa compartilhar novidades'],
        modelAnswer: 'Spill the tea, in the loop'
      },
      {
        id: 'lesson-5-writing-2',
        type: 'free-writing',
        prompt: 'Descreva como Ravi mantém a equipe motivada durante a noite de edição (mínimo 30 palavras).',
        evaluationMode: 'free',
        wordCountTarget: 30,
        hints: ['Mencione "keep everyone in the loop"', 'Fale sobre manter a energia positiva'],
        modelAnswer: 'Ravi keeps everyone in the loop by promising updates from the producer and reminding the team not to be a buzzkill so the creative energy stays high during the late session.'
      }
    ],
    pronunciationExercises: [],
  },
];
