
import { RawFlashcardData } from '../types';

export const PREDEFINED_FLASHCARD_DATA: RawFlashcardData = {
  phrases: {
    "Apresentações Pessoais": [
      { id: 'phr-intro-1', texts: { 'pt-BR': 'Oi, tudo bem?', 'en-US': 'Hi, how are you?', 'es-ES': 'Hola, ¿cómo estás?', 'fr-FR': 'Salut, ça va ?', 'it-IT': 'Ciao, come stai?', 'ru-RU': 'Привет, как дела?', 'zh-CN': '你好吗？', 'ja-JP': 'こんにちは、お元気ですか？', 'eo': 'Saluton, kiel vi fartas?' } },
      { id: 'phr-intro-2', texts: { 'pt-BR': 'Qual é o seu nome?', 'en-US': 'What is your name?', 'es-ES': '¿Cuál es tu nombre?', 'fr-FR': 'Comment tu t\'appelles ?', 'it-IT': 'Come ti chiami?', 'ru-RU': 'Как тебя зовут?', 'zh-CN': '你叫什么名字？', 'ja-JP': 'お名前は何ですか？', 'eo': 'Kiel vi nomiĝas?' } },
      { id: 'phr-intro-3', texts: { 'pt-BR': 'Meu nome é...', 'en-US': 'My name is...', 'es-ES': 'Mi nombre es...', 'fr-FR': 'Je m\'appelle...', 'it-IT': 'Mi chiamo...', 'ru-RU': 'Меня зовут...', 'zh-CN': '我的名字是...', 'ja-JP': '私の名前は...', 'eo': 'Mia nomo estas...' } },
    ],
    "Viagem (Aeroporto)": [
      { id: 'phr-travel-1', texts: { 'pt-BR': 'Onde fica o portão de embarque?', 'en-US': 'Where is the boarding gate?', 'es-ES': '¿Dónde está la puerta de embarque?', 'fr-FR': 'Où est la porte d\'embarquement ?', 'it-IT': 'Dov\'è il gate d\'imbarco?', 'ru-RU': 'Где выход на посадку?', 'zh-CN': '登机口在哪里？', 'ja-JP': '搭乗ゲートはどこですか？', 'eo': 'Kie estas la enirpordego?' } },
      { id: 'phr-travel-2', texts: { 'pt-BR': 'Eu tenho uma escala.', 'en-US': 'I have a layover.', 'es-ES': 'Tengo una escala.', 'fr-FR': 'J\'ai une escale.', 'it-IT': 'Ho uno scalo.', 'ru-RU': 'У меня пересадка.', 'zh-CN': '我需要转机。', 'ja-JP': '乗り継ぎがあります。', 'eo': 'Mi havas transiron.' } },
    ],
    "Restaurantes": [
        { id: 'phr-rest-1', texts: { 'pt-BR': 'Uma mesa para dois, por favor.', 'en-US': 'A table for two, please.', 'es-ES': 'Una mesa para dos, por favor.', 'fr-FR': 'Une table pour deux, s\'il vous plaît.', 'it-IT': 'Un tavolo per due, per favore.', 'ru-RU': 'Столик на двоих, пожалуйста.', 'zh-CN': '请给我一张两人桌。', 'ja-JP': '二人用のテーブルをお願いします。', 'eo': 'Tablon por du, mi petas.' } },
        { id: 'phr-rest-2', texts: { 'pt-BR': 'Eu gostaria de ver o cardápio.', 'en-US': 'I would like to see the menu.', 'es-ES': 'Me gustaría ver el menú.', 'fr-FR': 'Je voudrais voir le menu.', 'it-IT': 'Vorrei vedere il menù.', 'ru-RU': 'Я хотел бы посмотреть меню.', 'zh-CN': '我想看菜单。', 'ja-JP': 'メニューを見たいのですが。', 'eo': 'Mi ŝatus vidi la menuon.' } },
        { id: 'phr-rest-3', texts: { 'pt-BR': 'A conta, por favor.', 'en-US': 'The check, please.', 'es-ES': 'La cuenta, por favor.', 'fr-FR': 'L\'addition, s\'il vous plaît.', 'it-IT': 'Il conto, per favore.', 'ru-RU': 'Счет, пожалуйста.', 'zh-CN': '请结账。', 'ja-JP': 'お会計をお願いします。', 'eo': 'La kalkulon, mi petas.' } },
    ]
  },
  objects: {
    "Animais": [
      { id: 'obj-animal-1', texts: { 'pt-BR': 'Cachorro', 'en-US': 'Dog', 'es-ES': 'Perro', 'fr-FR': 'Chien', 'it-IT': 'Cane', 'ru-RU': 'Собака', 'zh-CN': '狗', 'ja-JP': '犬', 'eo': 'Hundo' }, imageUrl: 'https://cdn.pixabay.com/photo/2019/08/19/07/45/dog-4415649_960_720.jpg' },
      { id: 'obj-animal-2', texts: { 'pt-BR': 'Gato', 'en-US': 'Cat', 'es-ES': 'Gato', 'fr-FR': 'Chat', 'it-IT': 'Gatto', 'ru-RU': 'Кошка', 'zh-CN': '猫', 'ja-JP': '猫', 'eo': 'Kato' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_960_720.jpg' },
      { id: 'obj-animal-3', texts: { 'pt-BR': 'Pássaro', 'en-US': 'Bird', 'es-ES': 'Pájaro', 'fr-FR': 'Oiseau', 'it-IT': 'Uccello', 'ru-RU': 'Птица', 'zh-CN': '鸟', 'ja-JP': '鳥', 'eo': 'Birdo' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/02/07/16/47/kingfisher-2046453_960_720.jpg' },
      { id: 'obj-animal-4', texts: { 'pt-BR': 'Peixe', 'en-US': 'Fish', 'es-ES': 'Pez', 'fr-FR': 'Poisson', 'it-IT': 'Pesce', 'ru-RU': 'Рыба', 'zh-CN': '鱼', 'ja-JP': '魚', 'eo': 'Fiŝo' }, imageUrl: 'https://cdn.pixabay.com/photo/2019/07/04/06/18/fish-4315933_960_720.jpg' },
      { id: 'obj-animal-5', texts: { 'pt-BR': 'Cavalo', 'en-US': 'Horse', 'es-ES': 'Caballo', 'fr-FR': 'Cheval', 'it-IT': 'Cavallo', 'ru-RU': 'Лошадь', 'zh-CN': '马', 'ja-JP': '馬', 'eo': 'Ĉevalo' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/02/14/11/19/horse-2065809_960_720.jpg' },
    ],
    "Alimentos": [
       { id: 'obj-food-1', texts: { 'pt-BR': 'Maçã', 'en-US': 'Apple', 'es-ES': 'Manzana', 'fr-FR': 'Pomme', 'it-IT': 'Mela', 'ru-RU': 'Яблоко', 'zh-CN': '苹果', 'ja-JP': 'りんご', 'eo': 'Pomo' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/09/23/17/58/apple-1690372_960_720.jpg' },
       { id: 'obj-food-2', texts: { 'pt-BR': 'Banana', 'en-US': 'Banana', 'es-ES': 'Plátano', 'fr-FR': 'Banane', 'it-IT': 'Banana', 'ru-RU': 'Банан', 'zh-CN': '香蕉', 'ja-JP': 'バナナ', 'eo': 'Banano' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/07/22/09/59/fruits-1534494_960_720.jpg' },
       { id: 'obj-food-3', texts: { 'pt-BR': 'Laranja', 'en-US': 'Orange', 'es-ES': 'Naranja', 'fr-FR': 'Orange', 'it-IT': 'Arancia', 'ru-RU': 'Апельсин', 'zh-CN': '橙子', 'ja-JP': 'オレンジ', 'eo': 'Oranĝo' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/01/20/15/06/orange-1995056_960_720.jpg' },
       { id: 'obj-food-4', texts: { 'pt-BR': 'Morango', 'en-US': 'Strawberry', 'es-ES': 'Fresa', 'fr-FR': 'Fraise', 'it-IT': 'Fragola', 'ru-RU': 'Клубника', 'zh-CN': '草莓', 'ja-JP': 'いちご', 'eo': 'Frago' }, imageUrl: 'https://cdn.pixabay.com/photo/2018/04/29/11/54/strawberries-3359465_960_720.jpg' },
       { id: 'obj-food-5', texts: { 'pt-BR': 'Uva', 'en-US': 'Grape', 'es-ES': 'Uva', 'fr-FR': 'Raisin', 'it-IT': 'Uva', 'ru-RU': 'Виноград', 'zh-CN': '葡萄', 'ja-JP': 'ぶどう', 'eo': 'Vinbero' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/10/04/10/22/grapes-1714390_960_720.jpg' },
       { id: 'obj-food-6', texts: { 'pt-BR': 'Cenoura', 'en-US': 'Carrot', 'es-ES': 'Zanahoria', 'fr-FR': 'Carotte', 'it-IT': 'Carota', 'ru-RU': 'Морковь', 'zh-CN': '胡萝卜', 'ja-JP': '人参', 'eo': 'Karoto' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/07/11/22/16/carrot-1510447_960_720.jpg' },
       { id: 'obj-food-7', texts: { 'pt-BR': 'Tomate', 'en-US': 'Tomato', 'es-ES': 'Tomate', 'fr-FR': 'Tomate', 'it-IT': 'Pomodoro', 'ru-RU': 'Помидор', 'zh-CN': '番茄', 'ja-JP': 'トマト', 'eo': 'Tomato' }, imageUrl: 'https://cdn.pixabay.com/photo/2018/05/03/21/49/tomato-3372252_960_720.jpg' },
       { id: 'obj-food-8', texts: { 'pt-BR': 'Alface', 'en-US': 'Lettuce', 'es-ES': 'Lechuga', 'fr-FR': 'Laitue', 'it-IT': 'Lattuga', 'ru-RU': 'Салат', 'zh-CN': '生菜', 'ja-JP': 'レタス', 'eo': 'Laktuko' }, imageUrl: 'https://cdn.pixabay.com/photo/2018/04/20/11/24/lettuce-3335535_960_720.jpg' },
    ],
    "Móveis": [
       { id: 'obj-furn-1', texts: { 'pt-BR': 'Cadeira', 'en-US': 'Chair', 'es-ES': 'Silla', 'fr-FR': 'Chaise', 'it-IT': 'Sedia', 'ru-RU': 'Стул', 'zh-CN': '椅子', 'ja-JP': '椅子', 'eo': 'Seĝo' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/08/03/15/33/chair-2576593_960_720.jpg' },
       { id: 'obj-furn-2', texts: { 'pt-BR': 'Mesa', 'en-US': 'Table', 'es-ES': 'Mesa', 'fr-FR': 'Table', 'it-IT': 'Tavolo', 'ru-RU': 'Стол', 'zh-CN': '桌子', 'ja-JP': 'テーブル', 'eo': 'Tablo' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/07/31/18/39/table-2559349_960_720.jpg' },
       { id: 'obj-furn-3', texts: { 'pt-BR': 'Cama', 'en-US': 'Bed', 'es-ES': 'Cama', 'fr-FR': 'Lit', 'it-IT': 'Letto', 'ru-RU': 'Кровать', 'zh-CN': '床', 'ja-JP': 'ベッド', 'eo': 'Lito' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/11/19/13/06/bed-1839183_960_720.jpg' },
       { id: 'obj-furn-4', texts: { 'pt-BR': 'Sofá', 'en-US': 'Sofa', 'es-ES': 'Sofá', 'fr-FR': 'Canapé', 'it-IT': 'Divano', 'ru-RU': 'Диван', 'zh-CN': '沙发', 'ja-JP': 'ソファ', 'eo': 'Sofo' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/08/06/15/22/sofa-2593148_960_720.jpg' },
    ],
    "Meios de Transporte": [
        { id: 'obj-trans-1', texts: { 'pt-BR': 'Carro', 'en-US': 'Car', 'es-ES': 'Coche', 'fr-FR': 'Voiture', 'it-IT': 'Auto', 'ru-RU': 'Машина', 'zh-CN': '汽车', 'ja-JP': '車', 'eo': 'Aŭto' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/04/01/12/16/car-1300629_960_720.png' },
        { id: 'obj-trans-2', texts: { 'pt-BR': 'Bicicleta', 'en-US': 'Bicycle', 'es-ES': 'Bicicleta', 'fr-FR': 'Vélo', 'it-IT': 'Bicicletta', 'ru-RU': 'Велосипед', 'zh-CN': '自行车', 'ja-JP': '自転車', 'eo': 'Biciklo' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/11/18/12/49/bicycle-1834265_960_720.jpg' },
        { id: 'obj-trans-3', texts: { 'pt-BR': 'Avião', 'en-US': 'Airplane', 'es-ES': 'Avión', 'fr-FR': 'Avion', 'it-IT': 'Aereo', 'ru-RU': 'Самолет', 'zh-CN': '飞机', 'ja-JP': '飛行機', 'eo': 'Aviadilo' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/07/30/19/52/airplane-1557997_960_720.jpg' },
        { id: 'obj-trans-4', texts: { 'pt-BR': 'Ônibus', 'en-US': 'Bus', 'es-ES': 'Autobús', 'fr-FR': 'Bus', 'it-IT': 'Autobus', 'ru-RU': 'Автобус', 'zh-CN': '公共汽车', 'ja-JP': 'バス', 'eo': 'Aŭtobuso' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/06/06/07/22/bus-2376672_960_720.jpg' },
    ],
    "Itens de Escritório": [
        { id: 'obj-office-1', texts: { 'pt-BR': 'Computador', 'en-US': 'Computer', 'es-ES': 'Ordenador', 'fr-FR': 'Ordinateur', 'it-IT': 'Computer', 'ru-RU': 'Компьютер', 'zh-CN': '电脑', 'ja-JP': 'コンピューター', 'eo': 'Komputilo' }, imageUrl: 'https://cdn.pixabay.com/photo/2014/09/24/14/29/macbook-459196_960_720.jpg' },
        { id: 'obj-office-2', texts: { 'pt-BR': 'Caneta', 'en-US': 'Pen', 'es-ES': 'Bolígrafo', 'fr-FR': 'Stylo', 'it-IT': 'Penna', 'ru-RU': 'Ручка', 'zh-CN': '笔', 'ja-JP': 'ペン', 'eo': 'Skribilo' }, imageUrl: 'https://cdn.pixabay.com/photo/2016/01/09/21/04/pen-1130985_960_720.jpg' },
        { id: 'obj-office-3', texts: { 'pt-BR': 'Livro', 'en-US': 'Book', 'es-ES': 'Libro', 'fr-FR': 'Livre', 'it-IT': 'Libro', 'ru-RU': 'Книга', 'zh-CN': '书', 'ja-JP': '本', 'eo': 'Libro' }, imageUrl: 'https://cdn.pixabay.com/photo/2015/11/19/21/10/glasses-1052010_960_720.jpg' },
    ],
    "Roupas": [
        { id: 'obj-cloth-1', texts: { 'pt-BR': 'Camisa', 'en-US': 'Shirt', 'es-ES': 'Camisa', 'fr-FR': 'Chemise', 'it-IT': 'Camicia', 'ru-RU': 'Рубашка', 'zh-CN': '衬衫', 'ja-JP': 'シャツ', 'eo': 'Ĉemizo' }, imageUrl: 'https://cdn.pixabay.com/photo/2014/04/03/10/55/t-shirt-311732_960_720.png' },
        { id: 'obj-cloth-2', texts: { 'pt-BR': 'Calça', 'en-US': 'Pants', 'es-ES': 'Pantalones', 'fr-FR': 'Pantalon', 'it-IT': 'Pantaloni', 'ru-RU': 'Брюки', 'zh-CN': '裤子', 'ja-JP': 'ズボン', 'eo': 'Pantalono' }, imageUrl: 'https://cdn.pixabay.com/photo/2017/04/27/17/36/pents-2266092_960_720.jpg' },
        { id: 'obj-cloth-3', texts: { 'pt-BR': 'Sapato', 'en-US': 'Shoe', 'es-ES': 'Zapato', 'fr-FR': 'Chaussure', 'it-IT': 'Scarpa', 'ru-RU': 'Обувь', 'zh-CN': '鞋', 'ja-JP': '靴', 'eo': 'Ŝuo' }, imageUrl: 'https://cdn.pixabay.com/photo/2014/11/30/13/26/footwear-551130_960_720.jpg' },
    ]
  }
};