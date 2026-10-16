import { type NextRequest, NextResponse } from "next/server"
import { POST as qrisStatusPost } from "@/app/api/payment/qris/status/route"

/**
 * Backward compatibility alias: forwards /api/payment/cashify/status requests
 * to our custom Dynamic QRIS Payment Gateway API status handler.
 */
export async function POST(request: NextRequest) {
  return qrisStatusPost(request)
}