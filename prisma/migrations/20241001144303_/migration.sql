/*
  Warnings:

  - You are about to drop the column `carpetaId` on the `Proceso` table. All the data in the column will be lost.
  - You are about to drop the column `carpetaId` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proceso" DROP COLUMN "carpetaId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "carpetaId";
