-- AlterTable
ALTER TABLE "training_availability" ADD COLUMN     "training_type_id" INTEGER,
ALTER COLUMN "training_type" SET DATA TYPE VARCHAR(50);

-- CreateTable
CREATE TABLE "training_prices" (
    "id" SERIAL NOT NULL,
    "training_type_id" INTEGER NOT NULL,
    "child_count" INTEGER NOT NULL,
    "price" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "training_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "accompanying_person_price" DECIMAL(6,2) DEFAULT 3.00,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "color_hex" VARCHAR(7) DEFAULT '#3b82f6',

    CONSTRAINT "training_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_prices_training_type_id_child_count_key" ON "training_prices"("training_type_id", "child_count");

-- CreateIndex
CREATE UNIQUE INDEX "training_types_name_key" ON "training_types"("name");

-- AddForeignKey
ALTER TABLE "training_availability" ADD CONSTRAINT "training_availability_training_type_id_fkey" FOREIGN KEY ("training_type_id") REFERENCES "training_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_prices" ADD CONSTRAINT "training_prices_training_type_id_fkey" FOREIGN KEY ("training_type_id") REFERENCES "training_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

