interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "green" | "red" | "blue" | "amber";
}

const colors = {
  default: "text-gray-900",
  green: "text-emerald-600",
  red: "text-red-500",
  blue: "text-blue-600",
  amber: "text-amber-600",
};

export default function StatCard({ label, value, sub, color = "default" }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-semibold mt-1.5 ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
