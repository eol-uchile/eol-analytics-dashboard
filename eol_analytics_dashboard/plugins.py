# Installed packages (via pip)
from django.conf import settings
from django.utils.translation import ugettext_noop

# Edx dependencies
from lms.djangoapps.courseware.tabs import EnrolledTab
from xmodule.tabs import TabFragmentViewMixin


class EolDashboardAnalyticsTab(TabFragmentViewMixin, EnrolledTab):
    type = 'eol_analytics_dashboard'
    title = ugettext_noop('Analitica')
    priority = None
    view_name = 'analytics_dashboard_view'
    fragment_view_name = 'eol_analytics_dashboard.views.EolAnalyticsDashboardFragmentView'
    is_hideable = True
    is_default = False
    body_class = 'eol_analytics_dashboard'
    online_help_token = 'eol_analytics_dashboard'
    # True if this tab should be displayed only for instructors
    course_staff_only = True

    @classmethod
    def is_enabled(cls, course, user=None):
        """
        Returns true if the specified user has staff access.
        """
        return True
