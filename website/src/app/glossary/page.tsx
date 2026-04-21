import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================
// Glossary — scientific terms used across /research, /algorithms, /suggest
// Definitions kept short + anchored to project examples để người dùng không
// phải học lại textbook.
// ============================================================

type Term = {
  name: string;
  vi?: string;
  def: string;
  example: string;
};

type Section = {
  id: string;
  icon: string;
  title: string;
  blurb: string;
  terms: Term[];
};

const SECTIONS: Section[] = [
  {
    id: "stats",
    icon: "📐",
    title: "Thống kê cơ bản",
    blurb: "Công cụ kiểm định giả thuyết — ngôn ngữ dùng để nói &ldquo;có thật hay chỉ do may&rdquo;.",
    terms: [
      {
        name: "p-value",
        vi: "Giá trị p",
        def: "Xác suất thấy kết quả ≥ quan sát được NẾU giả thuyết vô hiệu (không có edge) là đúng. p < 0.05 = &ldquo;khó giải thích bằng may&rdquo;.",
        example: "EV Maximizer 3D Pro (Chu kỳ 7): h1 p=0.0007, h2 p=0.865 — chứng minh overfitting.",
      },
      {
        name: "Chi² test (Chi-squared)",
        vi: "Kiểm định χ²",
        def: "So sánh phân bố quan sát với phân bố kỳ vọng. Dùng khi muốn hỏi &ldquo;biến này phân bố đều hay lệch?&rdquo;",
        example: "Chi² vị trí đơn vị Max 3D Pro p=0.003 → bias digit 6 có thật (+11.6%).",
      },
      {
        name: "Z-test (2-proportion)",
        vi: "Kiểm định z hai tỷ lệ",
        def: "So sánh 2 tỷ lệ (vd: win rate chiến lược vs Random). Output Δ, z-score, p, CI95.",
        example: "Ensemble Mega 6/45 vs Random: Δ+0.69pp, z=2.0, p=0.046 → Suggestive.",
      },
      {
        name: "Confidence Interval (CI95)",
        vi: "Khoảng tin cậy 95%",
        def: "Khoảng giá trị Δ thực có khả năng 95% nằm trong. Nếu CI chứa 0 → không loại trừ được &ldquo;không có edge&rdquo;.",
        example: "ExpDecay_Cold Mega 6/45 h1 CI [-0.96, +0.44] → chứa 0, không significant.",
      },
      {
        name: "Bonferroni correction",
        vi: "Hiệu chỉnh Bonferroni",
        def: "Khi test K giả thuyết cùng lúc, chia α (vd 0.05) cho K để tránh false positive. K=14 → threshold 0.00357.",
        example: "Accept decision cần p < 0.00357 (Bonferroni), Suggestive chỉ cần p < 0.05.",
      },
      {
        name: "Null hypothesis (H₀)",
        vi: "Giả thuyết vô hiệu",
        def: "Mặc định &ldquo;không có hiệu ứng&rdquo;. Data phải đủ mạnh mới bác bỏ được H₀ — không đủ thì giữ H₀.",
        example: "H₀ của mọi chiến lược: &ldquo;win_rate = win_rate_Random&rdquo;. 0/50 bác bỏ được.",
      },
      {
        name: "Power (1−β)",
        vi: "Lực kiểm định",
        def: "Xác suất phát hiện hiệu ứng THỰC nếu nó tồn tại. Power < 80% → test không đủ nhạy.",
        example: "Principle #12: Variable-baseline power analysis mandatory trước replication.",
      },
      {
        name: "Signal-to-noise ratio",
        vi: "Tỷ lệ tín hiệu / nhiễu",
        def: "|tín hiệu| / σ nhiễu. Gần 1 → tín hiệu bị nhiễu che, khó tin cậy.",
        example: "3D: +0.4pp / ±0.44pp ≈ 0.68 — lý do backtest thắng thường không replicate.",
      },
    ],
  },
  {
    id: "gates",
    icon: "🛡️",
    title: "Quy trình kiểm định (3-gate)",
    blurb: "Protocol dự án dùng để quyết định một chiến lược có edge hay không.",
    terms: [
      {
        name: "3-gate protocol",
        vi: "Giao thức 3 cổng",
        def: "Stacked gate: (1) full-sample, (2) split-half replication, (3) forward_last_100. PHẢI pass cả 3 mới Accept.",
        example: "Principle #13. Đã validate 5 lần (Chu kỳ 7, 9, 11, 12, 13) — mọi forward-flip case.",
      },
      {
        name: "Split-half replication",
        vi: "Sao chép nửa-nửa",
        def: "Chia data thành h1 (trước) + h2 (sau), chạy chiến lược riêng. Direction phải nhất quán và có ý nghĩa cả 2 nửa.",
        example: "ExpDecay_Cold Mega 6/45: h1 Δ=−0.26pp → h2 Δ=+0.37pp direction flip → Reject.",
      },
      {
        name: "Forward validation",
        vi: "Kiểm định thuận thời gian",
        def: "Sau khi tune trên data cũ, test trên 100 draws mới nhất. &ldquo;Gác cổng&rdquo; bắt overfitting.",
        example: "GBM 3D: full +3pp → forward −1.9pp (flip) → Reject Chu kỳ 12.",
      },
      {
        name: "Walk-forward",
        vi: "Đi tới từng bước",
        def: "Chỉ train trên data TRƯỚC ngày dự đoán (no look-ahead). Bắt chước điều kiện thực tế.",
        example: "Toàn bộ backtest dự án dùng walk-forward, min_history = 50 draws.",
      },
      {
        name: "Look-ahead bias",
        vi: "Thiên lệch nhìn trước",
        def: "Lỗi dùng thông tin TƯƠNG LAI để dự đoán QUÁ KHỨ — làm backtest nhìn đẹp nhưng không thực tế.",
        example: "Chu kỳ 12.5 audit GBM confirm &ldquo;no leak&rdquo; — vẫn overfit thôi, không look-ahead.",
      },
      {
        name: "Overfitting",
        vi: "Quá khớp",
        def: "Mô hình học thuộc noise thay vì pattern thực. Signature: backtest cao, forward thấp / direction flip.",
        example: "GBM 3D Pro prediction concentration 0.037 (Principle #15 fail) → classic overfit.",
      },
      {
        name: "Decision states",
        vi: "4 trạng thái quyết định",
        def: "Accept (3-gate pass, ship), Suggestive (full pass, replication pending), Inconclusive (gates disagree), Reject (fail).",
        example: "Dự án hiện tại: 0 Accept, 0 Suggestive verified. 2 Mega 6/45 Suggestive chưa test replication.",
      },
    ],
  },
  {
    id: "strategy",
    icon: "🧠",
    title: "Chiến lược & Machine Learning",
    blurb: "Các kỹ thuật tạo prediction — dùng trong 28 chiến lược 3D + 20 chiến lược matrix.",
    terms: [
      {
        name: "Bayesian (Dirichlet posterior)",
        vi: "Hậu nghiệm Bayes",
        def: "Update P(number_i) theo quan sát mới: posterior ∝ prior × likelihood. Dirichlet là conjugate prior của multinomial.",
        example: "Bayesian AI matrix: α_i = count_i + 1, sample softmax temperature T.",
      },
      {
        name: "Temperature (T)",
        vi: "Nhiệt độ softmax",
        def: "Tham số điều chỉnh độ &ldquo;sharp&rdquo; của distribution. T→0 = greedy (chỉ top-1), T→∞ = uniform.",
        example: "Mega 6/45 Bayesian Sharp dùng T=0.3 (sharper) → Win 3.14% directional.",
      },
      {
        name: "Exponential decay / half-life",
        vi: "Suy giảm hàm mũ / chu kỳ bán rã",
        def: "Weight w_t = 0.5^(Δt/HL). Quan sát cũ hơn half-life nhận weight ≤ 0.5. Dùng khi nghi ngờ có drift.",
        example: "ExpDecay_Cold HL=90 draws — thử hypothesis &ldquo;cold number biased in recent window&rdquo;.",
      },
      {
        name: "GBM (Gradient Boosting)",
        vi: "Máy tăng cường gradient",
        def: "Ensemble decision tree — model học residual của tree trước. Thường mạnh nhưng dễ overfit sample nhỏ.",
        example: "Chu kỳ 12 GBMDigitClassifier +3pp backtest → forward flip → Reject Chu kỳ 12.5.",
      },
      {
        name: "Copula",
        vi: "Hàm đối ngẫu liên hợp",
        def: "Modeling joint distribution khi biết marginals. Empirical copula copy rank từ data; Gaussian giả định chuẩn.",
        example: "Chu kỳ 11 thử Empirical + Gaussian copula 3D — 3/4 Reject + 1/4 Inconclusive.",
      },
      {
        name: "Online Bayesian (Kalman-style)",
        vi: "Bayes trực tuyến",
        def: "Update posterior từng step thay vì batch refit. α_t = (1−λ)·α_{t−1} + obs_t với forgetting rate λ.",
        example: "Chu kỳ 14 pending: Path #1 cho matrix, primary Mega 6/45.",
      },
      {
        name: "Ensemble",
        vi: "Hợp nhất nhiều model",
        def: "Kết hợp dự đoán từ K chiến lược — voting, averaging, weighted. Giảm variance nhưng không giảm bias.",
        example: "Mega 6/45 Ensemble: p=0.046 Suggestive (full), replication chưa test.",
      },
      {
        name: "Wheeling / covering design",
        vi: "Hệ thống wheeling",
        def: "Sinh N vé overlap để đảm bảo nếu k/6 số trúng nằm trong pool → có vé thắng. Chỉ redistribute odds.",
        example: "Lotto 5/35 HybridParity wheeling N=20 — Chu kỳ 5 correction: Reject (p=0.301).",
      },
      {
        name: "Hypergeometric",
        vi: "Phân bố siêu hình học",
        def: "Phân bố số &ldquo;match&rdquo; khi rút k số không thay thế từ pool có m số trúng trong N. Baseline của matrix lottery.",
        example: "Power 6/55 baseline E=0.6545 matches/ticket là mean của hypergeometric(55, 6, 6).",
      },
    ],
  },
  {
    id: "metrics",
    icon: "📊",
    title: "Số liệu đánh giá",
    blurb: "Các metric dự án dùng xuyên suốt backtest + UI.",
    terms: [
      {
        name: "Δ (delta)",
        vi: "Chênh lệch",
        def: "Hiệu giữa chiến lược và baseline. Cùng đơn vị với metric đang đo.",
        example: "JointBias Max 3D Δ=+0.305pp nghĩa là exact match rate cao hơn Random 0.305 điểm %.",
      },
      {
        name: "pp (percentage points)",
        vi: "Điểm phần trăm",
        def: "Đơn vị của Δ khi so sánh 2 tỷ lệ. 1.5% → 1.9% = +0.4pp (KHÔNG phải +27%).",
        example: "Bias ceiling 3D = +0.4pp. Principle #14 auto-flag nếu |Δ| > 3× (+1.2pp).",
      },
      {
        name: "avg_matches",
        vi: "Số trúng trung bình",
        def: "Trung bình số số trúng / vé qua toàn backtest. Dùng cho matrix products (6/55, 6/45, 5/35).",
        example: "Power 6/55 Bayesian avg=0.685 vs Random 0.676 → Δ+0.031.",
      },
      {
        name: "win_rate_ge3",
        vi: "Tỷ lệ trúng ≥ 3 số",
        def: "% tickets trúng ít nhất 3 số (mức có giải). Primary metric matrix (weighted highest trong tournament).",
        example: "Mega 6/45 Ensemble win_rate 2.58% vs baseline 1.89% → Δ+0.69pp.",
      },
      {
        name: "exact_pct (3D)",
        vi: "Tỷ lệ trúng đúng 3 số",
        def: "% tickets trúng đúng 000-999 (giải lớn). Primary metric 3D products.",
        example: "Max 3D JointBias exact 2.01% vs Random 1.70% → +0.305pp directional.",
      },
      {
        name: "ROI",
        vi: "Return on Investment",
        def: "(revenue − cost) / cost × 100%. Âm = lỗ. Xổ số bản chất ROI âm.",
        example: "Mọi chiến lược matrix/3D: ROI từ −94% đến −27%. Ngay chiến lược &ldquo;best&rdquo; vẫn lỗ tiền.",
      },
      {
        name: "EV (Expected Value)",
        vi: "Giá trị kỳ vọng",
        def: "Trung bình payoff có trọng số theo xác suất. EV âm = game có kỳ vọng lỗ dài hạn.",
        example: "EV Maximizer 3D Pro Chu kỳ 7: tối ưu EV full-sample nhưng split-half dramatic flip → Reject.",
      },
      {
        name: "Sharpe ratio",
        vi: "Tỷ số Sharpe",
        def: "(return − risk-free) / std. Đo return per unit risk. Xổ số Sharpe thường âm mạnh (−7 đến −9).",
        example: "Random Power 6/55 Sharpe = −8.70 — baseline lỗ ổn định.",
      },
    ],
  },
  {
    id: "project",
    icon: "🧭",
    title: "Thuật ngữ dự án",
    blurb: "Các khái niệm chỉ riêng project này — codified trong METHODOLOGY.md.",
    terms: [
      {
        name: "Principle #11-#15",
        vi: "Nguyên tắc phương pháp",
        def: "5 rule bắt buộc phát sinh từ failure cases: #11 split-half, #12 power, #13 3-gate, #14 magnitude, #15 ML concentration.",
        example: "Xem /research section &ldquo;Methodology Principles&rdquo;.",
      },
      {
        name: "Bias ceiling",
        vi: "Trần bias",
        def: "Upper bound hợp lý cho |Δ| dựa trên magnitude bias observed. 3D: +0.4pp. Matrix: +0.3pp.",
        example: "Principle #14: nếu |Δ| > 3× ceiling → auto-flag Ship-with-caveats.",
      },
      {
        name: "Magnitude sanity check",
        vi: "Kiểm tra độ lớn hợp lý",
        def: "Nếu Δ observed quá lớn so với physical bias → nghi overfit hoặc data leak. Principle #14.",
        example: "GBM 3D Pro Δ=+3pp (3× bias ceiling) → triggered audit Chu kỳ 12.5.",
      },
      {
        name: "Prediction concentration",
        vi: "Tập trung dự đoán",
        def: "n_unique/total tickets dự đoán. <0.30 hoặc top-5 > 30% → ML collapse, Reject per Principle #15.",
        example: "GBM 3D Pro: n_unique/total = 0.037 → dự đoán lặp → fail Principle #15.",
      },
      {
        name: "Ship-with-caveats",
        vi: "Triển khai với cảnh báo",
        def: "Trạng thái tạm: technical Accept nhưng có dấu hiệu overfit. Cần audit trước khi ship.",
        example: "Chu kỳ 12 GBM 3D Pro: Ship-with-caveats → Chu kỳ 12.5 audit → deprecated → Reject.",
      },
      {
        name: "Research line state",
        vi: "Trạng thái dòng nghiên cứu",
        def: "CLOSED = mechanism space exhausted, không tiếp tục. ACTIVE = còn path untested.",
        example: "3D CLOSED sau Chu kỳ 13 (28 strategies). Matrix ACTIVE (Chu kỳ 14 pending).",
      },
      {
        name: "Tournament ranking",
        vi: "Xếp hạng giải đấu",
        def: "Multi-objective score weighted (win-rate 0.40 + ROI 0.30 + Sharpe 0.20 + novelty 0.10) để rank chiến lược trong cycle.",
        example: "Chu kỳ 10 pivot: dùng tournament thay single-metric ranking.",
      },
      {
        name: "Directional / Confirmed",
        vi: "Hướng đúng / Xác nhận",
        def: "Directional = Δ > 0 (nhìn đúng hướng) NHƯNG p ≥ 0.05. Confirmed = Δ > 0 AND 3-gate pass.",
        example: "Mọi research pick UI gắn badge &ldquo;🔬 Directional&rdquo; — đây KHÔNG phải confirmed edge.",
      },
      {
        name: "Research pick (UI)",
        vi: "Đề xuất nghiên cứu",
        def: "Strategy default-selected trong SuggestionPanel — directional positive, best-of-Reject. KHÔNG confirmed edge. Tối đa 2 picks per product: 🎯 tỷ lệ trúng cao nhất + 💰 lỗ ít nhất. Nếu cùng strategy thắng cả 2 → 1 pick.",
        example: "Max 3D: Phủ sóng tối đa Pareto-dominant → 1 pick. Mega 6/45: Bayesian Sharp (win) + Phủ sóng (ROI) → 2 picks.",
      },
      {
        name: "Pareto-dominant",
        vi: "Chi phối Pareto",
        def: "Strategy A Pareto-dominates B nếu A ≥ B trên MỌI axis (win rate, ROI) và strict > ở ít nhất 1. Nếu 1 strategy Pareto-dominates các strategies khác → không cần pick riêng cho mỗi axis.",
        example: "Max 3D Phủ sóng tối đa: Win 2.22% > JointBias 2.01% VÀ ROI −35.8% > JointBias −52.5%. JointBias bị dominated.",
      },
      {
        name: "Pick selection rule",
        vi: "Quy tắc chọn pick",
        def: "(1) Loại strategy Reject vì overfit/direction-flip/Principle #14/#15 fail. (2) Max winPct → winrate_pick. (3) Max roi → roi_pick. (4) Same strategy → 1 pick. ⚠️ Rule chưa áp replication cho chính quy tắc pick — điểm yếu methodology.",
        example: "Lotto 5/35 tie: Phủ sóng vs Bayesian cùng ROI −84.4%. Tie-break bằng avg_matches cao hơn → Phủ sóng. Rule ad-hoc.",
      },
      {
        name: "Best-of-Reject",
        vi: "Tốt nhất trong Reject",
        def: "Khi 0/~50 strategy Accept, &ldquo;best&rdquo; chỉ là least-bad trong nhóm Reject. Framing &ldquo;pick&rdquo; dễ gây hiểu nhầm là có edge — thực tế chưa.",
        example: "Mọi research pick hiện tại: directional positive nhưng vẫn Reject per 3-gate. Đợi Chu kỳ 14+ để có Accept thực sự.",
      },
    ],
  },
];

// ============================================================
// Page
// ============================================================

export default function GlossaryPage() {
  const total = SECTIONS.reduce((acc, s) => acc + s.terms.length, 0);
  return (
    <div className="space-y-6 pb-12">
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">📚 Thuật ngữ khoa học</h1>
          <Badge variant="outline" className="text-xs">{total} thuật ngữ · 5 nhóm</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          Từ điển nhanh cho các thuật ngữ thống kê, methodology và ML dùng xuyên suốt
          /research, /algorithms, /suggest. Mục tiêu: đọc 30 giây là hiểu đủ để không bị lạc trong jargon.
          Mỗi term kèm một ví dụ cụ thể từ lịch sử dự án.
        </p>
      </div>

      {/* TOC */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2 flex-wrap">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
              >
                <span>{s.icon}</span>
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground font-mono">({s.terms.length})</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="space-y-3 scroll-mt-20">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </h2>
            <p className="text-xs text-muted-foreground">{section.blurb}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {section.terms.map((t) => (
              <Card key={t.name} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-primary">{t.name}</span>
                    {t.vi && <span className="text-xs text-muted-foreground font-normal">— {t.vi}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="leading-relaxed">{t.def}</p>
                  <div className="rounded-md bg-muted/40 border-l-2 border-primary/30 pl-2 py-1.5 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Ví dụ: </span>
                    {t.example}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {/* Footer note */}
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Nguồn chi tiết: <code className="font-mono bg-muted px-1 rounded">website/research/METHODOLOGY.md</code>
          {" "}(principles), <code className="font-mono bg-muted px-1 rounded">website/research/EVALUATION.md</code>
          {" "}(decision rules), <code className="font-mono bg-muted px-1 rounded">website/research/RESEARCH_HISTORY.md</code>
          {" "}(cycle index).
        </p>
      </div>
    </div>
  );
}
