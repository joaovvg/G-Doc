# Assinatura digital de documentos

## O que foi implementado

O sistema agora permite registrar uma assinatura digital interna em documentos que possuem PDF principal.

Cada assinatura salva:

- Identificador da assinatura
- Usuario signatario
- Nome do signatario
- CPF do signatario
- Data e hora da assinatura
- Algoritmo usado
- Hash do conteudo do arquivo no momento da assinatura
- Nome do arquivo assinado

## Como funciona

Quando o usuario clica em `Assinar Digitalmente`, o sistema:

1. Verifica se o documento possui PDF principal
2. Gera um hash `SHA-256` do conteudo armazenado em `fileContent`
3. Cria um registro de assinatura com os dados do usuario logado
4. Salva a assinatura dentro do proprio documento
5. Registra um evento no historico do documento

## Como a validacao aparece

Na tela de detalhes do documento, a secao `Assinaturas Digitais` mostra todas as assinaturas registradas.

Para cada assinatura, o sistema compara:

- `contentHash` salvo no momento da assinatura
- hash atual do `fileContent`

Se os dois hashes forem iguais:

- o status exibido sera `Hash Valido`

Se forem diferentes:

- o status exibido sera `Arquivo Alterado`

Isso indica que o PDF principal foi modificado depois da assinatura.

## Regras atuais

- A assinatura vale para o PDF principal do documento
- Um mesmo usuario nao pode assinar o mesmo documento duas vezes
- A assinatura fica persistida no banco na coluna `documents.signatures`
- O historico do documento recebe um evento de assinatura

## Limitacao importante

Esta implementacao e uma assinatura digital interna baseada em hash e trilha de auditoria.

Ela **nao** substitui uma assinatura com certificado digital ICP-Brasil, token, A1/A3, carimbo do tempo oficial ou validacao juridica externa.

Ou seja:

- serve muito bem para integridade, rastreabilidade e controle interno
- nao deve ser vendida como assinatura qualificada oficial sem integracao com certificado digital valido

## Arquivos principais alterados

- `types.ts`
- `utils.ts`
- `views/DocumentDetail.tsx`
- `backend/src/repositories.js`
- `backend/db/schema.sql`
- `backend/db/fix_tables.sql`
