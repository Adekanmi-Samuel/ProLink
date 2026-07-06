require('dotenv').config();
const prisma = require('../config/prisma');

const categories = [
  {
    name: 'Web, Mobile & Software Dev',
    slug: 'web-mobile-software-dev',
    icon: '💻',
    skills: ['React', 'Node.js', 'Python', 'Next.js', 'Prisma', 'React Native', 'Flutter', 'TypeScript', 'Java', 'C#']
  },
  {
    name: 'Design & Creative',
    slug: 'design-creative',
    icon: '🎨',
    skills: ['UI/UX Design', 'Logo Design', 'Illustration', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Video Editing', 'Animation']
  },
  {
    name: 'Writing & Translation',
    slug: 'writing-translation',
    icon: '✍️',
    skills: ['Copywriting', 'Technical Writing', 'Translation', 'Proofreading', 'Content Writing', 'Ghostwriting']
  },
  {
    name: 'Sales & Marketing',
    slug: 'sales-marketing',
    icon: '📈',
    skills: ['SEO', 'Social Media Marketing', 'Email Marketing', 'Lead Generation', 'SEM', 'Marketing Strategy']
  },
  {
    name: 'Admin Support',
    slug: 'admin-support',
    icon: '📋',
    skills: ['Virtual Assistant', 'Data Entry', 'Web Research', 'Project Management', 'Customer Service']
  }
];

async function main() {
  console.log('Starting seed...');
  for (const cat of categories) {
    // Upsert Category
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon
      }
    });
    console.log(`Created category: ${category.name}`);

    // Upsert Skills
    for (const skillName of cat.skills) {
      const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.skill.upsert({
        where: { slug },
        update: {},
        create: {
          name: skillName,
          slug,
          category_id: category.id
        }
      });
    }
  }
  console.log('Seed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
