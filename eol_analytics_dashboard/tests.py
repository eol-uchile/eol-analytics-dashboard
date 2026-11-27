# Installed packages (via pip)
from django.test import TestCase


class TestEolAnalyticsDashboard(TestCase):
    def test_smoke(self):
        """
            Minimal test to trigger the CI workflow.
        """
        self.assertTrue(True)
