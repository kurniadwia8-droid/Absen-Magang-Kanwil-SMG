
"use client";

import { useEffect, useState, type FormEvent } from "react";

type ApiAttendance = {
  id: number;
  nama: string;
  jenis_magang: string;
  departemen: string;
  tanggal: string;
  masuk: string | null;
  pulang: string | null;
};

type Attendance = {
  id: number;
  name: string;
  type: string;
  division: string;
  date: string;
  timeIn: string;
  timeOut: string;
};

type Participant = {
  name: string;
  type: string;
  division: string;
  pin: string;
};

const internshipTypes = [
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

function fromApi(row: ApiAttendance): Attendance {
  return {
    id: Number(row.id),
    name: row.nama,
    type: row.jenis_magang,
    division: row.departemen,
    date: String(row.tanggal).slice(0, 10),
    timeIn: row.masuk || "",
    timeOut: row.pulang || "",
  };
}

function getWIBDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getWIBTime() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getTodayLabel() {
  return new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Home() {
  const [clock, setClock] = useState("--:--:--");
  const [name, setName] = useState("");
  const [type, setType] = useState(internshipTypes[0]);
  const [division, setDivision] = useState(divisions[0]);
  const [pin, setPin] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [currentRecord, setCurrentRecord] = useState<Attendance | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const update = () => setClock(getWIBTime());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function verifyParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const cleanName = name.trim();
    if (!cleanName || !/^\d{4}$/.test(pin)) {
      setMessage("Masukkan nama dan PIN 4 digit.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/attendance/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          nama: cleanName,
          jenis_magang: type,
          departemen: division,
          pin,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Verifikasi gagal.");
      }

      const selected: Participant = {
        name: cleanName,
        type,
        division,
        pin,
      };

      const history: Attendance[] = Array.isArray(result.data)
        ? result.data.map((row: ApiAttendance) => fromApi(row))
        : [];

      setParticipant(selected);
      setRecords(history);

      setCurrentRecord(
        result.today ? fromApi(result.today as ApiAttendance) : null
      );

      setMessage("PIN benar. Kamu berhasil masuk.");
    } catch (error) {
      setParticipant(null);
      setRecords([]);
      setCurrentRecord(null);
      setMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitAttendance(action: "masuk" | "pulang") {
    if (!participant || busy) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action,
          nama: participant.name,
          jenis_magang: participant.type,
          departemen: participant.division,
          pin: participant.pin,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Absensi gagal dicatat.");
      }

      const record = fromApi(result.data as ApiAttendance);
      setCurrentRecord(record);
      setRecords((previous) => [
        record,
        ...previous.filter((item) => item.id !== record.id),
      ]);

      setMessage(
        action === "masuk"
          ? "Absensi masuk berhasil!"
          : "Absensi pulang berhasil!"
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setParticipant(null);
    setRecords([]);
    setCurrentRecord(null);
    setPin("");
    setMessage("Kamu sudah keluar. Masukkan identitas dan PIN untuk masuk.");
  }

  return (
    <main className="min-h-screen bg-emerald-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl bg-emerald-800 p-6 text-white">
          <h1 className="text-2xl font-bold">ABSENSI MAGANG</h1>
          <p className="mt-1 text-emerald-100">Kanwil Semarang</p>
          <p className="mt-5 text-sm">Waktu Indonesia Barat</p>
          <p className="text-3xl font-bold">{clock}</p>
          <p className="mt-2 text-sm">{getTodayLabel()}</p>
        </header>

        {!participant ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-bold">Masuk Peserta</h2>
            <p className="mb-5 text-sm text-slate-500">
              Isi identitas sesuai data yang didaftarkan admin.
            </p>

            <form onSubmit={verifyParticipant} className="space-y-4">
              <div>
                <label htmlFor="nama" className="mb-1 block text-sm font-medium">
                  Nama lengkap
                </label>
                <input
                  id="nama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full rounded-xl border p-3"
                  placeholder="Nama sesuai pendaftaran"
                />
              </div>

              <div>
                <label htmlFor="jenis" className="mb-1 block text-sm font-medium">
                  Jenis magang
                </label>
                <select
                  id="jenis"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  {internshipTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="divisi" className="mb-1 block text-sm font-medium">
                  Divisi / bagian
                </label>
                <select
                  id="divisi"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  {divisions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pin" className="mb-1 block text-sm font-medium">
                  PIN peserta (4 digit)
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  required
                  className="w-full rounded-xl border p-3"
                  placeholder="Masukkan PIN"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-emerald-700 p-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Memeriksa..." : "Verifikasi PIN"}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Peserta aktif</p>
                  <h2 className="text-xl font-bold">{participant.name}</h2>
                  <p className="text-sm text-slate-500">
                    {participant.type} · {participant.division}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Keluar
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => submitAttendance("masuk")}
                  disabled={busy || Boolean(currentRecord)}
                  className="rounded-xl bg-emerald-700 p-4 font-semibold text-white disabled:bg-slate-300"
                >
                  Masuk
                  <span className="mt-1 block text-sm font-normal">
                    {currentRecord?.timeIn || "Absen masuk"}
                  </span>
                </button>

                <button
                  onClick={() => submitAttendance("pulang")}
                  disabled={busy || !currentRecord || Boolean(currentRecord.timeOut)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Pulang
                  <span className="mt-1 block text-sm font-normal">
                    {currentRecord?.timeOut || "Absen pulang"}
                  </span>
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Riwayat Absensi</h2>

              {records.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Belum ada riwayat absensi.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="rounded-xl border p-4">
                      <p className="font-semibold">{record.date}</p>
                      <p className="mt-1 text-sm">
                        Masuk: {record.timeIn || "—"}
                      </p>
                      <p className="text-sm">
                        Pulang: {record.timeOut || "Belum absen"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {message && (
          <p
            aria-live="polite"
            className="rounded-xl bg-white p-4 text-sm"
          >
            {message}
          </p>
        )}

        <footer className="text-center text-xs text-slate-500">
          Absensi Magang Kanwil Semarang
        </footer>
      </div>
    </main>
  );
}
