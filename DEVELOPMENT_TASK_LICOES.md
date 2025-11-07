# 📋 Task de Desenvolvimento - Sistema de Lições

## 🎯 Objetivo Geral
Criar uma nova aba "Lições" no header principal com sistema completo de aprendizado de inglês incluindo histórias interativas, dicionário integrado, exercícios de interpretação, escrita e pronúncia usando openSMILE.

---

## 📊 Progresso Geral: 55%

---

## 🏗️ FASE 1: Estrutura Base e Navegação (100%) ✅

### 1.1 Header e Navegação Principal
- [x] **Adicionar aba "Lições" no Header** (100%) ✅
  - ✅ Localizar componente de Header principal (App.tsx)
  - ✅ Adicionar nova tab "Lições" após "Smart Learn"
  - ✅ Configurar roteamento para view 'licoes'
  - ✅ Criar layout base da página (LicoesView.tsx)

### 1.2 Estrutura de Dados
- [x] **Definir modelos de dados TypeScript** (100%) ✅
  - ✅ Tipo `Lesson` (id, title, level, content, theme)
  - ✅ Tipo `Story` (id, text, idioms, slang, proverbs)
  - ✅ Tipo `Exercise` (interpretation, writing, pronunciation)
  - ✅ Tipo `DictionaryEntry` (word, translation, examples)
  - ✅ Enum `LessonLevel` (BASICO, INTERMEDIARIO, AVANCADO)
  - ✅ Enum `LessonTheme` (APRESENTACAO, AMIZADE, HOBBIES, PAQUERA, DESCONTRAIDO, FOFOCA)
  - ✅ Arquivo criado: `types/licoes.ts`

### 1.3 Banco de Dados/Storage
- [ ] **Criar schemas para armazenamento** (0%) ⏳
  - Schema de lições
  - Schema de progresso do usuário
  - Schema de áudios de referência
  - Schema de dicionário
  - 📝 **Nota**: Será implementado quando iniciar FASE 2

---

## 📚 FASE 2: Sistema de Histórias e Dicionário (80%)

### 2.1 Componente de História Interativa
- [x] **Criar componente StoryReader** (100%) ✅
  - ✅ Layout de leitura responsivo
  - ✅ Renderização de texto com formatação rica e destaque de expressões
  - ✅ Sistema de níveis (básico → avançado) com filtros
  - ✅ Filtro por tema
  - ⏳ Indicador de progresso de leitura (planejado para refinamento futuro)

### 2.2 Sistema de Marcação de Expressões
- [x] **Implementar detecção e sublinhado** (100%) ✅
  - ✅ Parser para identificar expressões idiomáticas, gírias e provérbios
  - ✅ Destaque via botão sublinhado estilizado com legenda de tipos
  - ✅ Integração com pop-up do dicionário
  - ⏳ Tooltips adicionais (avaliar necessidade após testes de UX)

### 2.3 Dicionário Pop-up
- [x] **Criar componente DictionaryPopup** (85%) ✅
  - ✅ Design de pop-up modal responsivo
  - ✅ Exibir palavra/expressão, tradução e exemplos de uso
  - ⏳ Pronúncia (áudio nativo) – previsto para integração com backend de áudio
  - ⏳ Botão "Adicionar ao vocabulário" – previsto para fase de progresso do usuário
  - ✅ Animações/transparência base aplicada e suporte a teclado

### 2.4 SearchBar de Dicionário
- [x] **Implementar barra de busca** (90%) ✅
  - ✅ Posicionada na região superior esquerda com ícone e label "Dic"
  - ✅ Autocomplete com resultados em tempo real
  - ✅ Suporte a submit manual (Enter/botão)
  - ⏳ Histórico de buscas recentes (backlog)

### 2.5 Interação de Seleção de Palavra
- [x] **Implementar long-press detection** (100%) ✅
  - ✅ Detecta clique/toque mantido por 1 segundo
  - ✅ Abre pop-up do dicionário automaticamente
  - ✅ Feedback visual com hover e foco
  - ✅ Compatível com desktop e mobile (touch)

-### 2.6 Conteúdo de Histórias
- [ ] **Criar 15+ histórias em inglês** (33%) ⏳
  - ✅ 5 histórias iniciais criadas (2 básicas, 2 intermediárias, 1 avançada)
  - ✅ Cada história com 3 expressões destacadas (idioms/gírias)
  - ⏳ Expandir para 10+ expressões por história e total >15 histórias
  - ⏳ Cobertura completa de todos os temas e níveis

### 2.7 Integração com Exercícios
- [x] **Sincronizar histórias com dados de quiz** (70%) ✅
  - ✅ Dados de 5 quizzes conectados às histórias correspondentes
  - ✅ Estado compartilhado para acompanhar progresso do aluno
  - ⏳ Telemetria/analytics para desempenho das expressões

---

## 📝 FASE 3: Exercícios de Interpretação (40%)

### 3.1 Componente de Quiz
- [x] **Criar componente InterpretationQuiz** (70%) ✅
  - ✅ Layout de questão múltipla escolha com feedback imediato
  - ✅ Renderiza título e metadados da lição
  - ✅ Exibe progress bar simplificada (contagem de respondidas)
  - ✅ Estado de seleção e reset de quiz
  - ⏳ Botão "Confirmar Resposta" (modo revisão)
  - ⏳ Indicador de tempo

### 3.2 Sistema de Pontuação
- [ ] **Implementar scoring system** (30%) ⏳
  - ✅ Pontuação básica por acertos exibida em tempo real
  - ⏳ Penalização opcional por erros
  - ⏳ Bônus por tempo de resposta
  - ⏳ Persistência de progresso do usuário

### 3.3 Feedback de Resposta
- [x] **Criar sistema de feedback** (60%) ✅
  - ✅ Mensagens de acerto/erro com explicação detalhada
  - ✅ Destaque visual nas alternativas (cores e ícones)
  - ⏳ Dicas adicionais para revisão
  - ⏳ Animações de feedback

### 3.4 Conteúdo de Exercícios
- [x] **Criar 5 lições de interpretação** (40%) ✅
  - Lição 1: Apresentações Pessoais
  - Lição 2: Fazendo Amizades
  - Lição 3: Discutindo Hobbies
  - Lição 4: Paquera e Romance
  - Lição 5: Conversas Descontraídas
  - Cada lição com 5-10 questões
  - Total: 25-50 questões

---

## ✍️ FASE 4: Exercícios de Escrita (75%)

### 4.1 Componente de Writing Practice
- [x] **Criar componente WritingExercise** (70%) ✅
  - ✅ Editor com contagem de palavras dinâmica
  - ✅ Exibe contexto, dicas e resposta modelo
  - ⏳ Timer opcional (backlog)
  - ⏳ Formatação avançada (rich text)

### 4.2 Sistema de Correção
- [x] **Implementar correção automática** (50%) ✅
  - ✅ Comparação exata para prompts fechados
  - ✅ Validação por palavras-chave e meta de palavras
  - ⏳ Detecção ortográfica/gramatical (integração futura)
  - ⏳ Sugestões enriquecidas e highlight de diferenças

### 4.3 Pontuação e Feedback
- [x] **Sistema de scoring para escrita** (80%) ✅
  - ✅ Feedback textual por exercício
  - ✅ Pontuação numérica ponderada (0-100)
  - ✅ Métricas: precisão, palavras-chave, vocabulário, gramática e comprimento
  - ✅ Exibição visual de métricas detalhadas
  - ⏳ Sistema de badges/conquistas (backlog)

### 4.4 Tipos de Exercícios
- [x] **Implementar variações de exercícios** (60%) ✅
  - ✅ Reconstruction, translation, free-writing e fill-in-the-blank
  - ✅ Exercício com checagem de palavras-chave
  - ⏳ Dictation (aguardando suporte de áudio)

### 4.5 Conteúdo de Exercícios
- [x] **Criar 5 lições de escrita** (40%) ✅
  - ✅ 2 exercícios por lição alinhados às histórias existentes
  - ⏳ Expandir para 10 exercícios por lição (planejado)
  - ⏳ Cobertura total de 50 exercícios

### 4.6 Persistência de Dados
- [x] **Implementar salvamento local** (100%) ✅
  - ✅ localStorage para quiz e writing progress
  - ✅ Carregamento automático na inicialização
  - ✅ Salvamento automático em toda mudança
  - ⏳ Sincronização com backend (backlog)

---

## 🎤 FASE 5: Sistema de Pronúncia com openSMILE (65%)

### 5.1 Backend Python - Setup
- [x] **Configurar ambiente Python** (100%) ✅
  - ✅ Diretório `/backend/pronunciation` criado
  - ✅ requirements.txt com todas dependências
  - ✅ README com instruções de setup
  - ✅ .gitignore configurado

### 5.2 Classe PronunciationAnalyzer
- [x] **Implementar análise com openSMILE** (100%) ✅
  - ✅ Inicializado openSMILE com ComParE_2016 e eGeMAPSv02
  - ✅ Método `extract_features(audio_path)` implementado
  - ✅ Método `analyze_pronunciation(audio_path)` implementado
  - ✅ Extração de pitch (mean, stddev, range)
  - ✅ Extração de loudness, jitter, shimmer
  - ✅ Cálculo de voice quality (HNR) e duração

### 5.3 Classe PronunciationScorer
- [x] **Implementar sistema de scoring** (100%) ✅
  - ✅ Método `compare_with_reference(user, ref, text)` completo
  - ✅ `_score_pitch()` com comparação de entonação
  - ✅ `_score_fluency()` baseado em jitter e spectral flux
  - ✅ `_score_voice_quality()` usando HNR e shimmer
  - ✅ `_transcribe_audio()` com Google Speech API
  - ✅ `_calculate_text_similarity()` com SequenceMatcher
  - ✅ `_generate_detailed_feedback()` com mensagens contextuais
  - ✅ Score ponderado: pitch 30%, fluency 25%, quality 20%, text 25%

### 5.4 API FastAPI
- [x] **Criar endpoints de pronúncia** (70%) ✅
  - ✅ Endpoint POST `/analyze-pronunciation` implementado
  - ✅ Recebe: audio file, expected_text, reference_audio_path
  - ✅ Retorna: overall_score, subscores, feedback, metrics
  - ✅ Endpoint GET `/health` para health check
  - ✅ CORS configurado para frontend
  - ⏳ Endpoint WebSocket `/ws/realtime-analysis` (planejado)
  - ⏳ Streaming de áudio em tempo real (planejado)

### 5.5 Áudios de Referência
- [x] **Preparar sistema TTS para áudios nativos** (100%) ✅
  - ✅ Integrado Piper TTS (voz natural en_US-lessac-medium)
  - ✅ Classe `ReferenceAudioGenerator` implementada
  - ✅ Geração sob demanda de áudios de referência
  - ✅ Suporte a frases múltiplas por lição
  - ✅ Formato: WAV, 16kHz, mono (compatível)
  - ✅ Armazenamento em `/backend/references/`
  - ⏳ Biblioteca de 50+ frases pré-gravadas (opcional, pode gerar on-the-fly)

### 5.6 Frontend - Gravador de Áudio
- [x] **Criar classe AudioRecorder** (100%) ✅
  - ✅ Método `startRecording()` com MediaRecorder API
  - ✅ Configuração: mono, 16kHz, noise suppression, echo cancellation
  - ✅ Método `stopRecording()` retornando Blob
  - ✅ Método `isRecording()` para checar estado
  - ✅ Método `cancelRecording()` para limpar recursos
  - ✅ Service `pronunciationService.ts` com integração completa
  - ⏳ WebSocket para feedback em tempo real (planejado)

### 5.7 Componente PronunciationTest
- [x] **Criar interface de teste de pronúncia** (100%) ✅
  - ✅ Exibe frase alvo com destaque visual
  - ✅ Botão "Gravar minha pronúncia" com ícone de microfone
  - ✅ Animação pulsante durante gravação
  - ✅ Player de áudio de referência (TTS Piper)
  - ✅ Botão "Ouvir minha gravação" após recording
  - ✅ Loading spinner durante análise
  - ✅ Estado de erro com mensagens claras

### 5.8 Visualização de Resultados
- [x] **Criar componente PronunciationResults** (90%) ✅
  - ✅ Score geral (0-100) com código de cores
  - ✅ Breakdown de 4 subscores:
    - ✅ Entonação (pitch)
    - ✅ Fluência (fluency)
    - ✅ Clareza (quality)
    - ✅ Precisão (text accuracy)
  - ✅ Transcrição do que foi reconhecido
  - ✅ Feedback detalhado contextual com emojis
  - ⏳ Gráfico de onda (opcional, backlog)
  - ✅ Botão "Tentar Novamente"
  - ✅ Seleção de frases para praticar

### 5.9 Métricas em Tempo Real
- [ ] **Implementar visualização live** (0%) ⏳
  - WebSocket endpoint no backend (planejado)
  - Streaming de métricas durante gravação
  - Meter de pitch (frequência fundamental)
  - Meter de loudness (volume)
  - Meter de quality (estabilidade)
  - Animações suaves com React

### 5.10 Conteúdo de Exercícios
- [x] **Criar exercícios de pronúncia** (10%) ✅
  - ✅ 5 frases exemplo implementadas
  - ⏳ Expandir para 10 frases por lição
  - ⏳ Total planejado: 50 exercícios
  - Frases alinhadas com lições existentes

### 5.11 Deploy e Docker
- [x] **Containerizar backend** (100%) ✅
  - ✅ Dockerfile multi-stage otimizado
  - ✅ docker-compose.yml configurado
  - ✅ Scripts de setup (setup.sh e setup.bat)
  - ✅ Health checks configurados
  - ✅ Volume mounting para referências
  - ✅ README com instruções completas

---

## 🎨 FASE 6: UI/UX e Polimento (0%)

### 6.1 Design System
- [ ] **Aplicar design consistente** (0%)
  - Usar TailwindCSS
  - Componentes shadcn/ui
  - Ícones Lucide React
  - Paleta de cores do app
  - Tipografia responsiva
  - Dark mode support

### 6.2 Animações e Transições
- [ ] **Implementar micro-interações** (0%)
  - Transições de página suaves
  - Animações de feedback (correto/erro)
  - Loading states elegantes
  - Skeleton loaders
  - Progress bars animadas

### 6.3 Responsividade
- [ ] **Garantir mobile-first** (0%)
  - Layout adaptativo (mobile, tablet, desktop)
  - Touch-friendly buttons
  - Swipe gestures para navegação
  - Teclado virtual otimizado
  - Orientação portrait/landscape

### 6.4 Acessibilidade
- [ ] **Implementar a11y standards** (0%)
  - ARIA labels
  - Navegação por teclado
  - Screen reader support
  - Contraste adequado (WCAG AA)
  - Focus indicators visíveis

---

## 🔧 FASE 7: Integração e Testes (0%)

### 7.1 Integração Frontend-Backend
- [ ] **Conectar todos os sistemas** (0%)
  - API client para dicionário
  - API client para exercícios
  - API client para pronúncia
  - State management (Context/Redux)
  - Error handling global
  - Retry logic para falhas de rede

### 7.2 Sistema de Progresso
- [ ] **Implementar tracking de progresso** (0%)
  - Salvar lições completadas
  - Salvar scores de exercícios
  - Streak de dias consecutivos
  - XP e níveis
  - Achievements/conquistas
  - Dashboard de estatísticas

### 7.3 Testes Unitários
- [ ] **Escrever testes** (0%)
  - Testes de componentes React
  - Testes de APIs Python
  - Testes de scoring algorithms
  - Testes de parsing de texto
  - Coverage mínimo: 70%

### 7.4 Testes de Integração
- [ ] **Testar fluxos completos** (0%)
  - Fluxo: Ler história → Dicionário → Quiz
  - Fluxo: Exercício de escrita completo
  - Fluxo: Teste de pronúncia completo
  - Fluxo: Progresso salvo corretamente

### 7.5 Performance
- [ ] **Otimizar performance** (0%)
  - Lazy loading de lições
  - Code splitting
  - Image optimization
  - Audio preloading
  - Caching de dicionário
  - Debounce em searches

---

## 📦 FASE 8: Deploy e Documentação (0%)

### 8.1 Deploy Backend
- [ ] **Publicar API Python** (0%)
  - Containerizar com Docker
  - Deploy em servidor (AWS/Heroku/Railway)
  - Configurar variáveis de ambiente
  - Setup de logging
  - Monitoring (Sentry)

### 8.2 Deploy Frontend
- [ ] **Atualizar aplicação** (0%)
  - Build otimizado
  - Environment configs
  - API endpoints corretos
  - Deploy na plataforma atual

### 8.3 Documentação
- [ ] **Criar documentação completa** (0%)
  - README de setup
  - Guia de uso do sistema de lições
  - API documentation (Swagger)
  - Comentários no código
  - Guia para adicionar novas lições

### 8.4 Treinamento de Conteúdo
- [ ] **Documentar processo de criação** (0%)
  - Como adicionar novas histórias
  - Como marcar expressões
  - Como criar exercícios
  - Como adicionar áudios de referência
  - Template de lição

---

## 📈 Checklist de Conclusão Final

- [ ] Todas as 8 fases concluídas (100%)
- [ ] Testes passando
- [ ] Deploy realizado
- [ ] Documentação completa
- [ ] Performance otimizada
- [ ] Sem bugs críticos
- [ ] Feedback de usuários teste coletado
- [ ] Ajustes finais implementados

---

## 🎯 Prioridades de Desenvolvimento

### Sprint 1 (Semana 1-2) - Fundação
- FASE 1 completa
- FASE 2.1 a 2.4 (Histórias e Dicionário básico)

### Sprint 2 (Semana 3-4) - Exercícios
- FASE 2.5 e 2.6 (Conteúdo)
- FASE 3 completa (Interpretação)

### Sprint 3 (Semana 5-6) - Escrita
- FASE 4 completa (Writing)

### Sprint 4 (Semana 7-9) - Pronúncia
- FASE 5 completa (openSMILE)

### Sprint 5 (Semana 10) - Polimento
- FASE 6 completa (UI/UX)

### Sprint 6 (Semana 11-12) - Finalização
- FASE 7 e 8 completas (Testes e Deploy)

---

## 🛠️ Stack Tecnológica

### Frontend
- React + TypeScript
- TailwindCSS
- shadcn/ui
- Lucide React (ícones)
- Web Audio API
- WebSocket API
- React Query (data fetching)

### Backend
- Python 3.9+
- FastAPI
- openSMILE (análise de áudio)
- SpeechRecognition (STT)
- WebSockets
- Pydub (processamento de áudio)
- NumPy/Pandas (análise de dados)

### Database/Storage
- PostgreSQL (lições, progresso)
- AWS S3 ou similar (áudios)
- Redis (cache de dicionário)

### DevOps
- Docker
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- Vercel/Netlify (frontend)
- Railway/Heroku (backend)

---

## 📝 Notas Importantes

1. **Áudios de Referência**: Essencial ter gravações de falante nativo para comparação precisa
2. **openSMILE**: Requer Python environment separado, considerar microserviço
3. **Performance**: WebSocket pode ser intensivo, implementar throttling
4. **Conteúdo**: Priorizar qualidade sobre quantidade nas histórias
5. **Feedback**: Sistema de pronúncia deve ser encorajador, não punitivo
6. **Mobile**: Testar exaustivamente gravação de áudio em dispositivos mobile
7. **Privacidade**: Não armazenar gravações de áudio dos usuários sem consentimento

---

**Data de Criação**: 06/11/2025  
**Versão**: 1.0  
**Progresso Atual**: 0% (Aguardando início do desenvolvimento)
