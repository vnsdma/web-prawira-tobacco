import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)


export async function GET() {
  try {
    const now = new Date().toISOString();

    // Ambil promo yang:
    // 1. Status aktif
    // 2. Tanggal valid (sekarang berada di antara valid_from dan valid_until)
    // 3. Punya image_url (tidak null)
    const { data, error } = await supabase
      .from('promos')
      .select('id, name, code, description, image_url, discount_type, discount_value')
      .eq('is_active', true)
      .not('image_url', 'is', null) // Hanya ambil yang ada gambarnya
      .lte('valid_from', now)       // valid_from <= sekarang
      .gte('valid_until', now)      // valid_until >= sekarang
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}