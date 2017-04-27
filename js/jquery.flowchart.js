$(function() {
    // the widget definition, where "custom" is the namespace,
    // "colorize" the widget name
    $.widget("flowchart.flowchart", {
        // default options
        options: {
            canUserEditLinks: true,
            canUserMoveOperators: true,
            data: {},
            distanceFromArrow: 0,
            defaultOperatorClass: 'flowchart-default-operator',
            defaultLinkTitle: '',
            defaultLinkColor: 'black',
            defaultSelectedLinkColor: 'blue',
            defaultOperatorsColor: "#CCCCCC",
            defaultOperatorsBold: "1px",
            linkWidth: 2,
            linkSelectedWidth: 3,
            grid: 20,
            multipleLinksOnOutput: true,
            multipleLinksOnInput: true,
            linkVerticalDecal: 0,
            interFace: {
                onOperatorSelect: function(operatorId) {
                    return true;
                },
                onOperatorUnselect: function() {
                    return true;
                },
                onLinkSelect: function(linkId) {
                    return true;
                },
                onLinkUnselect: function() {
                    return true;
                },
                showTips: function(tipStr) {
                    return true;
                }
            },
            onOperatorMouseOver: function(operatorId) {
                return true;
            },
            onOperatorMouseOut: function(operatorId) {
                return true;
            },

            onOperatorCreate: function(operatorId, operatorData, fullElement) {
                return true;
            },
            onLinkCreate: function(linkId, linkData) {
                return true;
            },
            onOperatorDelete: function(operatorId) {
                return true;
            },
            onLinkDelete: function(linkId, forced) {
                return true;
            },
            onOperatorMoved: function(operatorId, position) {
                return true;
            }
        },
        data: null,
        objs: null,
        maskNum: 0,
        linkNum: 1,
        operatorNum: 0,
        lastOutputConnectorClicked: null,
        selectedOperatorId: null,
        selectedLinkId: null,
        positionRatio: 1,
        globalId: null,
        mode: 1, // 记录当前连线模式的flag

        operatorRecordForSwitch: "",

        recordArray: [], // 在用户创建OM或MO模式新枝（点击Done按键之前）过程中保存用户创建的新的连线的数组

        dictionary_1: new Array(), // 字典数据结构，以节点为key，保存以该节点为起始节点的OM连线

        dictionary_2: new Array(), // 字典数据结构，以节点为key，保存以该节点为终止节点的MO连线

        dictionary_3: new Array(), // 字典数据结构，以节点为key，保存该节点下OM连线的主干连线的数量，
        // 调用linkdone()函数之后递增，用于OM主干连线角度的设定，被_refreshLinkPositions()函数调用

        dictionary_4: new Array(), // 字典数据结构，以节点为key，保存该节点下MO连线的主干连线的数量
        // 调用linkdone()函数之后递增，用于MO主干连线角度的设定，被_refreshLinkPositions()函数调用

        report: [], // 保存每一次的调用getReturnValue()函数的返回值

        ansObj: {},

        // the constructor
        _create: function() {
            if (typeof document.__flowchartNumber == 'undefined') {
                document.__flowchartNumber = 0;
            } else {
                document.__flowchartNumber++;
            }
            this.globalId = document.__flowchartNumber;
            this._initVariables();

            this.element.addClass('flowchart-container');

            this.objs.layers.links = $('<svg class="flowchart-links-layer"></svg>');
            this.objs.layers.links.appendTo(this.element);

            this.objs.layers.operators = $('<div class="flowchart-operators-layer unselectable"></div>');
            this.objs.layers.operators.appendTo(this.element);

            this.objs.layers.temporaryLink = $('<svg class="flowchart-temporary-link-layer"></svg>');
            this.objs.layers.temporaryLink.appendTo(this.element);

            var shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
            shape.setAttribute("x1", "0");
            shape.setAttribute("y1", "0");
            shape.setAttribute("x2", "0");
            shape.setAttribute("y2", "0");
            shape.setAttribute("stroke-dasharray", "6,6");
            shape.setAttribute("stroke-width", this.options.linkWidth);
            shape.setAttribute("stroke", "black");
            shape.setAttribute("fill", "none");
            this.objs.layers.temporaryLink[0].appendChild(shape);
            this.objs.temporaryLink = shape;

            this._initEvents();

            if (typeof this.options.data != 'undefined') {
                this.setData(this.options.data);
            }
        },

        _initVariables: function() {

            //这个对象保存了流图的所有节点和边的状态
            this.data = {
                operators: {},
                links: {}
            };

            this.objs = {
                layers: {
                    operators: null,
                    temporaryLink: null,
                    links: null
                },
                linksContext: null,
                temporaryLink: null
            };
        },

        // 初始化状态
        //*****关于这里的事件*****
        _initEvents: function() {

            var self = this;

            this.element.mousemove(function(e) {
                var $this = $(this);
                var offset = $this.offset();
                self._mousemove((e.pageX - offset.left) / self.positionRatio, (e.pageY - offset.top) / self.positionRatio, e);
            });

            this.element.click(function(e) {
                var $this = $(this);
                var offset = $this.offset();
                self._click((e.pageX - offset.left) / self.positionRatio, (e.pageY - offset.top) / self.positionRatio, e);
            });


            this.objs.layers.operators.on('pointerdown mousedown touchstart', '.flowchart-operator', function(e) {
                e.stopImmediatePropagation();
            });

            this.objs.layers.operators.on('click', '.flowchart-operator', function(e) {
                if ($(e.target).closest('.flowchart-operator-connector').length == 0) {
                    self.selectOperator($(this).data('operator_id'));
                }
            });

            this.objs.layers.operators.on('click', '.flowchart-operator-connector', function() {
                var $this = $(this);
                if (self.options.canUserEditLinks) {
                    self._connectorClicked($this.closest('.flowchart-operator').data('operator_id'), $this.data('connector'), $this.data('sub_connector'), $this.closest('.flowchart-operator-connector-set').data('connector_type'));
                }
            });

            this.objs.layers.links.on('mousedown touchstart', '.flowchart-link', function(e) {
                e.stopImmediatePropagation();
            });

            this.objs.layers.links.on('click', '.flowchart-link', function() {
                self.selectLink($(this).data('link_id'));
            });

            this.objs.layers.operators.on('mouseover', '.flowchart-operator', function(e) {
                self._operatorMouseOver($(this).data('operator_id'));
            });

            this.objs.layers.operators.on('mouseout', '.flowchart-operator', function(e) {
                self._operatorMouseOut($(this).data('operator_id'));
            });

        },

        setData: function(data) {
            this._clearOperatorsLayer();

            this.data.operators = {};
            for (var operatorId in data.operators) {
                if (data.operators.hasOwnProperty(operatorId)) {
                    this.createOperator(operatorId, data.operators[operatorId]);
                }
            }
            this.data.links = {};
            for (var linkId in data.links) {
                if (data.links.hasOwnProperty(linkId)) {
                    this.createLink(linkId, data.links[linkId]);
                }
            }
            this.redrawLinksLayer();
        },

        // 添加 link，只在 connectors clicked 的时候被调用
        // 设置 linkId 的格式为: “l” + linkNum
        // 如果当前为 OM 或 MO 模式，则更新record并开始记录当前新增的linkId
        addLink: function(linkData) {
            //OM模式下如果切换了起点则要linkdone
            if (this.mode == 2) {
                if (operatorRecordForSwitch != linkData.fromOperator) {
                    this.linkdone();
                    operatorRecordForSwitch = linkData.fromOperator;
                }
            }

            //MO模式下如果切换了终点则要linkdone
            if (this.mode == 3) {
                if (operatorRecordForSwitch != linkData.toOperator) {
                    this.linkdone();
                    operatorRecordForSwitch = linkData.toOperator;
                }
            }

            var linkId = "l" + String(this.linkNum);
            this.createLink(linkId, linkData);

            if (this.mode != 1) {
                // 意味着是在 OM 或 MO 模式下添加的边，加入到this.recordArray中
                // OO 模式是不会去修改recordArray的，recordArray这也是linkdone的关键
                this.recordArray.push(linkId);
            }
        },

        // 在 setData 函数中被调用
        createLink: function(linkId, linkDataOriginal) {
            var linkData = $.extend(true, {}, linkDataOriginal);
            if (!this.options.onLinkCreate(linkId, linkData)) {
                return;
            }

            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];

            var multipleLinksOnOutput = this.options.multipleLinksOnOutput;
            var multipleLinksOnInput = this.options.multipleLinksOnInput;
            if (!multipleLinksOnOutput || !multipleLinksOnInput) {
                for (var linkId2 in this.data.links) {
                    if (this.data.links.hasOwnProperty(linkId2)) {
                        var currentLink = this.data.links[linkId2];

                        var currentSubConnectors = this._getSubConnectors(currentLink);
                        var currentFromSubConnector = currentSubConnectors[0];
                        var currentToSubConnector = currentSubConnectors[1];

                        if (!multipleLinksOnOutput && currentLink.fromOperator == linkData.fromOperator && currentLink.fromConnector == linkData.fromConnector && currentFromSubConnector == fromSubConnector) {
                            this.deleteLink(linkId2);
                            continue;
                        }
                        if (!multipleLinksOnInput && currentLink.toOperator == linkData.toOperator && currentLink.toConnector == linkData.toConnector && currentToSubConnector == toSubConnector) {
                            this.deleteLink(linkId2);
                        }
                    }
                }
            }

            this.data.links[linkId] = linkData;
            this.data.links[linkId].Title = "link" + this.linkNum;
            this.data.links[linkId].siblings = [];
            this._drawLink(linkId);
        },

        redrawLinksLayer: function() {
            this._clearLinksLayer();
            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    this._drawLink(linkId);
                }
            }
        },

        _clearLinksLayer: function() {
            this.objs.layers.links.empty();
            this.objs.layers.operators.find('.flowchart-operator-connector-small-arrow').css('border-left-color', 'transparent');
        },

        _clearOperatorsLayer: function() {
            this.objs.layers.operators.empty();
        },

        getConnectorPosition: function(operatorId, connectorId, subConnector) {
            var operatorData = this.data.operators[operatorId];
            var $connector = operatorData.internal.els.connectorArrows[connectorId][subConnector];

            var connectorOffset = $connector.offset();
            var elementOffset = this.element.offset();

            var x = (connectorOffset.left - elementOffset.left) / this.positionRatio;
            var width = parseInt($connector.css('border-top-width'));
            var y = (connectorOffset.top - elementOffset.top - 1) / this.positionRatio + parseInt($connector.css('border-left-width'));

            return { x: x, width: width, y: y };
        },

        getLinkMainColor: function(linkId) {
            var color = this.options.defaultLinkColor;
            var linkData = this.data.links[linkId];
            if (typeof linkData.color != 'undefined') {
                color = linkData.color;
            }
            return color;
        },

        getLinkTitle: function(linkId) {
            var title = this.options.defaultLinkTitle;
            var linkData = this.data.links[linkId];
            if (typeof linkData.internal.els.text != 'undefined') {
                title = linkData.internal.els.text;
            }
            return title;
        },

        //MLX: 划线部分相关代码（定义fromOperator和toOperator）
        _drawLink: function(linkId) {
            var linkData = this.data.links[linkId];
            linkData.mode = this.mode;

            if (typeof linkData.internal == 'undefined') {
                linkData.internal = {};
            }
            linkData.internal.els = {};

            var fromOperatorId = linkData.fromOperator;
            var fromConnectorId = linkData.fromConnector;
            var toOperatorId = linkData.toOperator;
            var toConnectorId = linkData.toConnector;

            if (linkData.mode == 2) {
                if (!!this.dictionary_3[fromOperatorId] == false) {
                    this.dictionary_3[fromOperatorId] = 1;
                }
                linkData.OMNum = this.dictionary_3[fromOperatorId];
            }

            if (linkData.mode == 3) {
                if (!!this.dictionary_4[toOperatorId] == false) {
                    this.dictionary_4[toOperatorId] = 1;
                }
                linkData.MONum = this.dictionary_4[toOperatorId];
            }

            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];

            var fromOperator = this.data.operators[fromOperatorId];
            var toOperator = this.data.operators[toOperatorId];

            var fromSmallConnector = fromOperator.internal.els.connectorSmallArrows[fromConnectorId][fromSubConnector];
            var toSmallConnector = toOperator.internal.els.connectorSmallArrows[toConnectorId][toSubConnector];

            linkData.internal.els.fromSmallConnector = fromSmallConnector;
            linkData.internal.els.toSmallConnector = toSmallConnector;

            var overallGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.objs.layers.links[0].appendChild(overallGroup);
            linkData.internal.els.overallGroup = overallGroup;

            var mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
            var maskId = "fc_mask_" + this.globalId + "_" + this.maskNum;
            this.maskNum++;
            mask.setAttribute("id", maskId);

            overallGroup.appendChild(mask);

            var shape_polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            shape_polygon.setAttribute("stroke", "none");
            shape_polygon.setAttribute("fill", "black");
            mask.appendChild(shape_polygon);
            linkData.internal.els.mask = shape_polygon;

            var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.setAttribute('class', 'flowchart-link');
            group.setAttribute('data-link_id', linkId);
            overallGroup.appendChild(group);

            var shape_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            shape_path.setAttribute("stroke-width", this.options.linkWidth.toString());
            shape_path.setAttribute("fill", "none");
            group.appendChild(shape_path);
            linkData.internal.els.path = shape_path;

            var shape_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            shape_rect.setAttribute("stroke", "none");
            shape_rect.setAttribute("mask", "url(#" + maskId + ")");
            group.appendChild(shape_rect);
            linkData.internal.els.rect = shape_rect;

            var path_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            path_text.textContent = this.data.links[linkId].Title;
            path_text.setAttribute("id", linkId);
            path_text.setAttribute("fill", "black");
            group.appendChild(path_text);
            linkData.internal.els.path_text = path_text;
            linkData.internal.els.text = path_text.textContent;

            this._refreshLinkPositions(linkId);
            this.unColorizeLink(linkId);
        },

        _getSubConnectors: function(linkData) {
            var fromSubConnector = 0;
            if (typeof linkData.fromSubConnector != 'undefined') {
                fromSubConnector = linkData.fromSubConnector;
            }

            var toSubConnector = 0;
            if (typeof linkData.toSubConnector != 'undefined') {
                toSubConnector = linkData.toSubConnector;
            }

            return [fromSubConnector, toSubConnector];
        },

        calc: function(int) {
            switch (int % 5) {
                case 0:
                    return 2;
                    break;
                case 1:
                    return 3;
                    break;
                case 2:
                    return 5;
                    break;
                case 3:
                    return 1;
                    break;
                default:
                    return 4;
            }
        },

        // SVG划线代码（包括三种模式切换）
        // 设置 this.data.links[linkId].type
        _refreshLinkPositions: function(linkId) {
            var linkData = this.data.links[linkId];

            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];

            var fromPosition = this.getConnectorPosition(linkData.fromOperator, linkData.fromConnector, fromSubConnector);
            var toPosition = this.getConnectorPosition(linkData.toOperator, linkData.toConnector, toSubConnector);

            var fromX = fromPosition.x;
            var offsetFromX = fromPosition.width;
            var fromY = fromPosition.y;

            var toX = toPosition.x;
            var toY = toPosition.y;

            fromY += this.options.linkVerticalDecal;
            toY += this.options.linkVerticalDecal;


            var distanceFromArrow = this.options.distanceFromArrow;

            linkData.internal.els.mask.setAttribute("points", fromX + ',' + (fromY - offsetFromX - distanceFromArrow) + ' ' + (fromX + offsetFromX + distanceFromArrow) + ',' + fromY + ' ' + fromX + ',' + (fromY + offsetFromX + distanceFromArrow));


            var bezierFromX = (fromX + offsetFromX + distanceFromArrow);
            var bezierToX = toX + 1;
            var bezierIntensity = 0;

            if (linkData.mode == 1) {
                linkData.internal.els.path.setAttribute("d", 'M' + bezierFromX + ',' + (fromY) + ' C' + (fromX + offsetFromX + distanceFromArrow + bezierIntensity) + ',' + fromY + ' ' + (toX - bezierIntensity) + ',' + toY + ' ' + bezierToX + ',' + toY);
                linkData.internal.els.path_text.setAttribute("x", fromX + (toX - fromX) / 2);
                linkData.internal.els.path_text.setAttribute("y", fromY + (toY - fromY) / 2 - 10);
                linkData.type = "OO";
            }

            if (linkData.mode == 2) {
                //OM或MO时通过 linkData.OMNum 来计算角度不够合理
                //试想第一个位置被占据了，第二次则用第二个位置
                //现在删掉第一个，再增加第三个还是用的第二个的位置，和第二个重叠
                var toX2 = fromX + 50 * Math.sin(Math.PI / 6 * this.calc(linkData.OMNum));
                var toY2 = fromY - 50 * Math.cos(Math.PI / 6 * this.calc(linkData.OMNum));
                linkData.internal.els.path.setAttribute("d", 'M' + bezierFromX + ',' + (fromY) + ' C' + (fromX + offsetFromX + distanceFromArrow + bezierIntensity) + ',' + fromY + ' ' + (toX2 - bezierIntensity) + ',' + toY2 + ' ' + toX2 + ',' + toY2 + 'M' + (toX2) + ',' + (toY2) + 'C' + (toX2 + offsetFromX + distanceFromArrow + bezierIntensity) + ',' + toY2 + ' ' + (toX - bezierIntensity) + ',' + toY + ' ' + bezierToX + ',' + toY);
                linkData.internal.els.path_text.setAttribute("x", toX2 + 50 + (toX - toX2 - 50) / 2);
                linkData.internal.els.path_text.setAttribute("y", toY2 + (toY - toY2) / 2 - 10);
                linkData.type = "OM";
            }

            if (linkData.mode == 3) {
                var toX3 = toX - 50 * Math.sin(Math.PI / 6 * this.calc(linkData.MONum));
                var toY3 = toY - 50 * Math.cos(Math.PI / 6 * this.calc(linkData.MONum));
                linkData.internal.els.path.setAttribute("d", 'M' + bezierFromX + ',' + (fromY) + ' C' + (fromX + offsetFromX + distanceFromArrow + bezierIntensity) + ',' + fromY + ' ' + (toX3 - bezierIntensity) + ',' + toY3 + ' ' + toX3 + ',' + toY3 + 'M' + (toX3) + ',' + (toY3) + 'C' + (toX3) + ',' + toY3 + ' ' + (toX - bezierIntensity) + ',' + toY + ' ' + bezierToX + ',' + toY);
                linkData.internal.els.path_text.setAttribute("x", fromX + (toX - 50 - fromX) / 2);
                linkData.internal.els.path_text.setAttribute("y", fromY + (toY - fromY) / 2 - 10);
                linkData.type = "MO";
            }

            linkData.internal.els.rect.setAttribute("x", fromX);
            linkData.internal.els.rect.setAttribute("y", fromY - this.options.linkWidth / 2);
            linkData.internal.els.rect.setAttribute("width", offsetFromX + distanceFromArrow + 1);
            linkData.internal.els.rect.setAttribute("height", this.options.linkWidth);
        },

        getOperatorCompleteData: function(operatorData) {
            if (typeof operatorData.internal == 'undefined') {
                operatorData.internal = {};
            }
            this._refreshInternalProperties(operatorData);
            var infos = $.extend(true, {}, operatorData.internal.properties);

            for (var connectorId_i in infos.inputs) {
                if (infos.inputs.hasOwnProperty(connectorId_i)) {
                    if (infos.inputs[connectorId_i] == null) {
                        delete infos.inputs[connectorId_i];
                    }
                }
            }

            for (var connectorId_o in infos.outputs) {
                if (infos.outputs.hasOwnProperty(connectorId_o)) {
                    if (infos.outputs[connectorId_o] == null) {
                        delete infos.outputs[connectorId_o];
                    }
                }
            }

            if (typeof infos.class == 'undefined') {
                infos.class = this.options.defaultOperatorClass;
            }
            return infos;
        },

        _getOperatorFullElement: function(operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);
            console.log(operatorData)
            var $operator = $('<div class="flowchart-operator" id="'+operatorData.properties.title+'"></div>');
            $operator.addClass(infos.class);

            var $operator_title = $('<div class="flowchart-operator-title"></div>');
            $operator_title.html(infos.title);
            $operator_title.appendTo($operator);

            var $operator_inputs_outputs = $('<div class="flowchart-operator-inputs-outputs"></div>');

            $operator_inputs_outputs.appendTo($operator);

            var $operator_inputs = $('<div class="flowchart-operator-inputs"></div>');
            $operator_inputs.appendTo($operator_inputs_outputs);

            var $operator_outputs = $('<div class="flowchart-operator-outputs"></div>');
            $operator_outputs.appendTo($operator_inputs_outputs);

            var self = this;

            var connectorArrows = {};
            var connectorSmallArrows = {};
            var connectorSets = {};
            var connectors = {}; /**/

            var fullElement = {
                operator: $operator,
                title: $operator_title,
                connectorSets: connectorSets,
                connectors: connectors,
                connectorArrows: connectorArrows,
                connectorSmallArrows: connectorSmallArrows
            };

            function addConnector(connectorKey, connectorInfos, $operator_container, connectorType) {
                var $operator_connector_set = $('<div class="flowchart-operator-connector-set"></div>');
                $operator_connector_set.data('connector_type', connectorType);
                $operator_connector_set.appendTo($operator_container);

                connectorArrows[connectorKey] = [];
                connectorSmallArrows[connectorKey] = [];
                connectors[connectorKey] = [];
                connectorSets[connectorKey] = $operator_connector_set;

                self._createSubConnector(connectorKey, connectorInfos, fullElement);
            }

            for (var key_i in infos.inputs) {
                if (infos.inputs.hasOwnProperty(key_i)) {
                    addConnector(key_i, infos.inputs[key_i], $operator_inputs, 'inputs');
                }
            }

            for (var key_o in infos.outputs) {
                if (infos.outputs.hasOwnProperty(key_o)) {
                    addConnector(key_o, infos.outputs[key_o], $operator_outputs, 'outputs');
                }
            }

            return fullElement;
        },

        _createSubConnector: function(connectorKey, connectorInfos, fullElement) {
            var $operator_connector_set = fullElement.connectorSets[connectorKey];

            var subConnector = fullElement.connectors[connectorKey].length;

            var $operator_connector = $('<div class="flowchart-operator-connector"></div>');
            $operator_connector.appendTo($operator_connector_set);
            $operator_connector.data('connector', connectorKey);
            $operator_connector.data('sub_connector', subConnector);

            var $operator_connector_label = $('<div class="flowchart-operator-connector-label"></div>');
            $operator_connector_label.text(connectorInfos.label.replace('(:i)', subConnector + 1));
            $operator_connector_label.appendTo($operator_connector);

            var $operator_connector_arrow = $('<div class="flowchart-operator-connector-arrow"></div>');

            $operator_connector_arrow.appendTo($operator_connector);

            var $operator_connector_small_arrow = $('<div class="flowchart-operator-connector-small-arrow"></div>');
            $operator_connector_small_arrow.appendTo($operator_connector);

            fullElement.connectors[connectorKey].push($operator_connector);
            fullElement.connectorArrows[connectorKey].push($operator_connector_arrow);
            fullElement.connectorSmallArrows[connectorKey].push($operator_connector_small_arrow);
        },

        getOperatorElement: function(operatorData) {
            var fullElement = this._getOperatorFullElement(operatorData);
            return fullElement.operator;
        },

        addOperator: function(operatorData) {
            while (typeof this.data.operators[this.operatorNum] != 'undefined') {
                this.operatorNum++;
            }

            this.createOperator(this.operatorNum, operatorData);
            return this.operatorNum;
        },

        // 添加一个新的operator，会调用 self._refreshLinkPositions(linkId)
        createOperator: function(operatorId, operatorData) {
            operatorData.internal = {};
            this._refreshInternalProperties(operatorData);

            var fullElement = this._getOperatorFullElement(operatorData);
            if (!this.options.onOperatorCreate(operatorId, operatorData, fullElement)) {
                return false;
            }

            var grid = this.options.grid;

            if (grid) {
                operatorData.top = Math.round(operatorData.top / grid) * grid;
                operatorData.left = Math.round(operatorData.left / grid) * grid;
            }

            fullElement.operator.appendTo(this.objs.layers.operators);
            fullElement.operator.css({ top: operatorData.top, left: operatorData.left });
            fullElement.operator.data('operator_id', operatorId);

            this.data.operators[operatorId] = operatorData;
            this.data.operators[operatorId].internal.els = fullElement;

            if (operatorId == this.selectedOperatorId) {
                this._addSelectedClass(operatorId);
            }

            var self = this;

            function operatorChangedPosition(operator_id, pos) {
                operatorData.top = pos.top;
                operatorData.left = pos.left;

                for (var linkId in self.data.links) {
                    if (self.data.links.hasOwnProperty(linkId)) {
                        var linkData = self.data.links[linkId];
                        if (linkData.fromOperator == operator_id || linkData.toOperator == operator_id) {
                            self._refreshLinkPositions(linkId);
                        }
                    }
                }
            }

            // Small fix has been added in order to manage eventual zoom
            // http://stackoverflow.com/questions/2930092/jquery-draggable-with-zoom-problem
            if (this.options.canUserMoveOperators) {
                var pointerX;
                var pointerY;
                fullElement.operator.draggable({
                    containment: operatorData.internal.properties.uncontained ? false : this.element,
                    handle: '.flowchart-operator-title',
                    start: function(e, ui) {
                        if (self.lastOutputConnectorClicked != null) {
                            e.preventDefault();
                            return;
                        }
                        var elementOffset = self.element.offset();
                        pointerX = (e.pageX - elementOffset.left) / self.positionRatio - parseInt($(e.target).css('left'));
                        pointerY = (e.pageY - elementOffset.top) / self.positionRatio - parseInt($(e.target).css('top'));
                    },
                    drag: function(e, ui) {
                        if (self.options.grid) {
                            var grid = self.options.grid;
                            var elementOffset = self.element.offset();
                            ui.position.left = Math.round(((e.pageX - elementOffset.left) / self.positionRatio - pointerX) / grid) * grid;
                            ui.position.top = Math.round(((e.pageY - elementOffset.top) / self.positionRatio - pointerY) / grid) * grid;

                            if (!operatorData.internal.properties.uncontained) {
                                var $this = $(this);
                                ui.position.left = Math.min(Math.max(ui.position.left, 0), self.element.width() - $this.outerWidth());
                                ui.position.top = Math.min(Math.max(ui.position.top, 0), self.element.height() - $this.outerHeight());
                            }

                            ui.offset.left = Math.round(ui.position.left + elementOffset.left);
                            ui.offset.top = Math.round(ui.position.top + elementOffset.top);
                            fullElement.operator.css({ left: ui.position.left, top: ui.position.top });
                        }
                        operatorChangedPosition($(this).data('operator_id'), ui.position);
                    },
                    stop: function(e, ui) {
                        self._unsetTemporaryLink();
                        var operatorId = $(this).data('operator_id');
                        operatorChangedPosition(operatorId, ui.position);
                        fullElement.operator.css({
                            height: 'auto',
                            width: 'auto'
                        });

                        self.options.onOperatorMoved(operatorId, ui.position);
                    }
                });
            }
        },

        // 判断节点连线区域被选中的行为
        // 调用 addLink() 函数
        _connectorClicked: function(operator, connector, subConnector, connectorCategory) {
            if (connectorCategory == 'outputs') {
                var d = new Date();
                // var currentTime = d.getTime();
                this.lastOutputConnectorClicked = {
                    operator: operator,
                    connector: connector,
                    subConnector: subConnector
                };
                this.objs.layers.temporaryLink.show();
                var position = this.getConnectorPosition(operator, connector, subConnector);
                var x = position.x + position.width;
                var y = position.y;
                this.objs.temporaryLink.setAttribute('x1', x.toString());
                this.objs.temporaryLink.setAttribute('y1', y.toString());
                this._mousemove(x, y);
            }
            if (connectorCategory == 'inputs' && this.lastOutputConnectorClicked != null) {
                var linkData = {
                    Title: this.options.defaultLinkTitle,
                    fromOperator: this.lastOutputConnectorClicked.operator,
                    fromConnector: this.lastOutputConnectorClicked.connector,
                    fromSubConnector: this.lastOutputConnectorClicked.subConnector,
                    toOperator: operator,
                    toConnector: connector,
                    toSubConnector: subConnector
                };

                this.addLink(linkData);
                this.linkNum++;
                this._unsetTemporaryLink();
            }
        },

        _unsetTemporaryLink: function() {
            this.lastOutputConnectorClicked = null;
            this.objs.layers.temporaryLink.hide();
        },

        _mousemove: function(x, y, e) {
            if (this.lastOutputConnectorClicked != null) {
                this.objs.temporaryLink.setAttribute('x2', x);
                this.objs.temporaryLink.setAttribute('y2', y);
            }
        },

        _click: function(x, y, e) {
            var $target = $(e.target);
            if ($target.closest('.flowchart-operator-connector').length == 0) {
                this._unsetTemporaryLink();
            }

            if ($target.closest('.flowchart-operator').length == 0) {
                this.unselectOperator();
            }

            if ($target.closest('.flowchart-link').length == 0) {
                this.unselectLink();
            }
        },

        _removeSelectedClassOperators: function() {
            this.objs.layers.operators.find('.flowchart-operator').removeClass('selected');
        },

        unselectOperator: function() {
            if (this.selectedOperatorId != null) {
                if (!this.options.interFace.onOperatorUnselect()) {
                    return;
                }
                this._removeSelectedClassOperators();
                this.selectedOperatorId = null;
            }
        },

        _addSelectedClass: function(operatorId) {
            this.data.operators[operatorId].internal.els.operator.addClass('selected');
        },

        selectOperator: function(operatorId) {
            if (!this.options.interFace.onOperatorSelect(operatorId)) {
                return;
            }
            this.unselectLink();

            this._removeSelectedClassOperators();
            this._addSelectedClass(operatorId);
            this.selectedOperatorId = operatorId;
        },

        addClassOperator: function(operatorId, className) {
            this.data.operators[operatorId].internal.els.operator.addClass(className);
        },

        removeClassOperator: function(operatorId, className) {
            this.data.operators[operatorId].internal.els.operator.removeClass(className);
        },

        removeClassOperators: function(className) {
            this.objs.layers.operators.find('.flowchart-operator').removeClass(className);
        },

        _addHoverClassOperator: function(operatorId) {
            this.data.operators[operatorId].internal.els.operator.addClass('hover');
        },

        _removeHoverClassOperators: function() {
            this.objs.layers.operators.find('.flowchart-operator').removeClass('hover');
        },

        _operatorMouseOver: function(operatorId) {
            if (!this.options.onOperatorMouseOver(operatorId)) {
                return;
            }
            this._addHoverClassOperator(operatorId);
        },

        _operatorMouseOut: function(operatorId) {
            if (!this.options.onOperatorMouseOut(operatorId)) {
                return;
            }
            this._removeHoverClassOperators();
        },

        getSelectedOperatorId: function() {
            return this.selectedOperatorId;
        },

        getSelectedLinkId: function() {
            return this.selectedLinkId;
        },

        // Found here : http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        _shadeColor: function(color, percent) {
            var f = parseInt(color.slice(1), 16),
                t = percent < 0 ? 0 : 255,
                p = percent < 0 ? percent * -1 : percent,
                R = f >> 16,
                G = f >> 8 & 0x00FF,
                B = f & 0x0000FF;
            return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        },

        // 控制连线及其名称颜色变化的接口
        colorizeLink: function(linkId, color) {
            var linkData = this.data.links[linkId];
            linkData.internal.els.path.setAttribute('stroke', color);
            linkData.internal.els.rect.setAttribute('fill', color);
            linkData.internal.els.path_text.setAttribute('fill', color);
            linkData.internal.els.fromSmallConnector.css('border-left-color', color);
            linkData.internal.els.toSmallConnector.css('border-left-color', color);
        },
        // 控制连线及其名称颜色还原的接口
        unColorizeLink: function(linkId) {
            this.colorizeLink(linkId, this.getLinkMainColor(linkId));
        },

        // 控制连线及其名称粗细变化的接口
        boldLink: function(linkId, width) {
            var linkData = this.data.links[linkId];
            linkData.internal.els.path.setAttribute('stroke-width', width);
            linkData.internal.els.path_text.style.fontWeight = 'bold';
        },
        // 控制连线及其名称粗细还原的接口
        unBoldLink: function(linkId) {
            var linkData = this.data.links[linkId];
            linkData.internal.els.path.setAttribute('stroke-width', this.options.linkWidth);
            linkData.internal.els.path_text.style.fontWeight = 'normal';
        },

        // 控制 operator 边框粗细的接口
        boldOperator: function(operatorId, width) {
            var tdiv = this.data.operators[operatorId].internal.els.operator[0];
            tdiv.style['border-width'] = width;
        },

        // 控制 operator 边框粗细还原的接口
        unBoldOperator: function(operatorId) {
            var tdiv = this.data.operators[operatorId].internal.els.operator[0];
            tdiv.style['border-width'] = this.options.defaultOperatorsBold;
        },

        // 控制 operator 边框颜色的接口
        colorOperator: function(operatorId, color) {
            var tdiv = this.data.operators[operatorId].internal.els.operator[0];
            tdiv.style['border-color'] = color;
        },

        // 控制 operator 边框颜色还原的接口
        unColorOperator: function(operatorId) {
            var tdiv = this.data.operators[operatorId].internal.els.operator[0];
            tdiv.style['border-color'] = this.options.defaultOperatorsColor;
        },

        unselectLink: function() {
            if (this.selectedLinkId != null) {
                if (!this.options.interFace.onLinkUnselect()) {
                    return;
                }
                this.unBoldLink(this.selectedLinkId);
                this.selectedLinkId = null;
            }
        },

        selectLink: function(linkId) {
            this.unselectLink();
            if (!this.options.interFace.onLinkSelect(linkId)) {
                return;
            }
            this.unselectOperator();
            this.selectedLinkId = linkId;
            this.boldLink(linkId, this.options.linkSelectedWidth);
        },

        deleteOperator: function(operatorId) {
            this._deleteOperator(operatorId, false);
        },

        // 删除数组中某个特定元素的函数
        // 被 _deleteLink() 函数调用
        // 在删除连线的过程中用以修改数组 this.recordArray 
        // 和数组 this.data.links[linkId].siblings
        deleteSiblings: function(siblings, linkId) {
            var temp = [];
            for (var i = 0; i < siblings.length; i++) {
                if (siblings[i] != linkId) {
                    temp.push(siblings[i]);
                }
            }
            return temp;
        },

        _deleteOperator: function(operatorId, replace) {
            if (!this.options.onOperatorDelete(operatorId, replace)) {
                return false;
            }
            if (!replace) {
                for (var linkId in this.data.links) {
                    if (this.data.links.hasOwnProperty(linkId)) {
                        var currentLink = this.data.links[linkId];
                        if (currentLink.fromOperator == operatorId || currentLink.toOperator == operatorId) {
                            this._deleteLink(linkId, true);
                        }
                    }
                }
            }
            if (!replace && operatorId == this.selectedOperatorId) {
                this.unselectOperator();
            }
            this.data.operators[operatorId].internal.els.operator.remove();
            delete this.data.operators[operatorId];
        },

        deleteLink: function(linkId) {
            this._deleteLink(linkId, false);
        },

        // 被 _deleteOperator 调用
        _deleteLink: function(linkId, forced) {
            if (this.selectedLinkId == linkId) {
                this.unselectLink();
            }
            if (!this.options.onLinkDelete(linkId, forced)) {
                if (!forced) {
                    return;
                }
            }

            this.colorizeLink(linkId, 'transparent');
            var linkData = this.data.links[linkId];
            var fromOperator = linkData.fromOperator;
            var fromConnector = linkData.fromConnector;
            var toOperator = linkData.toOperator;
            var toConnector = linkData.toConnector;

            //  OO 类型直接删掉即可
            //  OM 或 MO 类型则要dictionary 和 siblings

            // 首先判断被删除连线的类型
            // 然后根据 dictionary 中记录的 siblings 
            // 对被删除边的所有兄弟边的 siblings 属性数组进行更新
            if (linkData.type == "OM") {
                var siblingArray = this.dictionary_1[fromOperator];
                for (var i = 0; i < siblingArray.length; i++) {
                    this.data.links[siblingArray[i]].siblings = this.deleteSiblings(this.data.links[siblingArray[i]].siblings, linkId);
                    this.dictionary_1[fromOperator] = this.deleteSiblings(this.dictionary_1[fromOperator], linkId);
                }
                if (this.data.links[linkId].siblings.length == 0)
                    this.dictionary_3[fromOperator] -= 1;
            } else if (linkData.type == "MO") {
                var siblingArray = this.dictionary_2[toOperator];
                for (var i = 0; i < siblingArray.length; i++) {
                    this.data.links[siblingArray[i]].siblings = this.deleteSiblings(this.data.links[siblingArray[i]].siblings, linkId);
                    this.dictionary_2[toOperator] = this.deleteSiblings(this.dictionary_2[toOperator], linkId);
                }
                if (this.data.links[linkId].siblings.length == 0)
                    this.dictionary_4[toOperator] -= 1;
            }

            linkData.internal.els.overallGroup.remove();
            delete this.data.links[linkId];

            this._cleanMultipleConnectors(fromOperator, fromConnector, 'from');
            this._cleanMultipleConnectors(toOperator, toConnector, 'to');
        },

        _cleanMultipleConnectors: function(operator, connector, linkFromTo) {
            if (!this.data.operators[operator].properties[linkFromTo == 'from' ? 'outputs' : 'inputs'][connector].multiple) {
                return;
            }

            var maxI = -1;
            var fromToOperator = linkFromTo + 'Operator';
            var fromToConnector = linkFromTo + 'Connector';
            var fromToSubConnector = linkFromTo + 'SubConnector';
            var els = this.data.operators[operator].internal.els;
            var subConnectors = els.connectors[connector];
            var nbSubConnectors = subConnectors.length;

            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if (linkData[fromToOperator] == operator && linkData[fromToConnector] == connector) {
                        if (maxI < linkData[fromToSubConnector]) {
                            maxI = linkData[fromToSubConnector];
                        }
                    }
                }
            }

            var nbToDelete = Math.min(nbSubConnectors - maxI - 2, nbSubConnectors - 1);
            for (var i = 0; i < nbToDelete; i++) {
                subConnectors[subConnectors.length - 1].remove();
                subConnectors.pop();
                els.connectorArrows[connector].pop();
                els.connectorSmallArrows[connector].pop();
            }
        },

        deleteSelected: function() {
            this.linkdone();
            if (this.selectedLinkId != null) {
                this.deleteLink(this.selectedLinkId);
            }
            if (this.selectedOperatorId != null) {
                this.deleteOperator(this.selectedOperatorId);
            }
        },

        setPositionRatio: function(positionRatio) {
            this.positionRatio = positionRatio;
        },

        getPositionRatio: function() {
            return this.positionRatio;
        },

        mode1: function() {
            this.mode = 1;
        },

        mode2: function() {
            this.mode = 2;
        },

        mode3: function() {
            this.mode = 3;
        },

        setOperatorTitle: function(operatorId, title) {
            this.data.operators[operatorId].internal.els.title.html(title);
            this.data.operators[operatorId].internal.els.operator[0].id = title;
            if (typeof this.data.operators[operatorId].properties == 'undefined') {
                this.data.operators[operatorId].properties = {};
            }
            this.data.operators[operatorId].properties.title = title;
            this._refreshInternalProperties(this.data.operators[operatorId]);
        },

        // 设置连线名称为 title
        // 同时更新连线名称框中的文字和连线自身 Title 属性的值
        setLinkTitle: function(linkId, title) {
            this.data.links[linkId].internal.els.text = title;
            this.data.links[linkId].Title = title;
            this._refreshLinkTitle(linkId);
        },

        getOperatorTitle: function(operatorId) {
            return this.data.operators[operatorId].internal.properties.title;
        },

        setOperatorData: function(operatorId, operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);
            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if ((linkData.fromOperator == operatorId && typeof infos.outputs[linkData.fromConnector] == 'undefined') ||
                        (linkData.toOperator == operatorId && typeof infos.inputs[linkData.toConnector] == 'undefined')) {
                        this._deleteLink(linkId, true);
                    }
                }
            }
            this._deleteOperator(operatorId, true);
            this.createOperator(operatorId, operatorData);
            this.redrawLinksLayer();
        },

        doesOperatorExists: function(operatorId) {
            return typeof this.data.operators[operatorId] != 'undefined';
        },

        getOperatorData: function(operatorId) {
            var data = $.extend(true, {}, this.data.operators[operatorId]);
            delete data.internal;
            return data;
        },

        getOperatorFullProperties: function(operatorData) {
            return operatorData.properties;
        },

        _refreshInternalProperties: function(operatorData) {
            operatorData.internal.properties = this.getOperatorFullProperties(operatorData);
        },

        _refreshLinkTitle: function(linkId) {
            var title = document.getElementById(linkId);
            title.textContent = this.data.links[linkId].internal.els.text;
        },

        // 封装所有连线的信息
        // 被 submit() 函数调用
        getReturnValue: function(linkData) {
            //linkData即this.data.links
            var Report = [];
            for (var i in linkData) {
                var link = linkData[i];

                var $name = [];
                var $mode = "";
                var $head = [];
                var $tail = [];

                if (typeof link != "undefined" && link.type == "OO") {
                    $name.push(this.getLinkTitle(String(i)));
                    $mode = "OO";
                    var fromOperatorId = link.fromOperator;
                    $head.push(this.getOperatorTitle(fromOperatorId));
                    var toOperatorId = link.toOperator;
                    $tail.push(this.getOperatorTitle(toOperatorId));
                } else if (typeof link != "undefined" && link.type == "OM") {
                    $mode = "OM";
                    var fromOperatorId = link.fromOperator;
                    $head.push(this.getOperatorTitle(fromOperatorId));
                    for (var j = 0; j < link.siblings.length; j++) {
                        $name.push(this.getLinkTitle(link.siblings[j]));
                        var toOperatorId = linkData[link.siblings[j]].toOperator;
                        $tail.push(this.getOperatorTitle(toOperatorId));
                    }
                    for (var j = 0; j < link.siblings.length; j++) {
                        delete linkData[link.siblings[j]];
                    }
                } else if (typeof link != "undefined" && link.type == "MO") {
                    $mode = "MO";
                    var toOperatorId = link.toOperator;
                    $tail.push(this.getOperatorTitle(toOperatorId));
                    for (var j = 0; j < link.siblings.length; j++) {
                        $name.push(this.getLinkTitle(link.siblings[j]));
                        var fromOperatorId = linkData[link.siblings[j]].fromOperator;
                        $head.push(this.getOperatorTitle(fromOperatorId));
                    }
                    for (var j = 0; j < link.siblings.length; j++) {
                        delete linkData[link.siblings[j]];
                    }
                }
                if (typeof link != "undefined") {
                    var report = {
                        Name: $name,
                        Type: $mode,
                        Head: $head,
                        Tail: $tail,
                    };
                    Report.push(report);
                }
            }
            return Report;
        },

        addSiblings: function(linkArray) {
            for (var i = 0; i < linkArray.length; i++) {
                for (var j = 0; j < linkArray.length; j++) {
                    this.data.links[linkArray[i]].siblings.push(linkArray[j]);
                }
            }
        },

        //此函数用于检测数组中是否有重复元素
        isRepeat: function(arr) {
            var hash = {};
            for (var i in arr) {
                if (hash[arr[i]])
                    return true;
                hash[arr[i]] = true;
            }
            return false;
        },

        // 用户点击 Done 按键之后的操作
        // 更新 dictionary_1 或 dictionary_2 的内容
        // 为 dictionary_3 或 dictionary_4 的对应节点递增计数
        linkdone: function() {
            if (this.mode == 2 && this.recordArray.length > 0) {
                var fromOperatorId = this.data.links[this.recordArray[0]].fromOperator;
                if (!!this.dictionary_1[fromOperatorId]) {
                    for (var i = 0; i < this.recordArray.length; i++) {
                        this.dictionary_1[fromOperatorId].push(this.recordArray[i]);
                    }
                } else {
                    this.dictionary_1[fromOperatorId] = this.recordArray;
                }
                this.addSiblings(this.recordArray);
                if (!!this.dictionary_3[fromOperatorId]) {
                    this.dictionary_3[fromOperatorId]++;
                }
            }

            if (this.mode == 3 && this.recordArray.length > 0) {
                var toOperatorId = this.data.links[this.recordArray[0]].toOperator;
                if (!!this.dictionary_2[toOperatorId]) {
                    for (var i = 0; i < this.recordArray.length; i++) {
                        this.dictionary_2[toOperatorId].push(this.recordArray[i]);
                    }
                } else {
                    this.dictionary_2[toOperatorId] = this.recordArray;
                }
                this.addSiblings(this.recordArray);
                if (!!this.dictionary_4[toOperatorId]) {
                    this.dictionary_4[toOperatorId]++;
                }
            }
            operatorRecordForSwitch = "";
            this.recordArray = [];
        },

        // 用户点击 Submit 按键之后的操作
        // 调用 this.getReturnValue() 
        // 生成描述流图的对象，发送至服务器 
        submit: function() {
            //如果没有点击linkdone就submit
            if (this.recordArray.length > 0)
                this.linkdone();

            //submit的时候当前的状态，this.data
            //console.log(this.data);

            //link的数据全部处理到this.report中
            //每条边包含name、type、head、tail
            //只有type不为数组
            var linkData = $.extend(true, {}, this.data.links);
            this.report = this.getReturnValue(linkData);

            //这个obj即是传递给服务端的obj
            /*
            示例：
            {
                "DFDID":1,
                "Node":["A","B","C","D","E","F","G"],
                "Input":["A"],
                "Output":["F","G"],
                "Edge":[
                    {"Name":["b","c"], "Type":"OM", "Head":["A"], "Tail":["B","C"]},
                    {"Name":["g"], "Type":"OO", "Head":["A"], "Tail":["G"]},
                    {"Name":["d","e"], "Type":"OM", "Head":["B"], "Tail":["D","E"]},
                    {"Name":["f1","f2","f3"], "Type":"MO", "Head":["D","E","C"], "Tail":["F"]}
                ]
            }
            */
            /*
            合法性检查：
            1.Node名只能是大写加数字，不能有空格
            2.link名只能是小写加数字，不能有空格
            3.Node和Link均无重名
            4.link模式应该是对的才行
            */

            var obj = {};
            obj.Edge = new Array();
            obj.Input = new Array();
            obj.Output = new Array();
            obj.Node = new Array();

            // flag=0意味着输入不合法
            var flag = 1;

            //DFDID在调用外部设置

            //Edge
            //这里一条边一条边的处理
            var linkNameArr = [];
            console.log("***Edge***");
            for (var i = 0; i < this.report.length; i++) {
                obj.Edge[i] = this.report[i];
                linkNameArr.push.apply(linkNameArr, obj.Edge[i].Name);

                // 法则4
                if ((obj.Edge[i].Type == "MO" || obj.Edge[i].Type == "OM") && obj.Edge[i].Name.length <= 1) {
                    obj.Edge[i].Type = "OO";
                }

                console.log("name:" + obj.Edge[i].Name + " type:" + obj.Edge[i].Type + " head:" + obj.Edge[i].Head + " tail:" + obj.Edge[i].Tail);
            }

            //Node
            var thisdata = this.data;
            for (var operatorsID in thisdata.operators) {
                var operatortitle = this.getOperatorTitle(operatorsID);
                obj.Node.push(operatortitle);
            }
            console.log("***Node***");
            console.log(obj.Node);

            //Input和Output
            var NodeHasInput = new Array();
            var NodeHasOutput = new Array();

            for (var linksID in thisdata.links) {
                var headNodeName = this.getOperatorTitle(thisdata.links[linksID].fromOperator);
                var tailNodeName = this.getOperatorTitle(thisdata.links[linksID].toOperator);

                //headNodeName Has Output
                //tailNodeName Has Input
                if ($.inArray(headNodeName, NodeHasOutput) == -1)
                    NodeHasOutput.push(headNodeName);
                if ($.inArray(tailNodeName, NodeHasInput) == -1)
                    NodeHasInput.push(tailNodeName);
            }

            for (var opnameIdx in obj.Node) {
                if ($.inArray(obj.Node[opnameIdx], NodeHasInput) == -1)
                    obj.Input.push(obj.Node[opnameIdx]);
                if ($.inArray(obj.Node[opnameIdx], NodeHasOutput) == -1)
                    obj.Output.push(obj.Node[opnameIdx]);
            }
            console.log("***Input***");
            console.log(obj.Input);
            console.log("***Output***");
            console.log(obj.Output);

            //法则1,2,3
            //node名重复
            if (this.isRepeat(obj.Node)) {
                flag = 0;
                this.options.interFace.showTips("The name of the nodes can not be duplicated.");
            }
            //link名重复
            if (this.isRepeat(linkNameArr)) {
                flag = 0;
                this.options.interFace.showTips("The name of the links can not be duplicated.");
            }
            //node名是否合法
            var nodenameFlag = 1;
            for (var i in obj.Node) {
                var rgexp = new RegExp("[A-Z0-9]", "g");
                var rgexpAns = obj.Node[i].match(rgexp);
                if (rgexpAns.length != obj.Node[i].length) {
                    nodenameFlag = 0;
                    break;
                }
            }
            if (nodenameFlag == 0) {
                flag = 0;
                this.options.interFace.showTips("The name of the nodes must consist of uppercase letters and numbers.");
            }
            //link名是否合法
            var linknameFlag = 1;
            for (var i in linkNameArr) {
                var rgexp = new RegExp("[a-z0-9]", "g");
                var rgexpAns = linkNameArr[i].match(rgexp);
                if (rgexpAns.length != linkNameArr[i].length) {
                    linknameFlag = 0;
                    break;
                }
            }
            if (linknameFlag == 0) {
                flag = 0;
                this.options.interFace.showTips("The name of the links must consist of lowercase letters and numbers.");
            }


            //结果非法
            if (flag == 0)
                return 0;

            //结果合法
            //返回值需包含 ans 和 dic
            //dic是字典，名-id的对应，对交互而言意义重大
            else {
                this.ansObj.ans = obj;
                this.ansObj.dic = {};

                return this.ansObj;
            }
        }
    });
});
