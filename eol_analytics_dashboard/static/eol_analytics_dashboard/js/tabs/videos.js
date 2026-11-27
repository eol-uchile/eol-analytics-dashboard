/*
 * Tab "Videos"
 */
(function (window) {
    'use strict';

    var dashboard = window.EOLDashboard;
    if (!dashboard) { return; }

    // Reemplazar el render por el código que dibuja el gráfico.
    function renderVisualizacionVideos(container, data) {
        dashboard.renderPlaceholder(container, data);
    }

    dashboard.registerTab('videos', {
        load: dashboard.createTabLoader([
            {
                key: 'visualizacion_videos',
                wrapperId: 'visualizacion-videos-chart-wrapper',
                containerId: 'visualizacion-videos-chart',
                render: renderVisualizacionVideos
            }
        ])
    });
})(window);
