import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FX_PAIRS = [
  { symbol: "USDJPY=X", displayName: "USD/JPY", assetType: "FX", market: "FX" },
  { symbol: "EURUSD=X", displayName: "EUR/USD", assetType: "FX", market: "FX" },
  { symbol: "GBPJPY=X", displayName: "GBP/JPY", assetType: "FX", market: "FX" },
  { symbol: "EURJPY=X", displayName: "EUR/JPY", assetType: "FX", market: "FX" },
  { symbol: "GBPUSD=X", displayName: "GBP/USD", assetType: "FX", market: "FX" },
];

const JP_STOCKS = [
  { symbol: "7203.T", displayName: "トヨタ自動車", assetType: "STOCK", market: "TSE" },
  { symbol: "6758.T", displayName: "ソニーグループ", assetType: "STOCK", market: "TSE" },
  { symbol: "9984.T", displayName: "ソフトバンクG", assetType: "STOCK", market: "TSE" },
  { symbol: "8306.T", displayName: "三菱UFJ FG", assetType: "STOCK", market: "TSE" },
  { symbol: "9432.T", displayName: "NTT", assetType: "STOCK", market: "TSE" },
  { symbol: "6861.T", displayName: "キーエンス", assetType: "STOCK", market: "TSE" },
  { symbol: "6098.T", displayName: "リクルートHD", assetType: "STOCK", market: "TSE" },
];

async function main() {
  for (const m of [...FX_PAIRS, ...JP_STOCKS]) {
    await prisma.chartMaster.upsert({
      where: { symbol: m.symbol },
      update: {
        displayName: m.displayName,
        assetType: m.assetType,
        market: m.market,
      },
      create: m,
    });
  }
  console.log("Seeded chart masters:", FX_PAIRS.length + JP_STOCKS.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
