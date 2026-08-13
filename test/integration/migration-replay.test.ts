import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readMigrations() {
  const migrationsPath = path.resolve("prisma/migrations");
  const migrationNames = (await readdir(migrationsPath, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    migrationNames.map(async (name) => ({
      name,
      sql: await readFile(path.join(migrationsPath, name, "migration.sql"), "utf8"),
    })),
  );
}

describe("migration replay ordering", () => {
  it("introduces foreign-key, trigger table, and trigger function dependencies before use without destructive SQL", async () => {
    const migrations = await readMigrations();
    const tables = new Set<string>();
    const functions = new Set<string>();
    const destructiveSql = /\b(?:DROP\s+TABLE|DROP\s+SCHEMA|DROP\s+TYPE|TRUNCATE(?:\s+TABLE)?|DELETE\s+FROM)\b/i;

    for (const migration of migrations) {
      expect(migration.sql).not.toMatch(destructiveSql);

      if (migration.name === "20260810181000_complete_source_metadata_and_retire_legacy_lesson") {
        expect(migration.sql).toMatch(/INSERT INTO "LessonSource"[\s\S]*?ON CONFLICT \("lessonId", "sourceId"\) DO NOTHING;/);
        expect(migration.sql).toContain('ALTER TABLE "Source" DROP CONSTRAINT "Source_lessonId_fkey";');
        expect(migration.sql).toContain('DROP INDEX "Source_lessonId_idx";');
        expect(migration.sql).toContain('ALTER TABLE "Source" DROP COLUMN "lessonId";');
      } else {
        expect(migration.sql).not.toMatch(/ALTER\s+TABLE\s+"[^"]+"\s+DROP\s+(?:COLUMN|CONSTRAINT)/i);
      }

      const statements = [
        ...[...migration.sql.matchAll(/CREATE TABLE\s+"([^"]+)"/gi)].map((match) => ({ index: match.index!, kind: "table", match })),
        ...[...migration.sql.matchAll(/ALTER TABLE\s+"([^"]+)"[\s\S]*?;/gi)].map((match) => ({ index: match.index!, kind: "alter", match })),
        ...[...migration.sql.matchAll(/CREATE OR REPLACE FUNCTION\s+"([^"]+)"\s*\([\s\S]*?\$\$;/gi)].map((match) => ({
          index: match.index!,
          kind: "function",
          match,
        })),
        ...[...migration.sql.matchAll(/CREATE TRIGGER\s+"[^"]+"[\s\S]*?ON\s+"([^"]+)"[\s\S]*?EXECUTE FUNCTION\s+"([^"]+)"\s*\(/gi)].map((match) => ({
          index: match.index!,
          kind: "trigger",
          match,
        })),
      ].sort((left, right) => left.index - right.index);

      for (const statement of statements) {
        if (statement.kind === "table") {
          tables.add(statement.match[1]!);
          continue;
        }

        if (statement.kind === "alter") {
          expect(tables, `${migration.name}: altered table ${statement.match[1]} must exist first`).toContain(statement.match[1]!);

          for (const reference of statement.match[0].matchAll(/REFERENCES\s+"([^"]+)"/gi)) {
            expect(tables, `${migration.name}: FK target table ${reference[1]} must exist first`).toContain(reference[1]!);
          }

          continue;
        }

        if (statement.kind === "function") {
          for (const reference of statement.match[0].matchAll(/(?:FROM|UPDATE|INTO)\s+"([^"]+)"/gi)) {
            expect(tables, `${migration.name}: function table ${reference[1]} must exist first`).toContain(reference[1]!);
          }
          functions.add(statement.match[1]!);
          continue;
        }

        expect(tables, `${migration.name}: trigger table ${statement.match[1]} must exist first`).toContain(statement.match[1]!);
        expect(functions, `${migration.name}: trigger function ${statement.match[2]} must exist first`).toContain(statement.match[2]!);
      }
    }
  });
});
