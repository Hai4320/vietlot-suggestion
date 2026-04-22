"""HMM regime detection for Vietlott lottery (Chu kỳ 17).

Implements 2-state Gaussian HMM với observations = [chi²_recent_W, max_dev_recent_W]
on digit frequency (3D) or number frequency (matrix). Walk-forward fit per-draw
với no look-ahead, Viterbi decode state posterior, strategy switch per inferred regime.

Pre-reg: website/research/proposals/executed/cycle17_hmm_regime.md
Principle §3.10 (#16): Retry Tree documented inline pre-reg.

Reproducibility: seed=42 throughout. Baum-Welch EM w/ 10 random restarts, pick best log-lik.

Usage:
    from hmm_regime import (
        compute_observation_sequence_3d,
        compute_observation_sequence_matrix,
        fit_hmm_k2,
        viterbi_decode,
        walk_forward_regime_predict,
    )

All functions pure; HMM model objects are hmmlearn.GaussianHMM instances.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from hmmlearn import hmm


# ---------------------------------------------------------------------------
# Observation features
# ---------------------------------------------------------------------------


def _chi_square_stat(counts: np.ndarray, expected_count: float) -> float:
    """χ² goodness-of-fit vs uniform expected count per bin."""
    if expected_count <= 0:
        return 0.0
    return float(np.sum((counts - expected_count) ** 2 / expected_count))


def _max_deviation(counts: np.ndarray, expected_count: float) -> float:
    """Max absolute deviation from expected count across bins."""
    if expected_count <= 0 or counts.size == 0:
        return 0.0
    return float(np.max(np.abs(counts - expected_count)))


def compute_observation_sequence_3d(
    draws: list[list[int]],  # each draw = list of integers (0-999 for 3D)
    window: int = 20,
) -> np.ndarray:
    """Compute per-draw 2-dim observation for 3D products.

    3D draws each = 20 numbers (000-999). Observation extracts per-DIGIT statistics
    over recent `window` draws: chi² on digit counts (0-9 × 3 positions = 30 bins)
    và max_dev on same.

    Returns array shape (N - window, 2). First `window` draws excluded from eval.
    Index t of return corresponds to observation available at prediction time t+window.

    Args:
        draws: chronologically sorted list of draws (each = list of 20 ints 0-999)
        window: lookback window (default 20 per pre-reg)

    Returns:
        Array shape (len(draws) - window, 2): [chi², max_dev] per draw
    """
    if window <= 0:
        raise ValueError(f"window must be positive, got {window}")
    N = len(draws)
    if N <= window:
        return np.empty((0, 2), dtype=np.float64)

    n_obs = N - window
    obs = np.zeros((n_obs, 2), dtype=np.float64)

    # Digit counts: 3 positions × 10 digits = 30 bins
    # Expected per bin per draw: 20 numbers / draw × 3 digit-positions-each / 30 bins = 2 per draw
    # Per window: expected = 2 × window
    expected_per_bin = 2.0 * window

    for t in range(n_obs):
        window_start = t
        window_end = t + window  # exclusive
        # Flatten digits: each number → 3 digits
        counts = np.zeros(30, dtype=np.float64)  # bins: pos*10 + digit
        for d in range(window_start, window_end):
            for num in draws[d]:
                n_int = int(num)
                d0, d1, d2 = n_int // 100, (n_int // 10) % 10, n_int % 10
                counts[0 * 10 + d0] += 1
                counts[1 * 10 + d1] += 1
                counts[2 * 10 + d2] += 1

        obs[t, 0] = _chi_square_stat(counts, expected_per_bin)
        obs[t, 1] = _max_deviation(counts, expected_per_bin)

    return obs


def compute_observation_sequence_matrix(
    draws: list[list[int]],
    max_val: int,  # 55 for Power 6/55
    window: int = 20,
) -> np.ndarray:
    """Compute per-draw 2-dim observation for matrix products.

    Matrix draws each = 7 numbers (6 + special for Power 6/55). Observation extracts
    per-NUMBER statistics over recent `window` draws: chi² on number counts
    (max_val bins) và max_dev.

    Returns array shape (N - window, 2). Same semantics as 3D variant.

    Args:
        draws: chronologically sorted list of draws
        max_val: number space upper bound (inclusive 1..max_val)
        window: lookback window

    Returns:
        Array shape (len(draws) - window, 2): [chi², max_dev] per draw
    """
    if window <= 0:
        raise ValueError(f"window must be positive, got {window}")
    if max_val <= 0:
        raise ValueError(f"max_val must be positive, got {max_val}")
    N = len(draws)
    if N <= window:
        return np.empty((0, 2), dtype=np.float64)

    # Expected per bin per window = (numbers_per_draw × window) / max_val
    # For Power 6/55: 7 numbers/draw × window / 55
    if N == 0:
        return np.empty((0, 2), dtype=np.float64)

    numbers_per_draw = len(draws[0])
    expected_per_bin = numbers_per_draw * window / max_val

    n_obs = N - window
    obs = np.zeros((n_obs, 2), dtype=np.float64)

    for t in range(n_obs):
        window_start = t
        window_end = t + window
        counts = np.zeros(max_val, dtype=np.float64)
        for d in range(window_start, window_end):
            for num in draws[d]:
                if 1 <= int(num) <= max_val:
                    counts[int(num) - 1] += 1

        obs[t, 0] = _chi_square_stat(counts, expected_per_bin)
        obs[t, 1] = _max_deviation(counts, expected_per_bin)

    return obs


def normalize_observations(
    obs: np.ndarray,
    train_end: int | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Zero-mean unit-variance normalization using train-window stats.

    Prevents scale mismatch in Gaussian HMM EM (chi² and max_dev have different magnitudes).

    Args:
        obs: observation array (T, D)
        train_end: if given, stats computed only on obs[:train_end]. Else all of obs.

    Returns:
        (normalized_obs, mean, std) — mean/std are training-window stats for re-use.
    """
    if obs.shape[0] == 0:
        return obs, np.zeros(obs.shape[1]), np.ones(obs.shape[1])

    if train_end is None:
        train_end = obs.shape[0]
    train_end = max(1, min(train_end, obs.shape[0]))

    mean = obs[:train_end].mean(axis=0)
    std = obs[:train_end].std(axis=0, ddof=0)
    std = np.where(std < 1e-8, 1.0, std)  # avoid div-by-zero for constant dims

    return (obs - mean) / std, mean, std


# ---------------------------------------------------------------------------
# HMM fit + decode
# ---------------------------------------------------------------------------


@dataclass
class HMMFitResult:
    """Container for HMM fit output."""

    model: hmm.GaussianHMM
    log_likelihood: float
    converged: bool
    n_iter: int
    signal_state: int  # post-fit labeled state with higher mean chi² (exploitable)
    noise_state: int  # remaining state
    means: np.ndarray  # (K, D)
    state_posterior_train: np.ndarray  # (T_train,) Viterbi-decoded state per train obs


def fit_hmm_k2(
    obs_train: np.ndarray,
    n_restart: int = 10,
    max_iter: int = 100,
    tol: float = 1e-4,
    seed: int = 42,
) -> HMMFitResult:
    """Fit 2-state Gaussian HMM with diagonal covariance.

    Uses `n_restart` random initializations (different EM seeds) and picks the
    highest log-likelihood fit to mitigate local optima.

    State labeling convention (post-fit):
      - signal_state = argmax_k μ_k[0]  (state với chi² cao hơn)
      - noise_state = other state

    Args:
        obs_train: training observations (T, D)
        n_restart: random restarts for EM
        max_iter: Baum-Welch EM max iterations
        tol: convergence tolerance (log-likelihood change)
        seed: base seed; restarts use seed+i

    Returns:
        HMMFitResult. Raises if T < 2*D (insufficient data).
    """
    T, D = obs_train.shape
    if T < max(10, 2 * D):
        raise ValueError(f"Insufficient training data: T={T}, D={D}")

    best: HMMFitResult | None = None
    for restart_idx in range(n_restart):
        model = hmm.GaussianHMM(
            n_components=2,
            covariance_type="diag",
            n_iter=max_iter,
            tol=tol,
            random_state=seed + restart_idx,
            init_params="stmc",  # init start(s), transmat(t), means(m), covars(c) from data
            params="stmc",
        )
        try:
            model.fit(obs_train)
        except (ValueError, np.linalg.LinAlgError):
            continue
        try:
            ll = float(model.score(obs_train))
        except (ValueError, np.linalg.LinAlgError):
            continue
        if best is None or ll > best.log_likelihood:
            means = np.asarray(model.means_)  # (2, D)
            signal_state = int(np.argmax(means[:, 0]))
            noise_state = 1 - signal_state
            posterior = np.asarray(model.predict(obs_train))
            best = HMMFitResult(
                model=model,
                log_likelihood=ll,
                converged=bool(getattr(model.monitor_, "converged", False)),
                n_iter=int(getattr(model.monitor_, "iter", max_iter)),
                signal_state=signal_state,
                noise_state=noise_state,
                means=means,
                state_posterior_train=posterior,
            )

    if best is None:
        raise RuntimeError(
            f"HMM fit failed all {n_restart} restarts (T={T}, D={D}). Check data scale / variance."
        )

    return best


def viterbi_decode(model: hmm.GaussianHMM, obs: np.ndarray) -> np.ndarray:
    """Viterbi decode MAP state sequence for given observations."""
    return np.asarray(model.predict(obs), dtype=np.int64)


# ---------------------------------------------------------------------------
# Walk-forward regime prediction + strategy switching
# ---------------------------------------------------------------------------


@dataclass
class WalkForwardConfig:
    """Config for walk-forward HMM backtest."""

    window: int  # observation window W (e.g., 20 or 40)
    min_history: int  # minimum draws before first prediction (default 200)
    refit_every: int  # re-fit HMM every N draws for efficiency (default 10)
    n_restart: int  # EM random restarts per fit
    seed: int  # base random seed


def walk_forward_regime_predict(
    obs_sequence: np.ndarray,
    config: WalkForwardConfig,
) -> dict:
    """Run walk-forward HMM fit + Viterbi decode.

    For each draw index t from min_history to N-1:
      1. Compute observation index i = t - window (i ≥ 0 required)
      2. Re-fit HMM on obs[:i] every config.refit_every steps (cached otherwise)
      3. Viterbi decode state at time i → regime for draw t
      4. Record inferred state (signal or noise)

    Args:
        obs_sequence: (N_obs, D) from compute_observation_sequence_*
        config: walk-forward params

    Returns:
        dict with:
          - states_per_draw: np.ndarray int64 shape (N_obs - min_history_obs,)
              Viterbi-decoded state at each prediction step (aligned to obs index)
          - signal_states_per_step: np.ndarray bool shape same
              True where state == signal_state
          - fit_log: list of dict with {obs_index, log_likelihood, signal_state, means}
          - concentration: dict with signal_fraction, noise_fraction (Principle #15 check)
          - effective_min_obs: int (obs index where predictions begin)
    """
    N_obs = obs_sequence.shape[0]
    if N_obs == 0:
        return {
            "states_per_draw": np.array([], dtype=np.int64),
            "signal_states_per_step": np.array([], dtype=bool),
            "fit_log": [],
            "concentration": {"signal_fraction": 0.0, "noise_fraction": 0.0},
            "effective_min_obs": 0,
        }

    # min_history_obs: first obs index where we can predict (equivalent to draw index min_history)
    # draw_index = obs_index + window, so obs_index_start = min_history - window
    min_history_obs = max(1, config.min_history - config.window)
    if min_history_obs >= N_obs:
        return {
            "states_per_draw": np.array([], dtype=np.int64),
            "signal_states_per_step": np.array([], dtype=bool),
            "fit_log": [],
            "concentration": {"signal_fraction": 0.0, "noise_fraction": 0.0},
            "effective_min_obs": min_history_obs,
        }

    states = np.full(N_obs - min_history_obs, fill_value=-1, dtype=np.int64)
    signal_flag = np.zeros(N_obs - min_history_obs, dtype=bool)
    fit_log: list[dict] = []

    cached_fit: HMMFitResult | None = None
    cached_mean: np.ndarray | None = None
    cached_std: np.ndarray | None = None
    last_refit_i = -1

    for out_idx, i in enumerate(range(min_history_obs, N_obs)):
        # Decide whether to re-fit
        need_refit = (cached_fit is None) or ((i - last_refit_i) >= config.refit_every)

        if need_refit:
            obs_train_raw = obs_sequence[:i]  # strict past only
            if obs_train_raw.shape[0] < max(10, 2 * obs_sequence.shape[1]):
                # Not enough data to fit yet; mark state as noise (conservative default)
                states[out_idx] = -1  # invalid
                signal_flag[out_idx] = False
                continue
            obs_train_norm, mean_train, std_train = normalize_observations(obs_train_raw)
            try:
                cached_fit = fit_hmm_k2(
                    obs_train_norm,
                    n_restart=config.n_restart,
                    seed=config.seed,
                )
                cached_mean = mean_train
                cached_std = std_train
                last_refit_i = i
                fit_log.append(
                    {
                        "obs_index": int(i),
                        "log_likelihood": float(cached_fit.log_likelihood),
                        "signal_state": int(cached_fit.signal_state),
                        "means": cached_fit.means.tolist(),
                        "converged": bool(cached_fit.converged),
                        "n_iter": int(cached_fit.n_iter),
                    }
                )
            except (RuntimeError, ValueError) as e:
                # Fit failed; mark state as noise (fail-safe)
                states[out_idx] = -1
                signal_flag[out_idx] = False
                fit_log.append({"obs_index": int(i), "error": str(e)})
                continue

        # Use cached fit to decode state at time i-1 (most recent past observation)
        # Apply same normalization as train
        if cached_fit is None or cached_mean is None or cached_std is None:
            states[out_idx] = -1
            signal_flag[out_idx] = False
            continue
        current_obs_raw = obs_sequence[i - 1 : i]  # (1, D)
        current_obs_norm = (current_obs_raw - cached_mean) / cached_std
        state_i = int(cached_fit.model.predict(current_obs_norm)[0])
        states[out_idx] = state_i
        signal_flag[out_idx] = state_i == cached_fit.signal_state

    # Concentration check (Principle #15)
    valid_mask = states >= 0
    if valid_mask.sum() > 0:
        sig_frac = float(signal_flag[valid_mask].sum() / valid_mask.sum())
    else:
        sig_frac = 0.0
    noise_frac = 1.0 - sig_frac

    return {
        "states_per_draw": states,
        "signal_states_per_step": signal_flag,
        "fit_log": fit_log,
        "concentration": {
            "signal_fraction": sig_frac,
            "noise_fraction": noise_frac,
        },
        "effective_min_obs": int(min_history_obs),
    }
