var processGraph = {
	processGraphToolDivID: "furtherStateGraph-left-wrapper",
	processGraphSvgID: "furtherStateGraph-left-svg",
	processGraphRightDivID: "furtherStateGraph-right-div",
	processGraphSvgG: undefined,
	actionListFromPast: undefined,
	actionListFromRoot: undefined,
	previousActionListFromRoot: undefined,
	_nodeArray: undefined,
	_lineArray: undefined,
	_IDtoNode: undefined,
	_IDtoLine: undefined,
	_CIRCLER: 7,
	_ifAddedRightView: false,
	_circlesProcessPrefix: "process-circle-",
	_linesProcessPrefix: "process-line-",
	_actionProcessPrefix: "process-action-",
	_tip: d3.tip().attr("class", "d3-tip"),
	initialize: function(dfdDefine) {
		//初始化
		var self = this;
		console.log(dfdDefine);
		initializeVariables();
		if(self._ifAddedRightView === false) {
			self._ifAddedRightView = true;
			self._addRightView();
			self._addButton();
		}
		d3.select("#" + self.processGraphSvgID)
			.selectAll("g")
			.remove();
		self.processGraphSvgG = d3.select("#" + self.processGraphSvgID)
			.append("g");
		self._translateToGraph(dfdDefine);
		self._calculateNodesPosition(dfdDefine);
		self.renderView(null);
		self.processGraphSvgG.call(self._tip);

		function initializeVariables () {
			self.actionListFromPast = [];
			self.actionListFromRoot = [];
			self.previousActionListFromRoot = [];
			self._nodeArray = undefined;
			self._lineArray = undefined;
			self._IDtoNode = undefined;
			self._IDtoLine = undefined;
		}
	},
	_addRightView: function() {
		//添加右边的指示条
		var self = this;
		var textDiv = undefined;
		var spanDiv = undefined;
		textDiv = d3.select("#" + self.processGraphRightDivID)
			.append("div");
		textDiv.append("br");
		textDiv.append("text")
			.style("font-weight", "bold")
			.text("Repetitions");
		spanDiv = d3.select("#" + self.processGraphRightDivID)
			.append("div")
			.style("width", "65%")
			.style("float", "right");
		spanDiv.append("br");
		spanDiv.append("div")
			.style("height", "20px")
			.style("width", "20px")
			.style("background", "#BEBEBE")
			.style("opacity", 0.7)
			.style("float", "left");
		spanDiv.append("text")
			.style("font-weight", "bold")
			.html("&nbsp&nbsp&nbsp0");
		spanDiv.append("br");
		spanDiv.append("div")
			.style("height", "20px")
			.style("width", "20px")
			.style("background", "#6C6C6C")
			.style("opacity", 0.7)
			.style("float", "left");
		spanDiv.append("text")
			.style("font-weight", "bold")
			.html("&nbsp&nbsp&nbsp1");
		spanDiv.append("br");
		spanDiv.append("div")
			.style("height", "20px")
			.style("width", "20px")
			.style("background", "#000000")
			.style("opacity", 0.7)
			.style("float", "left");
		spanDiv.append("text")
			.style("font-weight", "bold")
			.html("&nbsp&nbsp&nbsp>2");
	},
	_translateToGraph: function(dfdDefine) {
		//转换形式，生成_nodeArray,_lineArray
		var self = this;
		self._nodeArray = [];
		self._lineArray = [];
		self._IDtoNode = [];
		self._IDtoLine = [];
		var tmpNodeArray = dfdDefine.Node;
		var tmpLineArray = dfdDefine.Edge;
		var tmpInput = dfdDefine.Input;
		var tmpOutput = dfdDefine.Output;
		var tmpLength = tmpNodeArray.length;
		for(var i = 0; i < tmpLength; i++) {
			var tmpNode = {};
			tmpNode.id = tmpNodeArray[i];
			tmpNode.requirement = [];
			tmpNode.development = [];
			tmpNode.out = [];
			tmpNode.in = [];
			tmpNode.class = "";
			tmpNode.depth = undefined;
			self._IDtoNode[tmpNode.id] = tmpNode;
			self._nodeArray.push(tmpNode);
		}
		tmpLength = tmpInput.length;
		for(var i = 0; i < tmpLength; i++) {
			var inputName = "input";
			if(tmpLength > 1) {
				inputName += (i + 1);
			}
			var inputNameArray = [];
			inputNameArray.push(inputName);
			self._IDtoNode[tmpInput[i]].requirement.push(inputNameArray);
			var tmpInputLine = {};
			tmpInputLine.id = inputName;
			tmpInputLine.count = 0;
			tmpInputLine.previousCount = 0;
			tmpInputLine.target = self._IDtoNode[tmpInput[i]];
			self._IDtoLine[inputName] = tmpInputLine;
		}
		tmpLength = tmpOutput.length;
		for(var i = 0; i < tmpLength; i++) {
			var outputName = "output";
			if(tmpLength > 1) {
				outputName += (i + 1);
			}
			var outputNameArray = [];
			outputNameArray.push(outputName);
			self._IDtoNode[tmpOutput[i]].development.push(outputNameArray);
			var tmpOutputLine = {};
			tmpOutputLine.id = outputName;
			tmpOutputLine.count = 0;
			tmpOutputLine.previousCount = 0;
			tmpOutputLine.source = self._IDtoNode[tmpOutput[i]];
			self._IDtoLine[outputName] = tmpOutputLine;
		}
		tmpLength = tmpLineArray.length;
		for(var i = 0; i < tmpLength; i++) {
			var nameList = tmpLineArray[i].Name;
			var l = nameList.length;
			for(var j = 0; j < l; j++) {
				var tmpLine = {};
				tmpLine.id = nameList[j];
				tmpLine.count = 0;
				tmpLine.previousCount = 0;
				tmpLine.class = "";
				if(tmpLineArray[i].Type === "MO") {
					tmpLine.source = self._IDtoNode[tmpLineArray[i].Head[j]];
					tmpLine.target = self._IDtoNode[tmpLineArray[i].Tail[0]];
				}
				else if(tmpLineArray[i].Type === "OM") {
					tmpLine.source = self._IDtoNode[tmpLineArray[i].Head[0]];
					tmpLine.target = self._IDtoNode[tmpLineArray[i].Tail[j]];
				}
				else {
					tmpLine.source = self._IDtoNode[tmpLineArray[i].Head[0]];
					tmpLine.target = self._IDtoNode[tmpLineArray[i].Tail[0]];
				}
				self._IDtoLine[tmpLine.id] = tmpLine;
				self._lineArray.push(tmpLine);
			}
			if(tmpLineArray[i].Type === "MO") {
				var headLength = tmpLineArray[i].Head.length;
				var tmpRequirement = [];
				for(var k = 0; k < headLength; k++) {
					self._IDtoNode[tmpLineArray[i].Tail[0]].in.push(tmpLineArray[i].Head[k]);
					self._IDtoNode[tmpLineArray[i].Head[k]].out.push(tmpLineArray[i].Tail[0]);
					tmpRequirement.push(tmpLineArray[i].Name[k]);					
				}
				self._IDtoNode[tmpLineArray[i].Tail[0]].requirement.push(tmpRequirement);
			}
			else {
				var tailLength = tmpLineArray[i].Tail.length;
				for(var k = 0; k < tailLength; k++) {
					self._IDtoNode[tmpLineArray[i].Tail[k]].in.push(tmpLineArray[i].Head[0]);
					self._IDtoNode[tmpLineArray[i].Head[0]].out.push(tmpLineArray[i].Tail[k]);
					var tmpRequirement = [];
					tmpRequirement.push(tmpLineArray[i].Name[k]);
					self._IDtoNode[tmpLineArray[i].Tail[k]].requirement.push(tmpRequirement);
				}
			}
			if(tmpLineArray[i].Type === "OM") {
				var tailLength = tmpLineArray[i].Tail.length;
				var tmpDevelopment = [];
				for(var k = 0; k < tailLength; k++) {
					tmpDevelopment.push(tmpLineArray[i].Name[k]);
				}
				self._IDtoNode[tmpLineArray[i].Head[0]].development.push(tmpDevelopment);
			}
			else {
				var headLength = tmpLineArray[i].Head.length;
				for(var k = 0; k < headLength; k++) {
					var tmpDevelopment = [];
					tmpDevelopment.push(tmpLineArray[i].Name[k]);
					self._IDtoNode[tmpLineArray[i].Head[k]].development.push(tmpDevelopment);
				}
			}
		}
	},
	_calculateNodesPosition: function(dfdDefine) {
		//计算点的坐标
		var self = this;
		var nodeMatrix = [];
		nodeMatrix.length = _calculateDepthForNodes() + 1;
		for(var i = 0; i < nodeMatrix.length; i++) {
			nodeMatrix[i] = [];
		}
		for(var i = 0; i < self._nodeArray.length; i++) {
			nodeMatrix[self._nodeArray[i].depth].push(self._nodeArray[i]);
		}
		_calculateXYPosition();
		_modifyXYPosition();

		function _calculateDepthForNodes() {
			//计算节点在横轴上的位置
			var maxdepth = 0;
			var initialInputLength = dfdDefine.Input.length;
			var initialOutputLength = dfdDefine.Output.length;
			var visitedNode = [];
			var toVisitNode = [];
			for(var i = 0; i < initialInputLength; i++) {
				var n = self._IDtoNode[dfdDefine.Input[i]];
				n.depth = 0;
				visitedNode[n.id] = true;
				toVisitNode.push(n);
			}
			while(toVisitNode.length != 0) {
				var headNode = toVisitNode.shift();
				for(var i = 0; i < headNode.out.length; i++) {
					var nextNode = self._IDtoNode[headNode.out[i]];
					if((visitedNode[nextNode.id] === true) && (nextNode.out.length > 0)) {
						continue;
					}
					nextNode.depth = headNode.depth + 1;
					if(nextNode.depth > maxdepth) {
						maxdepth = nextNode.depth;
					}
					visitedNode[nextNode.id] = true;
					toVisitNode.push(nextNode);
				}
			}
			visitedNode = [];
			toVisitNode = [];
			for(var i = 0; i < initialOutputLength; i++) {
				var n = self._IDtoNode[dfdDefine.Output[i]];
				visitedNode[n.id] = true;
				toVisitNode.push(n);
			}
			while(toVisitNode.length != 0) {
				var headNode = toVisitNode.shift();
				for(var i = 0; i < headNode.in.length; i++) {
					var nextNode = self._IDtoNode[headNode.in[i]];
					if((visitedNode[nextNode.id] === true) && (nextNode.in.length > 0)) {
						continue;
					}
					if(nextNode.out.length == 1) {
						nextNode.depth = headNode.depth - 1;
					}
					visitedNode[nextNode.id] = true;
					toVisitNode.push(nextNode);
				}
			}
			return maxdepth;
		}
		function _calculateXYPosition() {
			//计算坐标
			var totalHeight = $("#"+self.processGraphSvgID).height();
			var totalWidth = $("#"+self.processGraphSvgID).width() * 1.1;
			var widthInterval = totalWidth / (nodeMatrix.length + 1);
			for(var i = 0; i < nodeMatrix.length; i++) {
				var l = nodeMatrix[i].length;
				var heightInterval = totalHeight / (l + 1);
				//根据用户的摆放位置决定上下顺序
				nodeMatrix[i].sort(function(a, b) {
					var yA = $("#" + a.id)[0].offsetTop;
					var yB = $("#" + b.id)[0].offsetTop;
					if(yA == yB) {
						return true;
					}
					return (yA - yB);
				});
				for(var j = 0; j < l; j++) {
					nodeMatrix[i][j].x = widthInterval * (i + 1) - totalWidth * 0.08;
					nodeMatrix[i][j].y = heightInterval * (j + 1);
				}
			}
		}
		function _modifyXYPosition() {
			//调整位置防止边重叠
			var lineLength = self._lineArray.length;
			for(var i = 0; i < lineLength; i++) {
				var tmpSource = self._lineArray[i].source;
				var tmpTarget = self._lineArray[i].target;
				if(tmpSource.x == tmpTarget.x) {
					continue;
				}
				var k1 = (tmpSource.y - tmpTarget.y) / (tmpSource.x - tmpTarget.x);
				var smallDepth = undefined;
				var largeDepth = undefined;
				if(tmpSource.depth < tmpTarget.depth) {
					smallDepth = tmpSource.depth;
					largeDepth = tmpTarget.depth;
				}
				else {
					smallDepth = tmpTarget.depth;
					largeDepth = tmpSource.depth;
				}
				for(var j = smallDepth + 1; j < largeDepth; j++) {
					var heightInterval = $("#"+self.processGraphSvgID).height() 
											/ (nodeMatrix[j].length + 1);
					for(var z = 0; z < nodeMatrix[j].length; z++) {
						_reduceCoincide(tmpSource, k1, nodeMatrix[j][z], heightInterval);
					}
				}
			}
			function _reduceCoincide(source, k1, middle, heightInterval) {
				var k2 = (middle.y - source.y) / (middle.x - source.x);
				if(k2 == k1) {
					middle.y -= (heightInterval / 4);
				}
			}
		}
	},
	_calculateNodeState: function(tmpNode) {
		//计算单个节点的buffer状态
		var self = this;
		var requirementCount = 0;
		var developmentCount = 0;
		for(var j = 0; j < tmpNode.requirement.length; j++) {
			var satisfiedCount = 0;
			for(var k = 0; k < tmpNode.requirement[j].length; k++) {
				var condition = tmpNode.requirement[j][k];
				if(self._IDtoLine[condition].count < 1) {
					satisfiedCount = 0;
					break;
				}
				else {
					if((satisfiedCount === 0) 
						|| (self._IDtoLine[condition].count < satisfiedCount)) {
						satisfiedCount = self._IDtoLine[condition].count;
					}
				}
			}
			requirementCount += satisfiedCount;
		}
		for(var j = 0; j < tmpNode.development.length; j++) {
			var satisfiedCount = 0;
			for(var k = 0; k < tmpNode.development[j].length; k++) {
				var condition = tmpNode.development[j][k];
				if(self._IDtoLine[condition].count < 1) {
					satisfiedCount = 0;
					break;
				}
				else {
					if((satisfiedCount === 0) 
						|| (self._IDtoLine[condition].count < satisfiedCount)) {
						satisfiedCount = self._IDtoLine[condition].count;
					}
				}
			}
			developmentCount += satisfiedCount;
		}
		if(developmentCount == requirementCount) {
			return false;
		}
		else if(developmentCount == (requirementCount - 1)) {
			return true;
		}
		console.log("processGraph-error-nodeState", tmpNode, developmentCount, requirementCount);
	},
	setActionListFromPast: function(actionList) {
		var self = this;
		self.actionListFromPast = actionList;
	},
	_processAnimate: function(actionList, ifFromPast) {
		var self = this;
		if(ifFromPast === true && actionList.length == 0) {
			return null;
		}
		var actionLength = actionList.length;
		var delay = 1000;
		for(l in self._IDtoLine) {
			self._IDtoLine[l].tmpCount = self._IDtoLine[l].previousCount;
			self._IDtoLine[l].previousCount = self._IDtoLine[l].count;
			self._IDtoLine[l].count = 0;
		}
		if(ifFromPast === true) {
			self.renderView(self.previousActionListFromRoot, true);
		}
		else {
			self.renderView([], true);
		}
		_animate();
		for(l in self._IDtoLine) {
			self._IDtoLine[l].count = self._IDtoLine[l].previousCount;
			self._IDtoLine[l].previousCount = self._IDtoLine[l].tmpCount;
		}
		function _animate() {
			for(var i = actionLength - 1; i >= 0; i--) {
				var action = actionList[i];
				var oldDelay = delay;
				var ifchanged = false;
				self._IDtoLine[action].count ++;
				//source node
				if(action.substring(0, 5) != "input") {
					if(self._calculateNodeState(self._IDtoLine[action].source) === false) {
						ifchanged = (self._IDtoLine[action].source.class != " unsatisfied-Node");
						self._IDtoLine[action].source.class = " unsatisfied-Node";
					}
					else {
						ifchanged = (self._IDtoLine[action].source.class != " satisfied-Node");
						self._IDtoLine[action].source.class = " satisfied-Node";
					}
				}
				if(ifchanged === true) {
					var tmpID = self._circlesProcessPrefix + self._IDtoLine[action].source.id;
					d3.select("#" + tmpID)
						.transition()
						.delay(delay)
						.duration(1000)
						.attr("class", "process-node" + self._IDtoLine[action].source.class + " process-animation")
						.transition()
						.delay(delay + 1000)
						.attr("class", "process-node" + self._IDtoLine[action].source.class);
					delay += 1000;
				}
				//line action
				ifchanged = false;
				if(action.substring(0, 5) != "input" && action.substring(0, 6) != "output") {
					if(self._IDtoLine[action].count == 1) {
						self._IDtoLine[action].class = " one-time-line";
					}
					else {
						self._IDtoLine[action].class = " moreThanTwo-time-line";
					}
					ifchanged = true;
				}
				if(ifchanged === true) {
					d3.select("#" + self._linesProcessPrefix + action)
						.transition()
						.delay(delay)
						.duration(1000)
						.attr("class", "process-line" + self._IDtoLine[action].class + " process-animation")
						.transition()
						.delay(delay + 1000)
						.attr("class", "process-line" + self._IDtoLine[action].class);
					delay += 1000;
				}
				//target node
				ifchanged = false;
				if(action.substring(0, 6) != "output") {
					if(self._calculateNodeState(self._IDtoLine[action].target) === false) {
						ifchanged = (self._IDtoLine[action].target.class != " unsatisfied-Node");
						self._IDtoLine[action].target.class = " unsatisfied-Node";
					}
					else {
						ifchanged = (self._IDtoLine[action].target.class != " satisfied-Node");
						self._IDtoLine[action].target.class = " satisfied-Node";
					}
				}
				if(ifchanged === true) {
					var tmpID = self._circlesProcessPrefix + self._IDtoLine[action].target.id;
					d3.select("#" + tmpID)
						.transition()
						.delay(delay)
						.duration(1000)
						.attr("class", "process-node" + self._IDtoLine[action].target.class + " process-animation")
						.transition()
						.delay(delay + 1000)
						.attr("class", "process-node" + self._IDtoLine[action].target.class);
					delay += 1000;
				}
				//同步
				stateGraph.playAnimation(i, oldDelay, delay - oldDelay, ifFromPast);
			}
		}
	},
	renderView: function(actionList, ifAnimation) {
		var self = this;
		if(actionList === null) {
			actionList = [];
		}
		if(ifAnimation != true) {
			initializeState();
		}
		calculateProcess();
		draw();
		//画图
		function initializeState() {
			for(l in self._IDtoLine) {
				self._IDtoLine[l].previousCount = self._IDtoLine[l].count;
				self._IDtoLine[l].count = 0;
			}
			self.previousActionListFromRoot = self.actionListFromRoot;
			if(self.previousActionListFromRoot == undefined) {
				self.previousActionListFromRoot = [];
			}
			self.actionListFromRoot = actionList;
		}
		function calculateProcess() {
			//确定点和边的状态
			var actionLength = actionList.length;
			for(var i = 0; i < actionLength; i++) {
				var action = actionList[i];
				self._IDtoLine[action].count ++;
			}
			for(var i = 0; i < self._lineArray.length; i++) {
				if(self._lineArray[i].count == 1) {
					self._lineArray[i].class = " one-time-line";
				}
				else if(self._lineArray[i].count > 1) {
					self._lineArray[i].class = " moreThanTwo-time-line";
				}
				else {
					self._lineArray[i].class = " zero-time-line";
				}
			}
			for(var i = 0; i < self._nodeArray.length; i++) {
				if(self._calculateNodeState(self._nodeArray[i]) === false) {
					self._nodeArray[i].class = " unsatisfied-Node";
				}
				else if(self._calculateNodeState(self._nodeArray[i]) === true) {
					self._nodeArray[i].class = " satisfied-Node";
				}
			}
		}
		function draw() {
			//绘制
			//action
			var actions = self.processGraphSvgG.selectAll(".process-text")
				.data(self._lineArray, function(l) {
					return l.id;
				});
			actions.exit()
				.remove();
			actions.enter()
				.append("text")
				.attr("class", "process-text")
				.attr("id", function(a) {
					return self._actionProcessPrefix + a.id;
				})
				.attr("x", function(l) {
		            return (l.source.x + l.target.x)/2 ;
		        })
		        .attr("y", function(l) {
		            return (l.source.y + l.target.y)/2 - 2;
		        })
		        .text(function(l) {
		            return l.id;
		        });
			//箭头
			/*var defs = self.processGraphSvgG
				.append("defs");  
			var arrowMarker = defs.append("marker")  
                .attr("id","arrow")  
                .attr("markerUnits","strokeWidth")  
                .attr("markerWidth","12")  
                .attr("markerHeight","12")  
                .attr("viewBox","0 0 12 12")   
                .attr("refX","6")  
                .attr("refY","6")  
                .attr("orient","auto");  
			var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";  
			arrowMarker.append("path")  
	            .attr("d",arrow_path)  
	            .attr("fill","#000");*/

			var lines = self.processGraphSvgG.selectAll(".process-line")
				.data(self._lineArray, function(l) {
					return l.id;
				});
			lines.exit()
				.remove();
			lines.attr("class", function(l) {
					return "process-line" + l.class;
				});
			if(ifAnimation != true) {
				lines.attr("count", function(l) {
					return l.count;
				});
			}
			lines.enter()
				.append("path")
				.attr("id", function(l) {
					return self._linesProcessPrefix + l.id;
				})
				.attr("count", function(l) {
					return l.count;
				})
				.attr("class", function(l) {
					return "process-line" + l.class;
				})
				.attr("d", _computeWidthOfLine)
				.on("mouseover", function() {
					self._mouseoverLink(this);
				})
				.on("mouseout", function() {
					self._mouseoutLink(this);
				});
		        /*.attr("marker-end","url(#arrow)");*/
		    //节点
		    var circles = self.processGraphSvgG.selectAll(".process-node")
				.data(self._nodeArray, function(n) {
					return n.id;
				});
			circles.exit()
				.remove();
			circles.attr("class", function(n) {
				return "process-node" + n.class;
			});
			circles.enter()
				.append("circle")
				.attr("id", function(n) {
					return self._circlesProcessPrefix + n.id;
				})
				.attr("cx", function(n) {
					return n.x;
				})
				.attr("cy", function(n) {
					return n.y;
				})
				.style("r", self._CIRCLER)
				.attr("class", function(n) {
					return "process-node" + n.class;
				})
				.on("mouseover", function(n) {
					self.mouseoverNode(n);
				})
				.on("mouseout", function(n) {
					self.mouseoutNode(n);
				});
			//nodeName
			var names = self.processGraphSvgG.selectAll(".process-name")
				.data(self._nodeArray, function(n) {
					return n.id;
				});
			names.exit()
				.remove();
			names.enter()
				.append("text")
		        .attr("class", "process-name")
		        .attr("x", function(n) {
		            return n.x - 10;
		        })
		        .attr("y", function(n) {
		            return n.y - 11;
		        })
		        .text(function(n) {
		            return n.id;
		        });

		    function _calculateArrow(l){
		        var x1 = l.source.x;
		        var y1 = l.source.y;
		        var x2 = l.target.x;
		        var y2 = l.target.y;
		        var l1 = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
		        var tmp1 = self._CIRCLER / l1;
		        var newobject = new Object();
		        newobject.x = x2 + tmp1 * (x1-x2);
		        newobject.y = y2 + tmp1 * (y1-y2);
		        return newobject;
		    }
		    function _computeWidthOfLine(l) {
				//在processGraph里使垂直
				var line_source = {x: l.source.x, y: l.source.y};
				var line_target = {x: _calculateArrow(l).x, y: _calculateArrow(l).y};
				var line2_source = line_target;
				var line2_target = {x: l.source.x, y: l.source.y};
				var tmp_x = line_target.x - line_source.x;
				var tmp_y = line_target.y - line_source.y;
				var tmp_m = Math.sqrt(tmp_y * tmp_y + tmp_x * tmp_x);
				line_source.x -= tmp_y * 2 / tmp_m;
				line_source.y += tmp_x * 2 / tmp_m;
				line2_target.x += tmp_y * 2 / tmp_m;
				line2_target.y -= tmp_x * 2 / tmp_m;
				var final = 'M' + line_source.x + ' ' + line_source.y + ' L' + line_target.x + ' '
							+ line_target.y + ' L' + line2_target.x + ' ' + line2_target.y + ' Z';
				return final;
			}
		}
	},
	_mouseoverLink: function(l) {
		//鼠标悬浮边事件
		var self = this;
		d3.select(l).classed("focus-highlight", true);
		self._tip.html(function() {
			return "<b>count: </b><font color=\"#FF6347\">" 
				+ d3.select(l).attr("count")
				+ "</font>";
		});
		self._tip.show();
	},
	_mouseoutLink: function(l) {
		//鼠标移开事件
		var self = this;
		d3.select(l).classed("focus-highlight", false);
		self._tip.hide();
	},
	mouseoverLinkFromStateGraph: function(lineID) {
		//鼠标悬浮边事件
		var self = this;
		if(lineID.substring(0, 5) != 'input' && lineID.substring(0, 6) != 'output') {
			d3.select("#" + self._linesProcessPrefix + lineID).classed("focus-highlight", true);
		}
	},
	mouseoutLinkFromStateGraph: function(lineID) {
		//鼠标移开事件
		var self = this;
		if(lineID.substring(0, 5) != 'input' && lineID.substring(0, 6) != 'output') {
			d3.select("#" + self._linesProcessPrefix + lineID).classed("focus-highlight", false);
		}
	},
	mouseoverNode: function(n) {
		var self = this;
		var actionListIndex = [];
		for(var i = 0; i < n.development.length; i++) {
			var l = n.development[i].length;
			for(var j = 0; j < l; j++) {
				actionListIndex[n.development[i][j]] = true;
			}
		}
		stateGraph.outstandingFullBuffer(actionListIndex);
	},
	mouseoutNode: function(n) {
		stateGraph.restoreFullBuffer();
	},
	_addButton: function() {
		var self = this;
		var toolBarDiv = d3.select("#" + self.processGraphToolDivID);
		toolBarDiv.append("span")
			.attr("id", "processGraph_showAnimation")
			.html("<img src=\"icon/play_root.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				self._processAnimate(self.actionListFromRoot, false);
			});
		toolBarDiv.append("br");
		toolBarDiv.append("span")
			.attr("id", "processGraph_showAnimation")
			.html("<img src=\"icon/play_past.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				self._processAnimate(self.actionListFromPast, true);
			});
	}
}