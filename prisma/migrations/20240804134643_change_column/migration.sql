/*
  Warnings:

  - A unique constraint covering the columns `[pair]` on the table `ChartMaster` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChartMaster_pair_key" ON "ChartMaster"("pair");
