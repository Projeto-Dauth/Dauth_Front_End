#!/bin/bash
set -e

echo "==> [1/3] Atualizando código..."
git pull origin main

echo "==> [2/3] Instalando dependências..."
npm install --frozen-lockfile

echo "==> [3/3] Gerando build de produção..."
npm run build

echo ""
echo "==> Deploy concluído! O nginx já está servindo o novo dist."
