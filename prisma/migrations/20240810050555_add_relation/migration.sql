/*
  Warnings:

  - Added the required column `chartLabelingId` to the `Bookmark` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bookmark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chartLabelingId" INTEGER NOT NULL,
    CONSTRAINT "Bookmark_chartLabelingId_fkey" FOREIGN KEY ("chartLabelingId") REFERENCES "ChartLabeling" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bookmark" ("date", "id", "time") SELECT "date", "id", "time" FROM "Bookmark";
DROP TABLE "Bookmark";
ALTER TABLE "new_Bookmark" RENAME TO "Bookmark";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
