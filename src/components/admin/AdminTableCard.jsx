export default function AdminTableCard({ title, columns, rows }) {
  return (
    <section className="surface-card">
      <h2 className="font-display text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="border-b border-slate-200 px-3 py-3 font-semibold uppercase tracking-[0.14em]">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="text-slate-700">
                {columns.map((column) => (
                  <td key={column.key} className="border-b border-slate-100 px-3 py-4">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
