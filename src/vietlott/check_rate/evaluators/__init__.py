"""Product-specific evaluators. Import submodules here to trigger registration."""

from vietlott.check_rate.evaluators import (
    base,  # noqa: F401
    power535,  # noqa: F401  # Phase 1
    power645,  # noqa: F401  # Phase 2
    power655,  # noqa: F401  # Phase 3
)

# Product evaluators are imported lazily as phases land:
# from vietlott.check_rate.evaluators import power655  # Phase 3
# from vietlott.check_rate.evaluators import p3d       # Phase 4
# from vietlott.check_rate.evaluators import p3d_pro   # Phase 5
