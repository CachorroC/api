/*
  Warnings:

  - Made the column `procesoId` on table `Actuacion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Actuacion" DROP CONSTRAINT "Actuacion_procesoId_fkey";

-- AlterTable
ALTER TABLE "Actuacion" ALTER COLUMN "procesoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Actuacion" ADD CONSTRAINT "Actuacion_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("idProceso") ON DELETE RESTRICT ON UPDATE CASCADE;
