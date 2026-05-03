import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type DateFilterValue = {
  fy: string; // "all" or "YYYY-YYYY"
  month: string; // "all" or "1".."12"
  day: string; // "all" or "1".."31"
};

export const defaultDateFilter: DateFilterValue = { fy: "all", month: "all", day: "all" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getFinancialYearOptions(): string[] {
  const now = new Date();
  const startYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const years: string[] = [];
  for (let i = 0; i < 8; i++) {
    const s = startYear - i;
    years.push(`${s}-${s + 1}`);
  }
  return years;
}

export function matchesDateFilter(dateIso: string, filter: DateFilterValue): boolean {
  const d = new Date(dateIso);
  if (filter.fy !== "all") {
    const [start, end] = filter.fy.split("-").map(Number);
    const fyStart = new Date(start, 3, 1); // Apr 1
    const fyEnd = new Date(end, 3, 1); // Apr 1 next year
    if (d < fyStart || d >= fyEnd) return false;
  }
  if (filter.month !== "all") {
    if (d.getMonth() + 1 !== Number(filter.month)) return false;
  }
  if (filter.day !== "all") {
    if (d.getDate() !== Number(filter.day)) return false;
  }
  return true;
}

interface Props {
  value: DateFilterValue;
  onChange: (v: DateFilterValue) => void;
}

const DateRangeFilter = ({ value, onChange }: Props) => {
  const fyOptions = getFinancialYearOptions();
  const hasFilter = value.fy !== "all" || value.month !== "all" || value.day !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.fy} onValueChange={(v) => onChange({ ...value, fy: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Financial Year" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All FY</SelectItem>
          {fyOptions.map((fy) => (
            <SelectItem key={fy} value={fy}>FY {fy}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={value.month} onValueChange={(v) => onChange({ ...value, month: v })}>
        <SelectTrigger className="w-[130px]"><SelectValue placeholder="Month" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={value.day} onValueChange={(v) => onChange({ ...value, day: v })}>
        <SelectTrigger className="w-[110px]"><SelectValue placeholder="Day" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Days</SelectItem>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={() => onChange(defaultDateFilter)}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
};

export default DateRangeFilter;
