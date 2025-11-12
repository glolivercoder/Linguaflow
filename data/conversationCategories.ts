export type CategoryKey = 'immigration' | 'hospital' | 'supermarket' | 'restaurant';

export interface QAItem {
  question: string;
  answer: string;
}

export interface QASection {
  type: 'qa';
  heading: string;
  items: QAItem[];
}

export interface PhraseSection {
  type: 'phrases';
  heading: string;
  items: string[];
}

export type CategorySection = QASection | PhraseSection;

export interface CategoryDefinition {
  key: CategoryKey;
  title: string;
  description: string;
  roleInstruction: string;
  kickoffPrompt: string;
  sections: CategorySection[];
}

export type TranslatedCategories = Record<CategoryKey, CategoryDefinition>;

export const CATEGORY_DEFINITIONS: Record<CategoryKey, CategoryDefinition> = {
  immigration: {
    key: 'immigration',
    title: 'Entrevista na imigração',
    description:
      'Pratique responder perguntas comuns durante a inspeção de imigração ao chegar em um novo país.',
    roleInstruction:
      'Aja como um agente de imigração cordial, porém atento, conduzindo a entrevista inicial com o viajante.',
    kickoffPrompt:
      'Vamos praticar uma entrevista de imigração. Eu serei o agente e você é o viajante chegando agora.',
    sections: [
      {
        type: 'qa',
        heading: 'Perguntas essenciais',
        items: [
          { question: 'Qual é o motivo da sua viagem?', answer: 'Estou aqui a turismo por duas semanas.' },
          { question: 'Onde você ficará hospedado?', answer: 'Ficarei no Hotel Central, no centro da cidade.' },
          { question: 'Quanto tempo pretende ficar no país?', answer: 'Permanecerei 14 dias e retorno no dia 20 de julho.' },
          { question: 'Você tem passagem de retorno?', answer: 'Sim, meu voo de volta está reservado para 20 de julho.' },
          { question: 'Quanto dinheiro você está trazendo?', answer: 'Tenho 1.500 dólares em espécie e cartões de crédito.' },
          { question: 'Você já visitou nosso país antes?', answer: 'Esta é a minha primeira visita.' },
          { question: 'Você tem familiares ou amigos aqui?', answer: 'Não, estou viajando sozinho.' },
          { question: 'Qual é a sua profissão?', answer: 'Sou analista de sistemas no Brasil.' },
          { question: 'Você trouxe alimentos ou produtos proibidos?', answer: 'Não, apenas itens pessoais e roupas.' },
          { question: 'Qual é o endereço da sua hospedagem?', answer: 'Rua Principal, 123, Hotel Central.' },
          { question: 'Você possui seguro viagem?', answer: 'Sim, tenho cobertura internacional pelo plano TravelCare.' },
          {
            question: 'Qual é o seu itinerário durante a estadia?',
            answer: 'Pretendo visitar museus, parques e os principais pontos turísticos.',
          },
        ],
      },
    ],
  },
  hospital: {
    key: 'hospital',
    title: 'Hospital',
    description:
      'Use frases úteis para explicar sintomas, pedir ajuda e responder perguntas em um pronto atendimento.',
    roleInstruction:
      'Comporte-se como um profissional de triagem em um hospital, ajudando o paciente a descrever sintomas e oferecendo orientações.',
    kickoffPrompt:
      'Estamos em um hospital. Eu serei o profissional de triagem e vou ajudá-lo a explicar seus sintomas.',
    sections: [
      {
        type: 'qa',
        heading: 'Perguntas de triagem',
        items: [
          { question: 'Qual é o problema principal hoje?', answer: 'Estou sentindo dores fortes no estômago desde ontem.' },
          { question: 'Quando os sintomas começaram?', answer: 'Começaram há cerca de doze horas.' },
          { question: 'Você tem alergia a algum medicamento?', answer: 'Não tenho alergias conhecidas.' },
          { question: 'Você está tomando algum remédio agora?', answer: 'Estou tomando apenas um analgésico leve.' },
          { question: 'Você tem febre ou calafrios?', answer: 'Sim, tive febre durante a noite.' },
          { question: 'Como você avaliaria sua dor de zero a dez?', answer: 'Diria que a dor está em oito.' },
          { question: 'Você já passou por alguma cirurgia recente?', answer: 'Não, nunca fiz cirurgia.' },
          {
            question: 'Você tem alguma condição médica crônica?',
            answer: 'Tenho pressão alta controlada com medicamentos.',
          },
        ],
      },
      {
        type: 'phrases',
        heading: 'Sintomas para mencionar',
        items: [
          'Estou com tontura e visão turva.',
          'Tenho dificuldade para respirar.',
          'Sinto dormência no braço esquerdo.',
          'Estou com náusea e falta de apetite.',
          'Tenho tosse seca há vários dias.',
          'Meu joelho está inchado e quente.',
        ],
      },
    ],
  },
  supermarket: {
    key: 'supermarket',
    title: 'Supermercado',
    description: 'Aprenda como pedir ajuda para encontrar itens comuns no mercado e praticar vocabulário de compras.',
    roleInstruction:
      'Finja ser um atendente prestativo de supermercado, oferecendo opções e recomendações de produtos.',
    kickoffPrompt: 'Estamos em um supermercado. Vou ajudá-lo a encontrar os itens da sua lista.',
    sections: [
      {
        type: 'phrases',
        heading: 'Pedidos úteis',
        items: [
          'Você pode me mostrar onde ficam as frutas frescas?',
          'Preciso encontrar verduras para fazer uma salada.',
          'Onde estão os biscoitos mais populares?',
          'Vocês têm refrigerantes sem açúcar?',
          'Pode me ajudar a localizar a seção de sardinhas enlatadas?',
          'Estou procurando frango fresco para o jantar.',
          'Tem alguma promoção em frutas da estação?',
          'Qual é a diferença entre essas marcas de biscoito?',
          'Pode pesar um quilo de bananas para mim?',
          'Vocês têm opções de verduras orgânicas?',
          'Qual refrigerante você recomenda para acompanhar um churrasco?',
          'Onde posso encontrar temperos para o frango?',
        ],
      },
    ],
  },
  restaurant: {
    key: 'restaurant',
    title: 'Restaurante',
    description:
      'Simule pedidos no restaurante e pratique como solicitar pratos e esclarecer preferências.',
    roleInstruction:
      'Aja como um garçom atencioso, sugerindo combinações e confirmando pedidos com o cliente.',
    kickoffPrompt:
      'Estamos em um restaurante. Sou o garçom e vou ajudá-lo a escolher o prato ideal.',
    sections: [
      {
        type: 'phrases',
        heading: 'Pedidos comuns',
        items: [
          'Eu gostaria de pedir batatas fritas crocantes, por favor.',
          'Pode trazer um bife acebolado ao ponto médio?',
          'Quero uma porção de arroz branco.',
          'Você pode adicionar um purê de batata cremoso?',
          'Gostaria de um prato de peixe grelhado com limão.',
          'Tem alguma sugestão de acompanhamento para o bife?',
          'Pode servir as batatas fritas sem sal?',
          'O purê contém leite ou creme?',
          'Qual peixe está mais fresco hoje?',
          'Poderia trocar o arroz por legumes cozidos?',
          'Pode trazer molho extra para o frango?',
          'Gostaria de uma recomendação de bebida que combine com o peixe.',
        ],
      },
    ],
  },
};

export const CATEGORY_KEYS: CategoryKey[] = ['immigration', 'hospital', 'supermarket', 'restaurant'];

export const BASE_CATEGORY_LANGUAGE_NAME = 'Português (BR)';
