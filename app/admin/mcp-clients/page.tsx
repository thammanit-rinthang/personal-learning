import { getCurrentActor } from "@/server/auth";
import { listMcpClients } from "@/services/admin.service";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/admin-ui";
import { McpClientManager } from "@/components/admin/mcp-client-manager";

export default async function McpClientsPage() { const actor = await getCurrentActor(); if (!actor) return null; const result = await listMcpClients(actor, { pageSize: 50 }); return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><AdminPageHeader title="MCP clients" description="กำหนดสิทธิ์แบบจำกัดขอบเขตให้ AI client โดยไม่มีสิทธิ์เผยแพร่เนื้อหา" /><div className="mt-8"><McpClientManager clients={result.items} />{!result.items.length ? <div className="mt-8"><AdminEmpty title="ยังไม่มี MCP client" description="สร้าง client พร้อมสิทธิ์ที่จำเป็นต่อการทำงานเท่านั้น" /></div> : null}</div></div>; }
