-- DropForeignKey
ALTER TABLE "public"."Actuacion" DROP CONSTRAINT "Actuacion_procesoId_fkey";

-- AlterTable
ALTER TABLE "public"."Actuacion" ALTER COLUMN "procesoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Actuacion" ADD CONSTRAINT "Actuacion_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "public"."Proceso"("idProceso") ON DELETE SET NULL ON UPDATE CASCADE;
