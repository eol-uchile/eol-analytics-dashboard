/*
 * Tab "Actividad por módulo".
 *
 *  - dedicacion_seccion: box plot, drawn by the shared loader EOLDashboard.loadBoxPlotChart.
 *    Its data comes from the view, through the key "sectionDedicationData" of the JSON block
 *    #activity_per_module_config rendered by activity_per_module.html.
 *  - dedicacion_calificaciones_subseccion: still a placeholder. Its data comes from the tab endpoint
 *    (data-endpoint of the panel) under the key with the same name.
 */
(function (window) {
    'use strict';

    var dashboard = window.EOLDashboard;
    if (!dashboard) { return; }

    // Resolved at call time so the translation catalog can be loaded after this file.
    function gettext(msgid) {
        return typeof window.gettext === 'function' ? window.gettext(msgid) : msgid;
    }

    // Replace with the code that draws the chart.
    function renderDedicacionCalificacionesSubseccion(container, data) {
        dashboard.renderPlaceholder(container, data);
    }

    var loadPlaceholderCharts = dashboard.createTabLoader([
        {
            key: 'dedicacion_calificaciones_subseccion',
            wrapperId: 'dedicacion-calificaciones-subseccion-chart-wrapper',
            containerId: 'dedicacion-calificaciones-subseccion-chart',
            render: renderDedicacionCalificacionesSubseccion
        }
    ]);

    dashboard.registerTab('activity_per_module', {
        // The retry button of the dashboard calls this function again for the whole tab.
        load: function (panel, endpoint) {
            return Promise.all([
                dashboard.loadBoxPlotChart(panel, {
                    configId: 'activity_per_module_config',
                    chartId: 'dedicacion-seccion',
                    configKey: 'sectionDedicationData',
                    yLabel: function () { return gettext('Horas de dedicación por sección'); }
                }),
                loadPlaceholderCharts(panel, endpoint)
            ]).then(function (results) {
                return results.some(Boolean);
            });
        }
    });
})(window);
