/*
 * Tab "Actividad por semana".
 *
 *  - dedicacion_semanal: box plot by week, drawn by the shared loader EOLDashboard.loadBoxPlotChart.
 *    Its data comes from the view, through the key "weeklyDedicationData" of the JSON block
 *    #activity_per_week_config rendered by activity_per_week.html.
 *  - dedicacion_tipo_actividad and participacion_semanal: still placeholders. Their data comes from
 *    the tab endpoint (data-endpoint of the panel) under the keys with the same names.
 */
(function (window) {
    'use strict';

    var dashboard = window.EOLDashboard;
    if (!dashboard) { return; }

    // Resolved at call time so the translation catalog can be loaded after this file.
    function gettext(msgid) {
        return typeof window.gettext === 'function' ? window.gettext(msgid) : msgid;
    }

    // Replace each render with the code that draws the chart.
    function renderDedicacionTipoActividad(container, data) {
        dashboard.renderPlaceholder(container, data);
    }

    function renderParticipacionSemanal(container, data) {
        dashboard.renderPlaceholder(container, data);
    }

    var loadPlaceholderCharts = dashboard.createTabLoader([
        {
            key: 'dedicacion_tipo_actividad',
            wrapperId: 'dedicacion-tipo-actividad-chart-wrapper',
            containerId: 'dedicacion-tipo-actividad-chart',
            render: renderDedicacionTipoActividad
        },
        {
            key: 'participacion_semanal',
            wrapperId: 'participacion-semanal-chart-wrapper',
            containerId: 'participacion-semanal-chart',
            render: renderParticipacionSemanal
        }
    ]);

    dashboard.registerTab('activity_per_week', {
        // The retry button of the dashboard calls this function again for the whole tab.
        load: function (panel, endpoint) {
            return Promise.all([
                dashboard.loadBoxPlotChart(panel, {
                    configId: 'activity_per_week_config',
                    chartId: 'dedicacion-semanal',
                    configKey: 'weeklyDedicationData',
                    yLabel: function () { return gettext('Horas de dedicación semanal'); }
                }),
                loadPlaceholderCharts(panel, endpoint)
            ]).then(function (results) {
                return results.some(Boolean);
            });
        }
    });
})(window);
