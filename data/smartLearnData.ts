export interface ExerciseItem {
  id: string;
  title: string;
  sentenceEn: string;
  sentencePt: string;
  answer: string;
  hint?: string;
}

export interface SmartTopic {
  id: string;
  title: string;
  description: string;
  pattern: string;
  exampleEn: string;
  examplePt: string;
  exercises: ExerciseItem[];
}

export interface SmartCategory {
  id: string;
  title: string;
  topics: SmartTopic[];
}

export const smartCategories: SmartCategory[] = [
  {
    id: 'basics',
    title: 'Estrutura básica',
    topics: [
      {
        id: 'plurals',
        title: 'Plurals (Plurais)',
        description: 'A maioria dos substantivos fica no plural com “-s”. Terminações em s, sh, ch, x ou z pedem “-es”.',
        pattern: 'Singular + s/es → plural',
        exampleEn: 'One bus → Two buses',
        examplePt: 'Um ônibus → Dois ônibus',
        exercises: [
          {
            id: 'plurals-ex1',
            title: 'Plural correto',
            sentenceEn: 'There are three _______ (box) on the shelf.',
            sentencePt: 'Há três _______ na prateleira.',
            answer: 'boxes',
            hint: 'Terminou em x → acrescente “-es”.'
          }
        ]
      },
      {
        id: 'articles',
        title: 'Articles (A / An / The)',
        description: '“A” antecede som consonantal, “an” som vocálico e “the” identifica algo específico.',
        pattern: 'A + som consonantal | An + som vocálico | The + específico',
        exampleEn: 'An orange is on the table.',
        examplePt: 'Uma laranja está sobre a mesa.',
        exercises: [
          {
            id: 'articles-ex1',
            title: 'Escolha o artigo',
            sentenceEn: 'Please hand me ___ umbrella by the door.',
            sentencePt: 'Por favor, me passe ___ guarda-chuva perto da porta.',
            answer: 'the'
          }
        ]
      },
      {
        id: 'countability',
        title: 'Countable & Uncountable Nouns',
        description: 'Contáveis aceitam números e “many/few”; incontáveis usam “much/little”.',
        pattern: 'many/few + contáveis | much/little + incontáveis',
        exampleEn: 'We need much water and few bottles.',
        examplePt: 'Precisamos de muita água e poucas garrafas.',
        exercises: [
          {
            id: 'countability-ex1',
            title: 'Classifique',
            sentenceEn: 'How much _______ (sugar) do you need?',
            sentencePt: 'Quanto _______ você precisa?',
            answer: 'sugar'
          }
        ]
      },
      {
        id: 'subject-pronouns',
        title: 'Subject Pronouns',
        description: 'Pronomes sujeito introduzem a ação: I, you, he, she, it, we, they.',
        pattern: 'Pronome sujeito + verbo',
        exampleEn: 'They live in Canada.',
        examplePt: 'Eles moram no Canadá.',
        exercises: [
          {
            id: 'subject-pronouns-ex1',
            title: 'Quem age?',
            sentenceEn: '___ (She / Her) likes chocolate.',
            sentencePt: '___ gosta de chocolate.',
            answer: 'She'
          }
        ]
      },
      {
        id: 'object-pronouns',
        title: 'Object Pronouns',
        description: 'Pronomes objeto recebem a ação: me, you, him, her, it, us, them.',
        pattern: 'Verbo + pronome objeto',
        exampleEn: 'Can you help us?',
        examplePt: 'Você pode nos ajudar?',
        exercises: [
          {
            id: 'object-pronouns-ex1',
            title: 'Quem recebe?',
            sentenceEn: 'I saw ___ (they) at the park.',
            sentencePt: 'Eu vi ___ no parque.',
            answer: 'them'
          }
        ]
      },
      {
        id: 'possessive-adjectives',
        title: 'Possessive Adjectives',
        description: 'Acompanham substantivos: my, your, his, her, its, our, their.',
        pattern: 'Possessivo + substantivo',
        exampleEn: 'This is our classroom.',
        examplePt: 'Esta é a nossa sala de aula.',
        exercises: [
          {
            id: 'poss-adj-ex1',
            title: 'De quem?',
            sentenceEn: 'Is this ___ (you) notebook?',
            sentencePt: 'Este é o caderno ___?',
            answer: 'your'
          }
        ]
      },
      {
        id: 'possessive-pronouns',
        title: 'Possessive Pronouns',
        description: 'Substituem o substantivo: mine, yours, his, hers, ours, theirs.',
        pattern: 'Pronome possessivo isolado',
        exampleEn: 'Those seats are ours.',
        examplePt: 'Aqueles assentos são nossos.',
        exercises: [
          {
            id: 'poss-pron-ex1',
            title: 'Escolha o pronome',
            sentenceEn: 'This phone is ___ (I).',
            sentencePt: 'Este telefone é ___.',
            answer: 'mine'
          }
        ]
      },
      {
        id: 'demonstratives',
        title: 'Demonstratives',
        description: 'This/these indicam proximidade; that/those indicam distância.',
        pattern: 'This/that + singular | These/those + plural',
        exampleEn: 'Those houses are new.',
        examplePt: 'Aquelas casas são novas.',
        exercises: [
          {
            id: 'demonstratives-ex1',
            title: 'Perto ou longe?',
            sentenceEn: '___ (This / That) book here is mine.',
            sentencePt: '___ livro aqui é meu.',
            answer: 'This'
          }
        ]
      }
    ]
  },
  {
    id: 'verbs-tenses',
    title: 'Verbos e tempos verbais',
    topics: [
      {
        id: 'verb-to-be',
        title: 'Verb To Be (Present / Past)',
        description: 'Indica estado ou identidade: am/is/are no presente e was/were no passado.',
        pattern: 'Presente: am/is/are | Passado: was/were',
        exampleEn: 'She is at home. They were happy.',
        examplePt: 'Ela está em casa. Eles estavam felizes.',
        exercises: [
          {
            id: 'verb-to-be-ex1',
            title: 'Escolha to be',
            sentenceEn: 'We ___ (be) in class yesterday.',
            sentencePt: 'Nós ___ na aula ontem.',
            answer: 'were'
          }
        ]
      },
      {
        id: 'present-simple',
        title: 'Present Simple',
        description: 'Usado para rotinas e fatos gerais. Acrescente “-s/-es” na 3ª pessoa.',
        pattern: 'Sujeito + verbo base (he/she/it + -s/-es)',
        exampleEn: 'He plays soccer on Sundays.',
        examplePt: 'Ele joga futebol aos domingos.',
        exercises: [
          {
            id: 'present-simple-ex1',
            title: 'Rotina diária',
            sentenceEn: 'My brother ___ (work) downtown.',
            sentencePt: 'Meu irmão ___ no centro.',
            answer: 'works'
          }
        ]
      },
      {
        id: 'present-continuous',
        title: 'Present Continuous',
        description: 'Mostra ação em progresso agora com to be + verbo-ing.',
        pattern: 'Am/Is/Are + verbo-ing',
        exampleEn: 'We are watching a series.',
        examplePt: 'Estamos assistindo a uma série.',
        exercises: [
          {
            id: 'present-continuous-ex1',
            title: 'Agora mesmo',
            sentenceEn: 'She ___ (cook) dinner right now.',
            sentencePt: 'Ela ___ fazendo o jantar agora.',
            answer: 'is cooking'
          }
        ]
      },
      {
        id: 'past-simple',
        title: 'Past Simple',
        description: 'Expressa ações finalizadas no passado. Regulares recebem “-ed”.',
        pattern: 'Sujeito + verbo passado',
        exampleEn: 'They visited the museum.',
        examplePt: 'Eles visitaram o museu.',
        exercises: [
          {
            id: 'past-simple-ex1',
            title: 'Ontem',
            sentenceEn: 'I ___ (walk) to work yesterday.',
            sentencePt: 'Eu ___ para o trabalho ontem.',
            answer: 'walked'
          }
        ]
      },
      {
        id: 'past-continuous',
        title: 'Past Continuous',
        description: 'Ação em progresso no passado com was/were + verbo-ing.',
        pattern: 'Was/Were + verbo-ing',
        exampleEn: 'They were studying when it rained.',
        examplePt: 'Eles estavam estudando quando choveu.',
        exercises: [
          {
            id: 'past-continuous-ex1',
            title: 'Durante o passado',
            sentenceEn: 'We ___ (drive) home when the phone rang.',
            sentencePt: 'Nós ___ dirigindo para casa quando o telefone tocou.',
            answer: 'were driving'
          }
        ]
      },
      {
        id: 'present-perfect',
        title: 'Present Perfect',
        description: 'Conecta passado ao presente usando have/has + particípio.',
        pattern: 'Have/Has + particípio',
        exampleEn: 'I have visited London twice.',
        examplePt: 'Eu visitei Londres duas vezes.',
        exercises: [
          {
            id: 'present-perfect-ex1',
            title: 'Experiência',
            sentenceEn: 'She ___ (never / eat) sushi before.',
            sentencePt: 'Ela ___ sushi antes.',
            answer: "has never eaten"
          }
        ]
      },
      {
        id: 'present-perfect-continuous',
        title: 'Present Perfect Continuous',
        description: 'Destaca duração: have/has + been + verbo-ing.',
        pattern: 'Have/Has been + verbo-ing',
        exampleEn: 'They have been studying for hours.',
        examplePt: 'Eles estão estudando há horas.',
        exercises: [
          {
            id: 'present-perfect-continuous-ex1',
            title: 'Há quanto tempo?',
            sentenceEn: 'I ___ (study) English since 2020.',
            sentencePt: 'Eu ___ estudando inglês desde 2020.',
            answer: 'have been studying'
          }
        ]
      },
      {
        id: 'past-perfect',
        title: 'Past Perfect',
        description: 'Mostra uma ação anterior a outra no passado usando had + particípio.',
        pattern: 'Had + particípio',
        exampleEn: 'She had left when I arrived.',
        examplePt: 'Ela já tinha partido quando eu cheguei.',
        exercises: [
          {
            id: 'past-perfect-ex1',
            title: 'Antes de outra ação',
            sentenceEn: 'They ___ (finish) dinner before the guests arrived.',
            sentencePt: 'Eles ___ o jantar antes dos convidados chegarem.',
            answer: 'had finished'
          }
        ]
      },
      {
        id: 'future-will',
        title: 'Future with Will',
        description: 'Usado para decisões imediatas e previsões: will + verbo base.',
        pattern: 'Will + verbo base',
        exampleEn: 'I will call you tomorrow.',
        examplePt: 'Eu vou ligar para você amanhã.',
        exercises: [
          {
            id: 'future-will-ex1',
            title: 'Decisão rápida',
            sentenceEn: 'It is cold. I ___ (close) the window.',
            sentencePt: 'Está frio. Eu ___ a janela.',
            answer: 'will close'
          }
        ]
      },
      {
        id: 'future-going-to',
        title: 'Future with Going To',
        description: 'Indica planos ou intenções: be + going to + verbo.',
        pattern: 'Be + going to + verbo',
        exampleEn: 'We are going to travel next month.',
        examplePt: 'Nós vamos viajar no próximo mês.',
        exercises: [
          {
            id: 'future-goingto-ex1',
            title: 'Plano futuro',
            sentenceEn: 'They ___ (visit) their grandparents this weekend.',
            sentencePt: 'Eles ___ visitar os avós neste fim de semana.',
            answer: 'are going to visit'
          }
        ]
      },
      {
        id: 'future-continuous',
        title: 'Future Continuous',
        description: 'Mostra ação em progresso no futuro: will be + verbo-ing.',
        pattern: 'Will be + verbo-ing',
        exampleEn: 'This time tomorrow, I will be flying.',
        examplePt: 'Amanhã a esta hora estarei voando.',
        exercises: [
          {
            id: 'future-continuous-ex1',
            title: 'Durante o futuro',
            sentenceEn: 'Next week we ___ (stay) at a hotel.',
            sentencePt: 'Na próxima semana nós ___ em um hotel.',
            answer: 'will be staying'
          }
        ]
      },
      {
        id: 'future-perfect',
        title: 'Future Perfect',
        description: 'Indica ação concluída antes de um momento futuro: will have + particípio.',
        pattern: 'Will have + particípio',
        exampleEn: 'By 2030, she will have graduated.',
        examplePt: 'Em 2030, ela já terá se formado.',
        exercises: [
          {
            id: 'future-perfect-ex1',
            title: 'Antes do futuro',
            sentenceEn: 'By noon, I ___ (finish) the report.',
            sentencePt: 'Ao meio-dia eu ___ o relatório.',
            answer: 'will have finished'
          }
        ]
      }
    ]
  },
  {
    id: 'neg-interrogative',
    title: 'Formas negativas e interrogativas',
    topics: [
      {
        id: 'neg-do',
        title: 'Negative with Do / Does',
        description: 'Use “do not (don’t)” ou “does not (doesn’t)” + verbo base para negar no presente simples.',
        pattern: 'Sujeito + do/does + not + verbo base',
        exampleEn: "She doesn’t eat meat.",
        examplePt: 'Ela não come carne.',
        exercises: [
          {
            id: 'neg-do-ex1',
            title: 'Negação presente',
            sentenceEn: 'He ___ (not / like) spicy food.',
            sentencePt: 'Ele ___ comida apimentada.',
            answer: "doesn't like"
          }
        ]
      },
      {
        id: 'neg-did',
        title: 'Negative with Did',
        description: 'Negue fatos passados com “did not (didn’t)” + verbo base.',
        pattern: 'Sujeito + did not + verbo base',
        exampleEn: "We didn’t see the movie.",
        examplePt: 'Nós não vimos o filme.',
        exercises: [
          {
            id: 'neg-did-ex1',
            title: 'Negação passada',
            sentenceEn: 'They ___ (not / finish) the project.',
            sentencePt: 'Eles ___ o projeto.',
            answer: "didn't finish"
          }
        ]
      },
      {
        id: 'neg-will',
        title: 'Negative with Will',
        description: 'Forme o futuro negativo com “will not (won’t)” + verbo base.',
        pattern: 'Will not + verbo base',
        exampleEn: "I won’t forget." ,
        examplePt: 'Eu não vou esquecer.',
        exercises: [
          {
            id: 'neg-will-ex1',
            title: 'Futuro negativo',
            sentenceEn: 'She ___ (not / attend) the meeting.',
            sentencePt: 'Ela ___ participar da reunião.',
            answer: "won't attend"
          }
        ]
      },
      {
        id: 'q-do',
        title: 'Questions with Do / Does',
        description: 'Forme perguntas no presente com do/does antes do sujeito.',
        pattern: 'Do/Does + sujeito + verbo base?',
        exampleEn: 'Do you like coffee?',
        examplePt: 'Você gosta de café?',
        exercises: [
          {
            id: 'q-do-ex1',
            title: 'Pergunta presente',
            sentenceEn: '___ (Do / Does) your sister play the piano?',
            sentencePt: '___ sua irmã toca piano?',
            answer: 'Does'
          }
        ]
      },
      {
        id: 'q-did',
        title: 'Questions with Did',
        description: 'Para perguntas no passado, use did + sujeito + verbo base.',
        pattern: 'Did + sujeito + verbo base?',
        exampleEn: 'Did they travel last year?',
        examplePt: 'Eles viajaram no ano passado?',
        exercises: [
          {
            id: 'q-did-ex1',
            title: 'Pergunta passada',
            sentenceEn: '___ (Did / Do) you see the eclipse?',
            sentencePt: '___ você viu o eclipse?',
            answer: 'Did'
          }
        ]
      },
      {
        id: 'q-will',
        title: 'Questions with Will',
        description: 'Perguntas no futuro usam will + sujeito + verbo base.',
        pattern: 'Will + sujeito + verbo base?',
        exampleEn: 'Will she join us tomorrow?',
        examplePt: 'Ela vai se juntar a nós amanhã?',
        exercises: [
          {
            id: 'q-will-ex1',
            title: 'Pergunta futura',
            sentenceEn: '___ (Will / Do) they arrive on time?',
            sentencePt: '___ eles chegarão a tempo?',
            answer: 'Will'
          }
        ]
      },
      {
        id: 'short-answers',
        title: 'Short Answers',
        description: 'Respostas curtas repetem o auxiliar: “Yes, I do / No, I don’t”.',
        pattern: 'Yes/No + sujeito + auxiliar',
        exampleEn: 'Yes, she does.',
        examplePt: 'Sim, ela faz.',
        exercises: [
          {
            id: 'short-answers-ex1',
            title: 'Resposta curta',
            sentenceEn: 'Do you drive? ___, I do.',
            sentencePt: 'Você dirige? ___, eu dirijo.',
            answer: 'Yes'
          }
        ]
      }
    ]
  },
  {
    id: 'modals',
    title: 'Modais e auxiliares',
    topics: [
      {
        id: 'can-could',
        title: 'Can / Could',
        description: 'Expressam habilidade e possibilidade. “Could” é passado ou mais formal.',
        pattern: 'Can/Could + verbo base',
        exampleEn: 'Can you swim? I could when I was younger.',
        examplePt: 'Você sabe nadar? Eu sabia quando era mais jovem.',
        exercises: [
          {
            id: 'can-could-ex1',
            title: 'Habilidade',
            sentenceEn: 'She ___ (can / could) speak three languages.',
            sentencePt: 'Ela ___ falar três idiomas.',
            answer: 'can'
          }
        ]
      },
      {
        id: 'may-might',
        title: 'May / Might',
        description: 'Indicam possibilidade ou permissão. “Might” costuma ser menos provável.',
        pattern: 'May/Might + verbo base',
        exampleEn: 'It may rain later.',
        examplePt: 'Pode chover mais tarde.',
        exercises: [
          {
            id: 'may-might-ex1',
            title: 'Possibilidade',
            sentenceEn: 'They ___ (may / might) arrive late because of traffic.',
            sentencePt: 'Eles ___ chegar atrasados por causa do trânsito.',
            answer: 'might'
          }
        ]
      },
      {
        id: 'must-have-to',
        title: 'Must / Have to',
        description: '“Must” expressa obrigação interna; “have to” é obrigação externa.',
        pattern: 'Must/Have to + verbo base',
        exampleEn: 'You must wear a helmet. You have to follow the rule.',
        examplePt: 'Você deve usar capacete. Você tem que seguir a regra.',
        exercises: [
          {
            id: 'must-have-to-ex1',
            title: 'Obrigação',
            sentenceEn: 'I ___ (must / have to) finish this report today.',
            sentencePt: 'Eu ___ terminar este relatório hoje.',
            answer: 'have to'
          }
        ]
      },
      {
        id: 'should-ought',
        title: 'Should / Ought to',
        description: 'Recomendam algo. “Ought to” é mais formal, ambos significam “deveria”.',
        pattern: 'Should/Ought to + verbo base',
        exampleEn: 'You should drink more water.',
        examplePt: 'Você deveria beber mais água.',
        exercises: [
          {
            id: 'should-ought-ex1',
            title: 'Conselho',
            sentenceEn: 'You ___ (should / must) see a doctor.',
            sentencePt: 'Você ___ procurar um médico.',
            answer: 'should'
          }
        ]
      },
      {
        id: 'would',
        title: 'Would',
        description: 'Usado para hipóteses, pedidos educados e o futuro do passado.',
        pattern: 'Would + verbo base',
        exampleEn: 'I would travel if I had time.',
        examplePt: 'Eu viajaria se tivesse tempo.',
        exercises: [
          {
            id: 'would-ex1',
            title: 'Hipótese',
            sentenceEn: 'He ___ (would / will) buy a new car if he won the lottery.',
            sentencePt: 'Ele ___ compraria um carro novo se ganhasse na loteria.',
            answer: 'would'
          }
        ]
      },
      {
        id: 'shall',
        title: 'Shall',
        description: 'Mais comum em inglês britânico para ofertas ou sugestões educadas.',
        pattern: 'Shall + sujeito + verbo base',
        exampleEn: 'Shall we start the meeting?',
        examplePt: 'Vamos começar a reunião?',
        exercises: [
          {
            id: 'shall-ex1',
            title: 'Convite',
            sentenceEn: '___ (Shall / Will) we go for a walk?',
            sentencePt: '___ vamos dar uma caminhada?',
            answer: 'Shall'
          }
        ]
      },
      {
        id: 'modals-negative-questions',
        title: 'Modal Verbs in Negative and Questions',
        description: 'Modal + not forma negativas; perguntas colocam o modal antes do sujeito.',
        pattern: 'Modal + not | Modal + sujeito + verbo base?',
        exampleEn: 'Can’t you stay longer?',
        examplePt: 'Você não pode ficar mais tempo?',
        exercises: [
          {
            id: 'modals-neg-questions-ex1',
            title: 'Modal interrogativo',
            sentenceEn: '___ (Could / Couldn’t) you help me with this box?',
            sentencePt: '___ você poderia me ajudar com esta caixa?',
            answer: 'Could'
          }
        ]
      }
    ]
  },
  {
    id: 'others',
    title: 'Outros pontos essenciais',
    topics: [
      {
        id: 'there-is-are',
        title: 'There is / There are',
        description: 'Introduzem a existência de algo no singular ou plural.',
        pattern: 'There is + singular | There are + plural',
        exampleEn: 'There are two windows in the room.',
        examplePt: 'Há duas janelas na sala.',
        exercises: [
          {
            id: 'there-ex1',
            title: 'Existe ou existem?',
            sentenceEn: 'There ___ (is / are) some books on the desk.',
            sentencePt: '___ alguns livros na mesa.',
            answer: 'are'
          }
        ]
      },
      {
        id: 'some-any-no',
        title: 'Some / Any / No',
        description: '“Some” em afirmações, “any” em negativas e perguntas, “no” em negativas enfáticas.',
        pattern: 'Some + afirmações | Any + negativas/perguntas | No + substantivo',
        exampleEn: 'Do you have any sugar? No, I have no sugar.',
        examplePt: 'Você tem açúcar? Não, não tenho açúcar.',
        exercises: [
          {
            id: 'some-any-ex1',
            title: 'Escolha correta',
            sentenceEn: 'There isn’t ___ milk in the fridge.',
            sentencePt: 'Não há ___ leite na geladeira.',
            answer: 'any'
          }
        ]
      },
      {
        id: 'quantifiers',
        title: 'Much / Many / A lot of / Few / Little',
        description: 'Quantificadores variam para contáveis e incontáveis.',
        pattern: 'Much/little + incontável | Many/few + contável | A lot of + ambos',
        exampleEn: 'She has little time but many ideas.',
        examplePt: 'Ela tem pouco tempo, mas muitas ideias.',
        exercises: [
          {
            id: 'quantifiers-ex1',
            title: 'Quanto ou quantos?',
            sentenceEn: 'We have ___ (few / little) money left.',
            sentencePt: 'Nós temos ___ dinheiro sobrando.',
            answer: 'little'
          }
        ]
      },
      {
        id: 'comparatives',
        title: 'Comparatives and Superlatives',
        description: 'Adjetivos curtos usam “-er/-est”; longos usam “more/most”.',
        pattern: 'Adjetivo curto + er/est | Adjetivo longo + more/most',
        exampleEn: 'This book is more interesting than that one.',
        examplePt: 'Este livro é mais interessante que aquele.',
        exercises: [
          {
            id: 'comparatives-ex1',
            title: 'Comparar',
            sentenceEn: 'Mount Everest is ___ (tall) mountain in the world.',
            sentencePt: 'O Monte Everest é a montanha mais ___ do mundo.',
            answer: 'the tallest'
          }
        ]
      },
      {
        id: 'adj-vs-adv',
        title: 'Adjectives vs Adverbs',
        description: 'Adjetivos descrevem substantivos; advérbios descrevem verbos ou adjetivos.',
        pattern: 'Adjetivo + substantivo | Verbo + advérbio',
        exampleEn: 'She is a careful driver. She drives carefully.',
        examplePt: 'Ela é uma motorista cuidadosa. Ela dirige cuidadosamente.',
        exercises: [
          {
            id: 'adj-adv-ex1',
            title: 'Escolha adjetivo/advérbio',
            sentenceEn: 'He speaks very ___ (calm / calmly).',
            sentencePt: 'Ele fala muito ___.',
            answer: 'calmly'
          }
        ]
      },
      {
        id: 'prep-place',
        title: 'Prepositions of Place',
        description: 'In (dentro), on (sobre), at (local específico).',
        pattern: 'In + espaço fechado | On + superfície | At + ponto específico',
        exampleEn: 'The keys are on the table.',
        examplePt: 'As chaves estão sobre a mesa.',
        exercises: [
          {
            id: 'prep-place-ex1',
            title: 'Onde está?',
            sentenceEn: 'The cat is ___ the box.',
            sentencePt: 'O gato está ___ da caixa.',
            answer: 'in'
          }
        ]
      },
      {
        id: 'prep-time',
        title: 'Prepositions of Time',
        description: 'Use in (meses, anos), on (dias/datas), at (horas).',
        pattern: 'In + meses/anos | On + dias | At + horas',
        exampleEn: 'The meeting is on Monday at 9 a.m.',
        examplePt: 'A reunião é na segunda às 9h.',
        exercises: [
          {
            id: 'prep-time-ex1',
            title: 'Quando é?',
            sentenceEn: 'My birthday is ___ July.',
            sentencePt: 'Meu aniversário é ___ julho.',
            answer: 'in'
          }
        ]
      },
      {
        id: 'conjunctions',
        title: 'Conjunctions',
        description: 'Unem ideias: and (e), but (mas), because (porque), although (embora).',
        pattern: 'S1 + conjunção + S2',
        exampleEn: 'I like tea but prefer coffee.',
        examplePt: 'Gosto de chá, mas prefiro café.',
        exercises: [
          {
            id: 'conjunctions-ex1',
            title: 'Conectar ideias',
            sentenceEn: 'She stayed home ___ she was sick.',
            sentencePt: 'Ela ficou em casa ___ estava doente.',
            answer: 'because'
          }
        ]
      },
      {
        id: 'conditionals',
        title: 'Conditionals',
        description: 'Zero, First, Second, Third express condições reais ou hipotéticas com diferentes estruturas.',
        pattern: 'Zero: If + present, present | First: If + present, will | Second: If + past, would | Third: If + past perfect, would have',
        exampleEn: 'If it rains, we stay home. If I had money, I would travel.',
        examplePt: 'Se chove, ficamos em casa. Se eu tivesse dinheiro, viajaria.',
        exercises: [
          {
            id: 'conditionals-ex1',
            title: 'Qual condicional?',
            sentenceEn: 'If I ___ (be) you, I would apologize.',
            sentencePt: 'Se eu ___ você, eu pediria desculpas.',
            answer: 'were'
          }
        ]
      },
      {
        id: 'passive-voice',
        title: 'Passive Voice',
        description: 'Realça o objeto da ação: be + particípio do verbo.',
        pattern: 'Be + particípio',
        exampleEn: 'The cake was baked by my mom.',
        examplePt: 'O bolo foi assado pela minha mãe.',
        exercises: [
          {
            id: 'passive-voice-ex1',
            title: 'Transforme em passiva',
            sentenceEn: 'The letters ___ (send) yesterday.',
            sentencePt: 'As cartas ___ enviadas ontem.',
            answer: 'were sent'
          }
        ]
      },
      {
        id: 'reported-speech',
        title: 'Reported Speech',
        description: 'Relata falas ajustando tempos verbais e pronomes.',
        pattern: 'Say/Tell + that + frase adaptada',
        exampleEn: 'She said that she was tired.',
        examplePt: 'Ela disse que estava cansada.',
        exercises: [
          {
            id: 'reported-speech-ex1',
            title: 'Discurso indireto',
            sentenceEn: '“I am late,” he said. → He said he ___ late.',
            sentencePt: '“Estou atrasado”, ele disse. → Ele disse que ___ atrasado.',
            answer: 'was'
          }
        ]
      },
      {
        id: 'relative-clauses',
        title: 'Relative Clauses',
        description: 'Who, which, that conectam frases e adicionam informação.',
        pattern: 'Substantivo + who/which/that + oração',
        exampleEn: 'The book that you bought is great.',
        examplePt: 'O livro que você comprou é ótimo.',
        exercises: [
          {
            id: 'relative-clauses-ex1',
            title: 'Relativo correto',
            sentenceEn: 'She is the person ___ helped me.',
            sentencePt: 'Ela é a pessoa ___ me ajudou.',
            answer: 'who'
          }
        ]
      },
      {
        id: 'gerunds-infinitives',
        title: 'Gerunds and Infinitives',
        description: 'Alguns verbos pedem -ing, outros infinitivo com to.',
        pattern: 'Enjoy + verbo-ing | Want + to + verbo',
        exampleEn: 'I enjoy reading but I want to travel.',
        examplePt: 'Eu gosto de ler mas quero viajar.',
        exercises: [
          {
            id: 'gerunds-ex1',
            title: 'Forma correta',
            sentenceEn: 'She decided ___ (go) to the gym.',
            sentencePt: 'Ela decidiu ___ para a academia.',
            answer: 'to go'
          }
        ]
      },
      {
        id: 'question-tags',
        title: 'Question Tags',
        description: 'Confirme algo com pequena pergunta no final: isn’t it?, don’t you?.',
        pattern: 'Frase + auxiliar oposto + pronome?',
        exampleEn: 'It’s cold, isn’t it?',
        examplePt: 'Está frio, não está?',
        exercises: [
          {
            id: 'question-tags-ex1',
            title: 'Tag correta',
            sentenceEn: 'You like pizza, ___?',
            sentencePt: 'Você gosta de pizza, ___?',
            answer: "don't you"
          }
        ]
      },
      {
        id: 'phrasal-verbs',
        title: 'Phrasal Verbs',
        description: 'Verbo + partícula muda o sentido: get up, look for, turn on.',
        pattern: 'Verbo + preposição/advérbio',
        exampleEn: 'Please turn off the lights.',
        examplePt: 'Por favor, desligue as luzes.',
        exercises: [
          {
            id: 'phrasal-verbs-ex1',
            title: 'Qual phrasal?',
            sentenceEn: 'She needs to ___ (look for / look after) her keys.',
            sentencePt: 'Ela precisa ___ suas chaves.',
            answer: 'look for'
          }
        ]
      }
    ]
  }
];
