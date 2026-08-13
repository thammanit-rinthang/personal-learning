import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { authenticateMcpRequest, generateToken } from "@/mcp/auth";
import { prisma } from "@/db/prisma";

describe("MCP Authentication", () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.mcpClient.deleteMany();
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.mcpClient.deleteMany();
  });

  it("should fail when bearer token is missing", async () => {
    const request = new Request("http://localhost/mcp");
    await expect(authenticateMcpRequest(request)).rejects.toThrow("Missing or invalid authorization header");
  });

  it("should fail when token is invalid", async () => {
    const request = new Request("http://localhost/mcp", {
      headers: { Authorization: "Bearer invalid_token" }
    });
    await expect(authenticateMcpRequest(request)).rejects.toThrow("Invalid token");
  });

  it("should fail when token is revoked", async () => {
    const { raw, hash } = generateToken();
    await prisma.mcpClient.create({
      data: {
        name: "Test Client",
        tokenHash: hash,
        permissions: ["course:read"],
        revokedAt: new Date(Date.now() - 1000)
      }
    });

    const request = new Request("http://localhost/mcp", {
      headers: { Authorization: `Bearer ${raw}` }
    });
    await expect(authenticateMcpRequest(request)).rejects.toThrow("Token revoked");
  });

  it("should fail when client has no missing scopes (missing scope mapping)", async () => {
    const { raw, hash } = generateToken();
    await prisma.mcpClient.create({
      data: {
        name: "Test Client",
        tokenHash: hash,
        permissions: ["invalid:scope"],
      }
    });

    const request = new Request("http://localhost/mcp", {
      headers: { Authorization: `Bearer ${raw}` }
    });
    await expect(authenticateMcpRequest(request)).rejects.toThrow("Missing scope");
  });

  it("should successfully authenticate and return an Actor, and update lastUsedAt", async () => {
    const { raw, hash } = generateToken();
    const client = await prisma.mcpClient.create({
      data: {
        name: "Test Client",
        tokenHash: hash,
        permissions: ["course:read", "lesson:write"],
      }
    });

    const request = new Request("http://localhost/mcp", {
      headers: { Authorization: `Bearer ${raw}` }
    });
    
    const actor = await authenticateMcpRequest(request);
    
    expect(actor.id).toBe(client.id);
    expect(actor.type).toBe("MCP");
    expect(actor.permissions).toEqual(["course:read", "lesson:write"]);

    const updatedClient = await prisma.mcpClient.findUnique({
      where: { id: client.id }
    });
    expect(updatedClient?.lastUsedAt).not.toBeNull();
  });

  it("should record audit event for successful mutation", async () => {
    const { raw, hash } = generateToken();
    const client = await prisma.mcpClient.create({
      data: {
        name: "Test Client",
        tokenHash: hash,
        permissions: ["course:read", "lesson:write"],
      }
    });

    const request = new Request("http://localhost/mcp", {
      headers: { Authorization: `Bearer ${raw}` }
    });
    
    const actor = await authenticateMcpRequest(request);
    
    await prisma.auditLog.create({
      data: {
        actorType: "MCP",
        mcpClientId: actor.id,
        action: "TEST_MUTATION",
        entityType: "Test"
      }
    });

    const logs = await prisma.auditLog.findMany();
    expect(logs.length).toBe(1);
    expect(logs[0].mcpClientId).toBe(client.id);
    expect(logs[0].action).toBe("TEST_MUTATION");
  });
});
