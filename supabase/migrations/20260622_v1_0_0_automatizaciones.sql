-- Dental Pilot v1.0.0
-- Motor de automatizaciones. No envía mensajes reales todavía.

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('appointment_reminder', 'budget_followup', 'patient_recovery', 'birthday')),
  title text not null,
  description text not null,
  is_enabled boolean not null default false,
  trigger_label text not null,
  timing_value integer not null default 0,
  timing_unit text not null default 'days' check (timing_unit in ('hours', 'days', 'months')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique references automation_rules(kind) on delete cascade,
  name text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_history (
  id uuid primary key default gen_random_uuid(),
  kind text not null references automation_rules(kind) on delete cascade,
  patient_id uuid null references patients(id) on delete set null,
  patient_name text not null,
  target_label text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'simulated', 'sent', 'failed')),
  channel text not null default 'simulation' check (channel in ('whatsapp', 'manual', 'simulation')),
  scheduled_for timestamptz null,
  sent_at timestamptz null,
  message_preview text not null,
  created_at timestamptz not null default now()
);

insert into automation_rules (kind, title, description, is_enabled, trigger_label, timing_value, timing_unit)
values
  ('appointment_reminder', 'Recordatorio de cita', 'Aviso antes de la cita para reducir inasistencias.', true, '24 horas antes de la cita', 24, 'hours'),
  ('budget_followup', 'Seguimiento de presupuesto', 'Mensaje para presupuestos enviados y sin respuesta.', true, '3 días después de enviado', 3, 'days'),
  ('patient_recovery', 'Recuperación de pacientes', 'Reactivación de pacientes sin actividad reciente.', false, '90 días sin cita', 90, 'days'),
  ('birthday', 'Cumpleaños', 'Mensaje de cumpleaños para reforzar relación con el paciente.', false, 'Día del cumpleaños', 0, 'days')
on conflict (kind) do nothing;

insert into automation_templates (kind, name, body, variables)
values
  ('appointment_reminder', 'Recordatorio de cita', 'Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}. Responde CONFIRMAR para confirmar tu asistencia.', array['nombre','fecha','hora']),
  ('budget_followup', 'Seguimiento de presupuesto', 'Hola {{nombre}}, tu presupuesto de {{tratamiento}} sigue pendiente. ¿Quieres que te ayudemos a resolver alguna duda?', array['nombre','tratamiento']),
  ('patient_recovery', 'Recuperación de paciente', 'Hola {{nombre}}, hace tiempo no vienes a control. Podemos ayudarte a agendar una revisión preventiva esta semana.', array['nombre']),
  ('birthday', 'Cumpleaños', '¡Feliz cumpleaños {{nombre}}! Te deseamos un excelente día de parte de Dental Pilot.', array['nombre'])
on conflict (kind) do nothing;
