
"use client";

import { useState } from "react";

type Participant = {
  id: number;
  nama: string;
  jenis_magang: string;
  departemen: string;
  created_at: string;
};

const types = [
  "Magang Mahasiswa",
  "Magang Mandiri",
  "Praktik Kerja Lapangan",
];

const divisions = [
  "Administrasi",
  "Bisnis",
  "Pemasaran",
  "Operasional",
  "Lainnya",
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState(types[0]);
  const [departemen, setDepartemen] = useState(divisions[0]);
  const [pin, setPin] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadParticipants() {
    const response = await fetch("/api/participants", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal memuat peserta.");
    }

    setParticipants(result.data);
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login gagal.");
      }

      await loadParticipants();
      setLoggedIn(true);
      setPassword("");
      setMessage("Login admin berhasil.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveParticipant(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          jenis_magang: jenis,
          departemen,
          pin,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan peserta.");
      }

      setMessage(result.message);
      setNama("");
      setPin("");
      await loadParticipants();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8f5] px-5 py-10 text-slate-800">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl bg-emerald-800 p-7 text-white">
          <p className="text-sm text-emerald-200">KANWIL SEMARANG</p>
          <h1 className="mt-2 text-3xl font-bold">Admin Absensi Magang</h1>
          <p className="mt-2 text-sm text-emerald-100">
            Kelola peserta dan tetapkan PIN absensi 4 digit.
          </p>
        </header>

        {!loggedIn ? (
          <form
            onSubmit={login}
            className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6"
          >
            <h2 className="text-xl font-bold">Login Admin</h2>
            <label className="block text-sm font-semibold">
              Password admin
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                maxLength={256}
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Memproses..." : "Login"}
            </button>
          </form>
        ) : (
          <>
            <form
              onSubmit={saveParticipant}
              className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6"
            >
              <h2 className="text-xl font-bold">Daftarkan Peserta</h2>
              <p className="text-sm text-slate-500">
                Jika identitas yang sama sudah terdaftar, PIN-nya akan
                diganti dengan PIN baru yang kamu tetapkan.
              </p>

              <label className="block text-sm font-semibold">
                Nama lengkap
                <input
                  value={nama}
                  onChange={(event) => setNama(event.target.value)}
                  required
                  maxLength={120}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </label>

              <label className="block text-sm font-semibold">
                Jenis magang
                <select
                  value={jenis}
                  onChange={(event) => setJenis(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  {types.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold">
                Divisi / bagian
                <select
                  value={departemen}
                  onChange={(event) => setDepartemen(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  {divisions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold">
                PIN peserta (4 digit)
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  minLength={4}
                  maxLength={4}
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="Contoh: 0123"
                  autoComplete="new-password"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </label>

              <button
                disabled={busy}
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Menyimpan..." : "Simpan Peserta"}
              </button>
            </form>

            <section className="rounded-3xl border border-emerald-100 bg-white p-6">
              <h2 className="text-xl font-bold">
                Daftar Peserta ({participants.length})
              </h2>
              <div className="mt-4 space-y-3">
                {participants.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Belum ada peserta terdaftar.
                  </p>
                ) : (
                  participants.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <p className="font-semibold">{item.nama}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.jenis_magang} · {item.departemen}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {message && (
          <p
            aria-live="polite"
            className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}

        <p className="text-sm text-slate-500">
          Halaman admin · Jangan bagikan password admin atau PIN peserta.
        </p>
      </div>
    </main>
  );
}
