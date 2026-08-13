import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        arrayOfFiles.push(path.join(__dirname, "../..", dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

describe("Architecture Constraints", () => {
  it("should not import Prisma directly in Server Actions or Route Handlers", () => {
    const actionFiles = getAllFiles("app/actions");
    const apiFiles = getAllFiles("app/api");
    
    const allFiles = [...actionFiles, ...apiFiles];
    
    const invalidFiles: string[] = [];
    
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf8");
      // Check for prisma import
      if (content.includes("@/db/prisma") || content.includes("@prisma/client")) {
        invalidFiles.push(file);
      }
    }
    
    expect(invalidFiles, "These files should not import prisma directly").toEqual([]);
  });
});
