#!/usr/bin/env python3
"""Chu Kỳ 20 — Baseline Analysis (steps A1-A5 of evaluation checklist).

Runs 5 sequential analyses on existing cycle result JSONs. Outputs 5 JSON files
for before-change measurement. No backtest; all analytical.

Usage: PYTHONPATH=website/research uv run python website/research/post_closure/cycle20_baseline_analysis.py

Pre-reg: proposals/executed/cycle20_methodology_refinement.md
Checklist: proposals/executed/cycle20_evaluation_checklist.md sections A1-A5
"""
from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any

from scipy import stats

ROOT = Path('website/research')
OUT_DIR = ROOT / 'post_closure'

RESULT_FILES = [
    ('cycle7', '3d', '3d/cycle7_replication_results.json'),
    ('cycle11', '3d', '3d/cycle11_copula_results.json'),
    ('cycle12', '3d', '3d/cycle12_gbm_results.json'),
    ('cycle12_5', '3d', '3d/cycle12_5_audit_results.json'),
    ('cycle13', '3d', '3d/cycle13_pooled_results.json'),
    ('cycle17', '3d', '3d/cycle17_hmm_results.json'),
    ('cycle9', 'matrix', 'matrix/mega645/cycle9_replication_results.json'),
    ('cycle14', 'matrix', 'matrix/cycle14_online_bayesian_results.json'),
    ('cycle15', 'matrix', 'matrix/cycle15_cross_product_results.json'),
    ('cycle16', 'matrix', 'matrix/cycle16_kelly_portfolio_results.json'),
    ('cycle17', 'matrix', 'matrix/cycle17_hmm_results.json'),
]

# Pre-reg bias ceilings per §6.2 closure report
BIAS_CEILING_PP = {'3d': 0.4, 'matrix': 0.3}
BASELINE_RATE = {'3d': 2.0, 'matrix': 1.5}  # approx, will refine per product below
PRODUCTS_BASELINE_RATE_PCT = {
    'max_3d': 2.0,       # ~= 20/1000
    'max_3d_pro': 2.0,
    'power_655': 1.5,    # hypergeometric P(X>=3, 7 of 55, 6 drawn) - approx
    'power_645': 2.0,    # slightly higher due to 45 pool
    'power_535': 1.5,
    'mega_645': 2.0,
    'lotto_535': 1.5,
}


# ---------------------------------------------------------------------------
# Shared extraction
# ---------------------------------------------------------------------------

def _walk_sig_blocks(obj: Any, path: tuple = ()) -> list[dict]:
    """Recursively find sig_vs_* blocks with context path."""
    out: list[dict] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(k, str) and k.startswith('sig_vs_') and isinstance(v, dict) and 'p_value_raw' in v:
                # Walk up path for strategy, segment, product
                path_str = '/'.join(str(p) for p in path)
                strategy = path[-1] if path else '?'
                # Segment detection
                segment = 'unknown'
                for p in path:
                    ps = str(p)
                    if ps in ('full', 'half1', 'half2', 'forward', 'forward_last_100'):
                        segment = ps
                        break
                # Product detection
                product = 'unknown'
                for p in path:
                    ps = str(p)
                    if ps in ('max_3d', 'max_3d_pro', 'power_655', 'power_645', 'power_535',
                              'mega_645', 'lotto_535'):
                        product = ps
                        break
                out.append({
                    'strategy': strategy,
                    'segment': segment,
                    'product': product,
                    'path': path_str,
                    'baseline_key': k,
                    'baseline_name': v.get('baseline_name', '?'),
                    'strategy_rate_pct': v.get('strategy_rate_pct'),
                    'baseline_rate_pct': v.get('baseline_rate_pct'),
                    'strategy_hits': v.get('strategy_hits'),
                    'strategy_n': v.get('strategy_n'),
                    'baseline_hits': v.get('baseline_hits'),
                    'baseline_n': v.get('baseline_n'),
                    'delta_pp': v.get('delta_pp'),
                    'p_raw': v.get('p_value_raw'),
                    'bonferroni_k': v.get('bonferroni_k'),
                    'passes_bonferroni': v.get('passes_bonferroni'),
                    'decision': v.get('decision'),
                    'ci95_lo_pp': v.get('ci95_lo_pp'),
                    'ci95_hi_pp': v.get('ci95_hi_pp'),
                })
            else:
                out.extend(_walk_sig_blocks(v, path + (str(k),)))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out.extend(_walk_sig_blocks(v, path + (f'[{i}]',)))
    return out


def _load_all_sig_blocks() -> list[dict]:
    rows = []
    for cycle, scope, relpath in RESULT_FILES:
        p = ROOT / relpath
        if not p.exists():
            print(f'  MISSING: {relpath}')
            continue
        data = json.loads(p.read_text())
        sigs = _walk_sig_blocks(data)
        for s in sigs:
            s['cycle'] = cycle
            s['scope'] = scope
            s['file'] = relpath
        rows.extend(sigs)
    return rows


# ---------------------------------------------------------------------------
# A1. Verdict census
# ---------------------------------------------------------------------------

def run_a1_verdict_census():
    print('\n=== A1 — Verdict census ===')
    rows = _load_all_sig_blocks()
    # vs-Random only (primary decision)
    vs_random = [r for r in rows if 'Random' in (r.get('baseline_name') or '')]
    print(f'Total sig_vs_Random blocks (all segments): {len(vs_random)}')

    # Decision distribution
    by_decision = defaultdict(int)
    by_decision_full = defaultdict(int)
    for r in vs_random:
        d = r.get('decision') or 'None'
        by_decision[d] += 1
        if r['segment'] == 'full':
            by_decision_full[d] += 1

    # Per cycle
    by_cycle_decision = defaultdict(lambda: defaultdict(int))
    for r in vs_random:
        if r['segment'] == 'full':
            by_cycle_decision[r['cycle']][r.get('decision') or 'None'] += 1

    print(f'\nAll-segments verdict distribution vs Random:')
    for d, c in sorted(by_decision.items(), key=lambda x: -x[1]):
        print(f'  {d:30s}: {c}')

    print(f'\nFull-segment only (gate-1 decisions):')
    for d, c in sorted(by_decision_full.items(), key=lambda x: -x[1]):
        print(f'  {d:30s}: {c}')

    print(f'\nPer-cycle × decision (full segment only):')
    for cycle in sorted(by_cycle_decision.keys()):
        dist = dict(by_cycle_decision[cycle])
        print(f'  {cycle}: {dist}')

    out = {
        'meta': {
            'checklist_item': 'A1 verdict census',
            'description': 'Count verdicts across cycles 7-17 from sig_vs_Random blocks',
            'n_total_vs_random_blocks': len(vs_random),
        },
        'all_segments_distribution': dict(by_decision),
        'full_segment_distribution': dict(by_decision_full),
        'per_cycle_full_segment': {c: dict(d) for c, d in by_cycle_decision.items()},
        'data_rows': [{k: v for k, v in r.items() if k != 'file'} for r in vs_random],
    }
    out_path = OUT_DIR / 'cycle20_a1_verdict_census.json'
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f'✓ Saved {out_path}')
    return rows


# ---------------------------------------------------------------------------
# A2. Power estimates
# ---------------------------------------------------------------------------

def compute_power_two_proportion(
    n: int,
    p0: float,
    delta: float,
    alpha: float,
    alternative: str = 'two-sided',
) -> float:
    """Approximate power for two-sample proportion z-test.

    Given:
        n: per-group sample size
        p0: baseline proportion
        delta: true effect (p1 - p0, absolute)
        alpha: significance level
    Returns:
        power (0..1)

    Uses normal approximation. For very small n or extreme p, may overestimate.
    """
    if n < 10 or p0 <= 0 or p0 >= 1:
        return 0.0
    p1 = max(0.0, min(1.0, p0 + delta))
    if p1 == p0:
        return alpha  # no effect
    # Under H0: SE = sqrt(2 * p_bar * (1-p_bar) / n)
    p_bar_null = p0
    se_null = math.sqrt(2 * p_bar_null * (1 - p_bar_null) / n)
    # Under H1: SE = sqrt(p0*(1-p0)/n + p1*(1-p1)/n)
    se_alt = math.sqrt(p0 * (1 - p0) / n + p1 * (1 - p1) / n)
    if se_alt == 0:
        return 1.0 if delta != 0 else alpha
    # Critical z for alpha
    if alternative == 'two-sided':
        z_crit = stats.norm.ppf(1 - alpha / 2)
    else:
        z_crit = stats.norm.ppf(1 - alpha)
    # Shift under H1
    # P(reject | H1) where reject = |Z| > z_crit under null
    # Z_obs = (p1_hat - p0_hat) / se_null; approximate shift (delta) / se_alt
    noncentrality = delta / se_alt
    if alternative == 'two-sided':
        power = (1 - stats.norm.cdf(z_crit - noncentrality)) + stats.norm.cdf(-z_crit - noncentrality)
    else:
        power = 1 - stats.norm.cdf(z_crit - noncentrality)
    return float(max(0.0, min(1.0, power)))


def run_a2_power_estimates(rows: list[dict] | None = None):
    print('\n=== A2 — Power estimates per significance test ===')
    if rows is None:
        rows = _load_all_sig_blocks()
    vs_random = [r for r in rows if 'Random' in (r.get('baseline_name') or '')]

    # Effect size = bias ceiling per product scope
    estimates = []
    for r in vs_random:
        scope = r['scope']
        ceiling_pp = BIAS_CEILING_PP[scope]
        # n per group = strategy_n (same as baseline_n typically)
        n = r.get('strategy_n') or 0
        p0 = (r.get('baseline_rate_pct') or 0) / 100
        if n == 0 or p0 == 0:
            estimates.append({**r, 'power_at_ceiling': None, 'power_at_half_ceiling': None})
            continue
        # Bonferroni alpha
        k = r.get('bonferroni_k') or 1
        alpha_strict = 0.05 / k
        # Power at ceiling effect (conservative)
        power_ceil = compute_power_two_proportion(
            n=n, p0=p0, delta=ceiling_pp / 100,
            alpha=alpha_strict, alternative='two-sided',
        )
        power_half = compute_power_two_proportion(
            n=n, p0=p0, delta=(ceiling_pp / 2) / 100,
            alpha=alpha_strict, alternative='two-sided',
        )
        estimates.append({
            'cycle': r['cycle'],
            'scope': r['scope'],
            'product': r['product'],
            'segment': r['segment'],
            'strategy': r['strategy'],
            'n_trials': n,
            'baseline_rate_pct': r.get('baseline_rate_pct'),
            'delta_pp_observed': r.get('delta_pp'),
            'p_raw': r.get('p_raw'),
            'bonferroni_k': k,
            'alpha_strict': alpha_strict,
            'bias_ceiling_pp': ceiling_pp,
            'power_at_ceiling': round(power_ceil, 4),
            'power_at_half_ceiling': round(power_half, 4),
            'decision': r.get('decision'),
        })

    # Summary: fraction of segments at >=50% power
    with_power = [e for e in estimates if e.get('power_at_ceiling') is not None]
    above_50 = [e for e in with_power if e['power_at_ceiling'] >= 0.50]
    above_80 = [e for e in with_power if e['power_at_ceiling'] >= 0.80]
    print(f'Tests with computed power: {len(with_power)} / {len(estimates)}')
    print(f'  Power ≥ 50% at bias ceiling: {len(above_50)} ({len(above_50)/len(with_power)*100:.1f}%)')
    print(f'  Power ≥ 80% at bias ceiling: {len(above_80)} ({len(above_80)/len(with_power)*100:.1f}%)')

    # Segment-wise summary
    by_segment = defaultdict(list)
    for e in with_power:
        by_segment[e['segment']].append(e['power_at_ceiling'])
    print(f'\nMean power by segment (at bias ceiling):')
    for seg, powers in sorted(by_segment.items()):
        if powers:
            print(f'  {seg:25s}: mean={sum(powers)/len(powers):.3f}, n={len(powers)}')

    # Candidates for reclassification: Reject at low power + positive delta
    reclass_candidates = [
        e for e in with_power
        if e.get('decision') == 'Reject'
        and e.get('delta_pp_observed') is not None
        and e['delta_pp_observed'] > 0
        and e['power_at_ceiling'] < 0.50
        and e['segment'] == 'full'  # primary gate
    ]
    print(f'\nReclassification candidates (Reject + Δ>0 + power<50% on full): {len(reclass_candidates)}')
    for c in sorted(reclass_candidates, key=lambda x: -x['delta_pp_observed'])[:10]:
        print(f'  {c["cycle"]}/{c["product"]}/{c["strategy"][:40]:40s}: Δ={c["delta_pp_observed"]:+.3f} power={c["power_at_ceiling"]:.3f}')

    out = {
        'meta': {
            'checklist_item': 'A2 power estimates',
            'description': 'Power at bias ceiling effect per cycle × product × segment × strategy',
            'bias_ceiling_pp': BIAS_CEILING_PP,
            'power_formula': 'two-proportion z-test approx (scipy.stats.norm)',
            'n_total_estimates': len(estimates),
            'n_with_computed_power': len(with_power),
            'n_power_ge_50pct': len(above_50),
            'n_power_ge_80pct': len(above_80),
            'n_reclassification_candidates_full': len(reclass_candidates),
        },
        'by_segment_mean_power': {seg: sum(ps)/len(ps) if ps else 0 for seg, ps in by_segment.items()},
        'reclassification_candidates_full': sorted(reclass_candidates, key=lambda x: -x['delta_pp_observed']),
        'all_estimates': estimates,
    }
    out_path = OUT_DIR / 'cycle20_a2_power_estimates.json'
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f'✓ Saved {out_path}')
    return estimates


# ---------------------------------------------------------------------------
# A3. Family evidence
# ---------------------------------------------------------------------------

def classify_strategy(strategy: str) -> str:
    """Map strategy name → family label."""
    s = strategy.lower()
    if 'random' in s:
        return 'baseline_random'
    if 'freqhot' in s or 'freqwholehot' in s or 'freq_hot' in s or 'frequency' in s or 'cold' in s:
        return 'frequency'
    if 'pattern' in s:
        return 'pattern'
    if 'expdecay' in s:
        return 'exp_decay'
    if 'hmm' in s:
        return 'hmm_regime'
    if 'kelly' in s or 'wheeling' in s or 'hybridparity' in s or 'mindistance' in s:
        return 'kelly_portfolio'
    if 'gbm' in s:
        return 'gbm_discriminative'
    if 'copula' in s:
        return 'copula'
    if 'pooled' in s or 'crossproduct' in s or 'cross_product' in s:
        return 'cross_product'
    if 'hierarchicalbayes' in s or 'bayesian' in s or 'bayes_sharp' in s or 'onlinebayes' in s:
        return 'bayesian'
    if 'adaptive' in s:
        return 'adaptive'
    if 'jointdigit' in s or 'digitbias' in s or 'conditionalchain' in s:
        return 'joint_digit_bias'
    if 'maxentropy' in s:
        return 'max_entropy'
    if 'ensemble' in s or 'composite' in s or 'multisignal' in s or 'ultimate' in s or 'hybrid' in s:
        return 'ensemble'
    if 'coverage' in s or 'evmax' in s or 'stratified' in s or 'tierweighted' in s or 'portfolio' in s:
        return 'coverage_evmax'
    if 'kldivergence' in s:
        return 'kldivergence'
    return f'other({strategy[:30]})'


def run_a3_family_evidence(rows: list[dict] | None = None):
    print('\n=== A3 — Family evidence aggregation ===')
    if rows is None:
        rows = _load_all_sig_blocks()
    vs_random = [r for r in rows if 'Random' in (r.get('baseline_name') or '') and r['segment'] == 'full']

    # Per strategy, track family and verdict
    by_family = defaultdict(list)
    for r in vs_random:
        fam = classify_strategy(r['strategy'])
        by_family[fam].append(r)

    # Summary per family
    summary = {}
    for fam, tests in sorted(by_family.items()):
        cycles = sorted(set(t['cycle'] for t in tests))
        rejects = [t for t in tests if t.get('decision') == 'Reject']
        positive_delta_rejects = [t for t in tests if t.get('decision') == 'Reject' and (t.get('delta_pp') or 0) > 0]
        mean_delta = sum((t.get('delta_pp') or 0) for t in tests) / len(tests) if tests else 0
        summary[fam] = {
            'n_tests_full_segment': len(tests),
            'cycles_tested': cycles,
            'n_rejects': len(rejects),
            'n_positive_delta_rejects': len(positive_delta_rejects),
            'convergent': len(cycles) >= 2 and len(rejects) >= 2,
            'mean_delta_pp': round(mean_delta, 4),
            'min_delta_pp': round(min((t.get('delta_pp') or 0) for t in tests), 4) if tests else 0,
            'max_delta_pp': round(max((t.get('delta_pp') or 0) for t in tests), 4) if tests else 0,
        }
        mark = '⚠ ELIMINATED' if summary[fam]['convergent'] else ''
        print(f'  {fam:25s}: n={len(tests):3d} cycles={cycles} rejects={len(rejects)} mean_Δ={mean_delta:+.3f}pp {mark}')

    out = {
        'meta': {
            'checklist_item': 'A3 family evidence',
            'description': 'Convergent evidence count per mechanism family',
            'n_families': len(by_family),
            'n_eliminated_families_convergent': sum(1 for s in summary.values() if s['convergent']),
        },
        'per_family': summary,
    }
    out_path = OUT_DIR / 'cycle20_a3_family_evidence.json'
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f'✓ Saved {out_path}')
    return summary


# ---------------------------------------------------------------------------
# A4. Composite re-score
# ---------------------------------------------------------------------------

def extract_metrics_for_composite(obj: Any, path: tuple = (), out: list | None = None):
    if out is None: out = []
    if isinstance(obj, dict):
        has_roi = 'roi_pct' in obj
        has_win = 'win_rate_pct' in obj
        has_exact = 'exact_match_rate_pct' in obj
        is_leaf = has_roi and (has_win or has_exact)
        if is_leaf:
            strat = path[-1] if path else '?'
            segment = '?'
            for p in reversed(path):
                if str(p) in ('full', 'half1', 'half2', 'forward', 'forward_last_100'):
                    segment = str(p); break
            sig = obj.get('sig_vs_Random', {})
            out.append({
                'path': '/'.join(str(x) for x in path),
                'segment': segment,
                'strategy': strat,
                'roi_pct': obj.get('roi_pct'),
                'win_rate': obj.get('win_rate_pct') or obj.get('exact_match_rate_pct'),
                'sharpe': obj.get('sharpe_ratio'),
                'p_raw': sig.get('p_value_raw'),
            })
            return out
        for k, v in obj.items():
            extract_metrics_for_composite(v, path + (k,), out)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            extract_metrics_for_composite(v, path + (f'[{i}]',), out)
    return out


def run_a4_composite_rescore():
    print('\n=== A4 — Composite tournament re-score ===')
    all_rows = []
    for cycle, scope, relpath in RESULT_FILES:
        p = ROOT / relpath
        if not p.exists(): continue
        data = json.loads(p.read_text())
        rows = extract_metrics_for_composite(data)
        for r in rows:
            r['cycle'] = cycle
            r['scope'] = scope
        all_rows.extend(rows)

    # Full segment only
    full_rows = [r for r in all_rows if r['segment'] == 'full']
    # Filter valid metric rows (have all 4 dimensions)
    valid = [r for r in full_rows if all(r.get(k) is not None for k in ('roi_pct', 'win_rate', 'sharpe', 'p_raw'))]
    print(f'Full-segment strategy results: {len(full_rows)}, with all 4 metrics: {len(valid)}')

    # Normalize per (cycle, product) group: z-score each metric, apply weights
    # Product detection from path
    def get_product(row):
        for p in row['path'].split('/'):
            if p in ('max_3d', 'max_3d_pro', 'power_655', 'power_645', 'power_535', 'mega_645', 'lotto_535'):
                return p
        return 'unknown'

    for r in valid:
        r['product'] = get_product(r)

    # Group
    groups = defaultdict(list)
    for r in valid:
        groups[(r['cycle'], r['product'])].append(r)

    # Per group, z-score and composite
    WEIGHTS = {'win_rate': 0.40, 'roi_pct': 0.30, 'sharpe': 0.15, 'p_neg_log': 0.15}
    flips = []
    for (cycle, product), group in groups.items():
        if len(group) < 2:
            continue
        # Extract arrays
        wr = [g['win_rate'] for g in group]
        roi = [g['roi_pct'] for g in group]
        shp = [g['sharpe'] for g in group]
        plog = [-math.log10(max(g['p_raw'], 1e-20)) for g in group]
        # Z-score (sample)
        def zs(arr):
            if len(arr) < 2: return [0]*len(arr)
            m = sum(arr)/len(arr)
            v = sum((x-m)**2 for x in arr)/(len(arr)-1)
            sd = math.sqrt(v) if v > 0 else 1.0
            return [(x-m)/sd for x in arr]
        z_wr, z_roi, z_shp, z_plog = zs(wr), zs(roi), zs(shp), zs(plog)
        for i, g in enumerate(group):
            g['composite'] = (
                WEIGHTS['win_rate']*z_wr[i] + WEIGHTS['roi_pct']*z_roi[i]
                + WEIGHTS['sharpe']*z_shp[i] + WEIGHTS['p_neg_log']*z_plog[i]
            )
        # Sort three ways
        win_top = max(group, key=lambda x: x['win_rate'])
        roi_top = max(group, key=lambda x: x['roi_pct'])
        comp_top = max(group, key=lambda x: x['composite'])
        flip = (win_top['strategy'] != comp_top['strategy']) or (roi_top['strategy'] != comp_top['strategy'])
        if flip:
            flips.append({
                'cycle': cycle,
                'product': product,
                'win_top': win_top['strategy'],
                'roi_top': roi_top['strategy'],
                'composite_top': comp_top['strategy'],
                'comp_top_composite': round(comp_top['composite'], 3),
                'win_top_composite': round(win_top['composite'], 3),
                'n_strategies': len(group),
            })

    print(f'\nGroups analyzed: {len(groups)}')
    print(f'Groups with composite-top ≠ win-top OR composite-top ≠ roi-top: {len(flips)}')
    for f in flips:
        print(f'  {f["cycle"]}/{f["product"]}: comp={f["composite_top"][:40]} vs win={f["win_top"][:40]} vs roi={f["roi_top"][:40]}')

    out = {
        'meta': {
            'checklist_item': 'A4 composite re-score',
            'weights': WEIGHTS,
            'description': 'Re-rank cycles 7-17 strategies by composite z-score. Flag groups where composite-top ≠ single-metric-top',
            'n_groups': len(groups),
            'n_flips': len(flips),
        },
        'flips': flips,
    }
    out_path = OUT_DIR / 'cycle20_a4_composite_rescore.json'
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f'✓ Saved {out_path}')
    return flips


# ---------------------------------------------------------------------------
# A5. Minimum-N per product × effect size
# ---------------------------------------------------------------------------

def required_n_for_power(p0: float, delta: float, alpha: float, power_target: float = 0.80) -> int:
    """Minimum n per group for two-proportion z-test at target power."""
    if delta == 0 or p0 <= 0 or p0 >= 1:
        return 10**9
    p1 = max(0.0, min(1.0, p0 + delta))
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power_target)
    numer = (z_alpha + z_beta) ** 2 * (p0 * (1 - p0) + p1 * (1 - p1))
    denom = delta ** 2
    return int(math.ceil(numer / denom))


def run_a5_min_n_table():
    print('\n=== A5 — Minimum N per product × effect size ===')
    # Current N per product
    from pathlib import Path
    DATA = Path('data')
    product_N = {}
    for p, fname in (('max_3d', '3d.jsonl'), ('max_3d_pro', '3d_pro.jsonl'),
                      ('power_655', 'power655.jsonl'), ('power_645', 'power645.jsonl'),
                      ('power_535', 'power535.jsonl')):
        f = DATA / fname
        if f.exists():
            product_N[p] = sum(1 for _ in f.read_text().strip().split('\n'))
    print(f'Current N per product: {product_N}')

    effect_sizes = [0.05, 0.1, 0.2, 0.3, 0.5, 1.0]  # pp
    alpha = 0.05 / 10  # future Bonferroni ~K=10
    power_targets = [0.50, 0.80]

    rows = []
    for prod, N in product_N.items():
        p0_pct = PRODUCTS_BASELINE_RATE_PCT.get(prod, 2.0)
        p0 = p0_pct / 100
        row = {'product': prod, 'N_current': N, 'p0_baseline_pct': p0_pct}
        for delta_pp in effect_sizes:
            delta = delta_pp / 100
            for target in power_targets:
                n_req = required_n_for_power(p0, delta, alpha, target)
                row[f'n_req_Δ{delta_pp}pp_power{int(target*100)}'] = n_req
        rows.append(row)

    # Print table
    print(f'\n{"Product":15s} {"N_cur":>6s} ', end='')
    for d in effect_sizes:
        print(f'{"Δ"+str(d)+"/80%":>14s}', end='')
    print()
    for r in rows:
        print(f'{r["product"]:15s} {r["N_current"]:6d}', end=' ')
        for d in effect_sizes:
            n = r[f'n_req_Δ{d}pp_power80']
            mark = '✓' if n <= r['N_current'] else '✗'
            print(f'{str(n)+mark:>14s}', end='')
        print()

    # Underpowered flag per product (can't detect Δ=0.3pp at 80% with current N)
    underpowered = []
    for r in rows:
        if r['N_current'] < r['n_req_Δ0.3pp_power80']:
            underpowered.append({
                'product': r['product'],
                'N_current': r['N_current'],
                'N_required_for_Δ0.3pp_80%': r['n_req_Δ0.3pp_power80'],
                'ratio': round(r['N_current'] / r['n_req_Δ0.3pp_power80'], 3),
            })

    print(f'\nUnderpowered products (cannot detect Δ=0.3pp at 80% power):')
    for u in underpowered:
        print(f'  {u["product"]}: N={u["N_current"]} vs {u["N_required_for_Δ0.3pp_80%"]} required (ratio={u["ratio"]})')

    out = {
        'meta': {
            'checklist_item': 'A5 min-N table',
            'alpha': alpha,
            'bonferroni_k_assumed': 10,
            'effect_sizes_pp': effect_sizes,
            'power_targets': power_targets,
            'n_underpowered_at_0_3pp_80pct': len(underpowered),
        },
        'rows': rows,
        'underpowered_products': underpowered,
    }
    out_path = OUT_DIR / 'cycle20_a5_min_n_table.json'
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f'✓ Saved {out_path}')
    return underpowered


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print('=' * 72)
    print('Chu Kỳ 20 — Baseline Analysis (A1-A5)')
    print('=' * 72)
    rows = run_a1_verdict_census()
    run_a2_power_estimates(rows)
    run_a3_family_evidence(rows)
    run_a4_composite_rescore()
    run_a5_min_n_table()
    print('\n' + '=' * 72)
    print('✓ All 5 baseline analyses complete. Outputs in website/research/post_closure/cycle20_a{1..5}_*.json')
    print('=' * 72)


if __name__ == '__main__':
    main()
