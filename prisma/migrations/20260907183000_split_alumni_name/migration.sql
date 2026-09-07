-- Split Alumnus.name into firstName / lastName, backfilling existing rows rather
-- than dropping them. SQLite cannot drop or rename a column in place, so the
-- table is rebuilt and the data copied across.
--
-- Split rule matches src/lib/alumni-import.ts: everything before the first space
-- is the first name, everything after it is the surname, so multi-word surnames
-- ("van der Berg") survive. A single-word name leaves lastName NULL.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Alumnus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "cohortYear" INTEGER,
    "currentOrganization" TEXT,
    "currentRole" TEXT,
    "linkedin" TEXT,
    "personalEmail" TEXT,
    "workEmail" TEXT,
    "featuredStatus" TEXT NOT NULL DEFAULT 'NOT_FEATURED',
    "careerUpdates" TEXT,
    "awards" TEXT,
    "boardMemberships" TEXT,
    "storyCollected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Alumnus" (
    "id", "firstName", "lastName", "cohortYear", "currentOrganization",
    "currentRole", "linkedin", "personalEmail", "workEmail", "featuredStatus",
    "careerUpdates", "awards", "boardMemberships", "storyCollected",
    "createdAt", "updatedAt"
)
SELECT
    "id",
    CASE
        WHEN instr(trim("name"), ' ') > 0
            THEN substr(trim("name"), 1, instr(trim("name"), ' ') - 1)
        ELSE trim("name")
    END,
    CASE
        WHEN instr(trim("name"), ' ') > 0
            THEN trim(substr(trim("name"), instr(trim("name"), ' ') + 1))
        ELSE NULL
    END,
    "cohortYear", "currentOrganization", "currentRole", "linkedin",
    "personalEmail", "workEmail", "featuredStatus", "careerUpdates", "awards",
    "boardMemberships", "storyCollected", "createdAt", "updatedAt"
FROM "Alumnus";

DROP TABLE "Alumnus";
ALTER TABLE "new_Alumnus" RENAME TO "Alumnus";

PRAGMA foreign_keys=ON;
