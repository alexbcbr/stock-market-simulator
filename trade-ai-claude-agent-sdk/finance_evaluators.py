"""Code evaluators for the financial assistant's answers.

Each evaluator is a cheap, deterministic check (no LLM call) that returns
``{"label", "score"}`` and, on failure, an ``explanation``. Labels are
``pass`` (score 1), ``fail`` (score 0) and ``unknown`` (score 0, input missing
so the check could not run). Note that ``unknown`` also scores 0, so average
scores treat it like a failure unless you filter on label.

These are heuristics, not proof of a good answer: they match text patterns and
can be satisfied by a wrong answer. ``EVALUATORS`` is the list the pipeline in
``finance_evals_pipeline.py`` runs.
"""

import re

from phoenix.evals import create_evaluator


@create_evaluator(name="mentions_ticker", kind="code")
def mentions_ticker(input, output):
    """Code eval: does the output mention the ticker(s) we asked about?

    Tickers are taken from the input as uppercase words of 2 to 5 letters, minus a
    short stop list (AI, US, CEO, CFO, IPO, ETF, AWS, USE). Any other uppercase
    word, such as BUY, counts as a ticker and can cause a false failure. The
    match is a case-insensitive substring test, so a ticker inside a longer word
    also passes.

    Args:
        input: The user's question.
        output: The assistant's answer.

    Returns:
        dict: ``unknown`` if either text is empty or the input has no likely
        ticker; ``pass`` if every ticker appears in the output; otherwise
        ``fail`` with the missing tickers in ``explanation``.
    """
    if not input or not output:
        return {"label": "unknown", "score": 0}

    # Extract ticker symbols from the input (uppercase 1-5 letter words)
    tickers = re.findall(r"\b([A-Z]{1,5})\b", input)
    # Filter to likely tickers (skip common words)
    likely_tickers = [
        t
        for t in tickers
        if len(t) >= 2
        and t not in ("AI", "US", "CEO", "CFO", "IPO", "ETF", "AWS", "USE")
    ]

    if not likely_tickers or not output:
        return {"label": "unknown", "score": 0}

    missing = [t for t in likely_tickers if t not in output.upper()]

    if not missing:
        return {"label": "pass", "score": 1}
    else:
        return {
            "label": "fail",
            "score": 0,
            "explanation": f"Missing tickers: {', '.join(missing)}",
        }


@create_evaluator(name="contains_price_data", kind="code")
def contains_price_data(input, output):
    """Code eval: does the output include at least one concrete price/number?

    The pattern accepts any digit sequence, with optional ``$``, thousands
    separators, decimals or ``%``, so a year, a list number or "3 stocks" passes.
    It shows that a number is present, not that it is a price.

    Args:
        input: The user's question; unused, kept for the evaluator signature.
        output: The assistant's answer.

    Returns:
        dict: ``unknown`` if the output is empty; ``pass`` if it contains a
        number; otherwise ``fail`` with an explanation.
    """
    if not output:
        return {"label": "unknown", "score": 0}

    # Matches things like $123.45, 123.45, 12%, 1,234.56
    has_number = bool(re.search(r"\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?", output))

    if has_number:
        return {"label": "pass", "score": 1}
    return {
        "label": "fail",
        "score": 0,
        "explanation": "No concrete price/number found in output",
    }


ACTION_WORDS = (
    "buy",
    "sell",
    "hold",
    "accumulate",
    "avoid",
    "overweight",
    "underweight",
    "recommend",
    "recommendation",
    "upgrade",
    "downgrade",
    "outperform",
    "underperform",
)


@create_evaluator(name="has_actionable_recommendation", kind="code")
def has_actionable_recommendation(input, output):
    """Code eval: does the output give an explicit recommendation, not just
    a data summary? Looks for buy/sell/hold-style language or a stated risk.
    A report that only restates prices/news without telling the user what
    to do fails this check.

    The check is a substring match against ``ACTION_WORDS``, so "buy" also
    matches inside words such as "buyback", and a refusal that says "I cannot
    recommend" passes. Only the output is read.

    Args:
        input: The user's question; unused, kept for the evaluator signature.
        output: The assistant's answer.

    Returns:
        dict: ``unknown`` if the output is empty; ``pass`` if any action word
        appears; otherwise ``fail`` listing the words checked.
    """
    if not output:
        return {"label": "unknown", "score": 0}

    lowered = output.lower()
    found = [word for word in ACTION_WORDS if word in lowered]

    if found:
        return {"label": "pass", "score": 1}
    return {
        "label": "fail",
        "score": 0,
        "explanation": (
            "No actionable recommendation language found "
            f"(checked for: {', '.join(ACTION_WORDS)})"
        ),
    }


EVALUATORS = [mentions_ticker, contains_price_data, has_actionable_recommendation]
