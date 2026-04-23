"""Phase 0 — prize-table resolver unit tests."""

from __future__ import annotations

from vietlott.config.prize_tables import (
    MAX_3D_LAST2_PRIZE,
    MAX_3D_PRO_TIERS,
    MAX_3D_TIERS,
    TICKET_COST_VND,
    resolve_power_535,
    resolve_power_645,
    resolve_power_655,
)


def test_ticket_cost():
    assert TICKET_COST_VND == 10_000


# ── Power 5/35 ────────────────────────────────────────────────────────────


def test_p535_jackpot():
    rule = resolve_power_535(5, True)
    assert rule.name == "Jackpot"
    assert rule.amount == 6_000_000_000


def test_p535_second():
    rule = resolve_power_535(5, False)
    assert rule.name == "2nd"
    assert rule.amount == 5_000_000


def test_p535_third():
    assert resolve_power_535(4, True).name == "3rd"


def test_p535_fourth():
    assert resolve_power_535(4, False).name == "4th"


def test_p535_fifth():
    assert resolve_power_535(3, True).name == "5th"


def test_p535_encourage_3_main_no_sp():
    rule = resolve_power_535(3, False)
    assert rule.name == "Encourage"
    assert rule.amount == 10_000


def test_p535_encourage_low_main_with_sp():
    for m in (0, 1, 2):
        rule = resolve_power_535(m, True)
        assert rule is not None and rule.name == "Encourage"


def test_p535_no_prize():
    assert resolve_power_535(0, False) is None
    assert resolve_power_535(1, False) is None
    assert resolve_power_535(2, False) is None


# ── Power 6/45 ────────────────────────────────────────────────────────────


def test_p645_tiers():
    assert resolve_power_645(6).name == "Jackpot"
    assert resolve_power_645(5).name == "1st"
    assert resolve_power_645(4).name == "2nd"
    assert resolve_power_645(3).name == "3rd"
    assert resolve_power_645(2) is None
    assert resolve_power_645(0) is None


# ── Power 6/55 ────────────────────────────────────────────────────────────


def test_p655_jackpot1_6_main():
    rule = resolve_power_655(6, False)
    assert rule.name == "Jackpot 1"
    assert rule.amount == 30_000_000_000


def test_p655_jackpot2_5_main_bonus():
    rule = resolve_power_655(5, True)
    assert rule.name == "Jackpot 2"


def test_p655_first_5_main_no_bonus():
    rule = resolve_power_655(5, False)
    assert rule.name == "1st"
    assert rule.amount == 40_000_000


def test_p655_second_4_main_ignores_bonus():
    assert resolve_power_655(4, False).name == "2nd"
    assert resolve_power_655(4, True).name == "2nd"


def test_p655_third_3_main_ignores_bonus():
    assert resolve_power_655(3, False).name == "3rd"
    assert resolve_power_655(3, True).name == "3rd"


def test_p655_no_prize_under_3():
    assert resolve_power_655(2, False) is None
    assert resolve_power_655(0, True) is None


# ── 3D / 3D Pro tables exist with 4 tiers ────────────────────────────────


def test_3d_tiers_present():
    assert set(MAX_3D_TIERS) == {"Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"}
    assert MAX_3D_TIERS["Giải Đặc biệt"].amount == 1_000_000
    assert MAX_3D_LAST2_PRIZE.amount == 100_000


def test_3d_pro_tiers_present():
    expected = {
        "Giải Đặc biệt",
        "Giải Phụ Đặc biệt",
        "Giải Nhất",
        "Giải Nhì",
        "Giải Ba",
        "Giải Tư",
        "Giải Năm",
        "Giải Sáu",
    }
    assert set(MAX_3D_PRO_TIERS) == expected


def test_3d_pro_prize_amounts():
    assert MAX_3D_PRO_TIERS["Giải Đặc biệt"].amount == 2_000_000_000
    assert MAX_3D_PRO_TIERS["Giải Phụ Đặc biệt"].amount == 400_000_000
    assert MAX_3D_PRO_TIERS["Giải Nhất"].amount == 30_000_000
    assert MAX_3D_PRO_TIERS["Giải Nhì"].amount == 10_000_000
    assert MAX_3D_PRO_TIERS["Giải Ba"].amount == 4_000_000
    assert MAX_3D_PRO_TIERS["Giải Tư"].amount == 1_000_000
    assert MAX_3D_PRO_TIERS["Giải Năm"].amount == 100_000
    assert MAX_3D_PRO_TIERS["Giải Sáu"].amount == 40_000
