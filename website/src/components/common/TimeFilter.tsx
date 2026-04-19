"use client";

import type { TimeFilter } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeFilterSelectProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
}

export function TimeFilterSelect({ value, onChange }: TimeFilterSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimeFilter)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tất cả</SelectItem>
        <SelectItem value="90d">90 ngày</SelectItem>
        <SelectItem value="60d">60 ngày</SelectItem>
        <SelectItem value="30d">30 ngày</SelectItem>
      </SelectContent>
    </Select>
  );
}
