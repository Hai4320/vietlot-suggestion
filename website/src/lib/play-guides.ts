/**
 * Prize structure and play guide data for all Vietlott products.
 * Source: https://www.vietlott.vn/
 */

export interface PrizeTier {
  name: string;
  condition: string;
  prize: string;
  odds: string;
  highlight?: boolean;
}

export interface PlayGuideData {
  /** How to play — step by step */
  howToPlay: string[];
  /** Draw schedule */
  schedule: string;
  /** Ticket price */
  ticketPrice: string;
  /** Prize tiers from highest to lowest */
  prizes: PrizeTier[];
  /** Odds of winning any prize */
  overallOdds?: string;
  /** Additional tips */
  tips?: string[];
}

export const PLAY_GUIDES: Record<string, PlayGuideData> = {
  power_655: {
    howToPlay: [
      "Chọn 6 số từ 01 đến 55.",
      "Mỗi vé có giá 10.000đ.",
      "Quay số mở thưởng 3 lần/tuần: Thứ 3, Thứ 5, Thứ 7.",
      "6 số chính + 1 số đặc biệt (Power) được quay ngẫu nhiên.",
      "Các con số dự thưởng phải trùng với số kết quả nhưng không cần theo đúng thứ tự.",
    ],
    schedule: "18h00 — Thứ 3, Thứ 5, Thứ 7",
    ticketPrice: "10.000đ / vé",
    overallOdds: "1:45",
    prizes: [
      {
        name: "Jackpot 1",
        condition: "Trùng 6 số với kết quả",
        prize: "≥ 30 tỷ đồng",
        odds: "1 : 28.989.675",
        highlight: true,
      },
      {
        name: "Jackpot 2",
        condition: "Trùng 5 số + số Power",
        prize: "≥ 3 tỷ đồng",
        odds: "1 : 5.797.935",
        highlight: true,
      },
      {
        name: "Giải nhất",
        condition: "Trùng 5 số",
        prize: "10.000.000đ",
        odds: "1 : 120.790",
      },
      {
        name: "Giải nhì",
        condition: "Trùng 4 số",
        prize: "300.000đ",
        odds: "1 : 2.416",
      },
      {
        name: "Giải ba",
        condition: "Trùng 3 số",
        prize: "30.000đ",
        odds: "1 : 45",
      },
    ],
    tips: [
      "Jackpot 1 tích lũy khi không có người trúng, có thể lên tới hàng trăm tỷ.",
      "Jackpot 2 = tổng giá trị Jackpot 1 trên mức 300 tỷ + 3 tỷ khởi điểm.",
      "Có thể mua nhiều vé với các bộ số khác nhau để tăng xác suất trúng.",
      "Kết quả được phát trực tiếp trên kênh TodayTV - SCTV2.",
    ],
  },

  power_645: {
    howToPlay: [
      "Chọn 6 số từ 01 đến 45.",
      "Mỗi vé có giá 10.000đ.",
      "Quay số mở thưởng 3 lần/tuần: Thứ 4, Thứ 6, Chủ nhật.",
      "6 số được quay ngẫu nhiên.",
      "Các con số dự thưởng phải trùng với số kết quả nhưng không cần theo đúng thứ tự.",
    ],
    schedule: "18h00 — Thứ 4, Thứ 6, Chủ nhật",
    ticketPrice: "10.000đ / vé",
    overallOdds: "1:13",
    prizes: [
      {
        name: "Jackpot",
        condition: "Trùng 6 số",
        prize: "≥ 12 tỷ đồng",
        odds: "1 : 8.145.060",
        highlight: true,
      },
      {
        name: "Giải nhất",
        condition: "Trùng 5 số",
        prize: "10.000.000đ",
        odds: "1 : 34.808",
      },
      {
        name: "Giải nhì",
        condition: "Trùng 4 số",
        prize: "300.000đ",
        odds: "1 : 733",
      },
      {
        name: "Giải ba",
        condition: "Trùng 3 số",
        prize: "30.000đ",
        odds: "1 : 45",
      },
    ],
    tips: [
      "Jackpot khởi điểm 12 tỷ đồng, tích lũy khi không có người trúng.",
      "Xác suất trúng Jackpot: 1/8.145.060.",
      "Có thể mua vé online qua ứng dụng Vietlott SMS.",
    ],
  },

  power_535: {
    howToPlay: [
      "Chọn 5 số từ 01 đến 35 và 1 số đặc biệt từ 01 đến 12.",
      "Mỗi vé có giá 10.000đ.",
      "Quay số mở thưởng 2 lần/ngày: 13h00 và 21h00 hàng ngày.",
      "5 số chính + 1 số đặc biệt được quay ngẫu nhiên.",
      "Các con số dự thưởng phải trùng với số kết quả nhưng không cần theo đúng thứ tự.",
    ],
    schedule: "13h00 & 21h00 — Hàng ngày",
    ticketPrice: "10.000đ / vé",
    overallOdds: "1:9",
    prizes: [
      {
        name: "Giải Độc Đắc",
        condition: "Trùng 5 số + số đặc biệt",
        prize: "≥ 6 tỷ đồng",
        odds: "1 : 3.838.380",
        highlight: true,
      },
      {
        name: "Giải nhất",
        condition: "Trùng 5 số",
        prize: "40.000.000đ",
        odds: "1 : 348.944",
      },
      {
        name: "Giải nhì",
        condition: "Trùng 4 số + số đặc biệt",
        prize: "500.000đ",
        odds: "1 : 25.590",
      },
      {
        name: "Giải ba",
        condition: "Trùng 4 số",
        prize: "50.000đ",
        odds: "1 : 2.326",
      },
      {
        name: "Giải tư",
        condition: "Trùng 3 số + số đặc biệt",
        prize: "50.000đ",
        odds: "1 : 569",
      },
      {
        name: "Giải năm",
        condition: "Trùng 3 số",
        prize: "10.000đ",
        odds: "1 : 52",
      },
    ],
    tips: [
      "Quay số 2 lần/ngày nên cơ hội trúng thưởng cao hơn.",
      "Giải Độc Đắc tích lũy, có thể lên tới hàng chục tỷ.",
      "Số đặc biệt chỉ từ 01-12, nên xác suất khớp khá cao.",
    ],
  },

  "3d": {
    howToPlay: [
      "Chọn 1 hoặc nhiều bộ 3 chữ số (từ 000 đến 999).",
      "Mỗi bộ số có giá 10.000đ.",
      "Quay số mở thưởng 3 lần/tuần: Thứ 2, Thứ 4, Thứ 6.",
      "20 bộ 3 số được quay cho các hạng giải.",
      "Các con số dự thưởng phải trùng với số kết quả theo đúng thứ tự.",
    ],
    schedule: "18h00 — Thứ 2, Thứ 4, Thứ 6",
    ticketPrice: "10.000đ / bộ số",
    overallOdds: "1:50",
    prizes: [
      {
        name: "Giải Đặc biệt",
        condition: "Trùng 2 bộ ba số theo đúng thứ tự",
        prize: "1 tỷ đồng",
        odds: "1 : 1.000.000",
        highlight: true,
      },
      {
        name: "Giải Nhất",
        condition: "Trùng 2 bộ ba số bất kỳ trong 4 bộ (G.Nhất + G.ĐB)",
        prize: "40.000.000đ",
        odds: "1 : 166.667",
      },
      {
        name: "Giải Nhì",
        condition: "Trùng 2 bộ ba số bất kỳ trong 6 bộ (G.Nhì + G.Nhất + G.ĐB)",
        prize: "10.000.000đ",
        odds: "1 : 66.667",
      },
      {
        name: "Giải Ba",
        condition: "Trùng 2 bộ ba số bất kỳ trong 8 bộ (G.Ba + trên)",
        prize: "5.000.000đ",
        odds: "1 : 35.714",
      },
      {
        name: "Giải Tư",
        condition: "Trùng 2 bộ ba số bất kỳ trong 20 bộ",
        prize: "1.000.000đ",
        odds: "1 : 5.263",
      },
      {
        name: "Giải Năm",
        condition: "Trùng 1 bộ ba số bất kỳ trong 2 bộ (G.ĐB)",
        prize: "150.000đ",
        odds: "1 : 500",
      },
      {
        name: "Giải Sáu",
        condition: "Trùng 1 bộ ba số bất kỳ trong 18 bộ",
        prize: "40.000đ",
        odds: "1 : 56",
      },
    ],
    tips: [
      "Giải thưởng cố định, không tích lũy.",
      "Có thể mua nhiều bộ số, mỗi bộ dự thưởng độc lập.",
      "Chú ý: phải trùng theo đúng thứ tự chữ số.",
    ],
  },

  "3d_pro": {
    howToPlay: [
      "Chọn 2 bộ 3 chữ số (từ 000 đến 999) tạo thành 1 cặp.",
      "Mỗi cặp số có giá 10.000đ.",
      "Quay số mở thưởng 3 lần/tuần: Thứ 3, Thứ 5, Thứ 7.",
      "20 bộ 3 số được quay cho các hạng giải.",
      "Dò cả đúng thứ tự và ngược thứ tự.",
    ],
    schedule: "18h00 — Thứ 3, Thứ 5, Thứ 7",
    ticketPrice: "10.000đ / cặp số",
    overallOdds: "1:50",
    prizes: [
      {
        name: "Giải Đặc biệt",
        condition: "Trùng 2 bộ ba số theo đúng thứ tự",
        prize: "2 tỷ đồng",
        odds: "1 : 1.000.000",
        highlight: true,
      },
      {
        name: "Giải phụ ĐB",
        condition: "Trùng 2 bộ ba số theo thứ tự ngược",
        prize: "400.000.000đ",
        odds: "1 : 1.000.000",
      },
      {
        name: "Giải Nhất",
        condition: "Trùng 2 bộ ba số bất kỳ trong 4 bộ (G.Nhất + G.ĐB)",
        prize: "30.000.000đ",
        odds: "1 : 166.667",
      },
      {
        name: "Giải Nhì",
        condition: "Trùng 2 bộ ba số bất kỳ trong 6 bộ (G.Nhì + trên)",
        prize: "10.000.000đ",
        odds: "1 : 66.667",
      },
      {
        name: "Giải Ba",
        condition: "Trùng 2 bộ ba số bất kỳ trong 8 bộ (G.Ba + trên)",
        prize: "4.000.000đ",
        odds: "1 : 35.714",
      },
      {
        name: "Giải Tư",
        condition: "Trùng 2 bộ ba số bất kỳ trong 20 bộ",
        prize: "1.000.000đ",
        odds: "1 : 5.263",
      },
      {
        name: "Giải Năm",
        condition: "Trùng 1 bộ ba số bất kỳ trong 2 bộ (G.ĐB)",
        prize: "100.000đ",
        odds: "1 : 500",
      },
      {
        name: "Giải Sáu",
        condition: "Trùng 1 bộ ba số bất kỳ trong 18 bộ",
        prize: "40.000đ",
        odds: "1 : 56",
      },
    ],
    tips: [
      "Giải Đặc biệt lên đến 2 tỷ đồng — cao nhất trong dòng 3D.",
      "Giải phụ ĐB trùng ngược thứ tự vẫn được 400 triệu.",
      "Giải thưởng cố định, không tích lũy.",
    ],
  },
};
