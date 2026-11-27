# Python Standard Libraries
import os
import json
import logging
import six

# Installed packages (via pip)
from django.conf import settings
from django.http import Http404
from django.template.loader import render_to_string
from django.urls import reverse

# Edx dependencies
from lms.djangoapps.courseware.access import has_access
from lms.djangoapps.courseware.courses import get_course_with_access
from lms.djangoapps.instructor import permissions
from opaque_keys.edx.keys import CourseKey, UsageKey
from openedx.core.djangoapps.plugin_api.views import EdxFragmentView
from web_fragments.fragment import Fragment
from xmodule.modulestore.django import modulestore

from .fetch_metrics import (
    get_api_cumulative_completion,
    get_api_cumulative_time,
    check_api_availability,
)

logger = logging.getLogger(__name__)

class EolAnalyticsDashboardFragmentView(EdxFragmentView):
    def render_to_fragment(self, request, course_id, **kwargs):
        course_key = CourseKey.from_string(course_id)
        course = get_course_with_access(request.user, "load", course_key)

        staff_access = bool(has_access(request.user, 'staff', course))
        data_researcher_access = request.user.has_perm(permissions.CAN_RESEARCH, course_key)
        if not (staff_access or data_researcher_access):
            raise Http404()

        context = self.get_context(request, course_id, course, course_key)

        html = render_to_string('eol_analytics_dashboard/analytics_dashboard_fragment.html', context)
        return Fragment(html)

    def get_context(self, request, course_id, course, course_key):
        current_username = request.user.username
        user_name = request.user.profile.name if hasattr(request.user, 'profile') else current_username

        logger.info("EOL Analytics - username=%s", current_username)

        course_id = "course-v1:eol+DCC-CC4303_v1+2026_2_1"

        # if USE_API:
        check_api_availability()

        general_data_cumulative_completion = get_api_cumulative_completion(course_id)
        general_data_cumulative_time = get_api_cumulative_time(course_id)

        # TODO: create manual loading

        context = {
            "course": course,
            'page_url': reverse('analytics_dashboard_view', kwargs={'course_id': six.text_type(course_key)}),
            "content": None,
            "max_unit": None,
            "cumulative_completion_data": general_data_cumulative_completion,
            "cumulative_time_data": general_data_cumulative_time
        }

        CHART_IDS = [
            'completitud-acumulada', 'tiempo-acumulado',
            'dedicacion-semanal', 'dedicacion-tipo-actividad', 'participacion-semanal',
            'dedicacion-seccion', 'dedicacion-calificaciones-subseccion',
            'visualizacion-videos',
        ]

        context['chart_bodies'] = {
            chart_id: render_to_string(
                'eol_analytics_dashboard/tabs/_chart_body.html', {'chart_id': chart_id})
            for chart_id in CHART_IDS
        }

        context['general_monitoring_fragment'] = render_to_string(
            'eol_analytics_dashboard/tabs/general_monitoring.html', context)
        context['activity_per_week_fragment'] = render_to_string(
            'eol_analytics_dashboard/tabs/activity_per_week.html', context)
        context['activity_per_module_fragment'] = render_to_string(
            'eol_analytics_dashboard/tabs/activity_per_module.html', context)
        context['videos_fragment'] = render_to_string(
            'eol_analytics_dashboard/tabs/videos.html', context)

        return context
