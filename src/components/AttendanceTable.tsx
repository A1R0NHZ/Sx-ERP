interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  durationMinutes: number;
  locationValid: boolean;
  timetableId?: string;
  student?: { name: string; studentId: string | null };
  timetable?: { subject: string; startTime: string; endTime: string };
}

interface Props {
  records: AttendanceRecord[];
  showStudent?: boolean;
}

const statusStyle: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  ABSENT: "bg-red-50 text-red-600",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
};

export default function AttendanceTable({ records, showStudent = false }: Props) {
  if (!records.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-sm text-gray-400">No records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
              {showStudent && <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Student</th>}
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Subject</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Duration</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                  {new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                {showStudent && (
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{r.student?.name}</p>
                    <p className="text-xs text-gray-400">{r.student?.studentId ?? "—"}</p>
                  </td>
                )}
                <td className="px-5 py-3.5 font-medium text-gray-900">{r.timetable?.subject ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {r.status === "IN_PROGRESS" ? "In Progress" : r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{r.durationMinutes}m</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium ${r.locationValid ? "text-emerald-600" : "text-red-400"}`}>
                    {r.locationValid ? "Valid" : "Invalid"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
