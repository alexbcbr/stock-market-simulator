import logging


def setup_logging():
    """Configure root logging at INFO level with a timestamped format.

    Safe to call more than once: ``logging.basicConfig`` does nothing when the root
    logger already has handlers, so the first call wins.
    """
    logging.basicConfig(
        level=logging.INFO,
        format=("%(asctime)s | %(levelname)s |%(name)s | %(message)s"),
    )
