-- AlterTable
ALTER TABLE "ChatParticipant" ADD COLUMN     "clearedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "attachments" TEXT;
