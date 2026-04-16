#!/usr/bin/env python3

from __future__ import annotations

import argparse
import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageFilter


DEFAULT_CASES = [
    "apple-mobile",
    "google-desktop",
    "x-mobile",
]


@dataclass
class CaseScore:
    name: str
    score: float
    content_f1: float
    row_corr: float
    col_corr: float
    edge_f1: float
    render_ink: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Review terminal-layout fidelity for rendered ASCII PNGs.",
    )
    parser.add_argument(
        "render_dir",
        type=Path,
        help="Directory containing <case>-ascii-art.png files",
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path("examples/screenshots"),
        help="Directory containing source screenshots",
    )
    parser.add_argument(
        "--cases",
        nargs="*",
        default=DEFAULT_CASES,
        help="Screenshot case names without file extensions",
    )
    parser.add_argument(
        "--cols",
        type=int,
        default=32,
        help="Coarse grid width used for structural scoring",
    )
    parser.add_argument(
        "--rows",
        type=int,
        default=24,
        help="Coarse grid height used for structural scoring",
    )
    return parser.parse_args()


def source_signal(image: Image.Image) -> list[float]:
    gray = image.convert("L")
    return [(255 - value) / 255.0 for value in gray.getdata()]


def render_signal(image: Image.Image) -> list[float]:
    gray = image.convert("L")
    return [value / 255.0 for value in gray.getdata()]


def average_grid(values: list[float], width: int, height: int, cols: int, rows: int) -> list[float]:
    grid: list[float] = []
    for row in range(rows):
        y0 = row * height // rows
        y1 = max(y0 + 1, (row + 1) * height // rows)
        for col in range(cols):
            x0 = col * width // cols
            x1 = max(x0 + 1, (col + 1) * width // cols)

            total = 0.0
            count = 0
            for y in range(y0, y1):
                offset = y * width
                for x in range(x0, x1):
                    total += values[offset + x]
                    count += 1

            grid.append(total / count)
    return grid


def row_profile(values: list[float], width: int, height: int) -> list[float]:
    profile = []
    for row in range(height):
        offset = row * width
        profile.append(sum(values[offset : offset + width]) / width)
    return profile


def col_profile(values: list[float], width: int, height: int) -> list[float]:
    profile = []
    for col in range(width):
        total = 0.0
        for row in range(height):
            total += values[row * width + col]
        profile.append(total / height)
    return profile


def threshold_mask(values: list[float], threshold: float) -> list[int]:
    return [1 if value >= threshold else 0 for value in values]


def f1_score(expected: list[int], observed: list[int]) -> float:
    tp = fp = fn = 0
    for exp, obs in zip(expected, observed):
        if exp and obs:
            tp += 1
        elif obs:
            fp += 1
        elif exp:
            fn += 1
    if tp == 0:
        return 0.0
    precision = tp / (tp + fp)
    recall = tp / (tp + fn)
    return 2 * precision * recall / (precision + recall)


def correlation(expected: list[float], observed: list[float]) -> float:
    if len(expected) != len(observed):
        raise ValueError("profile length mismatch")

    mean_expected = sum(expected) / len(expected)
    mean_observed = sum(observed) / len(observed)

    numerator = 0.0
    expected_energy = 0.0
    observed_energy = 0.0

    for exp, obs in zip(expected, observed):
        exp_delta = exp - mean_expected
        obs_delta = obs - mean_observed
        numerator += exp_delta * obs_delta
        expected_energy += exp_delta * exp_delta
        observed_energy += obs_delta * obs_delta

    if expected_energy == 0 or observed_energy == 0:
        return 0.0

    return numerator / math.sqrt(expected_energy * observed_energy)


def clamp_unit(value: float) -> float:
    return max(0.0, min(1.0, value))


def edge_signal(image: Image.Image, *, render: bool) -> list[float]:
    edged = image.convert("L").filter(ImageFilter.FIND_EDGES)
    if render:
        return [value / 255.0 for value in edged.getdata()]
    return [(255 - value) / 255.0 for value in edged.getdata()]


def score_case(name: str, source_path: Path, render_path: Path, cols: int, rows: int) -> CaseScore:
    source = Image.open(source_path).convert("RGB")
    render = Image.open(render_path).convert("RGB")
    source = source.resize(render.size)

    width, height = render.size
    source_values = source_signal(source)
    render_values = render_signal(render)

    source_grid = average_grid(source_values, width, height, cols, rows)
    render_grid = average_grid(render_values, width, height, cols, rows)
    source_mask = threshold_mask(source_grid, 0.06)
    render_mask = threshold_mask(render_grid, 0.08)
    content_f1 = f1_score(source_mask, render_mask)

    row_corr = clamp_unit(correlation(row_profile(source_values, width, height), row_profile(render_values, width, height)))
    col_corr = clamp_unit(correlation(col_profile(source_values, width, height), col_profile(render_values, width, height)))

    source_edges = average_grid(edge_signal(source, render=False), width, height, cols, rows)
    render_edges = average_grid(edge_signal(render, render=True), width, height, cols, rows)
    edge_f1 = f1_score(threshold_mask(source_edges, 0.05), threshold_mask(render_edges, 0.06))

    render_ink = sum(render_values) / len(render_values)
    score = (
        content_f1 * 0.40
        + row_corr * 0.20
        + col_corr * 0.20
        + edge_f1 * 0.20
    ) * 100

    return CaseScore(
        name=name,
        score=score,
        content_f1=content_f1,
        row_corr=row_corr,
        col_corr=col_corr,
        edge_f1=edge_f1,
        render_ink=render_ink,
    )


def main() -> int:
    args = parse_args()

    scores: list[CaseScore] = []
    for case in args.cases:
        source_path = args.source_dir / f"{case}.png"
        render_path = args.render_dir / f"{case}-ascii-art.png"
        scores.append(score_case(case, source_path, render_path, args.cols, args.rows))

    for case_score in scores:
        print(
            f"{case_score.name}: score={case_score.score:.1f} "
            f"content_f1={case_score.content_f1:.3f} "
            f"row_corr={case_score.row_corr:.3f} "
            f"col_corr={case_score.col_corr:.3f} "
            f"edge_f1={case_score.edge_f1:.3f} "
            f"render_ink={case_score.render_ink:.3f}"
        )

    overall = sum(score.score for score in scores) / len(scores)
    print(f"overall: {overall:.1f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
