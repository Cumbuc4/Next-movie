import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

function generateLoginCode(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  const chars: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % charset.length;
    chars.push(charset[index]);
  }
  return chars.join("");
}

function hashLoginCode(code: string): string {
  return createHash("sha256").update(code.toUpperCase(), "utf8").digest("hex");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting demo users...");

  await prisma.user.deleteMany({
    where: { username: { in: ["tester01", "cinebuddy"] } },
  });

  console.log("Creating demo users...");

  const testerCode = generateLoginCode();
  const cinemaCode = generateLoginCode();

  const tester = await prisma.user.create({
    data: {
      username: "tester01",
      email: "tester@example.com",
      name: "Tester One",
      loginCodeHash: hashLoginCode(testerCode),
    },
  });

  const cinema = await prisma.user.create({
    data: {
      username: "cinebuddy",
      email: "cinema@example.com",
      name: "Cinema Buddy",
      loginCodeHash: hashLoginCode(cinemaCode),
    },
  });

  console.log("Linking users as friends...");

  const [aId, bId] = tester.id < cinema.id ? [tester.id, cinema.id] : [cinema.id, tester.id];

  await prisma.friendship.create({
    data: { aId, bId },
  });

  console.log("Adding pending friend requests...");

  await prisma.friendRequest.createMany({
    data: [
      { requesterId: tester.id, recipientId: cinema.id, status: "PENDING" },
      { requesterId: cinema.id, recipientId: tester.id, status: "PENDING" },
    ],
  });

  console.log("Seeding list items...");

  const demoItems = [
    {
      title: "Interestelar",
      overview: "Missao interestelar em busca de um novo lar para a humanidade.",
      type: "MOVIE" as const,
      tmdbId: 157336,
      posterPath: "/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg",
      backdropPath: "/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg",
    },
    {
      title: "O Senhor dos Aneis: A Sociedade do Anel",
      overview: "Frodo inicia a jornada para destruir o Um Anel.",
      type: "MOVIE" as const,
      tmdbId: 120,
      posterPath: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
      backdropPath: "/zaSf5OG7V8X8gqFvly88zDdRm46.jpg",
    },
    {
      title: "A Origem",
      overview: "Dom Cobb e sua equipe invadem sonhos para implantar ideias.",
      type: "MOVIE" as const,
      tmdbId: 27205,
      posterPath: "/tXQvtRWFKsSGHqh8wamOaGIqxpq.jpg",
      backdropPath: "/s2bT29y0ngXxxu2IA8AOzzXTRhd.jpg",
    },
    {
      title: "Dark",
      overview: "Serie de misterio com viagem no tempo e drama familiar.",
      type: "TV" as const,
      tmdbId: 70523,
      posterPath: "/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
      backdropPath: "/3lBDg3i6nn5R2NKFCJ6oKyUo2j5.jpg",
    },
    {
      title: "The Office",
      overview: "Mockumentary sobre o escritorio da Dunder Mifflin.",
      type: "TV" as const,
      tmdbId: 2316,
      posterPath: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
      backdropPath: "/9Gz8KxCN6lnm2eO0nJ0fLSe9uDE.jpg",
    },
  ];

  const listItems = await prisma.$transaction(
    demoItems.map((item) =>
      prisma.listItem.create({
        data: {
          ownerId: tester.id,
          type: item.type,
          tmdbId: item.tmdbId,
          title: item.title,
          overview: item.overview,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          releaseDate: new Date(),
        },
      }),
    ),
  );

  console.log("Creating pick history and shared history...");

  if (listItems.length > 0) {
    await prisma.pickHistory.createMany({
      data: listItems.slice(0, 2).map((item, idx) => ({
        ownerId: tester.id,
        itemId: item.id,
        pickedAt: new Date(Date.now() - (idx + 1) * 86400000),
      })),
    });

    await prisma.sharedPickHistory.create({
      data: {
        pickerId: tester.id,
        partnerId: cinema.id,
        itemId: listItems[2].id,
        pickedAt: new Date(Date.now() - 3 * 86400000),
      },
    });
  }

  console.log("Seed completed.");
  console.log(`Tester login code: ${testerCode}`);
  console.log(`Buddy login code: ${cinemaCode}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
