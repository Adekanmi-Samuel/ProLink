require('dotenv').config();
const prisma = require('../src/config/prisma');

const CATEGORIES_AND_SKILLS = [
  {
    name: 'Web Development',
    slug: 'web-development',
    icon: '🌐',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'PHP', 'WordPress', 'Shopify', 'Python/Django', 'Ruby on Rails', 'TypeScript', 'Tailwind CSS', 'REST API', 'GraphQL']
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    icon: '📱',
    skills: ['React Native', 'Flutter', 'Swift (iOS)', 'Kotlin (Android)', 'Ionic', 'Xamarin', 'App UI Design', 'Push Notifications', 'App Store Publishing']
  },
  {
    name: 'Graphic Design',
    slug: 'graphic-design',
    icon: '🎨',
    skills: ['Logo Design', 'Brand Identity', 'Flyer Design', 'Business Card Design', 'Social Media Graphics', 'Packaging Design', 'Illustration', 'Infographics', 'Print Design', 'T-shirt Design']
  },
  {
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    icon: '✏️',
    skills: ['Figma', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Research', 'Interaction Design', 'Design Systems', 'Responsive Design', 'Usability Testing']
  },
  {
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    icon: '📈',
    skills: ['SEO', 'Google Ads', 'Facebook Ads', 'Instagram Marketing', 'Content Marketing', 'Email Marketing', 'Social Media Management', 'Influencer Marketing', 'Analytics & Reporting', 'TikTok Marketing']
  },
  {
    name: 'Writing & Translation',
    slug: 'writing-translation',
    icon: '✍️',
    skills: ['Blog Writing', 'Copywriting', 'Technical Writing', 'Creative Writing', 'Resume Writing', 'Translation', 'Proofreading', 'Editing', 'Ghostwriting', 'Grant Writing', 'Academic Writing']
  },
  {
    name: 'Video & Animation',
    slug: 'video-animation',
    icon: '🎬',
    skills: ['Video Editing', 'Motion Graphics', '2D Animation', '3D Animation', 'Explainer Videos', 'Whiteboard Animation', 'YouTube Editing', 'Color Grading', 'After Effects', 'Premiere Pro']
  },
  {
    name: 'Audio & Music',
    slug: 'audio-music',
    icon: '🎵',
    skills: ['Music Production', 'Audio Editing', 'Mixing & Mastering', 'Voice Over', 'Podcast Editing', 'Sound Design', 'Jingles', 'Audio Transcription']
  },
  {
    name: 'Data & Analytics',
    slug: 'data-analytics',
    icon: '📊',
    skills: ['Data Entry', 'Data Analysis', 'Excel/Spreadsheets', 'Power BI', 'Tableau', 'SQL', 'Python (Data)', 'Web Scraping', 'Machine Learning', 'Data Visualization']
  },
  {
    name: 'Virtual Assistance',
    slug: 'virtual-assistance',
    icon: '💼',
    skills: ['Admin Support', 'Customer Service', 'Calendar Management', 'Email Management', 'Research', 'Data Entry', 'Travel Booking', 'Social Media Posting']
  },
  {
    name: 'Photography',
    slug: 'photography',
    icon: '📷',
    skills: ['Product Photography', 'Portrait Photography', 'Event Photography', 'Photo Editing', 'Photo Retouching', 'Lightroom', 'Real Estate Photography']
  },
  {
    name: 'Business & Consulting',
    slug: 'business-consulting',
    icon: '🏢',
    skills: ['Business Plan Writing', 'Financial Modeling', 'Market Research', 'Pitch Deck', 'Bookkeeping', 'Accounting', 'Legal Consulting', 'HR Consulting', 'Project Management']
  },
  {
    name: 'Engineering & Architecture',
    slug: 'engineering-architecture',
    icon: '🏗️',
    skills: ['AutoCAD', 'Revit', '3D Modeling', 'Structural Design', 'Interior Design', 'Electrical Design', 'Civil Engineering', 'Mechanical Design']
  },
  {
    name: 'Fashion & Beauty',
    slug: 'fashion-beauty',
    icon: '👗',
    skills: ['Fashion Design', 'Pattern Making', 'Tailoring', 'Makeup Artistry', 'Hair Styling', 'Personal Styling', 'Fashion Illustration']
  },
  {
    name: 'Events & Entertainment',
    slug: 'events-entertainment',
    icon: '🎉',
    skills: ['Event Planning', 'MC/Host', 'DJ Services', 'Catering Coordination', 'Decoration', 'Live Performance', 'Wedding Planning']
  },
  {
    name: 'Home & Repair Services',
    slug: 'home-repair-services',
    icon: '🔧',
    skills: ['Plumbing', 'Electrical Work', 'Painting', 'Carpentry', 'Tiling', 'AC Repair', 'Generator Repair', 'Cleaning Services', 'Fumigation']
  },
  {
    name: 'Education & Tutoring',
    slug: 'education-tutoring',
    icon: '📚',
    skills: ['Math Tutoring', 'English Tutoring', 'Science Tutoring', 'WAEC/JAMB Prep', 'SAT/GRE Prep', 'Music Lessons', 'Language Lessons', 'Online Course Creation']
  },
];

async function main() {
  console.log('🌱 Seeding categories and skills...\n');

  for (const cat of CATEGORIES_AND_SKILLS) {
    // Upsert category
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon }
    });
    console.log(`✅ Category: ${category.name} (id: ${category.id})`);

    // Upsert skills
    for (const skillName of cat.skills) {
      const skillSlug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await prisma.skill.upsert({
        where: { slug: skillSlug },
        update: { name: skillName, category_id: category.id },
        create: { name: skillName, slug: skillSlug, category_id: category.id }
      });
    }
    console.log(`   └─ ${cat.skills.length} skills added\n`);
  }

  const totalCategories = await prisma.category.count();
  const totalSkills = await prisma.skill.count();
  console.log(`\n🎉 Done! ${totalCategories} categories, ${totalSkills} skills total.`);
  
  await prisma.$disconnect();
  process.exit(0);
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
