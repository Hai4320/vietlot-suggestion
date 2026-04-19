# Phase 1: Comprehensive Backtest Analysis Report

**Date**: 2025-07-25
**Backtest Script**: `phase1_backtest_standalone.py`
**Output Data**: `phase1_backtest_results.json`

---

## 1. Executive Summary

All 10 existing strategies were backtested across 3 matrix products (Power 6/55, Power 6/45, Power 5/35) using walk-forward validation with 3 independent runs per strategy. **No strategy consistently or meaningfully outperforms the theoretical random baseline** across all products. The differences observed are within sampling noise (+/- 0.03 avg matches).

### Key Metrics Across Products

| Product | Draws | E[matches] | P(win≥3) | Best Strategy | Best Δ | Best ROI |
|---------|-------|-----------|----------|---------------|--------|----------|
| Power 6/55 | 1,334 | 0.6545 | 1.33% | Frequency_Hot | +0.029 | -92.63% |
| Power 6/45 | 1,301 | 0.8000 | 2.38% | Random | +0.010 | -62.09%* |
| Power 5/35 | 538 | 0.7143 | 1.39% | Frequency_Cold | +0.120** | -76.33% |

\* One lucky 5-match hit skewed ExpDecay_Cold ROI  
\*\* Small sample (507 predictions) — likely noise

---

## 2. Theoretical Baselines (Hypergeometric Distribution)

### Power 6/55 (pick 6 from 1-55)
| Matches | Probability | 1-in |
|---------|------------|------|
| 0 | 48.24% | 2.1 |
| 1 | 39.47% | 2.5 |
| 2 | 10.96% | 9.1 |
| 3 | 1.27% | 78.7 |
| 4 | 0.061% | 1,643 |
| 5 | 0.001% | 98,618 |
| 6 | 0.000003% | 33,294,492 |

**Expected matches per ticket**: 0.6545  
**P(win≥3)**: 1.33%

### Power 6/45 (pick 6 from 1-45)
| Matches | Probability | 1-in |
|---------|------------|------|
| 0 | 40.06% | 2.5 |
| 1 | 42.41% | 2.4 |
| 2 | 15.15% | 6.6 |
| 3 | 2.24% | 44.6 |
| 4 | 0.136% | 733 |
| 5 | 0.003% | 34,808 |
| 6 | 0.000012% | 8,145,060 |

**Expected matches per ticket**: 0.8000  
**P(win≥3)**: 2.38%

### Power 5/35 (pick 5 from 1-35)
| Matches | Probability | 1-in |
|---------|------------|------|
| 0 | 43.90% | 2.3 |
| 1 | 42.21% | 2.4 |
| 2 | 12.51% | 8.0 |
| 3 | 1.34% | 74.6 |
| 4 | 0.046% | 2,168 |
| 5 | 0.0003% | 324,632 |

**Expected matches per ticket**: 0.7143  
**P(win≥3)**: 1.39%

---

## 3. Strategy Performance Details

### 3.1 Power 6/55

| Rank | Strategy | Avg Matches | Δ vs Baseline | Win Rate | ROI | Sharpe | Best |
|------|----------|-------------|---------------|----------|-----|--------|------|
| 1 | Frequency_Hot | 0.6837 | +0.0292 | 1.40% | -94.33% | -8.75 | 4 |
| 2 | NotRepeat | 0.6772 | +0.0227 | 1.49% | -93.35% | -7.30 | 4 |
| 3 | Random | 0.6764 | +0.0219 | 1.46% | -94.17% | -8.70 | 4 |
| 4 | LongAbsence | 0.6572 | +0.0027 | 1.24% | -94.81% | -8.90 | 4 |
| 5 | ExpDecay_Hot | 0.6556 | +0.0011 | 1.49% | -92.63% | -6.39 | 4 |
| 6 | ExpDecay_Cold | 0.6545 | ±0.0000 | 1.32% | -94.57% | -8.82 | 4 |
| 7 | Pattern | 0.6524 | -0.0021 | 1.27% | -93.27% | -6.49 | 4 |
| 8 | Freq_Balanced | 0.6513 | -0.0032 | 1.40% | -93.60% | -7.34 | 4 |
| 9 | Frequency_Cold | 0.6375 | -0.0170 | 1.22% | -94.89% | -8.92 | 4 |
| 10 | PairFrequency | 0.6167 | -0.0378 | 1.13% | -94.41% | -7.51 | 4 |

**Observations**:
- Frequency_Hot leads but the +0.029 delta over 3700 predictions is statistically marginal
- PairFrequency is the **worst** performer — greedy co-occurrence selection actually hurts
- Cold number strategies consistently underperform (Frequency_Cold, ExpDecay_Cold)
- All ROIs are deeply negative (~-93%)

### 3.2 Power 6/45

| Rank | Strategy | Avg Matches | Δ vs Baseline | Win Rate | ROI | Sharpe | Best |
|------|----------|-------------|---------------|----------|-----|--------|------|
| 1 | Random | 0.8099 | +0.0099 | 2.36% | -88.43% | -4.92 | 4 |
| 2 | Pattern | 0.8054 | +0.0054 | 2.66% | -86.01% | -4.18 | 4 |
| 3 | Frequency_Hot | 0.8016 | +0.0016 | 2.03% | -90.17% | -5.48 | 4 |
| 4 | ExpDecay_Hot | 0.8013 | +0.0013 | 2.33% | -89.26% | -5.37 | 4 |
| 5 | PairFrequency | 0.8010 | +0.0010 | 2.16% | -89.01% | -4.97 | 4 |
| 6 | ExpDecay_Cold | 0.8007 | +0.0007 | 2.41% | -62.09%* | -0.27 | **5** |
| 7 | Freq_Balanced | 0.7999 | -0.0001 | 2.16% | -88.26% | -4.60 | 4 |
| 8 | LongAbsence | 0.7935 | -0.0065 | 2.33% | -87.76% | -4.56 | 4 |
| 9 | Frequency_Cold | 0.7852 | -0.0148 | 2.41% | -89.01% | -5.34 | 4 |
| 10 | NotRepeat | 0.7816 | -0.0184 | 2.69% | -87.43% | -4.82 | 4 |

\* ExpDecay_Cold's ROI skewed by a single 5-match hit (10M VND prize)

**Observations**:
- Random is literally the best strategy
- Pattern does well on win rate (2.66%) due to better range distribution
- NotRepeat, which was #2 on power_655, is worst here — product-specific behavior

### 3.3 Power 5/35

| Rank | Strategy | Avg Matches | Δ vs Baseline | Win Rate | ROI | Sharpe | Best |
|------|----------|-------------|---------------|----------|-----|--------|------|
| 1 | Frequency_Cold | 0.8343 | +0.1200 | 2.76% | -86.19% | -7.58 | 3 |
| 2 | Random | 0.7594 | +0.0451 | 1.18% | -76.33% | -1.74 | 4 |
| 3 | Freq_Balanced | 0.7475 | +0.0332 | 2.17% | -89.15% | -8.82 | 3 |
| 4 | ExpDecay_Hot | 0.7357 | +0.0214 | 1.18% | -94.08% | -12.54 | 3 |
| 5 | Pattern | 0.7219 | +0.0076 | 1.58% | -83.23% | -2.62 | 4 |
| 6 | PairFrequency | 0.7219 | +0.0076 | 0.59% | -97.04% | -18.23 | 3 |
| 7 | ExpDecay_Cold | 0.7160 | +0.0017 | 1.18% | -94.08% | -12.54 | 3 |
| 8 | Frequency_Hot | 0.7140 | -0.0003 | 1.38% | -93.10% | -11.50 | 3 |
| 9 | LongAbsence | 0.7002 | -0.0141 | 0.79% | -96.06% | -15.64 | 3 |
| 10 | NotRepeat | 0.6982 | -0.0161 | 1.38% | -93.10% | -11.50 | 3 |

**Observations**:
- Frequency_Cold has the largest delta (+0.12) BUT only 507 predictions — unreliable
- Random again in top 2
- PairFrequency has decent avg_matches but worst win rate (0.59%) — gets lots of 2s but not 3s
- Power 5/35 is a newer product (538 draws since 2025-06), insufficient for reliable comparison

---

## 4. Cross-Product Analysis

### Strategy Ranking Consistency

| Strategy | P655 Rank | P645 Rank | P535 Rank | Avg Rank |
|----------|-----------|-----------|-----------|----------|
| Random | 3 | 1 | 2 | 2.0 |
| Frequency_Hot | 1 | 3 | 8 | 4.0 |
| Pattern | 7 | 2 | 5 | 4.7 |
| ExpDecay_Hot | 5 | 4 | 4 | 4.3 |
| Freq_Balanced | 8 | 7 | 3 | 6.0 |
| NotRepeat | 2 | 10 | 10 | 7.3 |
| LongAbsence | 4 | 8 | 9 | 7.0 |
| Frequency_Cold | 9 | 9 | 1 | 6.3 |
| ExpDecay_Cold | 6 | 6 | 7 | 6.3 |
| PairFrequency | 10 | 5 | 6 | 7.0 |

**Most consistent strategies**: Random (avg rank 2.0), ExpDecay_Hot (avg rank 4.3)

### Key Insights

1. **Random is the most robust strategy** — consistently in top 3 across all products
2. **No strategy is universally good** — rankings shift dramatically between products
3. **Hot vs Cold is noise** — which mode wins depends entirely on the product/sample
4. **PairFrequency (co-occurrence) actively hurts** on power_655 — greedy pair selection creates structural bias
5. **All ROIs are catastrophic** — even the "best" strategies lose 76-97% of investment
6. **The lottery is fundamentally random** — as expected, no historical pattern provides meaningful edge

---

## 5. Problems with Current Strategies

### 5.1 Fundamental Issues
1. **Stochastic nature**: Lottery draws are independent events — past draws do not influence future draws
2. **Confirmation bias in design**: All strategies assume some form of serial correlation that doesn't exist
3. **High variance**: With ~0.65-0.8 expected matches, strategies need 10,000+ predictions to distinguish signal from noise

### 5.2 Implementation Issues
1. **PredictModel base class hardcoded for Power 6/55** — `number_predict=6`, `max_val=55`
2. **Strategies don't adapt num_count/max_val dynamically** — manual override needed
3. **No coverage optimization** — strategies optimize for expected matches, not coverage diversity
4. **No ensemble/combination approach** — each strategy operates independently
5. **No ticket portfolio optimization** — buying multiple diverse tickets could improve cover rates

### 5.3 Missing Approach Categories
1. **Combinatorial coverage (lottery wheeling)** — guaranteed minimum matches across a set of tickets
2. **Information-theoretic approaches** — maximize entropy/information gain per ticket
3. **Bayesian methods** — proper uncertainty quantification instead of point estimates
4. **Portfolio optimization** — Markowitz-style coverage diversification across tickets
5. **Number-space coverage** — maximize the fraction of possible outcomes "covered"

---

## 6. Recommendations for Phase 2+

### Priority 1: Combinatorial Coverage (Wheeling Systems)
- Implement lottery wheel generation (balanced incomplete block designs)
- Optimize for guaranteed k-of-n coverage across ticket sets
- This is the only mathematically proven way to improve expected returns per ticket set

### Priority 2: Coverage Diversification
- Generate diverse ticket sets that maximize unique number coverage
- Implement min-distance constraints between tickets
- Optimize for "at least one ticket matches 3+" probability

### Priority 3: Bayesian Number Scoring
- Replace point-estimate frequencies with proper posterior distributions
- Implement Dirichlet-multinomial model for number selection probabilities
- Quantify uncertainty in frequency estimates

### Priority 4: Ensemble Methods
- Combine multiple strategy signals via weighted voting
- Use rank aggregation across strategies
- Meta-strategy that adaptively weights sub-strategies

### Priority 5: Product-Specific Tuning
- Different optimal approaches for different products (6/55 vs 5/35)
- Adaptive parameter tuning via cross-validation within walk-forward framework

---

## 7. Files Generated

| File | Description |
|------|-------------|
| `phase1_backtest_standalone.py` | Self-contained backtest script (no project deps) |
| `phase1_backtest_results.json` | Full results data (JSON) |
| `phase1_analysis_report.md` | This report |
