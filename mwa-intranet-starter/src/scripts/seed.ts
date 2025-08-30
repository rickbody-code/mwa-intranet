import { prisma } from "@/lib/prisma";

async function main() {
  await prisma.announcement.createMany({
    data: [
      { title: "Welcome to the Intranet", body: "This is your new internal hub. Use Admin to add more content.", pinned: true },
      { title: "Policy Update", body: "Please review the new travel policy in the Documents section." }
    ]
  });

  await prisma.quickLink.createMany({
    data: [
      { label: "Outlook Webmail", url: "https://outlook.office.com" },
      { label: "SharePoint", url: "https://www.office.com/launch/sharepoint" },
      { label: "Teams", url: "https://teams.microsoft.com" }
    ]
  });

  await prisma.staff.createMany({
    data: [
      { name: "Richard Marsden", title: "Director", email: "richard@example.com", department: "Advisory", location: "Sydney" },
      { name: "Rick Body", title: "Advice Associate", email: "rick@example.com", department: "Advisory", location: "Sydney" },
      { name: "Glen Turner", title: "Paraplanner", email: "glen@example.com", department: "Advisory", location: "Sydney" }
    ]
  });

  console.log("Seeded ✅");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
