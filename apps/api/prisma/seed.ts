import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Data Seeding...');

  // --- 2. WORKOUT BLOCKS (The 105 Base Routines) ---

  // A - Low Impact
  await prisma.workoutBlock.upsert({
    where: { code: 'A01' },
    update: {},
    create: {
      code: 'A01',
      category: 'Low Impact',
      title: 'Foundation Day 1',
      description: 'Gentle introduction to movement patterns.',
      durationMin: 24,
      structure: {
        type: 'EMOM',
        minutes: 24,
        movements: [
          { minute: 1, name: 'Sit-to-Stand', reps: '10' },
          { minute: 2, name: 'Wall Push-ups', reps: '8' },
          { minute: 3, name: 'KB Deadlifts', reps: '12' },
          { minute: 4, name: 'Walk/Rest', reps: '45s' },
        ],
      },
    },
  });

  // B - CrossFit Standard
  await prisma.workoutBlock.upsert({
    where: { code: 'B01' },
    update: {},
    create: {
      code: 'B01',
      category: 'CrossFit',
      title: 'The Standard',
      description: 'Classic AMRAP triplet to test capacity.',
      durationMin: 25,
      structure: {
        type: 'AMRAP',
        minutes: 25,
        movements: [
          { name: 'Goblet Squats', reps: '10' },
          { name: 'Push-ups', reps: '10' },
          { name: 'KB Swings', reps: '15' },
          { name: 'Run', reps: '200m' },
        ],
      },
    },
  });

  // C - HIIT
  await prisma.workoutBlock.upsert({
    where: { code: 'C01' },
    update: {},
    create: {
      code: 'C01',
      category: 'HIIT',
      title: 'Tabata Burn',
      description: 'High intensity intervals.',
      durationMin: 20,
      structure: {
        type: 'INTERVAL',
        workSec: 20,
        restSec: 10,
        rounds: 8,
        movements: ['Squats', 'Push-ups', 'Mountain Climbers', 'Plank'],
      },
    },
  });

  // D - Strength
  await prisma.workoutBlock.upsert({
    where: { code: 'D01' },
    update: {},
    create: {
      code: 'D01',
      category: 'Strength',
      title: 'Heavy Day',
      description: 'Focus on primary lifts followed by conditioning.',
      durationMin: 45,
      structure: {
        partA: { type: 'Strength', movement: 'Deadlift', sets: 5, reps: 5 },
        partB: {
          type: 'Metcon',
          minutes: 12,
          movements: [
            { name: 'KB Swings', reps: '10' },
            { name: 'Push-ups', reps: '10' },
            { name: 'Run', reps: '200m' },
          ],
        },
      },
    },
  });

  // E - Express (Busy)
  await prisma.workoutBlock.upsert({
    where: { code: 'E01' },
    update: {},
    create: {
      code: 'E01',
      category: 'Express',
      title: 'Lunch Break Fix',
      description: 'Get it done in 20 minutes.',
      durationMin: 20,
      structure: {
        type: 'EMOM',
        minutes: 20,
        movements: [
          { minute: 1, name: 'KB Swings', reps: '12' },
          { minute: 2, name: 'Push-ups', reps: '10' },
          { minute: 3, name: 'Assault Bike', reps: '40s' },
          { minute: 4, name: 'Rest', reps: '60s' },
        ],
      },
    },
  });

  // --- 3. INGREDIENTS (The Palette) ---
  const chicken = await prisma.ingredient.create({
    data: { name: 'Chicken Breast', category: 'Protein', caloriesPer100g: 165 },
  });
  const rice = await prisma.ingredient.create({
    data: { name: 'White Rice', category: 'Carb', caloriesPer100g: 130 },
  });
  const broccoli = await prisma.ingredient.create({
    data: { name: 'Broccoli', category: 'Veg', caloriesPer100g: 34 },
  });
  const oliveOil = await prisma.ingredient.create({
    data: { name: 'Olive Oil', category: 'Fat', caloriesPer100g: 884 },
  });

  // --- 4. RECIPES (Specific Implementations) ---
  await prisma.recipe.create({
    data: {
      title: 'Grilled Lemon Chicken',
      instructions:
        '1. Marinate chicken with lemon and herbs. 2. Grill for 6 mins per side. 3. Serve with steamed broccoli.',
      calories: 450,
      protein: 40,
      carbs: 10,
      fats: 15,
      ingredients: {
        connect: [
          { id: chicken.id },
          { id: broccoli.id },
          { id: oliveOil.id },
          { id: rice.id },
        ],
      },
    },
  });

  // --- 5. MEAL TEMPLATES (The Logic) ---

  // Template A - Fat Loss Aggressive
  await prisma.mealTemplate.upsert({
    where: { code: 'TEMPLATE_A' },
    update: {},
    create: {
      code: 'TEMPLATE_A',
      goal: 'Fat Loss Aggressive',
      structure: {
        breakfast: ['Yogurt Greek', 'Protein Powder', 'Berries'],
        lunch: ['Lean Protein 200g', 'Rice 60g', 'Veg Unlimited'],
        dinner: ['White Fish 200g', 'Salad Big', 'Oil 1tbsp'],
      },
    },
  });

  // Template C - Muscle Gain
  await prisma.mealTemplate.upsert({
    where: { code: 'TEMPLATE_C' },
    update: {},
    create: {
      code: 'TEMPLATE_C',
      goal: 'Muscle Gain',
      structure: {
        breakfast: ['Oats 80g', 'Protein Scoop', 'Fruit'],
        lunch: ['Chicken/Beef 250g', 'Rice 120g', 'Veg'],
        dinner: ['Eggs', 'Potato', 'Oil'],
      },
    },
  });

  // --- 6. QUOTES (Daily Motivation) ---
  await prisma.quote.createMany({
    data: [
      {
        text: "The only bad workout is the one that didn't happen.",
        author: 'Unknown',
        tags: ['Motivation'],
      },
      {
        text: "Discipline is doing what needs to be done, even if you don't want to do it.",
        author: 'Unknown',
        tags: ['Discipline'],
      },
      {
        text: 'Your body can stand almost anything. It’s your mind that you have to convince.',
        author: 'Unknown',
        tags: ['Mindset'],
      },
      {
        text: "Don't stop when you're tired. Stop when you're done.",
        author: 'David Goggins',
        tags: ['Hardcore'],
      },
    ],
  });

  console.log('✅ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
