import { prisma } from "@/lib/prisma";

async function seedMWALinks() {
  console.log("🌱 Seeding MWA link categories...");

  try {
    // Create the main categories based on your Chrome structure
    const categories = [
      { name: "Knowledge Topics", order: 1 },
      { name: "MSA Website", order: 2 },
      { name: "MSA Resources", order: 3 },
      { name: "Foreign Country Info", order: 4 },
      { name: "Product Adviser Sites", order: 5 },
      { name: "MSA Applications", order: 6 },
      { name: "CPAL", order: 7 },
      { name: "Third Party Authorities", order: 8 },
      { name: "Competitor Websites", order: 9 },
    ];

    for (const categoryData of categories) {
      const category = await prisma.linkCategory.create({
        data: categoryData,
      });
      
      console.log(`✅ Created category: ${category.name}`);

      // Add some example subcategories and links
      if (category.name === "MSA Applications") {
        await prisma.linkSubCategory.create({
          data: {
            name: "Client Management",
            categoryId: category.id,
            order: 1,
          },
        });

        await prisma.linkSubCategory.create({
          data: {
            name: "Portfolio Tools", 
            categoryId: category.id,
            order: 2,
          },
        });
      }

      if (category.name === "Third Party Authorities") {
        const asicSub = await prisma.linkSubCategory.create({
          data: {
            name: "ASIC",
            categoryId: category.id,
            order: 1,
          },
        });

        const apraSub = await prisma.linkSubCategory.create({
          data: {
            name: "APRA",
            categoryId: category.id,
            order: 2,
          },
        });

        const atoSub = await prisma.linkSubCategory.create({
          data: {
            name: "ATO",
            categoryId: category.id,
            order: 3,
          },
        });

        // Add some example links
        await prisma.link.create({
          data: {
            title: "ASIC MoneySmart",
            url: "https://moneysmart.gov.au",
            description: "Financial guidance for consumers",
            subCategoryId: asicSub.id,
            order: 1,
          },
        });

        await prisma.link.create({
          data: {
            title: "ASIC Register",
            url: "https://asic.gov.au",
            description: "Official ASIC website",
            subCategoryId: asicSub.id,
            order: 2,
          },
        });

        await prisma.link.create({
          data: {
            title: "APRA Website",
            url: "https://apra.gov.au",
            description: "Australian Prudential Regulation Authority",
            subCategoryId: apraSub.id,
            order: 1,
          },
        });

        await prisma.link.create({
          data: {
            title: "ATO Business Portal",
            url: "https://ato.gov.au",
            description: "Tax and business information",
            subCategoryId: atoSub.id,
            order: 1,
          },
        });
      }

      // Add some direct category-level links
      if (category.name === "MSA Website") {
        await prisma.link.create({
          data: {
            title: "Main Website",
            url: "https://marsdenwealth.com.au",
            description: "Company website",
            categoryId: category.id,
            order: 1,
          },
        });

        await prisma.link.create({
          data: {
            title: "Client Portal",
            url: "https://portal.marsdenwealth.com.au",
            description: "Client login portal",
            categoryId: category.id,
            order: 2,
          },
        });
      }

      if (category.name === "MSA Resources") {
        await prisma.link.create({
          data: {
            title: "SharePoint - Templates",
            url: "https://marsdenwealth.sharepoint.com/templates",
            description: "Document templates",
            categoryId: category.id,
            order: 1,
          },
        });

        await prisma.link.create({
          data: {
            title: "SharePoint - Clients",
            url: "https://marsdenwealth.sharepoint.com/clients",
            description: "Client documents",
            categoryId: category.id,
            order: 2,
          },
        });

        await prisma.link.create({
          data: {
            title: "SharePoint - Prospects", 
            url: "https://marsdenwealth.sharepoint.com/prospects",
            description: "Prospect information",
            categoryId: category.id,
            order: 3,
          },
        });
      }
    }

    console.log("🎉 Successfully seeded MWA link categories!");
    
    // Show summary
    const totalCategories = await prisma.linkCategory.count();
    const totalSubCategories = await prisma.linkSubCategory.count();
    const totalSubSubCategories = await prisma.linkSubSubCategory.count();
    const totalLinks = await prisma.link.count();
    
    console.log(`📊 Summary:`);
    console.log(`   Categories: ${totalCategories}`);
    console.log(`   SubCategories: ${totalSubCategories}`);
    console.log(`   SubSubCategories: ${totalSubSubCategories}`);
    console.log(`   Links: ${totalLinks}`);

  } catch (error) {
    console.error("❌ Failed to seed link categories:", error);
    throw error;
  }
}

async function main() {
  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Clearing existing hierarchical link data...");
  await prisma.link.deleteMany({});
  await prisma.linkSubSubCategory.deleteMany({});
  await prisma.linkSubCategory.deleteMany({});
  await prisma.linkCategory.deleteMany({});

  await seedMWALinks();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });