# Phase 2: Research Findings — Lottery Optimization Algorithms

**Date**: 2025-07-25  
**Sources**: Wikipedia (Lottery Wheeling, Covering Design, Block Design), Gordon-Kuperberg-Patashnik 1995, Bluskov 2020, mathematical combinatorics literature

---

## 1. Key Mathematical Insight

**Lottery draws are independent random events.** No algorithm can predict future draws from past data. The only provably effective approaches are:

1. **Coverage optimization** — Maximize the probability that at least one ticket in a set matches at a given threshold
2. **Diversity maximization** — Spread numbers across tickets to avoid redundancy
3. **Statistical soundness** — Properly quantify uncertainty instead of overfitting to noise

These are fundamentally different from "predictive" strategies. They optimize the **ticket portfolio**, not individual ticket selection.

---

## 2. Lottery Wheeling Systems (Covering Designs)

### 2.1 Theory

A **covering design** C(v, k, t) is a collection of k-element subsets (blocks/tickets) of a v-element set such that every t-element subset is contained in at least one block.

**Application to lottery**: For a pick-6 from 1-55 lottery:
- v = number of "player's numbers" (a subset to focus on, e.g., 10-15 numbers)
- k = 6 (numbers per ticket)  
- t = guarantee level (e.g., t=3 means "guarantee at least 3 matches if t of player's numbers are drawn")

### 2.2 Guarantee Types

| System | Meaning | Tickets needed (12 numbers, pick-6) |
|--------|---------|-------------------------------------|
| 6 if 6 | Full wheel — jackpot if all drawn | C(12,6) = 924 |
| 4 if 4 | At least one 4-match if 4 of your nums drawn | ~20 tickets |
| 3 if 3 | At least one 3-match if 3 of your nums drawn | ~10-15 tickets |

### 2.3 Construction Methods (from Gordon et al. 1995)

1. **Greedy algorithm**: Repeatedly pick the k-subset covering the most uncovered t-subsets → ~42% of optimal solutions use this
2. **Cyclic construction**: Take a single block and all cyclic shifts mod v
3. **Simulated annealing**: Start random, iteratively improve (Nurmela & Östergård 1993)
4. **Finite geometry**: Use projective/affine planes for specific parameter families

### 2.4 Key Formula — Schönheim Lower Bound

```
C(v,k,t) ≥ ⌈(v/k) × ⌈((v-1)/(k-1)) × ... × ⌈(v-t+1)/(k-t+1)⌉...⌉⌉
```

This gives the minimum possible number of tickets for a given guarantee.

### 2.5 Implementation Plan

For our website, implement an **abbreviated wheel generator**:
1. User selects N "favorite" numbers (8-15 numbers)
2. System generates minimum ticket set guaranteeing 3-if-3 or 4-if-4
3. Use greedy covering algorithm (practical, near-optimal)

---

## 3. Diversity-Maximized Ticket Sets

### 3.1 Problem

Current strategies generate tickets independently → high redundancy (same numbers appear across tickets).

### 3.2 Solution: Min-Distance Ticket Generation

Generate a set of tickets maximizing **minimum pairwise Hamming distance**:
- Hamming distance between two tickets = number of positions where they differ
- For sets: Jaccard distance = 1 - |A∩B| / |A∪B|

### 3.3 Algorithm

1. Generate first ticket (any strategy)
2. For each subsequent ticket, sample N candidates and pick the one with maximum minimum distance to all existing tickets
3. Enforce range balance: each of 5 equal-width sub-ranges should have ≥1 number per ticket

---

## 4. Bayesian Number Scoring (Dirichlet-Multinomial)

### 4.1 Problem with Current Frequency Strategy

Current: P(number n) ∝ count(n) / total_draws  
Issue: Point estimate ignores uncertainty. With 100 draws, 5 vs 6 occurrences is NOT meaningful.

### 4.2 Bayesian Approach

Model number draws as Multinomial(θ₁, ..., θᵥ) with Dirichlet prior:
```
θ ~ Dir(α₁, ..., αᵥ)
Posterior: θ|data ~ Dir(α₁ + c₁, ..., αᵥ + cᵥ)
```
Where:
- αᵢ = prior (set to 1 for uniform = "every number equally likely")
- cᵢ = observed count of number i in recent draws

### 4.3 Benefits

1. **Proper uncertainty**: Posterior variance shrinks with more data
2. **Credible intervals**: Can compute P(θᵢ > θⱼ) — is number i really "hotter" than j?
3. **Sample from posterior**: Each prediction samples a different θ, giving natural diversity
4. **Anti-overfitting**: With uniform prior, small frequency differences are properly discounted

### 4.4 Implementation

```python
# Posterior predictive: sample θ from Dirichlet, then sample numbers weighted by θ
alpha = np.ones(max_val) + counts  # Dirichlet parameters
theta = np.random.dirichlet(alpha)  # Sample probability vector
numbers = np.random.choice(range(1, max_val+1), size=num_count, p=theta, replace=False)
```

---

## 5. Ensemble Strategy (Rank Aggregation)

### 5.1 Concept

Instead of picking one strategy, run multiple strategies and combine their outputs.

### 5.2 Methods

1. **Borda Count**: Each strategy ranks numbers; sum ranks across strategies; pick top-k
2. **Weighted voting**: Each strategy "votes" for its predicted numbers; count votes weighted by strategy's backtest performance
3. **Stacking**: Use a meta-strategy that learns optimal weights

### 5.3 Implementation Plan

1. Run 5 base strategies (Freq_Hot, Freq_Cold, Pattern, ExpDecay, LongAbsence)
2. Each produces a ranking of all numbers
3. Aggregate rankings using Borda count
4. Select top-k from aggregated ranking + randomization for diversity

---

## 6. Information-Theoretic Coverage Strategy

### 6.1 Concept

Maximize the **information content** of each ticket by ensuring numbers are spread across the full range with maximum entropy.

### 6.2 Algorithm (Maximum Entropy Sampling)

1. Divide number range into num_count equal bands
2. From each band, sample exactly one number
3. Within each band, use historical frequency as prior (Bayesian)
4. This guarantees structural diversity while incorporating historical signal

### 6.3 Theoretical Backing

Shannon entropy of a ticket: H = -Σ p(nᵢ) log p(nᵢ)  
Maximum entropy subject to constraints yields the most "diverse" ticket.

---

## 7. Adaptive Window Strategy

### 7.1 Problem

Current strategies use fixed lookback_days (30, 90, 180, 365). Optimal window varies over time.

### 7.2 Solution: Exponential Smoothing with Adaptive α

Instead of a fixed window, use exponentially weighted moving average with adaptive smoothing parameter:

```
S(n, t) = α × I(n drawn at t) + (1-α) × S(n, t-1)
```

Where α is optimized via recent prediction performance (mini-backtest on last 50 draws).

---

## 8. Algorithm Selection for Each Product

Based on product characteristics:

| Product | Best Approach | Reason |
|---------|--------------|--------|
| Power 6/55 | Bayesian + Wheeling | Large number space (55), needs coverage |
| Power 6/45 | Ensemble + Diversity | Medium space, multiple strategies similar |
| Power 5/35 | Frequency_Cold + Max Entropy | Smaller space, cold numbers showed signal |
| Max 3D | Digit-position Bayesian | Fixed 3-digit structure |
| Max 3D Pro | Position-aware Markov | Multiple tiers, position matters |

---

## 9. Summary: New Algorithms to Implement

| # | Algorithm | Type | Key Advantage |
|---|-----------|------|---------------|
| 1 | Wheeling System | Coverage | **Guaranteed** minimum matches for ticket sets |
| 2 | Bayesian Dirichlet | Statistical | Proper uncertainty, anti-overfitting |
| 3 | Ensemble (Borda Count) | Meta | Combines strength of multiple strategies |
| 4 | Max-Entropy Sampling | Information | Structural diversity, range balance |
| 5 | Min-Distance Diversity | Portfolio | Minimizes redundancy across tickets |
| 6 | Adaptive Window | Optimization | Self-tuning lookback period |

---

## 10. References

1. Gordon, D.M., Kuperberg, G., Patashnik, O. (1995). "New constructions for covering designs." Journal of Combinatorial Designs, 3(4), 269–284.
2. Bluskov, I. (2020). "Combinatorial Systems (Wheels) for Pick-6 Lotteries." Lotbook Publishing.
3. Nurmela, K.J., Östergård, P.R.J. (1993). "Upper bounds for covering designs by simulated annealing." Congressus Numerantium, 96, 93–111.
4. Schönheim, J. (1964). "On coverings." Pacific Journal of Mathematics, 14(4), 1405–1411.
5. Wikipedia: Lottery Wheeling, Covering Design, Block Design (accessed 2025-07-25)
