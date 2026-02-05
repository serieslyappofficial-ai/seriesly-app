Seriesly – App Frontend (HTML + Supabase) v2
==========================================

O que foi adicionado nesta versão:
- ✅ Tela "Buscar perfis" (Instagram / TikTok / X) com abertura de links e salvamento de atalhos.
- ✅ Chat com IA na área de Suporte (modo gratuito / offline):
     - Respostas automáticas com base em perguntas comuns (login, planos, salvar links, avatar etc.)
     - Histórico do chat salvo no navegador (localStorage)
     - Sugestão de contato por e-mail quando necessário
- ✅ Textos atualizados citando Instagram, TikTok e X

Arquivos:
- index.html
- styles.css
- app.js
- README.txt

-----------------------------------------
1) Como usar
-----------------------------------------
1. Extraia o ZIP.
2. Abra o "index.html" no navegador.
3. Confirme as credenciais do Supabase em app.js (initSupabase).

-----------------------------------------
2) Tabelas esperadas no Supabase (SQL)
-----------------------------------------

Tabela profiles:
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  language text default 'pt',
  plan text default 'free',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

Tabela saved_items:
create table if not exists public.saved_items (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  value text not null,
  tag text,
  created_at timestamp with time zone default timezone('utc', now())
);

Tabela profile_shortcuts (para atalhos de @):
create table if not exists public.profile_shortcuts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  handle text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-----------------------------------------
3) Storage (Avatar)
-----------------------------------------
- Bucket: "avatars"
- Permitir upload para usuários autenticados (policy)
- O app salva a URL pública em profiles.avatar_url

-----------------------------------------
4) Premium / Lifetime
-----------------------------------------
Os botões de upgrade simulam a compra:
- Atualizam profiles.plan para "premium" ou "lifetime"
Depois você conecta um gateway real (Stripe / Mercado Pago / Pix etc.).

-----------------------------------------
5) Chat IA (modo gratuito)
-----------------------------------------
Este chat é um "IA-lite" (FAQ inteligente) sem custo:
- Não usa API externa
- Responde com base em intents simples
Quando você quiser IA real, trocamos para um endpoint (serverless) e conectamos a um modelo.



IMPORTANTE – corrigir coluna LANGUAGE:
--------------------------------------
Se aparecer o erro:
  "Could not find the 'language' column of 'profiles' in the schema cache"

rode o SQL abaixo no editor do Supabase:

alter table public.profiles
  add column if not exists language text default 'pt';

alter table public.profiles
  add column if not exists plan text default 'free';

Depois disso, clique em "Refresh schema" se o painel pedir.

--------------------------------------
Integração futura com ChatGPT (opcional)
--------------------------------------
O chat atual funciona 100% no navegador, sem custo.

Quando você quiser integrar com a API do ChatGPT:
1) Crie uma função serverless (por exemplo em Node) que receba:
   - histórico de mensagens
2) A função chama a API do ChatGPT usando sua API key (NUNCA coloque a key no frontend).
3) No app.js, em vez de usar apenas botAnswer(), você faz um fetch para essa função.
Se quiser, depois eu escrevo o exemplo desse endpoint para você.


-----------------------------------------
6) Estatísticas e plataformas
-----------------------------------------
O app agora mostra um RESUMO RÁPIDO no painel:
- total de itens salvos
- quantos links são Instagram, TikTok, X ou YouTube

Ele detecta a plataforma analisando o texto/URL do campo "value" de saved_items
(no frontend, não precisa mudar o banco para isso).

-----------------------------------------
7) Integração com ChatGPT (backend opcional)
-----------------------------------------
O chat Seriesly AI agora tenta chamar um endpoint de backend:

  AI_ENDPOINT = "/api/seriesly-ai"

Você precisa criar esse endpoint em um servidor (ex: Node + Express,
Next.js API Route, Vercel Function etc).

Exemplo SIMPLIFICADO em Node (server-side):

// npm install openai
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const { message, history } = req.body;

  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: "Você é o suporte oficial do Seriesly. Responda curto, direto e amigável. Não cite configurações internas."
      },
      ...history,
      { role: "user", content: message }
    ]
  });

  const reply = completion.output[0].content[0].text;
  res.status(200).json({ reply });
}

IMPORTANTE:
- A chave OPENAI_API_KEY fica apenas no backend.
- O frontend (app.js) NUNCA deve conter sua chave.


-----------------------------------------
8) Pastas (Folders) – Seriesly v5
-----------------------------------------
A versão v5 adiciona "Pastas" para organizar sua biblioteca.

SQL (rode no Supabase):
-----------------------------------------
create table if not exists public.folders (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create index if not exists folders_user_idx
  on public.folders(user_id, created_at desc);

alter table if exists public.saved_items
  add column if not exists folder_id bigint references public.folders(id) on delete set null;

create index if not exists saved_items_folder_idx
  on public.saved_items(user_id, folder_id, created_at desc);

Notas:
- Plano Free: limite de 3 pastas, 20 itens salvos e 5 atalhos.
- Premium/Lifetime: ilimitado.
