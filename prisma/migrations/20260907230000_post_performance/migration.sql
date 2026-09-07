-- Per-post performance, recorded by hand after publishing. The same columns are
-- what an automated pull from the platform APIs would fill.
ALTER TABLE "Post" ADD COLUMN "reach" INTEGER;
ALTER TABLE "Post" ADD COLUMN "engagement" INTEGER;
ALTER TABLE "Post" ADD COLUMN "clicks" INTEGER;
