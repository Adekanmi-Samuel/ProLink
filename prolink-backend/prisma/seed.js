const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Web Development', slug: 'web-development', icon: '🌐', skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Laravel', 'PHP', 'Ruby on Rails', 'ASP.NET', 'Tailwind CSS', 'Bootstrap', 'SASS/SCSS', 'REST API', 'GraphQL'] },
  { name: 'Mobile Development', slug: 'mobile-development', icon: '📱', skills: ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Java (Android)', 'iOS Development', 'Expo', 'Xamarin', 'Ionic', 'Cordova'] },
  { name: 'Design & Creative', slug: 'design-creative', icon: '🎨', skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Logo Design', 'Brand Identity', 'Graphic Design', 'Motion Design', 'Video Editing', 'Canva', 'Sketch', 'InVision', 'Web Design'] },
  { name: 'Writing & Content', slug: 'writing-content', icon: '✍️', skills: ['Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing', 'SEO Writing', 'Grant Writing', 'Proofreading', 'Editing', 'Ghostwriting', 'Script Writing', 'Creative Writing', 'Academic Writing'] },
  { name: 'Digital Marketing', slug: 'digital-marketing', icon: '📈', skills: ['SEO', 'Social Media Marketing', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Email Marketing', 'Affiliate Marketing', 'Influencer Marketing', 'Analytics', 'PPC', 'CRM', 'Conversion Optimization'] },
  { name: 'Video & Animation', slug: 'video-animation', icon: '🎬', skills: ['Video Production', 'Animation', 'Motion Graphics', '3D Modeling', 'Blender', 'After Effects', 'Premiere Pro', 'DaVinci Resolve', 'Whiteboard Animation', 'Explainer Videos', 'Cinematography'] },
  { name: 'Data Science & AI', slug: 'data-science-ai', icon: '🤖', skills: ['Python', 'Machine Learning', 'Data Analysis', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Power BI', 'Tableau', 'SQL', 'Excel', 'R Programming', 'Data Visualization', 'Big Data', 'Apache Spark'] },
  { name: 'Virtual Assistant', slug: 'virtual-assistant', icon: '🤝', skills: ['Administrative Support', 'Email Management', 'Calendar Management', 'Data Entry', 'Customer Support', 'Travel Planning', 'Research', 'Social Media Management', 'CRM Management', 'Transcription', 'Bookkeeping'] },
  { name: 'Blockchain & Web3', slug: 'blockchain-web3', icon: '🔗', skills: ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3.js', 'NFT', 'DeFi', 'Rust', 'Solana', 'Polygon', 'Hardhat', 'Foundry', 'IPFS', 'DApp Development'] },
  { name: 'Engineering & Architecture', slug: 'engineering-architecture', icon: '🏗️', skills: ['AutoCAD', 'Revit', 'Civil Engineering', 'Structural Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'SolidWorks', 'MATLAB', 'Python for Engineering', 'Project Management'] },
  { name: 'Sales & Business Development', slug: 'sales-business', icon: '💼', skills: ['Cold Calling', 'Lead Generation', 'Sales Strategy', 'Account Management', 'CRM Sales', 'B2B Sales', 'Business Development', 'Negotiation', 'Sales Funnels', 'Partnerships'] },
  { name: 'Finance & Accounting', slug: 'finance-accounting', icon: '💰', skills: ['Bookkeeping', 'QuickBooks', 'Financial Analysis', 'Tax Preparation', 'Payroll', 'Xero', 'Financial Modeling', 'Auditing', 'Forecasting', 'Budgeting'] },
  { name: 'Photography', slug: 'photography', icon: '📷', skills: ['Product Photography', 'Portrait Photography', 'Event Photography', 'Photo Editing', 'Lightroom', 'Photoshop', 'Drone Photography', 'Real Estate Photography', 'Food Photography'] },
  { name: 'Music & Audio', slug: 'music-audio', icon: '🎵', skills: ['Audio Editing', 'Mixing', 'Mastering', 'Voice Over', 'Podcast Production', 'Music Production', 'Sound Design', 'Ableton Live', 'FL Studio', 'Pro Tools'] },
  { name: 'Cybersecurity', slug: 'cybersecurity', icon: '🔒', skills: ['Penetration Testing', 'Network Security', 'Ethical Hacking', 'Security Auditing', 'Kali Linux', 'Python Security', 'Incident Response', 'Compliance', 'Risk Assessment'] },
  { name: 'Other', slug: 'other', icon: '📋', skills: ['Translation', 'Data Entry', 'Research', 'Consulting', 'Tutoring', 'Coaching', 'Event Planning', 'Supply Chain', 'Logistics', 'Quality Assurance', 'Testing'] },
];

async function seed() {
  console.log('🌱 Seeding categories and skills...\n');

  for (const cat of categories) {
    // Upsert category
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });
    console.log(`  📁 ${cat.icon} ${category.name}`);

    // Upsert skills for this category
    for (const skillName of cat.skills) {
      const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await prisma.skill.upsert({
        where: { slug },
        update: { name: skillName, category_id: category.id },
        create: { name: skillName, slug, category_id: category.id },
      });
    }
    console.log(`     ${cat.skills.length} skills`);
  }

  console.log('\n✅ Seed complete!');
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
