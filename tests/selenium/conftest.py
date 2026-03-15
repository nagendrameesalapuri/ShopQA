# conftest.py — pytest configuration and shared fixtures
import pytest
import os

def pytest_configure(config):
    """Create screenshots directory"""
    os.makedirs("screenshots", exist_ok=True)

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Make test result available to fixtures"""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)
