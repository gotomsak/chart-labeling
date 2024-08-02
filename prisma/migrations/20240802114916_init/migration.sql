/*
  Warnings:

  - You are about to drop the column `markDate` on the `Bookmark` table. All the data in the column will be lost.
  - Added the required column `time` to the `Bookmark` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bookmark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" TEXT NOT NULL
);
INSERT INTO "new_Bookmark" ("id") SELECT "id" FROM "Bookmark";
DROP TABLE "Bookmark";
ALTER TABLE "new_Bookmark" RENAME TO "Bookmark";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
