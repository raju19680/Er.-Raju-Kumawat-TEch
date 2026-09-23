#!/bin/bash
# Auto-setup script for Er. Raju Kumawat Tech Platform
# This script runs automatically on first deployment to:
# 1. Generate Prisma client
# 2. Push database schema (creates all tables)
# 3. Seed initial data (admin, teachers, students, content)

set -e

echo "🚀 Starting auto-setup..."

# Step 1: Generate Prisma client
echo "📦 Step 1: Generating Prisma client..."
bunx prisma generate
echo "✅ Prisma client generated"

# Step 2: Push database schema (creates all tables automatically)
echo "🗄️  Step 2: Creating database tables..."
bunx prisma db push
echo "✅ Database tables created"

# Step 3: Check if database is already seeded
echo "🌱 Step 3: Checking if seed is needed..."
SEED_CHECK=$(bunx tsx -e "
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()
db.organization.count().then(c => { console.log(c); db.\$disconnect() }).catch(() => { console.log(0); db.\$disconnect() })
" 2>/dev/null || echo "0")

if [ "$SEED_CHECK" = "0" ] || [ -z "$SEED_CHECK" ]; then
  echo "🌱 Database is empty, running seed..."
  bunx tsx prisma/seed.ts
  echo "✅ Seed complete"
else
  echo "⏭️  Database already has data ($SEED_CHECK organizations), skipping seed"
fi

echo ""
echo "🎉 Auto-setup complete!"
echo ""
echo "📋 Login Credentials:"
echo "   Super Admin: 9680177120 / rajulalkumawat1995@gmail.com / Kumawat@4321"
echo "   Teacher: ERKTACADEMY / ravi@errkt.com / Kumawat@4321"
echo ""
