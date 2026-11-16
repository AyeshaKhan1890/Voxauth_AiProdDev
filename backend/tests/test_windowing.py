import numpy as np
import pytest

from app.inference import build_window_starts, fit_window


def test_short_audio_is_tiled_to_one_model_window():
    samples = np.array([0.1, -0.2, 0.3], dtype=np.float32)

    starts = build_window_starts(len(samples), window_size=8, hop_size=4)
    window = fit_window(samples, starts[0], window_size=8)

    assert starts == [0]
    np.testing.assert_allclose(
        window,
        [0.1, -0.2, 0.3, 0.1, -0.2, 0.3, 0.1, -0.2],
    )


def test_long_audio_includes_the_final_samples():
    assert build_window_starts(sample_count=21, window_size=8, hop_size=5) == [0, 5, 10, 13]


def test_invalid_window_arguments_are_rejected():
    with pytest.raises(ValueError):
        build_window_starts(sample_count=0, window_size=8, hop_size=4)
