-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_schoolId_fkey`;

-- DropIndex
DROP INDEX `users_schoolId_fkey` ON `users`;

-- AlterTable
ALTER TABLE `users` MODIFY `schoolId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
