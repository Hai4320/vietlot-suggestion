"""
Lottery wheeling system — covering design generator.

Generates a minimal set of tickets that **guarantees** at least `t` matches
if `t` or more of the player's chosen numbers appear in the draw.

Uses a greedy covering algorithm: iteratively pick the k-subset that
covers the most uncovered t-subsets.  This is the approach recommended
by Gordon, Kuperberg & Patashnik (1995) and produces near-optimal wheels.

Usage
-----
>>> wheel = WheelGenerator(player_numbers=[1,3,7,12,18,22,29,33,40,46], pick_size=6, guarantee=3)
>>> tickets = wheel.generate()
>>> print(f"{len(tickets)} tickets needed for 3-if-3 guarantee")

This module is NOT a PredictModel subclass since it generates a SET
of tickets rather than individual predictions.  It's intended to be
called from the suggestion engine directly.
"""

from itertools import combinations
from typing import List, Set, Tuple


class WheelGenerator:
    """
    Lottery wheel (covering design) generator.

    Parameters
    ----------
    player_numbers : list[int]
        The set of numbers the player wants to wheel.  Must have more
        numbers than ``pick_size``.
    pick_size : int
        How many numbers per ticket (e.g. 6 for Power 6/55).
    guarantee : int
        The coverage guarantee level.  A value of ``t`` means: if any
        ``t`` of the player's numbers appear in the draw, at least one
        ticket will contain all ``t``.
    max_tickets : int
        Safety limit on the maximum number of tickets to generate.
    """

    def __init__(
        self,
        player_numbers: List[int],
        pick_size: int = 6,
        guarantee: int = 3,
        max_tickets: int = 200,
    ):
        if len(player_numbers) <= pick_size:
            raise ValueError(f"Need more player numbers ({len(player_numbers)}) than pick size ({pick_size})")
        if guarantee > pick_size:
            raise ValueError(f"Guarantee ({guarantee}) cannot exceed pick size ({pick_size})")

        self.player_numbers = sorted(player_numbers)
        self.pick_size = pick_size
        self.guarantee = guarantee
        self.max_tickets = max_tickets

    def generate(self) -> List[List[int]]:
        """
        Generate the minimum ticket set using greedy covering.

        Returns
        -------
        list[list[int]]
            List of tickets, each a sorted list of ``pick_size`` numbers.
        """
        v = len(self.player_numbers)
        k = self.pick_size
        t = self.guarantee

        # All t-subsets that need to be covered
        t_subsets_to_cover: Set[Tuple[int, ...]] = set(combinations(range(v), t))

        # All possible k-subsets (tickets) — using indices into player_numbers
        all_k_subsets = list(combinations(range(v), k))

        tickets: List[List[int]] = []
        covered: Set[Tuple[int, ...]] = set()

        while covered != t_subsets_to_cover and len(tickets) < self.max_tickets:
            # Find the k-subset that covers the most uncovered t-subsets
            best_block = None
            best_new_coverage = 0

            for block in all_k_subsets:
                # t-subsets within this block
                block_t_subsets = set(combinations(block, t))
                new_coverage = len(block_t_subsets - covered)

                if new_coverage > best_new_coverage:
                    best_new_coverage = new_coverage
                    best_block = block

            if best_block is None or best_new_coverage == 0:
                break

            # Add this ticket
            ticket = sorted([self.player_numbers[i] for i in best_block])
            tickets.append(ticket)
            covered |= set(combinations(best_block, t))

        return tickets

    def get_guarantee_info(self, tickets: List[List[int]]) -> dict:
        """
        Analyze the coverage guarantee of a ticket set.

        Returns
        -------
        dict with:
            - total_tickets: number of tickets
            - total_t_subsets: total t-subsets that need coverage
            - covered_t_subsets: how many are actually covered
            - coverage_pct: percentage covered
            - schonheim_bound: theoretical lower bound on tickets needed
        """
        v = len(self.player_numbers)
        k = self.pick_size
        t = self.guarantee

        # Build index mapping
        num_to_idx = {n: i for i, n in enumerate(self.player_numbers)}

        total_t_subsets = set(combinations(range(v), t))
        covered = set()

        for ticket in tickets:
            indices = tuple(sorted(num_to_idx.get(n, -1) for n in ticket if n in num_to_idx))
            covered |= set(combinations(indices, t))

        # Schönheim bound
        from math import ceil

        bound = self._schonheim_bound(v, k, t)

        return {
            "total_tickets": len(tickets),
            "total_t_subsets": len(total_t_subsets),
            "covered_t_subsets": len(covered & total_t_subsets),
            "coverage_pct": round(len(covered & total_t_subsets) / len(total_t_subsets) * 100, 2),
            "schonheim_lower_bound": bound,
        }

    @staticmethod
    def _schonheim_bound(v: int, k: int, t: int) -> int:
        """Compute Schönheim lower bound C(v,k,t) ≥ ⌈v/k ⌈(v-1)/(k-1) ...⌉⌉."""
        from math import ceil

        result = 1
        for i in range(t - 1, -1, -1):
            result = ceil((v - i) / (k - i) * result)
        return result
