# -*- coding: utf-8 -*-

# Installed packages (via pip)
from django.conf.urls import url
from django.conf import settings

# Internal project dependencies
from .views import (
    EolAnalyticsDashboardFragmentView,
)

urlpatterns = (
    # Recommendation Dashboard Tab for student
    url(
        r'courses/{}/analytics_dashboard$'.format(
            settings.COURSE_ID_PATTERN,
        ),
        EolAnalyticsDashboardFragmentView.as_view(),
        name='analytics_dashboard_view',
    ),
)
