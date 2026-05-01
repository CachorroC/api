-- CreateTable
CREATE TABLE "RelevantDates" (
    "date" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "notaId" TEXT,

    CONSTRAINT "RelevantDates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RelevantDates" ADD CONSTRAINT "RelevantDates_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "Nota"("id") ON DELETE SET NULL ON UPDATE CASCADE;
