export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-muted transition hover:bg-slate-50 hover:text-ink">Salir</button>
    </form>
  );
}
