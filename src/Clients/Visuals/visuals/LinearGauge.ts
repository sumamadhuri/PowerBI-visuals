﻿/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/* Please make sure that this path is correct */
/// <reference path="../_references.ts"/>

// JavaScript source code
module powerbi.visuals {
    //Model  
    export interface LinearGaugeBySQLBIData {
        titleLabel: string;
        subTitleLabel: string;
        showLabel: boolean;
        colorActual: string;
        colorComparison: string;
        states: number[];
        value: number;
        target: number;
        comparison: number;
        actual: number;
        percentage: number;
        min: number;
        max: number;
        trendValue1: number;
        trendValue2: number;
        actualFormat: string;
        targetFormat: string;
        trend1Format: string;
        trend2Format: string;
        minFormat: string;
        maxFormat: string;
        selector: data.Selector;
        toolTipInfo: TooltipDataItem[];
        golbalValueMin: number;
        targetSet: boolean;
        flip: boolean
    }

    //object variable which we used in customized color and text through UI options
    export var linearGaugeProps = {
        general: {
            ActualFillColor: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'ActualFillColor' },
            ComparisonFillColor: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'ComparisonFillColor' },
        },
        flip: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'flip', propertyName: 'show' }
        },
        labels: {
            color: { objectName: 'labels', propertyName: 'color' },
            labelPrecision: { objectName: 'labels', propertyName: 'labelPrecision' },
            labelDisplayUnits: { objectName: 'labels', propertyName: 'labelDisplayUnits' },
        },
        trendlabels: {
            color: { objectName: 'labels', propertyName: 'color' },
            labelPrecision_trend: { objectName: 'labels', propertyName: 'labelPrecision' },
            labelDisplayUnits_trend: { objectName: 'labels', propertyName: 'labelDisplayUnits' },
        }
    };
    export var cardProps = {
        categoryLabels: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'categoryLabels', propertyName: 'show' },
            color: <DataViewObjectPropertyIdentifier>{ objectName: 'categoryLabels', propertyName: 'color' },
            fontSize: <DataViewObjectPropertyIdentifier>{ objectName: 'categoryLabels', propertyName: 'fontSize' },
        },
        labels: {
            color: <DataViewObjectPropertyIdentifier>{ objectName: 'labels', propertyName: 'color' },
            labelPrecision: <DataViewObjectPropertyIdentifier>{ objectName: 'labels', propertyName: 'labelPrecision' },
            labelDisplayUnits: <DataViewObjectPropertyIdentifier>{ objectName: 'labels', propertyName: 'labelDisplayUnits' },
            fontSize: <DataViewObjectPropertyIdentifier>{ objectName: 'labels', propertyName: 'fontSize' },
        },
        trendlabels: {
            color: <DataViewObjectPropertyIdentifier>{ objectName: 'trendlabels', propertyName: 'color' },
            labelPrecision: <DataViewObjectPropertyIdentifier>{ objectName: 'trendlabels', propertyName: 'labelPrecision' },
            labelDisplayUnits: <DataViewObjectPropertyIdentifier>{ objectName: 'trendlabels', propertyName: 'labelDisplayUnits' },
            fontSize: <DataViewObjectPropertyIdentifier>{ objectName: 'trendlabels', propertyName: 'fontSize' },
        },
        wordWrap: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'wordWrap', propertyName: 'show' },
        },
    };

    var globalminValue = 0, globalminLength = 0, globalTargetValue = 0, globalTargetWidth = 0;
    //Visual
    export class LinearGauge implements IVisual {
        //Variables 
        private root: D3.Selection;
        private svg: D3.Selection;
        private svgLinear: D3.Selection;
        private svgLinearNext: D3.Selection;
        private svgTitle: D3.Selection;
        private svgSubtitle: D3.Selection;
        private actual: D3.Selection;
        private percentage: D3.Selection;
        private dataView: DataView;
        private data: LinearGaugeBySQLBIData;
        private min: D3.Selection;
        private max: D3.Selection;
        private targetText: D3.Selection;
        private trendValue1: D3.Selection;
        private trendValue2: D3.Selection;
        private heading: D3.Selection;
        private subHeading: D3.Selection;
        private cardFormatSetting: CardFormatSetting;
        private cardFormatSetting_trend: CardFormatSetting;
        private metaDataColumn: DataViewMetadataColumn;
        public static getDefaultData(): LinearGaugeBySQLBIData {
            return {
                colorActual: 'orange',
                colorComparison: 'lightgrey',
                titleLabel: '',
                subTitleLabel: '',
                showLabel: true,
                states: [],
                min: 0,
                max: 1,
                value: 0,
                target: 0,
                comparison: 0,
                actual: 0,
                percentage: 0,
                trendValue1: 0,
                trendValue2: 0,
                actualFormat: '',
                targetFormat: '',
                minFormat: '',
                maxFormat: '',
                trend1Format: '',
                trend2Format: '',
                toolTipInfo: [],
                golbalValueMin: 10,
                targetText: '',
                targetSet: false,
                selector: SelectionId.createNull().getSelector(),
                flip: false
            };
        }

        public getDefaultLabelSettings(show, labelColor, labelPrecision, format) {
            var defaultCountLabelPrecision = 0;
            var defaultDecimalLabelPrecision = 2;
            var defaultLabelColor = "#777777";
            var precision = 0;
            if (show === void 0) { show = false; }
            if (format) {
                var hasDots = powerbi.NumberFormat.getCustomFormatMetadata(format).hasDots;
            }
            precision = defaultCountLabelPrecision;
            if (labelPrecision) {
                precision = labelPrecision;
            }
            else if (hasDots) {
                precision = defaultDecimalLabelPrecision;
            }
            return {
                show: show,
                position: 0 /* Above */,
                displayUnits: 0,
                precision: precision,
                labelColor: labelColor || defaultLabelColor,
                formatterOptions: null,
            };
        }

        public getDefaultLabelSettings_trend(show, labelColor, labelPrecision_trend, format) {
            var defaultCountLabelPrecision = 0;
            var defaultDecimalLabelPrecision = 2;
            var defaultLabelColor = "#777777";
            var precision = 0;
            if (show === void 0) { show = false; }
            if (format) {
                var hasDots = powerbi.NumberFormat.getCustomFormatMetadata(format).hasDots;
            }
            precision = defaultCountLabelPrecision;
            if (labelPrecision_trend) {
                precision = labelPrecision_trend;
            }
            else if (hasDots) {
                precision = defaultDecimalLabelPrecision;
            }
            return {
                show: show,
                position: 0 /* Above */,
                displayUnits: 0,
                precision: precision,
                labelColor: labelColor || defaultLabelColor,
                formatterOptions: null,
            };
        }

        public getMetaDataColumn(dataView: DataView) {
            if (dataView && dataView.metadata && dataView.metadata.columns) {
                for (var i = 0, ilen = dataView.metadata.columns.length; i < ilen; i++) {
                    var column = dataView.metadata.columns[i];
                    if (column.isMeasure) {
                        this.metaDataColumn = column;
                        break;
                    }
                }
            }
        }

        public getDefaultFormatSettings(): CardFormatSetting {
            return {
                showTitle: true,
                textSize: null,
                labelSettings: this.getDefaultLabelSettings(true, 'black', 0, undefined),
                wordWrap: false,
            };
        }
        public getDefaultFormatSettings_trend(): CardFormatSetting {
            return {
                showTitle: true,
                textSize: null,
                labelSettings: this.getDefaultLabelSettings_trend(true, 'black', 0, undefined),
                wordWrap: false,
            };
        }
        //Capabilities what this visualization can do
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Y',// This will be the name of role and we can find element in an object with the role
                    kind: VisualDataRoleKind.Measure,//Type of value
                    displayName: 'Value',// it will display as measure header name
                },
                {
                    name: 'TargetValue',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Target Value',
                }, {
                    name: 'MinValue',
                    kind: VisualDataRoleKind.Measure,
                    displayName: data.createDisplayNameGetter('Role_DisplayName_MinValue'),
                }, {
                    name: 'MaxValue',
                    kind: VisualDataRoleKind.Measure,
                    displayName: data.createDisplayNameGetter('Role_DisplayName_MaxValue'),
                }, {
                    name: 'QualitativeState1Value',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Trend Value 1',
                }, {
                    name: 'QualitativeState2Value',
                    kind: VisualDataRoleKind.Measure,
                    displayName: 'Trend Value 2',
                }
            ],
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        ActualFillColor: {
                            displayName: 'Main Color',
                            type: { fill: { solid: { color: true } } }
                        },
                        ComparisonFillColor: {
                            displayName: 'Comparison Color',
                            type: { fill: { solid: { color: true } } }
                        },
                    },
                },
                flip: {
                    displayName: "Vertical Mode",
                    properties: {
                        show: {
                            displayName: "Vertical Mode",
                            type: { bool: true }
                        }
                    }
                },
                labels: {
                    displayName: powerbi.data.createDisplayNameGetter('Visual_DataPointLabel'),
                    properties: {
                        color: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_LabelsFill'),
                            type: { fill: { solid: { color: true } } }
                        },
                        labelDisplayUnits: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_DisplayUnits'),
                            type: { formatting: { labelDisplayUnits: true } }
                        },
                        labelPrecision: {
                            displayName: 'Decimal Places (Max 4 places)',
                            type: { numeric: true }
                        },
                    },
                },
                trendlabels: {
                    displayName: "Trend Label",
                    properties: {
                        color: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_LabelsFill'),
                            type: { fill: { solid: { color: true } } }
                        },
                        labelDisplayUnits: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_DisplayUnits'),
                            type: { formatting: { labelDisplayUnits: true } }
                        },
                        labelPrecision: {
                            displayName: 'Decimal Places (Max 4 places)',
                            type: { numeric: true }
                        },
                    },
                }
            },
            dataViewMappings: [{
                conditions: [
                    { 'Y': { max: 1 }, 'TargetValue': { max: 1 }, 'MinValue': { max: 1 }, 'MaxValue': { max: 1 }, 'QualitativeState1Value': { max: 1 }, 'QualitativeState2Value': { max: 1 } },//Maximum no. of values we can provide
                ],
                categorical: {
                    values: {
                        select: [
                            { bind: { to: 'Y' } },
                            { bind: { to: 'TargetValue' } },
                            { bind: { to: 'MinValue' } },
                            { bind: { to: 'MaxValue' } },
                            { bind: { to: 'QualitativeState1Value' } },
                            { bind: { to: 'QualitativeState2Value' } }//Binding with the categorical object

                        ]
                    },
                },
            }],
            suppressDefaultTitle: true,
        };

        //One time setup
        //First time it will be called and made the structure of your visual
        public init(options: VisualInitOptions): void {
            this.root = d3.select(options.element.get(0));

            this.heading = d3.select(options.element.get(0))
                .append('div')
                .classed('mainTitle', true);

            this.svg = d3.select(options.element.get(0))
                .append('div')
                .classed('data_tab', true);

            // this.svgLinear = this.svg
            //     .append('div').classed('data_tab',true);

            this.actual = this.svg
                .append('div')
                .classed('LG_txtActual', true)
                .append('span')
                .classed('data_total', true)
                .text('');

            this.percentage = this.svg
                .append('div')
                .classed('LG_txtPercentage', true)
                .append('text')
                .classed('data_percentage', true)
                .text('');

            this.svg = d3.select(options.element.get(0))
                .append('div')
                .classed('imagetab', true);

            this.svgLinear = this.svg
                .append('div');
            this.svgLinearNext = this.svg
                .append('div');

            this.trendValue1 = this.svgLinear
                .append('div')
                .classed('trendvalue1', true);

            this.trendValue2 = this.svgLinearNext
                .append('div')
                .classed('trendvalue2', true);


            this.svg = d3.select(options.element.get(0))
                .append('svg')
                .classed('linearSVG', true);


            this.svgLinear = this.svg
                .append('g');

            var titleLabels = this.svgLinear
                .append('g')
                .style('text-anchor', 'end');

            this.svgTitle = titleLabels
                .append('text')
                .classed('title', true);

            this.svgSubtitle = titleLabels
                .append('text')
                .attr('dy', '1em')
                .classed('subtitle', true);

            this.min = d3.select(options.element.get(0))
                .append('div')
                .classed('scale', true)
                .text(0);
            this.targetText = d3.select(options.element.get(0))
                .append('div')
                .classed('targetText', true);
        }

        //Convert the dataview into its view model
        //All the variable will be populated with the value we have passed
        public static converter(dataView: DataView): LinearGaugeBySQLBIData {

            var data: LinearGaugeBySQLBIData = LinearGauge.getDefaultData();

            if (dataView.categorical) {

                if (dataView.metadata) {
                    var objects = dataView.metadata.objects;
                    if (objects) {
                        data.colorActual = DataViewObjects.getFillColor(objects, linearGaugeProps.general.ActualFillColor, data.colorActual);
                        data.colorComparison = DataViewObjects.getFillColor(objects, linearGaugeProps.general.ComparisonFillColor, data.colorComparison);
                        data.flip = DataViewObjects.getValue(objects, linearGaugeProps.flip.show, data.flip);
                    }
                    var toolTipItems = [];

                    var actualFlag = false, maxFlag = false, values = dataView.categorical.values;

                    if (values && dataView.metadata.columns) {
                        for (var i = 0; i < values.length; i++) {

                            var col = dataView.metadata.columns[i];
                            var value = values[i].values[0] || 0;
                            if (col && col.roles) {

                                var pushToTooltips = false;

                                if (col.roles['Y']) { // we are marching the role and populating value
                                    if (col.format === '\\$#,0;(\\$#,0);\\$#,0')//here we are checking the format Ex:it is a currency format
                                    {
                                        data.actualFormat = '$';
                                    }
                                    data.actual = value;
                                    actualFlag = true;
                                    pushToTooltips = true;// pass the value as true to make it as a tooltip
                                } else if (col.roles['MinValue']) {
                                    if (col.format === '\\$#,0;(\\$#,0);\\$#,0') {
                                        data.minFormat = '$';
                                    }
                                    data.min = value;
                                } else if (col.roles['MaxValue']) {
                                    if (col.format === '\\$#,0;(\\$#,0);\\$#,0') {
                                        data.maxFormat = '$';
                                    }
                                    maxFlag = true;
                                    data.max = value;
                                } else if (col.roles['TargetValue']) {
                                    data.targetSet = true;
                                    if (col.format === '\\$#,0;(\\$#,0);\\$#,0') {
                                        data.targetFormat = '$';
                                    }
                                    data.target = value;
                                    pushToTooltips = true;
                                }
                                else if (col.roles['QualitativeState1Value']) {
                                    data.trendValue1 = value;
                                    if (col.format == '0%;-0%;0%' || col.format == '0 %;-0 %;0 %')
                                        data.trend1Format = '%';
                                }
                                else if (col.roles['QualitativeState2Value']) {
                                    data.trendValue2 = value;
                                    if (col.format == '0%;-0%;0%' || col.format == '0 %;-0 %;0 %')
                                        data.trend2Format = '%';
                                }
                                if (pushToTooltips)
                                    toolTipItems.push({ value: value, metadata: values[i] });
                            }
                        }
                        if (!maxFlag && actualFlag && data.actual > 0) {
                            data.max = data.actual * 2;
                        }
                        if (data.max == 0) {
                            data.max = 1;
                        }

                    }

                    if (toolTipItems.length > 0) {
                        data.toolTipInfo = TooltipBuilder.createTooltipInfo({
                            objectName: 'general',
                            propertyName: 'formatString',
                        }, null, null, null, null, toolTipItems);
                    }
                }
            }
            return data;//Data object we are returning here to the update function
        }

        //Drawing the visual
        public update(options: VisualUpdateOptions) {


            this.cardFormatSetting = this.getDefaultFormatSettings();
            this.cardFormatSetting_trend = this.getDefaultFormatSettings_trend();
            var labelSettings = null;
            var labelSettings_trend = null;
            var dataView = options.dataViews[0];

            var value: any;
            if (dataView) {
                this.getMetaDataColumn(dataView);
                if (dataView.single) {
                    value = dataView.single.value;
                }

                var dataViewMetadata = dataView.metadata;
                if (dataViewMetadata) {
                    var objects: DataViewObjects = dataViewMetadata.objects;
                    if (objects) {
                        labelSettings = this.cardFormatSetting.labelSettings;
                        labelSettings_trend = this.cardFormatSetting_trend.labelSettings;
                        labelSettings.labelColor = DataViewObjects.getFillColor(objects, cardProps.labels.color, labelSettings.labelColor);
                        labelSettings.precision = DataViewObjects.getValue(objects, cardProps.labels.labelPrecision, labelSettings.precision);
                        labelSettings_trend.precision = DataViewObjects.getValue(objects, cardProps.trendlabels.labelPrecision, this.cardFormatSetting_trend.labelSettings.precision);
                        labelSettings_trend.labelColor = DataViewObjects.getFillColor(objects, cardProps.trendlabels.color, this.cardFormatSetting_trend.labelSettings.labelColor);

                        // The precision can't go below 0 and not maximum 4
                        if (labelSettings.precision != null) {
                            labelSettings.precision = (labelSettings.precision >= 0) ? labelSettings.precision : 0;
                            labelSettings.precision = (labelSettings.precision <= 4) ? labelSettings.precision : 4;
                        }
                        if (labelSettings_trend.precision != null) {
                            labelSettings_trend.precision = (labelSettings_trend.precision >= 0) ? labelSettings_trend.precision : 0;
                            labelSettings_trend.precision = (labelSettings_trend.precision <= 4) ? labelSettings_trend.precision : 4;
                        }

                        labelSettings.displayUnits = DataViewObjects.getValue(objects, cardProps.labels.labelDisplayUnits, labelSettings.displayUnits);
                        labelSettings_trend.displayUnits = DataViewObjects.getValue(objects, cardProps.trendlabels.labelDisplayUnits, this.cardFormatSetting_trend.labelSettings.displayUnits);

                    }
                }
            }

            if (!options.dataViews || !options.dataViews[0]) return;
            var dataView = this.dataView = options.dataViews[0];
            var viewport = options.viewport;//We will get width and height from viewport object.

            this.data = LinearGauge.converter(dataView);//calling Converter function           

            var maxValue = Math.max(Math.abs(this.data.target), Math.abs(this.data.value), Math.abs(this.data.comparison), Math.abs(this.data.max));
            if (this.data.states.length === 0)
                this.data.states = [Math.ceil(maxValue) / 3, (Math.ceil(maxValue) / 3) * 2, Math.ceil(maxValue)];

            var sortedRanges = this.data.states.slice().sort(d3.descending);

            var titleWidth = TextMeasurementService.measureSvgTextWidth({ fontFamily: 'tahoma', fontSize: '16px', text: this.data.titleLabel });
            var showSubtitle = (this.data.subTitleLabel.length > 0);
            var subtitleWidth = TextMeasurementService.measureSvgTextWidth({ fontFamily: 'tahoma', fontSize: '12px', text: this.data.subTitleLabel });
            var labelWidth = (this.data.showLabel ? Math.max(titleWidth, subtitleWidth) : 0);
            var precisionValue = 0, displayunitValue = 0, color = 'black', precisionValue_trend = 0, displayunitValue_trend = 0, color_trend = 'black';
            var height = viewport.height;
            var width = viewport.width - 20;
            var modHeight = height / 12;
            //var yModHeight = viewport.width > 60 ? 60 : modHeight;
            var yModHeight = viewport.width / 9;

            //this.data.flip = true;
            if (this.data.flip) {
                this.svg
                    .attr({
                        'height': viewport.height,
                        'width': yModHeight
                    }).style('margin', 0);
            } else {
                this.svg
                    .attr({
                        'height': viewport.height / 11,
                        'width': viewport.width
                    }).style('margin', '0px 10px 0px 0px');
            }
            if (this.data.showLabel) {
                this.svgTitle
                    .style('display', 'none')
                    .attr('transform', 'translate(-10,' + ((20) + (showSubtitle ? 0 : 10)) + ')')
                    .text(this.data.titleLabel);
                this.svgLinear.attr('transform', 'translate(' + (10) + ',5)');

                if (showSubtitle) {
                    this.svgSubtitle
                        .style('display', 'none')
                        .attr('transform', 'translate(-10,' + ((height / 23) + 1) + ')')
                        .text(this.data.subTitleLabel);
                } else {
                    this.svgSubtitle.style('display', 'none');
                }

            } else {
                this.svgTitle.style('display', 'none');
                this.svgSubtitle.style('display', 'none');
                this.svgLinear.attr('transform', 'translate(10,5)');
            }
            if (labelSettings != undefined) {
                precisionValue = (labelSettings.precision != undefined ? labelSettings.precision : 0);
                displayunitValue = (labelSettings.displayUnits ? labelSettings.displayUnits : 0);
                color = labelSettings.labelColor;
            }
            if (labelSettings_trend != undefined) {
                precisionValue_trend = (labelSettings_trend.precision != undefined ? labelSettings_trend.precision : 0);
                displayunitValue_trend = (labelSettings_trend.displayUnits ? labelSettings_trend.displayUnits : 0);
                color_trend = labelSettings_trend.labelColor;
            }

            var percentageVal, actualVal, minVal, maxVal, targetVal, trend1Val, trend2Val;

            if (this.data.target === 0) {
                percentageVal = 0;
            }
            else {
                percentageVal = ((this.data.actual * 100) / this.data.target).toFixed(2);
            }
            //we are calculating value dynamically and using in style proerties to make component more responsive                                         
            function exponentToNumber(input) {
                var data = String(input).split(/[eE]/);
                if (data.length == 1) return data[0];

                var z = '', sign = this < 0 ? '-' : '',
                    str = data[0].replace('.', ''),
                    mag = Number(data[1]) + 1;

                if (mag < 0) {
                    z = sign + '0.';
                    while (mag++) z += '0';
                    return z + str.replace(/^\-/, '');
                }
                mag -= str.length;
                while (mag--) z += '0';
                return str + z;
            }
            function newFormat(c, b) {

                var length = (typeof (c.toString().split(".")[1]) != 'undefined') ? c.toString().split(".")[1].length : 0
                var a = (typeof (c.toString().split(".")[1]) != 'undefined') ? c.toString().split(".")[1] : 0
                var beforeDecimal = c.toString().split(".")[0];
                var f = beforeDecimal;
                if (b != 0)
                    f = f + '.';
                if (length != 0 || b != 0) {
                    for (var i = 0; i < b; i++) {
                        f = f + (typeof (a[i]) != "undefined" ? a[i] : 0);
                    }
                }
                if (f <= 0 && c != 0 && b == length - 1 && b != 0) {

                    var d = a.slice(-1);
                    var e = Math.round(Number('.' + d));
                    var newString = a.substr(0, a.length - 2);
                    var formatedString = newString + e;
                    if (formatedString.length == b) {
                        if (b != 0)
                            formatedString = beforeDecimal + "." + formatedString;

                        return formatedString;
                    }
                }
                else if (b == 0 && a.length >= 1) {
                    f = Math.round(c);
                    return f;
                }
                else {
                    return f;
                }
            }


            switch (displayunitValue) {
                case 0:
                    {
                        actualVal = newFormat(this.data.actual, precisionValue);
                        minVal = newFormat(this.data.min, precisionValue);
                        targetVal = newFormat(this.data.target, precisionValue);

                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = newFormat(this.data.toolTipInfo[a].value, precisionValue);
                        }
                        break;
                    }
                case 1:
                    {
                        actualVal = numberWithCommas(newFormat(this.data.actual, precisionValue));
                        minVal = numberWithCommas(newFormat(this.data.min, precisionValue));
                        targetVal = numberWithCommas(newFormat(this.data.target, precisionValue));

                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = numberWithCommas(newFormat(this.data.toolTipInfo[a].value, precisionValue));
                        }
                        break;
                    }
                case 1000:
                    {

                        actualVal = newFormat((this.data.actual / 1000), precisionValue) + 'K';
                        minVal = newFormat((this.data.min / 1000), precisionValue) + 'K';
                        targetVal = newFormat((this.data.target / 1000), precisionValue) + 'K';

                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000), precisionValue) + 'K').toString();
                        }
                        break;
                    }
                case 1000000:
                    {
                        actualVal = newFormat((this.data.actual / 1000000), precisionValue) + 'M';
                        minVal = newFormat((this.data.min / 1000000), precisionValue) + 'M';
                        targetVal = newFormat((this.data.target / 1000000), precisionValue) + 'M';

                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000000), precisionValue) + 'M').toString();
                        }

                        break;
                    }
                case 1000000000:
                    {
                        actualVal = newFormat((exponentToNumber(this.data.actual / 1000000000)), precisionValue) + 'bn';
                        minVal = newFormat((exponentToNumber(this.data.min / 1000000000)), precisionValue) + 'bn';
                        targetVal = newFormat((exponentToNumber(this.data.target / 1000000000)), precisionValue) + 'bn';


                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000000000), precisionValue) + 'bn').toString();
                        }
                        break;

                    }
                case 1000000000000:
                    {
                        actualVal = newFormat((exponentToNumber(this.data.actual / 1000000000000)), precisionValue) + 'T';
                        minVal = newFormat((exponentToNumber(this.data.min / 1000000000000)), precisionValue) + 'T';
                        targetVal = newFormat((exponentToNumber(this.data.target / 1000000000000)), precisionValue) + 'T';

                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000000000000), precisionValue) + 'T').toString();
                        }
                        break;

                    }

            }

            switch (displayunitValue_trend) {
                case 0:
                    {
                        trend1Val = newFormat(Math.abs(this.data.trendValue1), precisionValue_trend);
                        trend2Val = newFormat(Math.abs(this.data.trendValue2), precisionValue_trend);

                        break;
                    }
                case 1:
                    {

                        trend1Val = numberWithCommas(newFormat(Math.abs(this.data.trendValue1), precisionValue_trend));
                        trend2Val = numberWithCommas(newFormat(Math.abs(this.data.trendValue2), precisionValue_trend));

                        break;
                    }
                case 1000:
                    {


                        trend1Val = newFormat((Math.abs(this.data.trendValue1) / 1000), precisionValue_trend) + 'K';
                        trend2Val = newFormat((Math.abs(this.data.trendValue2) / 1000), precisionValue_trend) + 'K';

                        break;
                    }
                case 1000000:
                    {

                        trend1Val = newFormat((Math.abs(this.data.trendValue1) / 1000000), precisionValue_trend) + 'M';
                        trend2Val = newFormat((Math.abs(this.data.trendValue2) / 1000000), precisionValue_trend) + 'M';

                        break;
                    }
                case 1000000000:
                    {

                        trend1Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue1) / 1000000000)), precisionValue_trend) + 'bn';
                        trend2Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue2) / 1000000000)), precisionValue_trend) + 'bn';

                        break;

                    }
                case 1000000000000:
                    {

                        trend1Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue1) / 1000000000000)), precisionValue_trend) + 'T';
                        trend2Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue2) / 1000000000000)), precisionValue_trend) + 'T';

                        break;

                    }

            }



            this.actual.text(this.data.actualFormat + actualVal);//Using values which are stored in data object

            this.percentage.text((percentageVal) + '%');
            this.min.text(this.data.minFormat + minVal);

            var upArrow = '&#8599;', arrowClassTV1, arrowClassTV2;
            var customwidth = (window.getComputedStyle($(this.svg[0][0])[0]).width).slice(0, -2);
            var wifth = Number(customwidth) - 20;

            var percen = (((this.data.target - this.data.min) * 100) / (this.data.max - this.data.min));
            percen = (isNaN(percen)) ? 0 : percen;
            var passingValue = (((wifth * percen) / 100) <= 0) ? 0 : ((wifth * percen) / 100);

            var passingTextvalue = (wifth * (percen - 2)) / 100;
            //Scale on X-axis
            var actualFont = ((width + height) / 22);
            var percentageFont = actualFont / 2.5;
            var iMinAndTargetFont = 16;
            var topMargin;

            if (this.data.flip) {
                topMargin = 5 + 'px';
                actualFont = ((width + height) / 17);
                percentageFont = actualFont / 2.5;
                iMinAndTargetFont = actualFont / 2;
            } else {
                topMargin = (height / 7) + 'px';
            }
            this.min.style('font-size', iMinAndTargetFont + 'px');
            this.actual.style('font-size', actualFont + 'px');
            this.actual.style('color', color);
            this.actual.style('margin-right', percentageFont + 'px');
            this.percentage.style('font-size', percentageFont + 'px');
            this.percentage.style('padding-top', (percentageFont + 5) + 'px');
            if (!this.data.flip) {
                this.percentage.style('padding-top', (percentageFont + 10) + 'px');
                if (percentageFont < 20) {
                    this.percentage.style('padding-top', (percentageFont) + 'px');
                }
            }
            this.percentage.style('color', color);
            var trendValue1Text, trendValue2Text;
            var indexQualStatVal1, indexQualStatVal2, flagQualStatVal1 = false, flagQualStatVal2 = false, lengthColumn = options.dataViews[0].metadata.columns.length;
            //Populating Trend Value 1 and Trend Value 2 data  
            for (var ite = 0; ite < lengthColumn; ite++) {
                if (dataView.metadata.columns[ite].roles['QualitativeState1Value'] === true) {
                    flagQualStatVal1 = true;
                    indexQualStatVal1 = ite;
                }
                if (dataView.metadata.columns[ite].roles['QualitativeState2Value'] === true) {
                    flagQualStatVal2 = true;
                    indexQualStatVal2 = ite;
                }

            }
            if (flagQualStatVal1) {
                trendValue1Text = dataView.metadata.columns[indexQualStatVal1].displayName;
            }
            else {
                trendValue1Text = '';
            }
            if (flagQualStatVal2) {
                trendValue2Text = dataView.metadata.columns[indexQualStatVal2].displayName;

            }
            else {
                trendValue2Text = '';
            }
            //Adding css dynamically to make the component responsive, all values are calculated from Viewport value
            this.heading.style('margin-top', topMargin);
            this.trendValue1.style('font-size', percentageFont + 'px');
            this.trendValue1.style('color', color_trend);
            this.trendValue2.style('font-size', percentageFont + 'px');
            this.trendValue2.style('color', color_trend);
            var scale = d3.scale.linear()
                .domain([0, Math.max(sortedRanges[0], this.data.target, this.data.value)])
                .range([0, width]);

            if (flagQualStatVal1) {
                this.trendValue1.style('display', 'inline');
                this.trendValue1.select('span.trendvalue1arrow').remove();
                this.trendValue1.select('span').remove();
                this.trendValue1.append('span')
                    .classed('trendvalue1arrow', true)
                    .html(upArrow);
                this.trendValue1.append('span').text(trend1Val + this.data.trend1Format + ' ' + trendValue1Text);


                if (this.data.trendValue1 < 0) {
                    //$('.trendvalue1arrow').css('Transform','rotate(90deg)');

                    if ((this.trendValue1[0][0].querySelectorAll(".trendvalue1arrow")).length != 0) {
                        arrowClassTV1 = this.trendValue1[0][0].querySelectorAll(".trendvalue1arrow");
                        arrowClassTV1[0].style.transform = "rotate(90deg)";
                        arrowClassTV1[0].style.display = "inline-block"
                    }
                }
            }
            else {
                this.trendValue1.style('display', 'none');
            }
            if (flagQualStatVal2) {
                this.trendValue2.style('display', 'inline');

                this.trendValue2.select('span.trendvalue2arrow').remove();
                this.trendValue2.select('span').remove();
                this.trendValue2.append('span')
                    .classed('trendvalue2arrow', true)
                    .html(upArrow);
                this.trendValue2.append('span').text(trend2Val + this.data.trend2Format + ' ' + trendValue2Text);
                if (this.data.trendValue2 < 0) {
                    if ((this.trendValue2[0][0].querySelectorAll(".trendvalue2arrow")).length != 0) {
                        arrowClassTV2 = this.trendValue2[0][0].querySelectorAll(".trendvalue2arrow");
                        arrowClassTV2[0].style.transform = "rotate(90deg)";
                        arrowClassTV2[0].style.display = "inline-block"
                    }
                }
            }
            else {
                this.trendValue2.style('display', 'none');
            }
            if ((this.trendValue1[0][0].querySelectorAll(".trendvalue1arrow")).length != 0) {
                arrowClassTV1 = this.trendValue1[0][0].querySelectorAll(".trendvalue1arrow");
                arrowClassTV1[0].style.fontSize = percentageFont + 4 + 'px';
            }
            if ((this.trendValue2[0][0].querySelectorAll(".trendvalue1arrow")).length != 0) {
                arrowClassTV2 = this.trendValue2[0][0].querySelectorAll(".trendvalue2arrow");
                arrowClassTV2[0].style.fontsize = percentageFont + 4 + 'px';
            }
            //Ranges
            var range = this.svgLinear.selectAll('rect.range')
                .data(sortedRanges);


            range.enter()
                .append('rect')
                .attr('class', function (d, i) { return 'range s' + i; });

            if (this.data.flip) {
                range
                    .attr('x', (viewport.width / 2) - (yModHeight / 2) - 10)
                    .attr('y', 0)
                    .attr('height', viewport.height - 15) // 5px title margin + 5px transformation + 5px from bottom 
                    .attr('width', yModHeight)
                    .style('fill', this.data.colorComparison);
            }
            else {
                range
                    .attr('x', 0)
                    .attr('width', function (d) { return (Math.abs(scale(d) - scale(0))); })
                    .attr('height', modHeight)
                    .style('fill', this.data.colorComparison);
            }
            //Comparison measure
            this.svgLinear.selectAll('rect.measure').remove();
            if (this.data.comparison > 0) {
                var comparison = this.svgLinear
                    .append('rect')
                    .classed('measure', true)
                    .style('fill', this.data.colorComparison);

                if (this.data.flip) {
                    comparison
                        .attr('width', (yModHeight))
                        .attr('height', scale(this.data.comparison))
                        .attr('x', (viewport.width / 2) - (yModHeight / 2) - 10)
                        //.attr('x', 0)
                        .attr('y', 5);
                }
                else {
                    comparison
                        .attr('width', scale(this.data.comparison))
                        .attr('height', (modHeight / 3))
                        .attr('x', 0)
                        .attr('y', (modHeight / 3));
                }
            }
            var percent = (((this.data.actual - this.data.min) * 100) / (this.data.max - this.data.min));
            percent = (isNaN(percent)) ? 0 : percent;

            var actual = (((width * percent) / 100) <= 0) ? 0 : ((width * percent) / 100);
            actual = (isNaN(actual)) ? 0 : actual;
            //Main measure
            var measure = this.svgLinear
                .append('rect')
                .classed('measure', true)
                .style('fill', this.data.colorActual);

            if (this.data.flip) {
                actual = ((((viewport.height - 15) * percent) / 100) <= 0) ? 0 : (((viewport.height - 15) * percent) / 100);
                if (this.data.actual < this.data.max) {
                    measure
                        .attr('height', actual)
                        .attr('width', yModHeight)
                        .attr('x', (viewport.width / 2) - (yModHeight / 2) - 10)
                        .attr('y', viewport.height - 15 - actual);
                }
                else {
                    measure
                        .attr('height', viewport.height - 15)
                        .attr('width', yModHeight)
                        .attr('x', (viewport.width / 2) - (yModHeight / 2) - 10)
                        .attr('y', 0);
                }
            }
            else {
                if (this.data.actual < this.data.max) {
                    measure
                        .attr('width', actual)
                        .attr('height', modHeight)
                        .attr('x', 0)
                        .attr('y', 0);
                }
                else {
                    measure
                        .attr('width', width)
                        .attr('height', modHeight)
                        .attr('x', 0)
                        .attr('y', 0);
                }
            }
            if (this.data.max <= this.data.min) {
                measure.style('display', 'none');
            }
            //Target markers
            this.svgLinear.selectAll('line.marker').remove();
            var marker = this.svgLinear
                .append('line')
                .classed('marker', true)
                .style('stroke', 'black');

            var startingPoint = 0;
            var minvalueWidth = 0, tiltend;


            var customMin = (window.getComputedStyle($(this.min[0][0])[0]).width).slice(0, -2);

            startingPoint = Number(customMin) + 10;
            globalminLength = startingPoint;
            var customsvgWidth = (window.getComputedStyle($(this.svg[0][0])[0]).width).slice(0, -2);
            var fullsvgWidth = Number(customsvgWidth) - 20;
            minvalueWidth = (fullsvgWidth * (((this.data.target - this.data.min) * 100) / (this.data.max - this.data.min))) / 100;
            globalTargetWidth = minvalueWidth;
            var targetValueText = this.data.targetFormat + targetVal


            var targetTextwidth = 9 * targetValueText.length + 10;

            var flag = false;
            if (globalTargetWidth < globalminLength || passingValue < (targetTextwidth + startingPoint)) {
                tiltend = globalminLength + 10;
                flag = true;
            }
            else {
                tiltend = passingValue;
                flag = false;
            }

            if (this.data.flip) {
                passingValue = ((((viewport.height - 15) * percen) / 100) <= 0) ? 0 : (((viewport.height - 15) * percen) / 100);
                marker
                    .attr(
                    {
                        x1: (viewport.width / 2) - (yModHeight / 2) - 10,
                        y1: viewport.height - passingValue - 15,
                        x2: (viewport.width / 2) - (yModHeight / 2) - 10 + yModHeight,
                        y2: viewport.height - passingValue - 15
                    });
            } else {
                marker
                    .attr(
                    {
                        x1: passingValue,
                        y1: 0,
                        x2: passingValue,
                        y2: modHeight
                    });
            }

            this.svgLinear.selectAll('line.markerTilt').remove();
            var tiltmarker = this.svgLinear
                .append('line')
                .classed('markerTilt', true)
                .style('stroke', 'black');
            tiltmarker
                .attr(
                {
                    x1: passingValue,
                    y1: modHeight,
                    x2: (tiltend),
                    y2: (modHeight + 10)
                });

            if (globalTargetWidth > globalminLength) {
                this.svgLinear.selectAll('line.markerTilt').remove();
            }
            //Target Text   
            var customwifth = (window.getComputedStyle($(this.svg[0][0])[0]).width).slice(0, -2);
            var wifth = Number(customwifth) - 10;
            var percen = (((this.data.target - this.data.min) * 100) / (this.data.max - this.data.min));
            percen = (isNaN(percen)) ? 0 : percen;
            var passingValue = (((wifth * percen) / 100) <= 0) ? 0 : ((wifth * percen) / 100);

            var diff = wifth - passingValue + 20;
            if (this.data.flip) {
                this.svgLinear.selectAll('line.markerTilt').remove();
                this.targetText.selectAll('span.markerTarget').remove();
                this.svgLinear.selectAll('text.markerTarget').remove();
                passingValue = ((((viewport.height - 15) * percen) / 100) <= 0) ? 0 : (((viewport.height - 15) * percen) / 100);
                var iTargetHeight = TextMeasurementService.measureSvgTextHeight({ fontFamily: 'Segoe UI', fontSize: iMinAndTargetFont + 'px', text: this.data.targetFormat + targetVal });
                var iStartHeight1 = TextMeasurementService.measureSvgTextHeight({ fontFamily: 'Segoe UI', fontSize: iMinAndTargetFont + 'px', text: this.data.minFormat + minVal });
                passingValue = viewport.height - 15 <= passingValue + iTargetHeight ? passingValue - (iTargetHeight / 2) : passingValue;
                passingValue = passingValue < iStartHeight1 + 5 ? iStartHeight1 + 5 : passingValue;
                console.log(passingValue);
                var markerText = this.targetText
                    .append('span')
                    .classed('markerTarget', true)
                    .text(this.data.targetFormat + targetVal)
                    .style("position", "absolute")
                    .style('color', 'Black')
                    .style('font-size', iMinAndTargetFont + 'px')
                    .style('line-height', (iMinAndTargetFont * 52) / 60 + 'px')
                    .style("bottom", (passingValue) + 'px')
                    .style('left', viewport.width / 2 + (yModHeight / 2) + 5 + 'px');
            }
            else {
                if (flag == false) {
                    this.targetText.selectAll('span.markerTarget').remove();
                    this.svgLinear.selectAll('text.markerTarget').remove();

                    if (diff >= 20) {
                        var markerText = this.targetText
                            .append('span')
                            .classed('markerTarget', true)
                            .text(this.data.targetFormat + targetVal)
                            .style("float", "right")
                            .style('color', 'Black')
                            .style("margin-right", diff + 'px');
                    }
                    else {
                        var markerText = this.targetText
                            .append('span')
                            .classed('markerTarget', true)
                            .text(this.data.targetFormat + targetVal)
                            .style("float", "right")
                            .style('color', 'Black')
                            .style("display", 'none');
                    }
                }
                else {
                    this.targetText.selectAll('span.markerTarget').remove();
                    this.svgLinear.selectAll('text.markerTarget').remove();
                    var markerText = this.svgLinear
                        .append('text')
                        .classed('markerTarget', true)
                        .style('color', 'black')
                        .style('text-anchor', 'start')
                        .text(this.data.targetFormat + targetVal)


                    markerText
                        .attr('width', 1)
                        .attr('height', modHeight)
                        .attr('x', tiltend)
                        .attr('y', (modHeight + 20))
                        .attr('overflow', 'visible !important');
                    this.targetText.style("Display", "None");
                }
            }
            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            if (this.data.target < this.data.min || !(this.data.targetSet)) {
                this.svgLinear.selectAll('text.markerTarget').remove();
                this.svgLinear.selectAll('line.marker').remove();
                this.svgLinear.selectAll('line.markerTilt').remove();
            }
            if (this.data.target > this.data.max) {
                //this.svgLinear.selectAll('.measure').style('display','none');
                this.svgLinear.selectAll('.marker').style('display', 'none');
                this.targetText.style('display', 'none');
                this.svgLinear.selectAll('line.marker').remove();
                this.svgLinear.selectAll('line.markerTilt').remove();
                this.svgLinear.selectAll('text.markerTarget').remove();

            }
            else {
                //this.svgLinear.selectAll('.measure').style('display','block');
                this.svgLinear.selectAll('.marker').style('display', 'block');
                this.targetText.style('display', 'block');
            }

            // Setting width for the trend labels 
            if (this.data.flip) {
                var iWidth = (viewport.width / 2) - (yModHeight / 2) - 10;
                this.root.select('div.imagetab').style('float', 'left');
                if (this.trendValue1.style('display') != 'none' || this.trendValue2.style('display') != 'none') {
                    this.svg.style('margin-left', -1 * (iWidth + 9) + 'px');
                }

                this.root.select('div.imagetab')
                    .style('word-break', 'break-all')
                    .style('width', iWidth + 'px')
                    .style('margin-right', '10px');
            } else {
                this.root.select('div.imagetab').style('float', 'right');

                this.root.select('div.imagetab')
                    .style('word-break', 'normal')
                    .style('width', 'auto')
                    .style('margin-right', '20px');

                this.svg.style('margin-left', '0px');
            }

            // to change label positions
            if (this.data.flip) {
                var iStartWidth = TextMeasurementService.measureSvgTextWidth({ fontFamily: 'Segoe UI', fontSize: '16px', text: this.data.minFormat + minVal });
                var iStartHeight = TextMeasurementService.measureSvgTextHeight({ fontFamily: 'Segoe UI', fontSize: '16px', text: this.data.minFormat + minVal });
                var iTargetWidth = TextMeasurementService.measureSvgTextWidth({ fontFamily: 'Segoe UI', fontSize: '16px', text: this.data.targetFormat + targetVal });
                var iActualHeight = TextMeasurementService.measureSvgTextHeight({ fontFamily: 'Segoe UI', fontSize: actualFont + 'px', text: this.data.actualFormat + actualVal });
                var iActualWidth = TextMeasurementService.measureSvgTextWidth({ fontFamily: 'Segoe UI', fontSize: actualFont + 'px', text: this.data.actualFormat + actualVal });
                var iPercentWidth = TextMeasurementService.measureSvgTextWidth({ fontFamily: 'Segoe UI', fontSize: percentageFont + 'px', text: this.data.percentage + percentageVal + '%' });
                var iPercentHeight = TextMeasurementService.measureSvgTextHeight({ fontFamily: 'Segoe UI', fontSize: percentageFont + 'px', text: this.data.percentage + percentageVal + '%' });
                this.root.select('div.LG_txtPercentage')
                    .style('clear', 'left')
                    .style('position', 'absolute')
                    .style('bottom', iActualHeight + 'px')
                    .style('left', viewport.width / 2 - (yModHeight / 2) - iPercentWidth + 'px');
                this.root.select('div.scale')
                    .style('clear', 'left')
                    .style('position', 'absolute')
                    .style('bottom', '6px')
                    .style('font-size', iMinAndTargetFont + 'px')
                    .style('line-height', (iMinAndTargetFont * 52) / 60 + 'px')
                    .style('left', viewport.width / 2 + (yModHeight / 2) - 3 + 'px');

                this.root.select('div.LG_txtActual')
                    .style('clear', 'left')
                    .style('position', 'absolute')
                    .style('left', viewport.width / 2 - (yModHeight / 2) - iActualWidth - 4 + 'px')
                    .style('bottom', '3px');

                this.root.select('div.LG_txtActual').select('span')
                    .style('line-height', (actualFont * 52) / 60 + 'px')
                    .style('margin', '0 20px 0 0');

                if (this.data.target <= 0) {
                    this.targetText.text('');
                }

            } else {
                this.root.select('div.LG_txtPercentage')
                    .style('clear', 'none')
                    .style('position', 'static')
                    .style('float', 'left');
                this.root.select('div.scale')
                    .style('clear', 'none')
                    .style('position', 'static')
                    .style('line-height', 'normal')
                    .style('float', 'left');
                this.root.select('div.LG_txtActual')
                    .style('clear', 'none')
                    .style('position', 'static')
                    .style('float', 'left');
                this.root.select('div.LG_txtActual')
                    .select('span')
                    .style('line-height', 'normal');
                this.targetText
                    .select('span')
                    .style('line-height', 'normal');
            }
            TooltipManager.addTooltip(this.svgLinear, (tooltipEvent: TooltipEvent) => this.data.toolTipInfo);//Adding visual tips
            globalminValue = minVal;
            globalTargetValue = targetVal;
        }

        //Make visual properties available in the property pane in Power BI
        //values which we can customized from property pane in Power BI                
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {

            var enumeration = new ObjectEnumerationBuilder();
            if (!this.data)
                this.data = LinearGauge.getDefaultData();
            if (!this.cardFormatSetting)
                this.cardFormatSetting = this.getDefaultFormatSettings();

            if (!this.cardFormatSetting_trend)
                this.cardFormatSetting_trend = this.getDefaultFormatSettings_trend();

            var formatSettings = this.cardFormatSetting;
            var formatSettings_trend = this.cardFormatSetting_trend;


            switch (options.objectName) {
                case 'general':
                    enumeration.pushInstance({
                        objectName: 'general',
                        displayName: 'General',
                        selector: null,
                        properties: {
                            ActualFillColor: this.data.colorActual,
                            ComparisonFillColor: this.data.colorComparison
                        }
                    });
                    break;
                case 'flip':
                    enumeration.pushInstance({
                        objectName: 'flip',
                        displayName: 'Vertical Mode',
                        selector: null,
                        properties: {
                            show: this.data.flip
                        }
                    });
                    break;
                case 'labels':
                    var labelSettingOptions: VisualDataLabelsSettingsOptions = {
                        enumeration: enumeration,
                        dataLabelsSettings: formatSettings.labelSettings,
                        show: true,
                        displayUnits: true,
                        precision: true,
                    };
                    dataLabelUtils.enumerateDataLabels(labelSettingOptions);
                    break;

                case 'trendlabels':
                    var labelSettingOptions_trend: VisualDataLabelsSettingsOptions = {
                        enumeration: enumeration,
                        dataLabelsSettings: formatSettings_trend.labelSettings,
                        show: true,
                        displayUnits: true,
                        precision: true,
                    };
                    dataLabelUtils.enumerateDataLabels(labelSettingOptions_trend);
                    break;

            }

            return enumeration.complete();
        }

    }
}

/* Creating IVisualPlugin that is used to represent IVisual. */
//
// Uncomment it to see your plugin in "PowerBIVisualsPlayground" plugins list
// Remember to finally move it to plugins.ts
//
//module powerbi.visuals.plugins {
//    export var LinearGauge: IVisualPlugin = {
//        name: 'LinearGauge',
//        capabilities: LinearGauge.capabilities,
//        create: () => new LinearGauge()
//    };
//}