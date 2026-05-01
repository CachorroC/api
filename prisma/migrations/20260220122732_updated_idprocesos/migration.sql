/*
  Warnings:

  - The primary key for the `Proceso` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Actuacion" DROP CONSTRAINT "Actuacion_procesoId_fkey";

-- AlterTable
ALTER TABLE "Actuacion" ALTER COLUMN "procesoId" SET DATA TYPE TEXT,
ALTER COLUMN "idProceso" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Carpeta" ALTER COLUMN "idProcesos" SET DATA TYPE TEXT[];

-- AlterTable
ALTER TABLE "Proceso" DROP CONSTRAINT "Proceso_pkey",
ALTER COLUMN "idProceso" SET DATA TYPE TEXT,
ADD CONSTRAINT "Proceso_pkey" PRIMARY KEY ("idProceso");

-- AddForeignKey
ALTER TABLE "Actuacion" ADD CONSTRAINT "Actuacion_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("idProceso") ON DELETE RESTRICT ON UPDATE CASCADE;
