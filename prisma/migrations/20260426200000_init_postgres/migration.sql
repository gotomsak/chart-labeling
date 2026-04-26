-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "chart_masters" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candles" (
    "id" BIGSERIAL NOT NULL,
    "chartMasterId" INTEGER NOT NULL,
    "interval" TEXT NOT NULL,
    "time" BIGINT NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "label" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'yahoo',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labelings" (
    "id" SERIAL NOT NULL,
    "chartMasterId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interval" TEXT NOT NULL DEFAULT '5m',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "markers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "labelings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" SERIAL NOT NULL,
    "labelingId" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "time" BIGINT NOT NULL,
    "bookmarkIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_label_runs" (
    "id" SERIAL NOT NULL,
    "labelingId" INTEGER NOT NULL,
    "strategy" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "buyCount" INTEGER NOT NULL,
    "sellCount" INTEGER NOT NULL,
    "takeProfitCount" INTEGER NOT NULL,
    "noneCount" INTEGER NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_label_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chart_masters_symbol_key" ON "chart_masters"("symbol");

-- CreateIndex
CREATE INDEX "candles_chartMasterId_interval_time_idx" ON "candles"("chartMasterId", "interval", "time");

-- CreateIndex
CREATE UNIQUE INDEX "candles_chartMasterId_interval_time_key" ON "candles"("chartMasterId", "interval", "time");

-- CreateIndex
CREATE UNIQUE INDEX "labelings_fileName_key" ON "labelings"("fileName");

-- CreateIndex
CREATE INDEX "bookmarks_labelingId_time_idx" ON "bookmarks"("labelingId", "time");

-- AddForeignKey
ALTER TABLE "candles" ADD CONSTRAINT "candles_chartMasterId_fkey" FOREIGN KEY ("chartMasterId") REFERENCES "chart_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labelings" ADD CONSTRAINT "labelings_chartMasterId_fkey" FOREIGN KEY ("chartMasterId") REFERENCES "chart_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_labelingId_fkey" FOREIGN KEY ("labelingId") REFERENCES "labelings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_label_runs" ADD CONSTRAINT "auto_label_runs_labelingId_fkey" FOREIGN KEY ("labelingId") REFERENCES "labelings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

