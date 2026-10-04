import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/login");

  const metadata = (claims.user_metadata as Record<string, any> | undefined) ?? {};
  const authEmail = (claims.email as string | undefined) || "";

  const { data } = await supabase
    .from("usuarios")
    .select("nombre,telefono,gmail")
    .eq("id", claims.sub)
    .maybeSingle();

  return (
    <ProfileForm
      initial={{
        userId: claims.sub,
        email: data ? data.gmail || authEmail : authEmail,
        name: data ? data.nombre || "" : (metadata.full_name as string | undefined) || "",
        phone: data ? data.telefono || "" : (metadata.phone as string | undefined) || "",
      }}
    />
  );
}
