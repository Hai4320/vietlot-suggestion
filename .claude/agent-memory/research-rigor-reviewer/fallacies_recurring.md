---
name: recurring-fallacies-in-strategies
description: Specific named fallacies present in the project's strategy code, with file pointers
type: project
---

These specific fallacies recur across the strategy codebase. The architecture itself encodes them — they are not user errors in invocation.

1. **Gambler's fallacy ("due numbers")** — `LongAbsenceStrategy` (`strategies/long_absence.py`) ranks numbers by days-since-last-appearance and oversamples those with the longest gap. For i.i.d. draws this is mathematically equivalent to random selection in expectation but with strictly higher variance (stratification on a noise feature). The `suggest.py` Stats class also has a `days_since` term in its composite score with weight 0.20.

2. **Reverse gambler's fallacy / hot-hand** — `FrequencyStrategy(strategy_type="hot")` and `ExponentialDecayStrategy` upweight recently-frequent numbers. Same critique: under i.i.d. uniformity, the "frequency signal" is just noise.

3. **Bayesian-with-broken-prior** — `BayesianDirichletStrategy`. With a uniform Dirichlet prior under truly i.i.d. uniform draws, the posterior mean θ_i = (1+c_i)/(V+N) converges to 1/V, so the posterior is asymptotically uniform. The deviation it samples is purely posterior variance (which grows like 1/√N) interpreted as signal. The "evidence" is meaningful only if you already believed non-uniformity exists.

4. **Texas sharpshooter / multiple comparisons** — the readme ranks 8 strategies by ROI on the same backtest. With 8 strategies on essentially the same noise, the top of the ranking is whichever one happened to lottery-hit a 5-match draw. No FWER correction.

5. **Survivorship in design** — strategies that performed badly during development presumably got removed before the readme/check-rate were authored. The reported strategy set is itself a filtered population.

**Why:** These are subtle errors that a casual reader of the readme or suggest.py output will not catch. The strategies *look* statistically motivated (Dirichlet! exponential decay! co-occurrence!) but are operating on a noise channel.

**How to apply:** When reviewing additions to this strategy zoo, ask: "If you ran this strategy on uniform i.i.d. simulated data of the same N, would the strategy's reported edge persist?" If the answer is no, the apparent edge is overfitting to historical noise.
