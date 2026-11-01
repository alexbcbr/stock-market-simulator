from app.services.market_price_services import getRevenue


def test_getRevenue_positive_difference():
    assert getRevenue(open_price=10, close_price=15) == 5


def test_getRevenue_negative_difference():
    assert getRevenue(open_price=15, close_price=10) == -5


def test_getRevenue_no_difference():
    assert getRevenue(open_price=10, close_price=10) == 0


def test_getRevenue_with_floats():
    assert getRevenue(open_price=10.5, close_price=12.25) == 1.75
