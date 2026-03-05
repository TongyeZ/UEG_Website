let originalColorValues = [];
let geneDisplayColors = [];
let normalizedGeneIds = [];
let normalizedTranscriptomeGroups = [];
const defaultMarkerSize = 10;
const highlightMarkerSize = 16;
const blackColor = 'rgb(0,0,0)';
const baseMarkerOpacity = 0.9;

function normalizeValue(value) {
    return String(value || '').trim().toLowerCase();
}

function getTranscriptomeGroup(category) {
    const normalized = normalizeValue(category);
    if (!normalized) {
        return '';
    }
    return normalized.split('@')[0];
}

function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
}

function jetColorFromValue(value) {
    const x = clamp01(value);
    const r = Math.max(0, Math.min(1, 1.5 - Math.abs((4 * x) - 3)));
    const g = Math.max(0, Math.min(1, 1.5 - Math.abs((4 * x) - 2)));
    const b = Math.max(0, Math.min(1, 1.5 - Math.abs((4 * x) - 1)));
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

function createBlackColorArray(count) {
    return Array(count).fill(blackColor);
}

function renderLegendTable() {
    const legendTable = document.getElementById('colorLegendTable');
    if (!legendTable) {
        return;
    }

    legendTable.innerHTML = '';
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>SEP Range</th><th>Color</th>';
    legendTable.appendChild(headerRow);

    const bins = 6;
    const step = 1 / bins;
    for (let i = 0; i < bins; i += 1) {
        const minValue = i * step;
        const maxValue = (i + 1) * step;
        const midpoint = (minValue + maxValue) / 2;
        const swatchColor = jetColorFromValue(midpoint);

        const row = document.createElement('tr');
        row.innerHTML =
            `<td>${minValue.toFixed(2)} - ${maxValue.toFixed(2)}</td>` +
            `<td><span class="legend-swatch" style="background:${swatchColor};"></span> ${swatchColor}</td>`;
        legendTable.appendChild(row);
    }
}

function populateCategoryDropdown(categories) {
    const select = document.getElementById('categorySelect');
    if (!select) {
        return;
    }

    const uniqueGroups = [...new Set(categories.map(getTranscriptomeGroup).filter(Boolean))];
    const preferredOrder = ['megs', 'segs', 'uegs'];
    uniqueGroups.sort((a, b) => {
        const ia = preferredOrder.indexOf(a);
        const ib = preferredOrder.indexOf(b);
        if (ia === -1 && ib === -1) {
            return a.localeCompare(b);
        }
        if (ia === -1) {
            return 1;
        }
        if (ib === -1) {
            return -1;
        }
        return ia - ib;
    });

    select.innerHTML = '<option value="">All Transcriptome Groups</option>';
    uniqueGroups.forEach((group) => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group.toUpperCase();
        select.appendChild(option);
    });
}

function applyHighlight(query, selectedCategory) {
    const scatterPlot = document.getElementById('scatterPlot');
    if (!scatterPlot || !scatterPlot.data || !scatterPlot.data.length) {
        return;
    }

    const data = scatterPlot.data[0];
    const markerCount = data.x.length;
    const resetColors = createBlackColorArray(markerCount);
    const resetSizes = Array(markerCount).fill(defaultMarkerSize);
    const normalizedQuery = normalizeValue(query);
    const normalizedSelectedCategory = getTranscriptomeGroup(selectedCategory);

    const categoryMatches = normalizedTranscriptomeGroups.map((group) => {
        if (!normalizedSelectedCategory) {
            return false;
        }
        return group === normalizedSelectedCategory;
    });

    if (!normalizedQuery && !normalizedSelectedCategory) {
        Plotly.restyle('scatterPlot', {
            'marker.color': [resetColors],
            'marker.size': [resetSizes]
        });
        return;
    }

    const exactMatchIndices = [];
    const partialMatchIndices = [];

    normalizedGeneIds.forEach((geneId, index) => {
        if (geneId === normalizedQuery) {
            exactMatchIndices.push(index);
        } else if (geneId.includes(normalizedQuery)) {
            partialMatchIndices.push(index);
        }
    });

    const matchedIndices = exactMatchIndices.length ? exactMatchIndices : partialMatchIndices;
    categoryMatches.forEach((isMatch, index) => {
        if (isMatch) {
            matchedIndices.push(index);
        }
    });

    const uniqueMatchedIndices = [...new Set(matchedIndices)];
    uniqueMatchedIndices.forEach((index) => {
        resetColors[index] = geneDisplayColors[index];
        resetSizes[index] = highlightMarkerSize;
    });

    Plotly.restyle('scatterPlot', {
        'marker.color': [resetColors],
        'marker.size': [resetSizes]
    });
}

function loadScatterPlot() {
    $.getJSON('/get_global_expression_specificity_data', function(data) {
        originalColorValues = data.Recount2_SEP_TPM_0_1.map(clamp01);
        geneDisplayColors = originalColorValues.map(jetColorFromValue);
        const geneIds = data.GeneID.map(String);
        normalizedGeneIds = geneIds.map(normalizeValue);
        const categories = (data.Category || []).map(String);
        normalizedTranscriptomeGroups = categories.map(getTranscriptomeGroup);
        const initialMarkerColors = createBlackColorArray(geneIds.length);
        populateCategoryDropdown(categories);

        const scatterPlotData = {
            x: data.Q95,
            y: data.IQR,
            z: data.Variance,
            mode: 'markers',
            type: 'scatter3d',
            marker: {
                symbol: 'circle',
                size: defaultMarkerSize,
                color: initialMarkerColors,
                line: {
                    width: 0
                },
                opacity: baseMarkerOpacity
            },
            text: geneIds,
            hovertemplate: 'GeneID: %{text}<br>Q95: %{x}<br>IQR: %{y}<br>Variance: %{z}<extra></extra>'
        };

        const layout = {
            scene: {
                xaxis: { title: 'Median(Q95) Expression Level' },
                yaxis: { title: 'Expression Variability (IQR)' },
                zaxis: { title: 'Variance' }
            }
        };

        Plotly.newPlot('scatterPlot', [scatterPlotData], layout).then(function() {
            renderLegendTable();
            applyHighlight($('#geneIdInput').val(), $('#categorySelect').val());
        });
    });
}

$(document).ready(function() {
    loadScatterPlot();

    $('#searchButton').on('click', function() {
        applyHighlight($('#geneIdInput').val(), $('#categorySelect').val());
    });

    $('#geneIdInput').on('input', function() {
        applyHighlight($(this).val(), $('#categorySelect').val());
    });

    $('#geneIdInput').on('keypress', function(event) {
        if (event.which === 13) {
            event.preventDefault();
            applyHighlight($(this).val(), $('#categorySelect').val());
        }
    });

    $('#categorySelect').on('change', function() {
        applyHighlight($('#geneIdInput').val(), $(this).val());
    });
});
