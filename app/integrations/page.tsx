import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import ConnectionGuide from "./connection-guide";
import "./integrations.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MCP & Plugin — AFF GO",
  description: "Hubungkan AFF GO ke asisten AI untuk memahami fitur dan merawat prompt studio.",
  robots: { index: false, follow: false },
};

export default async function IntegrationsPage() {
  await requireChatGPTUser("/integrations");
  return <ConnectionGuide />;
}
