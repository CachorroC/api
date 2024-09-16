-- DropForeignKey
ALTER TABLE "Carpeta" DROP CONSTRAINT "Carpeta_juzgadoId_juzgadoTipo_ciudad_fkey";

-- AlterTable
ALTER TABLE "Carpeta" ADD COLUMN     "juzgadoCiudad" TEXT;

-- AddForeignKey
ALTER TABLE "Carpeta" ADD CONSTRAINT "Carpeta_juzgadoId_juzgadoTipo_juzgadoCiudad_fkey" FOREIGN KEY ("juzgadoId", "juzgadoTipo", "juzgadoCiudad") REFERENCES "Juzgado"("id", "tipo", "ciudad") ON DELETE SET NULL ON UPDATE CASCADE;
