### Objetivo
Solucionar definitivamente os erros de CORS e CSP nas integrações externas (Gemini e Pixabay) que impedem o uso das APIs a partir do front-end.

### Diagnóstico Atual
- **Backend FastAPI** já utiliza `CORSMiddleware` com origens dinâmicas via variável `ALLOWED_ORIGINS` @backend/pronunciation/main.py#27-56.
- **Frontend Vite** impõe CSP rigorosa via cabeçalho configurado em `vite.config.ts` @vite.config.ts#8-13.
- Logs mostram bloqueios `Content Security Policy` para `https://generativelanguage.googleapis.com` (Gemini) e outras conexões externas.
- Testes `curl` confirmaram:
  - Pixabay responde 200 com cabeçalhos `Access-Control-Allow-Origin: *` indicando CORS liberado no provedor.
  - Gemini `generativelanguage.googleapis.com` responde 200 listando modelos, logo a API está ativa e funcional.

### Ações Realizadas Nesta Task
1. **Ampliação da CSP**: autorizado tráfego `connect-src` para `https://generativelanguage.googleapis.com`, `https://*.googleapis.com` e `https://*.googleusercontent.com`, mantendo Pixabay e hosts locais @vite.config.ts#8-13.
2. **Verificação de Origem Back-end**: confirmado que `CORSMiddleware` cobre `localhost` e hosts configuráveis via env, sem ajustes adicionais @backend/pronunciation/main.py#27-56.
3. **Testes de Rede**:
   - `curl https://pixabay.com/api/?key=...&q=Horse&image_type=photo&per_page=3&safesearch=true` → 200 OK + cabeçalho `Access-Control-Allow-Origin: *`.
   - `curl https://generativelanguage.googleapis.com/v1beta/models?key=...` → 200 OK com listagem de modelos Gemini.

### Próximos Passos Recomendados
1. Reiniciar o servidor Vite (`npm run dev` ou script equivalente) para aplicar a nova CSP.
2. Validar no navegador os fluxos que usam Gemini/Pixabay e certificar-se de que o console não apresenta novos erros de CSP ou CORS.
3. (Opcional) Externalizar os domínios autorizados em variáveis de ambiente para facilitar ajustes entre ambientes.

### Considerações
- A CSP agora autoriza apenas os domínios necessários, mantendo postura restritiva.
- A configuração de CORS do backend continua flexível, permitindo credenciais e todos os métodos para as origens aprovadas.
- Recomenda-se monitorar os logs após o deploy para detectar eventuais novos domínios que precisem ser adicionados.
