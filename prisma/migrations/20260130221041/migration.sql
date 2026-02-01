/*
  Warnings:

  - The `category` column on the `Carpeta` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Carpeta" DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'SinEspecificar';
