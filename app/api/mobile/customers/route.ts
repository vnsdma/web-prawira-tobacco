import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { webcrypto } from "node:crypto"; // Import webcrypto untuk randomUUID

// Menggunakan polyfill untuk crypto.randomUUID agar kompatibel dengan Next.js environment
const randomUUID = typeof crypto.randomUUID === 'function' ? crypto.randomUUID.bind(crypto) : webcrypto.randomUUID.bind(webcrypto);


// Create a single Supabase client for interacting with your database
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone } = await request.json()

    if (!email) {//
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if customer already exists
    const { data: existingCustomer, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .single()

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows found"
      console.error("Error finding customer:", findError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingCustomer) {
      return NextResponse.json(existingCustomer)
    }

    // --- Perubahan Kunci: Menghasilkan UUID acak untuk user_uid ---
    const uniqueUserUid = randomUUID();
    // ------------------------------------------------------------------
    
    // Create new customer
    const { data: customer, error: insertError } = await supabase
      .from("customers")
      .insert({
        name: name || "Guest",
        email,
        phone: phone || "",
        user_uid: uniqueUserUid, // Menggunakan UUID yang acak
        status: "active",
      })
   .select()
   .single()

  if (insertError) {
   console.error("Error creating customer:", insertError)
   return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
 }

 return NextResponse.json(customer)
 } catch (error) {
 console.error("Error processing customer request:", error)
 return NextResponse.json({ error: "Invalid request" }, { status: 400 })
 }
}