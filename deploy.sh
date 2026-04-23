#!/bin/bash
# POLARIS Deploy Script
# Einfach doppelklicken oder im Terminal: ./deploy.sh

set -e

cd "$(dirname "$0")"

echo ""
echo "🚀 POLARIS wird deployed..."
echo ""

# Build + Deploy
npx vercel --prod --yes

echo ""
echo "✅ Fertig! POLARIS ist live:"
echo "   https://polaris-nine-kappa.vercel.app"
echo ""
