ALTER TABLE "McpClient" ADD COLUMN "userId" TEXT;
ALTER TABLE "McpClient" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE TABLE "McpOAuthClient" (
  "clientId" TEXT NOT NULL,
  "redirectUris" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "McpOAuthClient_pkey" PRIMARY KEY ("clientId")
);

CREATE TABLE "McpAuthorizationCode" (
  "id" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "codeChallenge" TEXT NOT NULL,
  "codeChallengeMethod" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpAuthorizationCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "McpRefreshToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpRefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "McpAuthorizationCode_codeHash_key" ON "McpAuthorizationCode"("codeHash");
CREATE INDEX "McpAuthorizationCode_clientId_expiresAt_idx" ON "McpAuthorizationCode"("clientId", "expiresAt");
CREATE INDEX "McpAuthorizationCode_userId_expiresAt_idx" ON "McpAuthorizationCode"("userId", "expiresAt");
CREATE UNIQUE INDEX "McpRefreshToken_tokenHash_key" ON "McpRefreshToken"("tokenHash");
CREATE INDEX "McpRefreshToken_userId_expiresAt_idx" ON "McpRefreshToken"("userId", "expiresAt");
CREATE INDEX "McpClient_userId_revokedAt_idx" ON "McpClient"("userId", "revokedAt");

ALTER TABLE "McpClient" ADD CONSTRAINT "McpClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpAuthorizationCode" ADD CONSTRAINT "McpAuthorizationCode_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "McpOAuthClient"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpAuthorizationCode" ADD CONSTRAINT "McpAuthorizationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpRefreshToken" ADD CONSTRAINT "McpRefreshToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "McpOAuthClient"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpRefreshToken" ADD CONSTRAINT "McpRefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
