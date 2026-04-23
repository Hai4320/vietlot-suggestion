"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CsvInputProps {
  value: string;
  onChange: (value: string) => void;
  onEvaluate: () => void;
  onClear: () => void;
  busy?: boolean;
}

export function CsvInput({ value, onChange, onEvaluate, onClear, busy }: CsvInputProps) {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      onChange(text);
      setTab("paste");
    };
    reader.onerror = () => {
      onChange("");
      setFileName(null);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "paste" | "upload")}>
        <TabsList>
          <TabsTrigger value="paste">Paste CSV</TabsTrigger>
          <TabsTrigger value="upload">Upload file</TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="mt-3">
          <textarea
            className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={
              "game,algorithm,ticket_no,numbers,special\npower_535,diversity_v1,1,7 9 10 16 19,3\npower_535,diversity_v1,2,2 4 11 20 28,8"
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
          {fileName && (
            <p className="mt-1 text-xs text-muted-foreground">Loaded from: {fileName}</p>
          )}
        </TabsContent>
        <TabsContent value="upload" className="mt-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Chọn file CSV…
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            File được đọc ngay trên trình duyệt — không upload lên server.
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={onEvaluate} disabled={busy || !value.trim()}>
          {busy ? "Đang xử lý…" : "Đánh giá"}
        </Button>
        <Button variant="outline" onClick={() => { onClear(); setFileName(null); }} disabled={busy}>
          Clear
        </Button>
      </div>
    </div>
  );
}
