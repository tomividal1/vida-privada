"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value
    ? new Date(value + "T00:00:00")
    : undefined;

  const textoFecha = selectedDate
    ? selectedDate.toLocaleDateString("es-AR")
    : placeholder;

  function seleccionarFecha(date: Date | undefined) {
    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    onChange(`${year}-${month}-${day}`);
    setOpen(false);
  }

  return (
    <div className="relative">

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3 text-left outline-none transition hover:border-white/20"
      >
        <span
          className={
            selectedDate
              ? "text-white"
              : "text-gray-500"
          }
        >
          {textoFecha}
        </span>

        <span className="text-lg">
          📅
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#111] p-4 shadow-2xl">

          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={seleccionarFecha}
          />

          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            Limpiar fecha
          </button>

        </div>
      )}

    </div>
  );
}