-- Links a staff record to its Supabase Auth account. Nullable: an admin can add
-- someone before they have ever signed in.
ALTER TABLE "User" ADD COLUMN "authId" TEXT;

-- One staff record per auth account.
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");
