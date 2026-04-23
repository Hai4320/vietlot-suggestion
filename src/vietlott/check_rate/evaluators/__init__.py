"""Product-specific evaluators. Import submodules here to trigger registration."""

from vietlott.check_rate.evaluators import base  # noqa: F401

# Product evaluators are imported lazily as phases land:
# from vietlott.check_rate.evaluators import power535  # Phase 1
# from vietlott.check_rate.evaluators import power645  # Phase 2
# from vietlott.check_rate.evaluators import power655  # Phase 3
# from vietlott.check_rate.evaluators import p3d       # Phase 4
# from vietlott.check_rate.evaluators import p3d_pro   # Phase 5
