import { getRankTitle } from './utils/failure'

export default function Failure({ stats, resetStats, exportCsv }) {
  const historyEntries = Object.entries(stats.history)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)

  const rank = getRankTitle(stats.shame_points)

  return (
    <div className="p-4 text-left">
      <div className="mb-4 text-center">
        <div className="text-5xl">{stats.shame_points}</div>
        <div className="italic">{rank}</div>
      </div>
      <div className="mb-4 space-y-1">
        <div>Total expired: {stats.total_expired}</div>
        <div>Total deleted unfinished: {stats.total_deleted_unfinished}</div>
        <div>Procrastination streak: {stats.procrastination_streak_days} days</div>
      </div>
      <table className="w-full mb-4">
        <thead>
          <tr className="text-left">
            <th className="border px-2">Date</th>
            <th className="border px-2">Expired</th>
            <th className="border px-2">Deleted</th>
            <th className="border px-2">Completed</th>
          </tr>
        </thead>
        <tbody>
          {historyEntries.map(([date, h]) => (
            <tr key={date}>
              <td className="border px-2">{date}</td>
              <td className="border px-2">{h.expired}</td>
              <td className="border px-2">{h.deleted}</td>
              <td className="border px-2">{h.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-x-2">
        <button onClick={exportCsv} className="border px-2 py-1">
          Export CSV
        </button>
        <button
          onClick={() => {
            if (window.confirm('Reset all failure stats?')) resetStats()
          }}
          className="border px-2 py-1"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
