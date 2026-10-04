"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserCircle } from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfileInitial = {
  userId: string;
  email: string;
  name: string;
  phone: string;
};

/** Datos cargados en el servidor: el formulario se pinta de inmediato, sin spinner. */
export default function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const userId = initial.userId;
  const email = initial.email;
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-[#5ce1e6]/15 dark:text-[#5ce1e6]">
              <UserCircle className="h-6 w-6" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/25 bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary shadow-sm dark:border-[#5ce1e6]/30 dark:bg-[#0D1D35] dark:text-[#5ce1e6]">
                Próximamente
              </span>
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
