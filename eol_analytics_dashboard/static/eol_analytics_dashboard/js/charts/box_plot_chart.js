/*
 * box_plot_chart.js
 *
 * Reusable box-and-whisker chart renderer (D3 v7).
 * It only draws. It does not fetch data, pick a course or manage loading states: see
 * chart_data_source.js for that.
 *
 * Input items (one box per item, in the order given):
 *   { label, minimum, firstQuartile, median, thirdQuartile, maximum }
 * The values are drawn as they come: the data is expected to be clean (no outliers).
 *
 * Public API (window.EOLBoxPlot):
 *   render(d3, container, items, options)
 *     options.height     chart height in px (default 360)
 *     options.yLabel     y axis title; pass it already translated, e.g. gettext('Horas ...')
 *     options.ariaLabel  accessible description; defaults to a translated generic text
 *     options.colors     partial override of the colors: boxLower, boxUpper, median,
 *                        whisker, grid, axis
 *   defaultColors        the default colors; change them to restyle every chart at once
 *
 * i18n: user-facing texts go through gettext(). The msgid is in Spanish; the translation comes
 * from Django's JavaScript catalog (window.gettext). Without the catalog the msgid is shown.
 */
(function (root) {
    'use strict';

    var defaultColors = {
        boxLower: '#00acc1',   // box part between Q1 and the median
        boxUpper: '#80deea',   // box part between the median and Q3
        median: '#006064',
        whisker: '#37474f',
        grid: '#e6e6e6',
        axis: '#555555'
    };

    var DEFAULTS = {
        height: 360,
        yLabel: '',
        ariaLabel: null,
        colors: {}
    };

    /* ---------- i18n helpers ---------- */

    // Resolved at call time so the catalog can be loaded after this file.
    function gettext(msgid) {
        return typeof root.gettext === 'function' ? root.gettext(msgid) : msgid;
    }

    // Replaces %(name)s placeholders, using Django's interpolate when it is available.
    function interpolate(format, values) {
        if (typeof root.interpolate === 'function') {
            return root.interpolate(format, values, true);
        }
        return format.replace(/%\((\w+)\)s/g, function (match, name) {
            return String(values[name]);
        });
    }

    /* ---------- drawing ---------- */

    function draw(d3, container, items, options) {
        var colors = options.colors;
        var formatNumber = d3.format('.2~f');

        container.innerHTML = '';

        var width = Math.max(container.clientWidth, 320);
        var margin = { top: 16, right: 16, bottom: 40, left: options.yLabel ? 64 : 48 };
        var innerWidth = width - margin.left - margin.right;

        // One band per item: the label is the category shown on the x axis.
        var x = d3.scaleBand()
            .domain(items.map(function (item) { return item.label; }))
            .range([0, innerWidth])
            .padding(0.35);

        // Slanted labels when the bands are too narrow to hold them horizontally.
        var rotateLabels = x.step() < 64;
        margin.bottom = rotateLabels ? 72 : 40;
        var innerHeight = options.height - margin.top - margin.bottom;

        // The y domain covers every whisker, from the lowest minimum to the highest maximum.
        var yMin = d3.min(items, function (item) { return item.minimum; });
        var yMax = d3.max(items, function (item) { return item.maximum; });
        var y = d3.scaleLinear()
            .domain([yMin >= 0 ? 0 : yMin, yMax])
            .nice()
            .range([innerHeight, 0]);

        var svg = d3.select(container).append('svg')
            .attr('width', width)
            .attr('height', options.height)
            .attr('role', 'img')
            .attr('aria-label', options.ariaLabel || gettext('Gráfico de cajas por semana'));

        var plot = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Grid lines
        plot.append('g')
            .call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickFormat(''))
            .call(function (axis) {
                axis.select('.domain').remove();
                axis.selectAll('line').attr('stroke', colors.grid);
            });

        // Axes
        plot.append('g')
            .attr('transform', 'translate(0,' + innerHeight + ')')
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call(function (axis) {
                axis.selectAll('text').attr('fill', colors.axis).style('font-size', '12px');
                if (rotateLabels) {
                    axis.selectAll('text')
                        .attr('transform', 'rotate(-45)')
                        .style('text-anchor', 'end');
                }
            });

        plot.append('g')
            .call(d3.axisLeft(y).ticks(6))
            .call(function (axis) {
                axis.selectAll('text').attr('fill', colors.axis).style('font-size', '12px');
            });

        if (options.yLabel) {
            svg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('x', -(margin.top + innerHeight / 2))
                .attr('y', 16)
                .attr('text-anchor', 'middle')
                .attr('fill', colors.axis)
                .style('font-size', '12px')
                .text(options.yLabel);
        }

        /* --- Box plot anatomy: one group per item, built from its five-number summary --- */

        var bandWidth = x.bandwidth();
        var center = bandWidth / 2;
        var capHalf = bandWidth * 0.25;

        var boxes = plot.selectAll('.box')
            .data(items)
            .enter().append('g')
            .attr('class', 'box')
            .attr('transform', function (item) { return 'translate(' + x(item.label) + ',0)'; });

        // Native tooltip with the five values
        boxes.append('title').text(function (item) {
            return [
                item.label,
                interpolate(gettext('Máximo: %(value)s'), { value: formatNumber(item.maximum) }),
                interpolate(gettext('Tercer cuartil: %(value)s'), { value: formatNumber(item.thirdQuartile) }),
                interpolate(gettext('Mediana: %(value)s'), { value: formatNumber(item.median) }),
                interpolate(gettext('Primer cuartil: %(value)s'), { value: formatNumber(item.firstQuartile) }),
                interpolate(gettext('Mínimo: %(value)s'), { value: formatNumber(item.minimum) })
            ].join('\n');
        });

        // Whiskers: one vertical line from the minimum to the maximum...
        boxes.append('line')
            .attr('x1', center).attr('x2', center)
            .attr('y1', function (item) { return y(item.maximum); })
            .attr('y2', function (item) { return y(item.minimum); })
            .attr('stroke', colors.whisker);

        // ...and a short horizontal cap at each end.
        ['maximum', 'minimum'].forEach(function (key) {
            boxes.append('line')
                .attr('x1', center - capHalf).attr('x2', center + capHalf)
                .attr('y1', function (item) { return y(item[key]); })
                .attr('y2', function (item) { return y(item[key]); })
                .attr('stroke', colors.whisker);
        });

        // Box: spans Q1 to Q3, split in two rectangles at the median.
        boxes.append('rect')
            .attr('x', 0).attr('width', bandWidth)
            .attr('y', function (item) { return y(item.median); })
            .attr('height', function (item) { return Math.max(y(item.firstQuartile) - y(item.median), 0); })
            .attr('fill', colors.boxLower);

        boxes.append('rect')
            .attr('x', 0).attr('width', bandWidth)
            .attr('y', function (item) { return y(item.thirdQuartile); })
            .attr('height', function (item) { return Math.max(y(item.median) - y(item.thirdQuartile), 0); })
            .attr('fill', colors.boxUpper);

        // Median line across the box
        boxes.append('line')
            .attr('x1', 0).attr('x2', bandWidth)
            .attr('y1', function (item) { return y(item.median); })
            .attr('y2', function (item) { return y(item.median); })
            .attr('stroke', colors.median)
            .attr('stroke-width', 2);
    }

    // Redraws the chart when the window is resized (one listener per container).
    function bindResize(container, redraw) {
        if (container.__eolBoxPlotResize) {
            root.removeEventListener('resize', container.__eolBoxPlotResize);
        }
        var timer = null;
        container.__eolBoxPlotResize = function () {
            clearTimeout(timer);
            timer = setTimeout(redraw, 150);
        };
        root.addEventListener('resize', container.__eolBoxPlotResize);
    }

    /* ---------- entry point ---------- */

    function render(d3, container, items, userOptions) {
        if (!container) { return; }

        var options = Object.assign({}, DEFAULTS, userOptions);
        options.colors = Object.assign({}, defaultColors, options.colors);

        draw(d3, container, items, options);
        bindResize(container, function () { draw(d3, container, items, options); });
    }

    root.EOLBoxPlot = {
        render: render,
        defaultColors: defaultColors
    };
})(typeof window !== 'undefined' ? window : globalThis);
