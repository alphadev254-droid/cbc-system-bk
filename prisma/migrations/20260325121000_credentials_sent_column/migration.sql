-- AlterTable
ALTER TABLE `schools`
ADD COLUMN `credentialsSentAt` DATETIME(3) NULL,
ADD COLUMN `credentialsResendCount` INTEGER NOT NULL DEFAULT 0;

