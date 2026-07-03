"use client";

import { useMemo, useState } from "react";
import type { Appointment, Budget, ClinicSettings, Patient, Payment, Treatment } from "@/types/database";
import { StatusPill } from "@/components/ui/status-pill";
import { SearchInput } from "@/components/ui/search-input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatMoney } from "@/lib/currency";
import { getRiskVariant, patientStatusLabel, riskLabel } from "@/modules/patients/status";
import { PatientDetailDrawer } from "./patient-detail-drawer";

export function PatientTable({ patients, settings, appointments = [], treatments = [], budgets = [], payments = [] }: { patients: Patient[]; settings: ClinicSettings; appointments?: Appointment[]; treatments?: Treatment[]; budgets?: Budget[]; payments?: Payment[] }) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => [patient.full_name, patient.phone, patient.source, patient.active_treatment].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [patients, search]);

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  return (
    <>
      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Listado de pacientes</h2>
            <p className="text-sm text-muted">Búsqueda rápida y acceso a ficha del paciente.</p>
          </div>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar paciente"
            className="sm:max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr><th className="px-5 py-4">Paciente</th><th>Teléfono</th><th>Origen</th><th>Tratamiento</th><th>Valor</th><th>Estado</th><th>Activo</th><th>Riesgo</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.map((patient) => (
                <tr key={patient.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4"><button className="font-semibold text-ink hover:text-primary" onClick={() => setSelectedPatient(patient)}>{patient.full_name}</button><p className="text-xs text-muted">{patient.email || "Sin email"}</p></td>
                  <td className="text-muted">{patient.phone}</td>
                  <td className="text-muted">{patient.source || "manual"}</td>
                  <td className="text-muted">{patient.active_treatment || "-"}</td>
                  <td className="font-semibold text-ink">{formatMoney(patient.estimated_value || 0, settings)}</td>
                  <td><StatusPill label={patientStatusLabel[patient.status]} variant="primary" /></td>
                  <td><StatusPill label={patient.is_active === false ? "No" : "Sí"} variant={patient.is_active === false ? "neutral" : "success"} /></td>
                  <td><StatusPill label={riskLabel[patient.risk_level]} variant={getRiskVariant(patient.risk_level)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={filteredPatients.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="m-4"
        />
      </section>
      <PatientDetailDrawer patient={selectedPatient} settings={settings} appointments={appointments} treatments={treatments} budgets={budgets} payments={payments} onClose={() => setSelectedPatient(null)} />
    </>
  );
}
