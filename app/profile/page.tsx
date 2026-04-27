"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserCircle } from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createSupabaseClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      setName((user.user_metadata?.full_name as string | undefined) || "");
      setPhone((user.user_metadata?.phone as string | undefined) || "");

      const { data } = await supabase
        .from("usuarios")
        .select("nombre,telefono,gmail")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setName(data.nombre || "");
        setPhone(data.telefono || "");
        setEmail(data.gmail || user.email || "");
      }

      setIsLoading(false);
    }

    void loadProfile();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setMessage("Ingresa un nombre valido.");
      return;
    }

    if (trimmedPhone && !/^\+?\d{7,15}$/.test(trimmedPhone.replace(/\s/g, ""))) {
      setMessage("Ingresa un telefono valido. Puedes usar formato +573001234567.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const supabase = createSupabaseClient();

      const { error: userError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          phone: trimmedPhone || null,
        },
      });

      if (userError) {
        setMessage(userError.message || "No se pudo actualizar el usuario.");
        return;
      }

      const { error: profileError } = await supabase.from("usuarios").upsert(
        {
          id: userId,
          nombre: trimmedName,
          telefono: trimmedPhone || null,
          gmail: email,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        setMessage(profileError.message || "No se pudieron guardar tus datos.");
        return;
      }

      setMessage("Tus datos fueron actualizados.");
      router.refresh();
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      setMessage(error?.message || "No se pudieron guardar tus datos.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-xl">
        <Button asChild variant="ghost" className="mb-6 px-0">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </Link>
        </Button>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm dark:border-white/15 dark:bg-[#0D1D35] sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-[#5ce1e6]/15 dark:text-[#5ce1e6]">
              <UserCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Mi usuario</h1>
              <p className="text-sm text-muted-foreground dark:text-white/60">
                {email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+573001234567"
                autoComplete="tel"
              />
            </div>

            {message && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground dark:bg-white/5 dark:text-white/70">
                {message}
              </p>
            )}

            <Button type="submit" disabled={isSaving} className="w-full">
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
