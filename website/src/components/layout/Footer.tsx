export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-4 text-center text-sm text-muted-foreground">
      <p>
        Dự án mã nguồn mở —{" "}
        <a
          href="https://github.com/vietvudanh/vietlott-data"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          GitHub
        </a>
        {" "}| MIT License
      </p>
      <p className="mt-1 text-xs">
        ⚠️ Chỉ dành cho mục đích giáo dục và nghiên cứu. Kết quả xổ số là ngẫu nhiên.
      </p>
    </footer>
  );
}
