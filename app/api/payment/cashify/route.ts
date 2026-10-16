import { type NextRequest, NextResponse } from "next/server"
import { POST as qrisPost } from "@/app/api/payment/qris/route"

/**
 * Backward compatibility alias: forwards /api/payment/cashify requests
 * to our custom Dynamic QRIS Payment Gateway API.
 */
export async function POST(request: NextRequest) {
  return qrisPost(request)
}