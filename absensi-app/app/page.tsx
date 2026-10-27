
"use client";

import { useEffect, useState } from "react";

type Attendance = {
  id: number;
  name: string;
  type: string;
  division: string;
  date: string;
  timeIn: string;
  timeOut: string;
};

const internshipTypes = ["Magang Mahasiswa", "Magang Mandiri", "Praktik Kerja Lapangan"];
const divisions = [
  "Administrasi",
  "Bisnis",
  "Pemasaran",
  "Operasional",
  "Lainnya",
];

function getWIBDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
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

export default function Home() {
  const [clock, setClock] = useState("--:--:--");
  const [name, setName] = useState("");
  const [type, setType] = useState(internshipTypes[0]);
  const [division, setDivision] = useState(divisions[0]);
  const [participant, setParticipant] = useState<{
    name: string;
    type: string;
    division: string;
  } | null>(null);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateClock = () => setClock(getWIBTime());
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function registerParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setMessage("Silakan isi nama lengkap terlebih dahulu.");
      return;
    }

    setParticipant({ name: name.trim(), type, division });
    setMessage(`Selamat datang, ${name.trim()}!`);
  }

  function clockIn() {
    if (!participant) return;

    const date = getWIBDate();
    const existing = records.find(
      (record) => record.name === participant.name && record.date === date
    );

    if (existing) {
      setMessage("Kamu sudah melakukan absen masuk hari ini.");
      return;
    }

    setRecords((previous) => [
      {
        id: Date.now(),
        ...participant,
        date,
        timeIn: getWIBTime(),
        timeOut: "",
      },
      ...previous,
    ]);
    setMessage("Absen masuk berhasil dicatat!");
  }

  function clockOut() {
    if (!participant) return;

    const date = getWIBDate();
    const existing = records.find(
      (record) =>
        record.name === participant.name &&
        record.date === date &&
        record.timeIn &&
        !record.timeOut
    );

    if (!existing) {
      setMessage("Belum ada absen masuk yang bisa diselesaikan hari ini.");
      return;
    }

    setRecords((previous) =>
      previous.map((record) =>
        record.id === existing.id
          ? { ...record, timeOut: getWIBTime() }
          : record
      )
    );
    setMessage("Absen pulang berhasil dicatat!");
  }

  const currentRecord = records.find(
    (record) =>
      record.name === participant?.name && record.date === getWIBDate()
  );

  return (
    <main className="min-h-screen bg-[#f4f8f5] text-slate-800">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-xl font-bold text-white">
            A
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-emerald-900">
              ABSENSI MAGANG
            </p>
            <p className="text-sm text-slate-500">Kanwil Semarang</p>
          </div>
          <div className="ml-auto hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 sm:block">
            Sistem Kehadiran Peserta
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl bg-emerald-800 p-7 text-white shadow-lg sm:p-9">
            <p className="text-sm font-medium text-emerald-200">
              PORTAL KEHADIRAN
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Selamat Datang,
              <br />
              Peserta Magang!
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-emerald-100">
              Catat kehadiran harianmu dengan mudah melalui portal absensi
              magang Kanwil Semarang.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="text-sm text-emerald-100">Waktu Indonesia Barat</p>
              <p className="mt-1 text-4xl font-bold tracking-wider tabular-nums sm:text-5xl">
                {clock}
              </p>
              <p className="mt-3 text-sm capitalize text-emerald-100">
                {today}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Langkah 01
              </p>
              <h2 className="mt-2 text-xl font-bold">Identitas Peserta</h2>
              <p className="mt-1 text-sm text-slate-500">
                Isi data diri sebelum melakukan absensi.
              </p>
            </div>

            <form onSubmit={registerParticipant} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                  Nama lengkap
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="mb-2 block text-sm font-semibold">
                  Jenis magang
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-600"
                >
                  {internshipTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="division"
                  className="mb-2 block text-sm font-semibold"
                >
                  Divisi / bagian
                </label>
                <select
                  id="division"
                  value={division}
                  onChange={(event) => setDivision(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-600"
                >
                  {divisions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-800"
              >
                Simpan Identitas
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Langkah 02
            </p>
            <h2 className="mt-2 text-xl font-bold">Absensi Harian</h2>
            <p className="mt-1 text-sm text-slate-500">
              Catat waktu masuk dan pulang sesuai waktu yang ditampilkan.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Peserta aktif
              </p>
              <p className="mt-1 font-bold">
                {participant?.name || "Belum ada peserta terdaftar"}
              </p>
              {participant && (
                <p className="mt-1 text-sm text-slate-500">
                  {participant.type} · {participant.division}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={clockIn}
                disabled={!participant || Boolean(currentRecord)}
                className="rounded-xl bg-emerald-700 px-4 py-4 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <span className="block text-lg">Masuk</span>
                <span className="mt-1 block text-xs font-normal">
                  {currentRecord ? currentRecord.timeIn : "Absen masuk"}
                </span>
              </button>
              <button
                onClick={clockOut}
                disabled={!participant || !currentRecord || Boolean(currentRecord.timeOut)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <span className="block text-lg">Pulang</span>
                <span className="mt-1 block text-xs font-normal">
                  {currentRecord?.timeOut || "Absen pulang"}
                </span>
              </button>
            </div>

            {message && (
              <p
                aria-live="polite"
                className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {message}
              </p>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Catatan: ini masih versi uji coba. Data belum tersimpan ke server.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Riwayat Absensi</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Catatan absensi pada sesi ini.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                {records.length} data
              </span>
            </div>

            {records.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  ✓
                </div>
                <p className="mt-3 font-semibold">Belum ada riwayat</p>
                <p className="mt-1 text-sm text-slate-500">
                  Data akan muncul setelah kamu melakukan absen masuk.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{record.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.date} · {record.division}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        Tercatat
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Masuk</p>
                        <p className="mt-1 font-bold">{record.timeIn}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Pulang</p>
                        <p className="mt-1 font-bold">
                          {record.timeOut || "Belum absen"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="border-t border-emerald-100 bg-white px-5 py-6 text-center text-xs text-slate-500">
        Absensi Magang Kanwil Semarang · Portal Kehadiran Peserta
      </footer>
    </main>
  );
}
