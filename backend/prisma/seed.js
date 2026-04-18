/**
 * Database seed — Skills, Lessons, and Achievements for SkillQuest
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Skills ──────────────────────────────────────────────────────────────
  const skills = await Promise.all([
    prisma.skill.upsert({
      where: { id: 'skill-html' },
      update: {},
      create: {
        id: 'skill-html',
        name: 'HTML Basics',
        description: 'Learn the building blocks of the web',
        icon: '🌐',
        category: 'programming',
        color: '#E44D26',
        positionX: 200,
        positionY: 100,
        prerequisites: '[]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-css' },
      update: {},
      create: {
        id: 'skill-css',
        name: 'CSS Styling',
        description: 'Style your web pages beautifully',
        icon: '🎨',
        category: 'programming',
        color: '#2965F1',
        positionX: 450,
        positionY: 100,
        prerequisites: '["skill-html"]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-js' },
      update: {},
      create: {
        id: 'skill-js',
        name: 'JavaScript',
        description: 'Make your pages interactive',
        icon: '⚡',
        category: 'programming',
        color: '#F0DB4F',
        positionX: 700,
        positionY: 100,
        prerequisites: '["skill-html", "skill-css"]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-react' },
      update: {},
      create: {
        id: 'skill-react',
        name: 'React',
        description: 'Build modern UIs with components',
        icon: '⚛️',
        category: 'programming',
        color: '#61DAFB',
        positionX: 700,
        positionY: 280,
        prerequisites: '["skill-js"]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-python' },
      update: {},
      create: {
        id: 'skill-python',
        name: 'Python',
        description: 'A versatile language for any use case',
        icon: '🐍',
        category: 'programming',
        color: '#3572A5',
        positionX: 200,
        positionY: 280,
        prerequisites: '[]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-git' },
      update: {},
      create: {
        id: 'skill-git',
        name: 'Git & GitHub',
        description: 'Version control your code like a pro',
        icon: '🔗',
        category: 'tools',
        color: '#F05032',
        positionX: 450,
        positionY: 280,
        prerequisites: '[]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-design' },
      update: {},
      create: {
        id: 'skill-design',
        name: 'UI Design',
        description: 'Design interfaces users love',
        icon: '🖌️',
        category: 'design',
        color: '#FF6B6B',
        positionX: 200,
        positionY: 460,
        prerequisites: '[]',
      },
    }),
    prisma.skill.upsert({
      where: { id: 'skill-sql' },
      update: {},
      create: {
        id: 'skill-sql',
        name: 'SQL & Databases',
        description: 'Query and manage data effectively',
        icon: '🗄️',
        category: 'data',
        color: '#00758F',
        positionX: 450,
        positionY: 460,
        prerequisites: '[]',
      },
    }),
  ]);

  console.log(`  ✓ Created ${skills.length} skills`);

  // ── Lessons ─────────────────────────────────────────────────────────────
  const lessons = await Promise.all([
    // HTML lessons
    ...['What is HTML?', 'Tags and Elements', 'Headings & Paragraphs', 'Links & Images', 'HTML Forms'].map(
      (title, i) =>
        prisma.lesson.upsert({
          where: { id: `lesson-html-${i}` },
          update: {},
          create: {
            id: `lesson-html-${i}`,
            skillId: 'skill-html',
            title,
            description: `Learn about ${title}`,
            xpReward: 15 + i * 5,
            order: i + 1,
            type: i % 2 === 0 ? 'reading' : 'quiz',
            difficulty: Math.ceil((i + 1) / 2),
            duration: 5 + i * 2,
            content: JSON.stringify({
              intro: `Welcome to the lesson on ${title}!`,
              questions: [
                { q: `What is ${title}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0 },
                { q: 'Which is correct?', options: ['A', 'B', 'C', 'D'], answer: 1 },
              ],
            }),
          },
        })
    ),
    // CSS lessons
    ...['CSS Selectors', 'Box Model', 'Flexbox', 'CSS Grid', 'Animations'].map(
      (title, i) =>
        prisma.lesson.upsert({
          where: { id: `lesson-css-${i}` },
          update: {},
          create: {
            id: `lesson-css-${i}`,
            skillId: 'skill-css',
            title,
            description: `Master ${title}`,
            xpReward: 20 + i * 5,
            order: i + 1,
            type: i % 2 === 0 ? 'quiz' : 'reading',
            difficulty: Math.ceil((i + 1) / 2),
            duration: 8 + i * 2,
            content: JSON.stringify({ intro: `About ${title}`, questions: [] }),
          },
        })
    ),
    // JS lessons
    ...['Variables & Types', 'Functions', 'Arrays & Objects', 'DOM Manipulation', 'Async JavaScript'].map(
      (title, i) =>
        prisma.lesson.upsert({
          where: { id: `lesson-js-${i}` },
          update: {},
          create: {
            id: `lesson-js-${i}`,
            skillId: 'skill-js',
            title,
            description: `Understand ${title}`,
            xpReward: 25 + i * 5,
            order: i + 1,
            type: 'coding',
            difficulty: 1 + Math.floor(i / 2),
            duration: 10 + i * 3,
            content: JSON.stringify({ intro: `About ${title}`, code: `// Write your code here\nconsole.log("Hello!");` }),
          },
        })
    ),
    // Python lessons
    ...['Python Basics', 'Data Types', 'Control Flow', 'Functions & Modules', 'File I/O'].map(
      (title, i) =>
        prisma.lesson.upsert({
          where: { id: `lesson-python-${i}` },
          update: {},
          create: {
            id: `lesson-python-${i}`,
            skillId: 'skill-python',
            title,
            description: `Learn ${title} in Python`,
            xpReward: 20 + i * 5,
            order: i + 1,
            type: i < 2 ? 'reading' : 'coding',
            difficulty: 1 + Math.floor(i / 2),
            duration: 8 + i * 2,
            content: JSON.stringify({ intro: `Python: ${title}` }),
          },
        })
    ),
  ]);

  console.log(`  ✓ Created ${lessons.length} lessons`);

  // ── Achievements ─────────────────────────────────────────────────────────
  const achievementData = [
    { id: 'ach-first-lesson',  name: 'First Steps',      description: 'Complete your first lesson',          icon: '👣', rarity: 'common',    xpReward: 10,  condition: { type: 'lessons_completed', threshold: 1 }  },
    { id: 'ach-10-lessons',    name: 'On a Roll',         description: 'Complete 10 lessons',                 icon: '🎯', rarity: 'common',    xpReward: 25,  condition: { type: 'lessons_completed', threshold: 10 } },
    { id: 'ach-25-lessons',    name: 'Scholar',           description: 'Complete 25 lessons',                 icon: '📚', rarity: 'rare',      xpReward: 50,  condition: { type: 'lessons_completed', threshold: 25 } },
    { id: 'ach-50-lessons',    name: 'Knowledge Seeker',  description: 'Complete 50 lessons',                 icon: '🔍', rarity: 'rare',      xpReward: 75,  condition: { type: 'lessons_completed', threshold: 50 } },
    { id: 'ach-level-5',       name: 'Rising Hero',       description: 'Reach Level 5',                       icon: '⭐', rarity: 'common',    xpReward: 30,  condition: { type: 'level_reached', threshold: 5 }      },
    { id: 'ach-level-10',      name: 'Adventurer',        description: 'Reach Level 10',                      icon: '🌟', rarity: 'rare',      xpReward: 75,  condition: { type: 'level_reached', threshold: 10 }     },
    { id: 'ach-level-25',      name: 'Elite Coder',       description: 'Reach Level 25',                      icon: '💎', rarity: 'epic',      xpReward: 150, condition: { type: 'level_reached', threshold: 25 }     },
    { id: 'ach-level-50',      name: 'Legend',            description: 'Reach Level 50',                      icon: '🏆', rarity: 'legendary', xpReward: 500, condition: { type: 'level_reached', threshold: 50 }     },
    { id: 'ach-streak-3',      name: 'Habit Forming',     description: 'Maintain a 3-day streak',             icon: '🔥', rarity: 'common',    xpReward: 20,  condition: { type: 'streak', threshold: 3 }             },
    { id: 'ach-streak-7',      name: 'Week Warrior',      description: 'Maintain a 7-day streak',             icon: '⚔️', rarity: 'rare',      xpReward: 60,  condition: { type: 'streak', threshold: 7 }             },
    { id: 'ach-streak-30',     name: 'Unstoppable',       description: 'Maintain a 30-day streak',            icon: '🌋', rarity: 'epic',      xpReward: 200, condition: { type: 'streak', threshold: 30 }            },
    { id: 'ach-xp-1000',       name: 'XP Collector',      description: 'Earn 1,000 total XP',                 icon: '💰', rarity: 'common',    xpReward: 30,  condition: { type: 'total_xp', threshold: 1000 }        },
    { id: 'ach-xp-5000',       name: 'XP Hoarder',        description: 'Earn 5,000 total XP',                 icon: '💵', rarity: 'rare',      xpReward: 100, condition: { type: 'total_xp', threshold: 5000 }        },
    { id: 'ach-xp-25000',      name: 'XP Millionaire',    description: 'Earn 25,000 total XP',                icon: '💎', rarity: 'legendary', xpReward: 500, condition: { type: 'total_xp', threshold: 25000 }       },
  ];

  const achievements = await Promise.all(
    achievementData.map((a) =>
      prisma.achievement.upsert({
        where: { id: a.id },
        update: {},
        create: { ...a, condition: JSON.stringify(a.condition) },
      })
    )
  );

  console.log(`  ✓ Created ${achievements.length} achievements`);
  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
