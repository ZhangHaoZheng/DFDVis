var stateGraph = {
	name: undefined,
	rootNode: undefined,
	maxDepth: undefined,//实节点的最大深度
	output: undefined,
	processGraphObject: undefined,
	numOfParentLevel: 2,
	numOfChildrenLevel: 3,
	stateGraphDivID: undefined,
	stateGraphDetailDivId: undefined,
	stateGraphOverviewDivid: undefined,
	nodeNow: undefined,
	nodePast: undefined,
	nodesNow: undefined,
	nodesPast: undefined,
	fromRootShortest: undefined,
	fromPastShortest: undefined,
	_overview_nodes: undefined,
	_maxMinDepth: 0,
	_interval: 20,
	_border: 20,
	_leftDetailInterval: 10,
	_leftOverviewInterval: 20,
	_stateGraph_detail_svg: undefined,
	_stateGraph_detail_g: undefined,
	_stateGraph_overview_svg: undefined,
	_stateGraph_overview_g: undefined,
	_linesPrefix: "line-",
	_circlesPrefix: "circle-",
	_actionPrefix: "action-",
	_circlesOverviewPrefix: "overview-circle-",
	_linesRootOverviewPrefix: "overview-root-line-",
	_linesPastOverviewPrefix: "overview-past-line-",
	noTauLinesPrefix: "overview-noTau-line-",
	_ifActionTextVisible: true,
	_ifRouteFromRootVisivle: true,
	_ifRouteFromPastVisible: true,
	_idToNode: [],               //id到Node对象的索引
	_nodeOfminDepth: [],
	_maxWidth: 0, //_nodeOfminDepth二维数组的最大宽度
	_overview_r: 0, //overview中节点半径
	_tip: d3.tip().attr("class", "d3-tip"),
	initialize: function(div_id, output, processGraphObject, name) {
		var self = this;
		self.name = name;
		self.stateGraphDivID = div_id;
		self.stateGraphDetailDivId = div_id + "-detail";
		self.stateGraphOverviewDivid = div_id + "-overview";
		self.output = output;
		self.processGraphObject = processGraphObject;
		_initailizeTheVariables();
		d3.select("#" + div_id)
			.selectAll("div").remove();
		var detail_overview_div = d3.select("#" + div_id)
			.append("div")
			.attr("id", "detail-overview-div");
		detail_overview_div.append("div")
			.attr("id", self.stateGraphDetailDivId);
		detail_overview_div.append("div")
			.attr("id", self.stateGraphOverviewDivid);
		self._stateGraph_detail_svg = d3.select("#" + self.stateGraphDetailDivId)
			.append("svg")
			.attr("height", $("#" + self.stateGraphDetailDivId).height())
			.attr("width", $("#" + self.stateGraphDetailDivId).width());
		self._stateGraph_detail_g = self._stateGraph_detail_svg.append("g")
			.attr("transform", "translate(" + self._leftDetailInterval + ",0)");
		self._stateGraph_overview_svg = d3.select("#" + self.stateGraphOverviewDivid)
			.append("svg")
			.attr("height", $("#" + self.stateGraphOverviewDivid).height())
			.attr("width", $("#" + self.stateGraphOverviewDivid).width());
		self._stateGraph_overview_g = self._stateGraph_overview_svg.append("g")
			.attr("transform", "translate(" + self._leftOverviewInterval + "," + self._border + ")");
		self._stateGraph_detail_g.call(self._tip);
		self._drawDepartLine();
		_zoom();
		self._translateToGraph(output);
		self._addButton();
		self._computeNodesPositionInOverview();
		self.showLevelsOfStategraph(0, 0);

		function _initailizeTheVariables() {
			self.nodeNow = undefined;
			self.nodePast = undefined;
			self.nodesNow = undefined;
			self.nodesPast = undefined;
			self._maxMinDepth = 0;
			self._ifActionTextVisible = true;
			self._idToNode = [];
			self._nodeOfminDepth = [];
			self._maxWidth = 0;
			self._overview_r = 0;
		}
		function _zoom() {
			var zoom = d3.behavior.zoom()
			    .scaleExtent([0.8, 8])
			    .on("zoom", function() {
			        self._stateGraph_overview_g.attr("transform",
			            "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
			    });
			self._stateGraph_overview_svg.call(zoom);
		}
	},
	_translateToGraph: function(output) {
		//根据得到的输出转化为链表形式的状态图
		var self = this;
		_translate();
		var idpath = [];
		idpath[self.rootNode.id] = true;
		self.maxDepth = 0;
		self.rootNode.maxdepth = 0;
		console.log(self.rootNode);
		console.log(self._idToNode);
		_calculateMaxDepthForNodes(self.rootNode, idpath, 1);
		for(var i = 0; i < self.maxDepth + 1; i++) {
			self._nodeOfminDepth[i] = [];
		}
		_calculateMinDepthForNodes();
		function _translate() {
			//转化
			var l1 = output.result[0].length;
			var graph = output.result[0][l1 - 1].graph;
			var ifDifferent = false;
			var dfdToDelete = [];
			var formalDef = output.result[0][l1 - 1].formalDef;
			var nodeName = output.result[0][l1 - 1].nodeName;
			formalDef = formalDef.substring(0, formalDef.indexOf(')') + 1);
			for(var id in graph) {
				if(id.substring(0, id.indexOf(')') + 1) == formalDef) {
					ifDifferent = true;
					formalDef = id;
				}
				var n;
				if(self._idToNode[id] != undefined) {
					n = self._idToNode[id];
				}
				else {
					n = new Object();
					self._idToNode[id] = n;
				}
				n.id = id;
				n.in = [];
				n.out = [];
				n.maxdepth = undefined;
				n.mindepth = undefined;
				for(var i = 0; i < graph[id].in.length; i++) {
					var in_n = graph[id].in[i];
					if(in_n.state == nodeName) {
						var toDelete = new Object();
						toDelete.id = id;
						toDelete.array = "in";
						toDelete.index = i;
						dfdToDelete.push(toDelete);
					}
					var node = new Object();
					node.action = in_n.action;
					if(self._idToNode[in_n.state] != undefined) {
						node.state = self._idToNode[in_n.state];
					}
					else {
						node.state = new Object();
						self._idToNode[in_n.state] = node.state;
					}
					n.in.push(node);
				}
				for(var i = 0; i < graph[id].out.length; i++) {
					var out_n = graph[id].out[i];
					var node = new Object();
					node.action = out_n.action;
					if(out_n.state == nodeName) {
						var toDelete = new Object();
						toDelete.id = id;
						toDelete.array = "out";
						toDelete.index = i;
						dfdToDelete.push(toDelete);
					}
					if(self._idToNode[out_n.state] != undefined) {
						node.state = self._idToNode[out_n.state];
					}
					else {
						node.state = new Object();
						self._idToNode[out_n.state] = node.state;
					}
					n.out.push(node);
				}
			}
			if(ifDifferent == true) {
				for(var i = 0; i < dfdToDelete.length; i++) {
					if(dfdToDelete[i].array == "in") {
						self._idToNode[dfdToDelete[i].id].in.splice(dfdToDelete[i].index, 1);
					}
					else {
						self._idToNode[dfdToDelete[i].id].out.splice(dfdToDelete[i].index, 1);
					}
				}
				self.rootNode = self._idToNode[formalDef];
			}
			else {
				var completeFormalDef = output.result[0][l1 - 1].formalDef;
				self._idToNode[nodeName].id = completeFormalDef;
				self._idToNode[completeFormalDef] = self._idToNode[nodeName];
				self.rootNode = self._idToNode[completeFormalDef];
			}
		}
		function _calculateMaxDepthForNodes(node, idpath, length) {
			//为每个节点计算maxdepth，深搜
			var l = node.out.length;
			for(var i = 0; i < l; i++) {
				var out_n = node.out[i].state;
				if(idpath[out_n.id] == true) {
					continue;
				}
				if((out_n.maxdepth == undefined) || (out_n.maxdepth < length)) {
					out_n.maxdepth = length;
					if(self.maxDepth < length) {
						self.maxDepth = length;
					}
					var tmp = [];
					tmp[out_n.id] = true;
					_calculateMaxDepthForNodes(out_n, $.extend(tmp, idpath), length + 1);
				}
			}
		}
		function _calculateMinDepthForNodes() {
			//为每个节点计算mindepth，广搜
			var queue = [];
			var ifPushed = [];
			queue.push(self.rootNode);
			self.rootNode.mindepth = 0;
			ifPushed[self.rootNode.id] = true;
			self._nodeOfminDepth[0].push(self.rootNode.id);
			while(queue.length != 0) {
				var n = queue.shift();
				var l = n.out.length;
				for(var i = 0; i < l; i++) {
					var tmp_n = n.out[i].state;
					if(ifPushed[tmp_n.id] == true) {
						continue;
					}
					tmp_n.mindepth = n.mindepth + 1;
					self._nodeOfminDepth[tmp_n.mindepth].push(tmp_n.id);
					if(tmp_n.mindepth > self._maxMinDepth) {
						self._maxMinDepth = tmp_n.mindepth;
					}
					ifPushed[tmp_n.id] = true;
					queue.push(tmp_n);
				}
			}
		}
	},
	showLevelsOfStategraph: function(level, index) {
		//根据参数level显示相应部分状态图，level为null则默认为最高的几层
		var self = this;
		if(self._nodeOfminDepth[level].length - 1 < index) {
			console.log("level unavailable", level, index, self._nodeOfminDepth[level]);
			return undefined;
		}
		self._renderView(self._nodeOfminDepth[level][index]);
	},
	_renderView: function(node_id) {
		//根据选定节点，渲染View
		var self = this;
		var ifProcessGraph = false;
		if(self.nodeNow != node_id) {
			ifProcessGraph = true;
			self.nodePast = self.nodeNow;
			self.nodeNow = node_id;
			self.nodesPast = self.nodesNow;
			self.nodesNow = [];
		}
		var x_linear_detail = d3.scale.linear();
		var y_linear_detail = d3.scale.linear();
		var diagonal = d3.svg.diagonal();
		var node = self._idToNode[node_id];
		var nodes = [],
			links = [];
		var smallest_y, smallest_x, largest_y, largest_x;
		var parentNodes = [];//记录选定节点的路径上的末端节点
		var transitionMark; //作图时标记动画延迟时间
		var overviewRootShortest = [];
		var overviewPastShortest = [];
		_selectNodesToShow();
		_computeNodesPosition();
		x_linear_detail.domain([smallest_x, largest_x]);
		y_linear_detail.domain([smallest_y, largest_y]);
		_drawRoute();	
		_drawStateGraphDetail();
		_drawStateGraphOverview();
		

		function _selectNodesToShow() {
			//根据选定节点确定需要显示的节点，结果放到nodes与links中
			var ifPushed = [];
			ifPushed[node.id] = true;
			var ifPushed_link = [];
			node.class = ["normalNode"];
			node.class.push("nowNode");
			nodes.push(node);
			self.nodesNow[node.id] = true;
			_subTree(node, self.numOfChildrenLevel);
			_parentTree(node, self.numOfParentLevel);
			_parentTree_children();
			if(ifPushed[self.nodePast] == true) {
				self._idToNode[self.nodePast].class.push("pastNode");
			}

			function _subTree(tmp_node, d) {
				if(d <= 0) {
					tmp_node.children = undefined;
					if(tmp_node.out.length > 0) {
						tmp_node.class.push("unexpandedNode")
					}
					return undefined;
				}
				var l = tmp_node.out.length;
				tmp_node.children = [];
				for(var i = 0; i < l; i++) {
					var link = new Object();
					link.source = tmp_node;
					link.target = tmp_node.out[i].state;
					link.id = tmp_node.id + tmp_node.out[i].state.id;
					link.action = tmp_node.out[i].action;
					links.push(link);
					ifPushed_link[link.source.id + link.target.id] = true;
					if(ifPushed[tmp_node.out[i].state.id] != true) {
						tmp_node.children.push(tmp_node.out[i].state);
						tmp_node.out[i].state.class = ["normalNode"];
						nodes.push(tmp_node.out[i].state);
						self.nodesNow[tmp_node.out[i].state.id] = true;
						ifPushed[tmp_node.out[i].state.id] = true;
						link.class = ["normalLine"];
						_subTree(tmp_node.out[i].state, d - 1);
					}
					else {
						link.class = ["ExtraLine"];
					}
				}
			}
			function _parentTree(tmp_node, d) {
				if(d <= 0) {
					tmp_node.trueParent = undefined;
					return undefined;
				}
				var l = tmp_node.in.length;
				tmp_node.trueParent = [];
				for(var i = 0; i < l; i++) {
					if(ifPushed_link[tmp_node.in[i].state.id + tmp_node.id] == true) {
						continue;
					}
					var link = new Object();
					link.source = tmp_node.in[i].state;
					link.target = tmp_node;
					link.id = tmp_node.in[i].state.id + tmp_node.id;
					link.action = tmp_node.in[i].action;
					links.push(link);
					ifPushed_link[link.source.id + link.target.id] = true;
					if(ifPushed[tmp_node.in[i].state.id] != true) {
						tmp_node.trueParent.push(tmp_node.in[i].state);
						tmp_node.in[i].state.class = ["normalNode"];
						nodes.push(tmp_node.in[i].state);
						self.nodesNow[tmp_node.in[i].state.id] = true;
						parentNodes.push(tmp_node.in[i].state);
						ifPushed[tmp_node.in[i].state.id] = true;
						link.class = ["normalLine"];
						_parentTree(tmp_node.in[i].state, d - 1);
					}
					else {
						link.class = ["ExtraLine"];
					}
				}
			}
			function _parentTree_children() {
				for(var i = 0; i < parentNodes.length; i++) {
					if(parentNodes[i].out.length > 0) {
						parentNodes[i].trueChildren = [];
					}
					else {
						parentNodes[i].trueChildren = undefined;
					}
					for(var j = 0; j < parentNodes[i].out.length; j++) {
						var n = parentNodes[i].out[j].state;
						if(ifPushed_link[parentNodes[i].id + n.id] == true) {
							continue;
						}
						var link = new Object();
						link.source = parentNodes[i];
						link.target = n;
						link.id = parentNodes[i].id + n.id;
						link.action = parentNodes[i].out[j].action;
						links.push(link);
						ifPushed_link[link.source.id + link.target.id] = true;
						if(ifPushed[n.id] != true) {//节点n没出现过
							n.class = ["siblingNode"];
							if(n.out.length > 0) {
								n.class.push("unexpandedNode");
							}
							nodes.push(n);
							self.nodesNow[n.id] = true;
							ifPushed[n.id] = true;
							parentNodes[i].trueChildren.push(n);
							n.trueChildren = undefined;
							link.class = ["siblingExtraLine"];
						}
						else {
							link.class = ["ExtraLine"];
						}
					}
				}
			}
		}
		function _computeNodesPosition() {
			//根据选定节点计算显示节点的坐标x，y
			var total_height = $("#" + self.stateGraphDetailDivId).height();
			var total_width = $("#" + self.stateGraphDetailDivId).width();
			smallest_y = total_height;
			smallest_x = total_width;
			largest_x = 0;
			largest_y = 0;
			x_linear_detail.range([self._border, total_width - self._border - self._leftDetailInterval]);
			y_linear_detail.range([self._border, total_height - self._border]);
			var radius, parentCX, parentCY, childrenCX, childrenCY;
			if(total_width / (Math.max(self.numOfParentLevel, self.numOfChildrenLevel) * 2) > 
				(total_height - self._interval) / (self.numOfChildrenLevel + self.numOfParentLevel)) {
				radius = (total_height - self._interval) / (self.numOfChildrenLevel + self.numOfParentLevel);
			}
			else {
				radius = total_width / (Math.max(self.numOfParentLevel, self.numOfChildrenLevel) * 2);
			}
			parentCX = total_width / 2;
			parentCY = (total_height / 2) - (self._interval / 3);
			childrenCX = total_width / 2;
			childrenCY = (total_height / 2) + (self._interval * 2 / 3);
			var tree = d3.layout.tree()
				.size([total_width, total_height])
				.separation(function(a, b) {
					var dis = (a.parent == b.parent ? 1 : 2) / (a.depth / 2);
					if(a.parent == b.parent) {
						if(a.depth == 1) {
							dis = 3;
						}
						if(a.depth == 2) {
							dis = 2;
						}
					}
			        return dis;
				});
			var subTreeNodes, siblingNodes, parentTreeNodes;
			subTreeNodes = tree.nodes(node);//计算子树中的节点坐标
			if(!node.x) {
				_fixTheTreeNodesProblem(node);
			}
			tree.children(function(d) {
				if(d.trueChildren) {
					return d.trueChildren;
				}
				else {
					return undefined;
				}
			});
			var l = parentNodes.length;
			siblingNodes = [];
			siblingNodes.length = l;
			for(var i = 0; i < l; i++) {
				//计算兄弟节点的坐标
				var l2 = parentNodes[i].trueChildren.length;
				siblingNodes[i] = [];
				for(var j = 0; j < l2; j++) {
					parentNodes[i].trueChildren[j].x = (total_width / 6) + (total_width * 2 * (j + 1)) / (3 * (l2 + 1));
					siblingNodes[i].push(parentNodes[i].trueChildren[j]);
				}
			}
			tree.children(function(d) {
				if(d.trueParent) {
					return d.trueParent;
				}
				return undefined;
			});
			parentTreeNodes = tree.nodes(node);//计算父节点的坐标
			if(!node.x) {
				_fixTheTreeNodesProblem(node);
			}
			l = subTreeNodes.length;
			for(var i = 0; i < l; i++) {
				var r = subTreeNodes[i].depth * radius / 1.5;
				subTreeNodes[i].x = r * Math.cos((1 - subTreeNodes[i].x / total_width) * Math.PI) + childrenCX;
				subTreeNodes[i].y = r * Math.sin((1 - subTreeNodes[i].x / total_width) * Math.PI) + childrenCY;
				_compareLargest_Smallest_XY(subTreeNodes[i].x, subTreeNodes[i].y);
			}
			l = parentTreeNodes.length;
			for(var i = 0; i < l; i++) {
				if(parentTreeNodes[i].id == node.id) {
					continue;
				}
				var r = parentTreeNodes[i].depth * radius;
				parentTreeNodes[i].parent = true;
				parentTreeNodes[i].x = r * Math.cos((1 - parentTreeNodes[i].x / total_width) * Math.PI) + parentCX;
				parentTreeNodes[i].y = r * Math.sin((parentTreeNodes[i].x / total_width - 1) * Math.PI) + parentCY;
				_compareLargest_Smallest_XY(parentTreeNodes[i].x, parentTreeNodes[i].y);
			}
			for(var i = 0; i < siblingNodes.length; i++) {
				for(var j = 0; j < siblingNodes[i].length; j++) {
					if(parentNodes[i].id == siblingNodes[i][j].id) {
						continue;
					}
					var r = radius / 3;
					siblingNodes[i][j].sibling = true;
					siblingNodes[i][j].x = r * Math.cos((1 - siblingNodes[i][j].x / total_width) * Math.PI) + parentNodes[i].x;
					siblingNodes[i][j].y = r * Math.sin((1 - siblingNodes[i][j].x / total_width) * Math.PI) + parentNodes[i].y;
					_compareLargest_Smallest_XY(siblingNodes[i][j].x, siblingNodes[i][j].y);
				}
			}

			function _compareLargest_Smallest_XY(x, y) {
				if(x > largest_x) {
					largest_x = x;
				}
				if(x < smallest_x) {
					smallest_x = x;
				}
				if(y > largest_y) {
					largest_y = y;
				}
				if(y < smallest_y) {
					smallest_y = y;
				}
			}
			function _fixTheTreeNodesProblem(n) {
				n.x = parentCX;
				if(n.children) {
					for(var i = 0; i < n.children.length; i++) {
						_fixTheTreeNodesProblem(n.children[i]);
					}
				}
			}
		}
		function _drawStateGraphDetail() {
			//作图detail
			transitionMark = false;
			var lines = self._stateGraph_detail_g.selectAll(".line")
				.data(links, function(l) {
					return l.id;
				});
			lines.exit()
				.remove();			
			var circles = self._stateGraph_detail_g.selectAll(".circle")
				.data(nodes, function(n) {
					return n.id;
				});
			circles.exit()
				.remove();
			lines.attr("class", function(l) {
					transitionMark = true;
					var l1 = l.class.length;
					var classStr = "line";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + l.class[i]);
					}
					classStr = _setRouteVisibleOrNotInDetail(classStr, l);
					return classStr;
				})
				.transition()
				.delay(300)
				.duration(800)
				.attr("d", _computeWidthOfLine);
			circles.transition()
				.delay(300)
				.duration(800)
				.attr("class", function(n) {
					transitionMark = true;
					var l1 = n.class.length;
					var classStr = "circle";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					if(!n.out.length) {
						classStr += " deadNode";
					}
					return classStr;
				})
				.attr("cx", function(n) {
					return x_linear_detail(n.x);
				})
				.attr("cy", function(n) {
					return y_linear_detail(n.y);
				});			
			lines.enter()
				.insert("path")
				.attr("id", function(l) {
					return self._linesPrefix + self._fixTheSelectProblem(l.id);
				})
				.attr("action", function(l) {
					return l.action;
				})
				.attr("class", function(l) {
					var l1 = l.class.length;
					var classStr = "line";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + l.class[i]);
					}
					classStr = _setRouteVisibleOrNotInDetail(classStr, l);
					return classStr;
				})
				.attr("d", undefined)
				.on("mouseover", function(l) {
					d3.select(this).classed("focus-highlight", true);
					self._stateGraph_overview_g.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._stateGraph_overview_g.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
					self._mouseoverLink(this);
					self.processGraphObject.mouseoverLinkFromStateGraph(l.action);
				})
				.on("mouseout", function(l) {
					self._stateGraph_overview_g.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._stateGraph_overview_g.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
					d3.select(this).classed("focus-highlight", false);
					self._mouseoutLink(this);
					self.processGraphObject.mouseoutLinkFromStateGraph(l.action);
				})
				.transition()
				.delay(function() {
					if(transitionMark == false) {
						return 0;
					}
					return 1100;
				})
				.duration(500)
				.attr("d", _computeWidthOfLine);
			circles.enter()
				.append("circle")
				.attr("id", function(n) {
					return self._circlesPrefix + self._fixTheSelectProblem(n.id);
				})
				.attr("cx", function(n) {
					return x_linear_detail(n.x);
				})
				.attr("cy", function(n) {
					return y_linear_detail(n.y);
				})
				.on("click", function(n) {
					_nodeClick(n);
				})
				.on("mouseover", function(n) {
					self.mouseoverNode(n.id);
					compareGraph.mouseoverNodeFromStateGraph(n.id);
				})
				.on("mouseout", function(n) {
					self.mouseoutNode(n.id);
					compareGraph.mouseoutNodeFromStateGraph(n.id);
				})
				.transition()
				.delay(function() {
					if(transitionMark == false) {
						return 0;
					}
					return 1100;
				})
				.attr("class", function(n) {
					var l1 = n.class.length;
					var classStr = "circle";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					if(!n.out.length) {
						classStr += " deadNode";
					}
					return classStr;
				});
			var line_actions = links.filter(function(l) {
				var l2 = l.class.length;
				for(var i = 0; i < l2; i++) {
					if(l.class[i] == "ExtraLine" || l.class[i] == "siblingExtraLine") {
						return false;
					}
					if(l.target.id == node.id || l.source.id == node.id) {
						return true;
					}
					return false;
				}
			});
			var actions = self._stateGraph_detail_g.selectAll(".action")
				.data(line_actions, function(l) {
					return l.id;
				});
			actions.exit()
				.remove();
			actions.transition()
				.delay(300)
				.duration(800)
				.attr("x", function(l) {
					return x_linear_detail((l.source.x + l.target.x) / 2);
				})
				.attr("y", function(l) {
					return y_linear_detail((l.source.y + l.target.y) / 2);
				});
			actions.enter()
				.append("text")
				.attr("class", "action")
				.attr("id", function(l) {
					return self._actionPrefix + self._fixTheSelectProblem(l.id);
				})
				.transition()
				.delay(function() {
					if(transitionMark == false) {
						return 0;
					}
					return 1100;
				})
				.attr("x", function(l) {
					return x_linear_detail((l.source.x + l.target.x) / 2);
				})
				.attr("y", function(l) {
					return y_linear_detail((l.source.y + l.target.y) / 2);
				})
				.text(function(l) {
					return l.action;
				});
			if(self._ifActionTextVisible == false) {
				self.hideText();
			}
			else {
				self.showText();
			}
			function _computeWidthOfLine(l) {
				//在detail里使垂直
				var line_source = {x: x_linear_detail(l.source.x), y: y_linear_detail(l.source.y)};
				var line_target = {x: x_linear_detail(l.target.x), y: y_linear_detail(l.target.y)};
				var line2_source = line_target;
				var line2_target = {x: x_linear_detail(l.source.x), y: y_linear_detail(l.source.y)};
				var tmp_x = line_target.x - line_source.x;
				var tmp_y = line_target.y - line_source.y;
				var tmp_m = Math.sqrt(tmp_y * tmp_y + tmp_x * tmp_x);
				line_source.x -= tmp_y * 2 / tmp_m;
				line_source.y += tmp_x * 2 / tmp_m;
				line2_target.x += tmp_y * 2 / tmp_m;
				line2_target.y -= tmp_x * 2 / tmp_m;
				var d1 = diagonal({source: line_source, target: line_target});
				var d2 = diagonal({source: line2_source, target: line2_target});
				var final = d1 + d2.substring(d2.indexOf('C')) + 'Z';
				return final;
			}
			function _setRouteVisibleOrNotInDetail(classStr, l) {
				if(overviewRootShortest[l.id] == true 
					&& overviewPastShortest[l.id] == true
					&& self._ifRouteFromRootVisivle == true
					&& self._ifRouteFromPastVisible == true) {
					classStr += (" hybridRootPastLine");
				}
				else if(overviewRootShortest[l.id] == true 
					&& self._ifRouteFromRootVisivle == true) {
					classStr += (" overviewRootLine");
				}
				else if(overviewPastShortest[l.id] == true
					&& self._ifRouteFromPastVisible == true) {
					classStr += (" overviewPastLine");
				}
				return classStr;
			}
		}
		function _drawStateGraphOverview() {
			//作图overview
			var circles = self._stateGraph_overview_g.selectAll(".circle")
				.data(self._overview_nodes, function(n) {
					return n.id;
				});
			circles.exit()
				.remove();
			circles.enter()
				.append("circle")
				.attr("id", function(n) {
					return self._circlesOverviewPrefix + self._fixTheSelectProblem(n.id);
				})
				.attr("cx", function(n) {
					return n.overview_x;
				})
				.attr("cy", function(n) {
					return n.overview_y;
				})
				.style("r", self._overview_r)
				.attr("class", function(n) {
					if(self.nodesNow[n.id] == true) {
						var l1 = n.class.length;
						var classStr = "circle";
						for(var i = 0; i < l1; i++) {
							classStr += (" " + n.class[i]);
						}
						if(!n.out.length) {
							classStr += " deadNode";
						}
						return classStr;
					}
					else {
						var classStr = "circle undrawedNode";
						if(!n.out.length) {
							classStr += " deadNode";
						}
						return classStr;
					}
				})
				.on("click", function(n) {
					_nodeClick(n);
				})
				.on("mouseover", function(n) {
					self.mouseoverNode(n.id);
					compareGraph.mouseoverNodeFromStateGraph(n.id);
				})
				.on("mouseout", function(n) {
					self.mouseoutNode(n.id);
					compareGraph.mouseoutNodeFromStateGraph(n.id);
				});
			circles.transition()
				.delay(function(n) {
					if(self.nodesNow[n.id] == false) {
						return 0;
					}
					else if(self.nodesPast != undefined && self.nodesPast[n.id] == true) {
						return 300;
					}
					else {
						if(transitionMark == false) {
							return 0;
						}
						else return 1100;
					}
				})
				.attr("class", function(n) {
					if(self.nodesNow[n.id] == true) {
						var l1 = n.class.length;
						var classStr = "circle";
						for(var i = 0; i < l1; i++) {
							classStr += (" " + n.class[i]);
						}
						if(!n.out.length) {
							classStr += " deadNode";
						}
						return classStr;
					}
					else if(self.nodePast != n.id) {
						var classStr = "circle undrawedNode";
						if(!n.out.length) {
							classStr += " deadNode";
						}
						return classStr;
					}
					else {
						var classStr = "circle pastNode undrawedNode";
						if(!n.out.length) {
							classStr += " deadNode";
						}
						return classStr;
					}
				});
		}
		function _nodeClick(n) {
			var i = self._searchIndex(n.mindepth, n.id);
			/*$("#stateGraph_slider").slider({
				value: -n.mindepth
			});
			$("#selectInput").text(n.mindepth);
			$("#stateGraph_slider2").slider({
				min: -self._nodeOfminDepth[n.mindepth].length + 1,
				value: -i
			});
			$("#selectNodeIndex").text(i);
			$("#selectSiblingNum").text(self._nodeOfminDepth[n.mindepth].length - 1);*/
			self._renderView(n.id);
		}
		function _drawRoute() {
			if(!self.nodePast || (self.nodePast == self.nodeNow)) {
				return null;
			}
			self.fromRootShortest = [];
			self.fromPastShortest = [];
			if(node_id != self.rootNode.id) {
				self.fromRootShortest = _findShortestRoute(self.rootNode, node_id);
			}
			if(self.nodePast != self.rootNode.id) {
				self.fromPastShortest = _findShortestRoute(self._idToNode[self.nodePast], node_id);
			}
			//改变processGraph中的样式
			if(ifProcessGraph === false) {
				//nothing
			}
			else if(node_id == self.rootNode.id) {
				self.processGraphObject.renderView(null);
			}
			else {
				var actionList = [];
				for(var i = 0; i < self.fromRootShortest.length; i++) {
					actionList.push(self.fromRootShortest[i].action);
				}
				self.processGraphObject.renderView(actionList);
			}
			//关于processGraph中的动画
			if(ifProcessGraph === false) {
				//nothing
			}
			else if(self.nodePast == self.rootNode.id) {
				/*var actionList = [];
				for(var i = 0; i < self.fromRootShortest.length; i++) {
					actionList.push(self.fromRootShortest[i].action);
				}
				self.processGraphObject.setActionListFromPast(actionList);*/
				self.processGraphObject.setActionListFromPast([]);
			}
			else {
				var actionList = [];
				for(var i = 0; i < self.fromPastShortest.length; i++) {
					actionList.push(self.fromPastShortest[i].action);
				}
				self.processGraphObject.setActionListFromPast(actionList);
			}
			_drawLines(self.fromRootShortest, "overviewRootLine", self._linesRootOverviewPrefix);
			_drawLines(self.fromPastShortest, "overviewPastLine", self._linesPastOverviewPrefix);
			_setRouteVisibleOrNotInOverview();

			function _findShortestRoute(source, targetID) {
				//找到从source到target最短的路径
				var queue = [];
				var ifPushed = [];
				var ifFirstFound = false;
				var lines = [];
				var tmp_tmp_n = undefined;
				queue.push(source);
				source.route_minlength = 0;
				source.route_jump = 0;
				ifPushed[source.id] = true;
				while(queue.length != 0) {
					var n = queue.shift();
					var l = n.out.length;
					for(var i = 0; i < l; i++) {
						var tmp_n = n.out[i].state;
						if(ifFirstFound == true) {
							if(n.route_minlength + 1 > tmp_tmp_n.route_minlength) {
								continue;
							}
							if(n.route_minlength + 1 == tmp_tmp_n.route_minlength
								&& tmp_n.id != targetID) {
								continue;
							}
						}
						if(ifPushed[tmp_n.id] == true) {
							if(n.route_minlength + 1 == tmp_n.route_minlength) {
								var jump = n.route_jump + Math.abs(n.mindepth - tmp_n.mindepth);
								if(jump < tmp_n.route_jump) {
									tmp_n.route_jump = jump;
									tmp_n.route_action = n.out[i].action;
									tmp_n.backPointer = n;
								}
							}
							continue;
						}
						tmp_n.route_jump = n.route_jump + Math.abs(n.mindepth - tmp_n.mindepth);
						tmp_n.route_minlength = n.route_minlength + 1;
						tmp_n.route_action = n.out[i].action;
						tmp_n.backPointer = n;
						if(tmp_n.id == targetID) {
							tmp_tmp_n = tmp_n;
							ifFirstFound = true;
							ifPushed[tmp_n.id] = true;
							continue;
						}
						ifPushed[tmp_n.id] = true;
						queue.push(tmp_n);
					}
				}
				if(ifFirstFound == false) {
					return lines;
				}
				while(tmp_tmp_n.id != source.id) {
					var line = new Object();
					line.source = tmp_tmp_n.backPointer;
					line.target = tmp_tmp_n;
					line.action = tmp_tmp_n.route_action;
					line.id = line.source.id + line.target.id;
					lines.push(line);
					tmp_tmp_n = tmp_tmp_n.backPointer;
					if(source.id == self.rootNode.id) {
						overviewRootShortest[line.id] = true;
					}
					else if(source.id == self.nodePast) {
						overviewPastShortest[line.id] = true;
					}
				}
				return lines;
			}
			/*function _findShortestRoute(source, targetID) {
				//找到从source到target最短的路径
				var queue = [];
				var ifPushed = [];
				queue.push(source);
				ifPushed[source.id] = true;
				while(queue.length != 0) {
					var n = queue.shift();
					var l = n.out.length;
					for(var i = 0; i < l; i++) {
						var tmp_n = n.out[i].state;
						if(ifPushed[tmp_n.id] == true) {
							continue;
						}
						tmp_n.route_action = n.out[i].action;
						tmp_n.backPointer = n;
						if(tmp_n.id == targetID) {
							var lines = [];
							var tmp_tmp_n = tmp_n;
							while(tmp_tmp_n.id != source.id) {
								var line = new Object();
								line.source = tmp_tmp_n.backPointer;
								line.target = tmp_tmp_n;
								line.action = tmp_tmp_n.route_action;
								line.id = line.source.id + line.target.id;
								lines.push(line);
								tmp_tmp_n = tmp_tmp_n.backPointer;
								if(source.id == self.rootNode.id) {
									overviewRootShortest[line.id] = true;
								}
								else if(source.id == self.nodePast) {
									overviewPastShortest[line.id] = true;
								}
							}
							return lines;
						}
						ifPushed[tmp_n.id] = true;
						queue.push(tmp_n);
					}
				}
			}*/
			function _computeWidthOfLineInOverview(l) {
				//在overview里使垂直
				var line_source = {x: l.source.overview_x, y: l.source.overview_y};
				var line_target = {x: l.target.overview_x, y: l.target.overview_y};
				var line2_source = line_target;
				var line2_target = {x: l.source.overview_x, y: l.source.overview_y};
				var tmp_x = line_target.x - line_source.x;
				var tmp_y = line_target.y - line_source.y;
				var tmp_m = Math.sqrt(tmp_y * tmp_y + tmp_x * tmp_x);
				line_source.x -= tmp_y * 2 / tmp_m;
				line_source.y += tmp_x * 2 / tmp_m;
				line2_target.x += tmp_y * 2 / tmp_m;
				line2_target.y -= tmp_x * 2 / tmp_m;
				var d1 = diagonal({source: line_source, target: line_target});
				var d2 = diagonal({source: line2_source, target: line2_target});
				var final = d1 + d2.substring(d2.indexOf('C')) + 'Z';
				return final;
			}
			function _drawLines(lines, classname, prefix) {
				var fromLines = self._stateGraph_overview_g.selectAll("." + classname)
					.data(lines, function(l) {
						return l.id;
					});
				fromLines.exit()
					.remove();
				fromLines.enter()
					.append("path")
					.attr("id", function(l) {
						return prefix + self._fixTheSelectProblem(l.id);
					})
					.attr("class", classname)
					.attr("action", function(l) {
						return l.action;
					})
					.attr("d", _computeWidthOfLineInOverview)
					.on("mouseover", function(l) {
						self._stateGraph_detail_g.select("#" 
							+ self._linesPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._stateGraph_overview_g.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._stateGraph_overview_g.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._mouseoverLink(this);
						self.processGraphObject.mouseoverLinkFromStateGraph(l.action);
					})
					.on("mouseout", function(l) {
						self._stateGraph_detail_g.select("#" 
							+ self._linesPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._stateGraph_overview_g.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._stateGraph_overview_g.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._mouseoutLink(this);
						self.processGraphObject.mouseoutLinkFromStateGraph(l.action);
					})
			}
			function _setRouteVisibleOrNotInOverview() {
				if(self._ifRouteFromRootVisivle == true) {
					self._stateGraph_overview_g.selectAll(".overviewRootLine")
						.style("visibility", "visible");
				}
				else {
					self._stateGraph_overview_g.selectAll(".overviewRootLine")
						.style("visibility", "hidden");
				}
				if(self._ifRouteFromPastVisible == true) {
					self._stateGraph_overview_g.selectAll(".overviewPastLine")
						.style("visibility", "visible");
				}
				else {
					self._stateGraph_overview_g.selectAll(".overviewPastLine")
						.style("visibility", "hidden");
				}
			}
		}
	},
	_computeNodesPositionInOverview: function() {
		//计算overview中节点的坐标以及存储节点半径
		var self = this;
		self._overview_nodes = [];
		var r;
		var height_interval = 1;
		for(var i = 0; i <= self._maxMinDepth; i++) {
			if(self._nodeOfminDepth[i].length > self._maxWidth) {
				self._maxWidth = self._nodeOfminDepth[i].length;
			}
		}
		var x_r = (($("#" + self.stateGraphOverviewDivid).width() - self._leftOverviewInterval)
			/ self._maxWidth - 1) / 2;
		var y_r = (($("#" + self.stateGraphOverviewDivid).height() - 2 * self._border)
			/ self._maxMinDepth - 1) / 2;
		if(x_r > y_r) {
			r = y_r;
		}
		else {
			r = x_r;
		}
		if(r > 4) {
			r = 4;
		}		
		if(r < 0) {
			r = 1;
		}
		height_interval = ($("#" + self.stateGraphOverviewDivid).height() - 2 * self._border) 
							/ self._maxMinDepth - 2 * r;
		for(var i = 0; i <= self._maxMinDepth; i++) {
			var l = self._nodeOfminDepth[i].length;
			var width_interval = ($("#" + self.stateGraphOverviewDivid).width() - self._leftOverviewInterval)
									/ l - 2 * r;
			if(width_interval < 1) {
				width_interval = 1;
			}
			else if(width_interval > 4 * r) {
				width_interval = 4 * r;
			}
			else if(width_interval > 2.5 * r) {
				width_interval = 2.5 * r;
			}
			for(var j = 0; j < l; j++) {
				self._idToNode[self._nodeOfminDepth[i][j]].overview_x = (2 * r + width_interval) * j + r;
				self._idToNode[self._nodeOfminDepth[i][j]].overview_y = (2 * r + height_interval) * i + r;
				self._overview_nodes.push(self._idToNode[self._nodeOfminDepth[i][j]]);
			}
		}
		self._overview_r = r;
	},
	_addButton: function() {
		var self = this;
		//提示框初始化
		/*var help_image = d3.select("#" + self.stateGraphDetailDivId)
			.append("div")
			.attr("id", "dialog_help")
			.attr("title", "state graph")
			.append("img")
			.attr("width", "800px");
		$("#dialog_help").dialog({
			width: "850",
			height: "550",
			autoOpen: false,
			buttons: {
				"1st": function() {
					help_image.attr("src", "help/stateGraph_help.PNG");
				},
				"2nd": function() {
					help_image.attr("src", "help/stateGraph_help2.PNG");
				}
			}
		});*/
		//按钮部分
		var toolBarDiv = d3.select("#" + self.stateGraphDivID)
			.append("div")
			.attr("id", self.stateGraphDivID + "-toolBarDiv");
		//帮助按钮
		/*toolBarDiv.append("span")
			.attr("id", "stateGraph_help")
			.html("<img src=\"icon/help.png\">")
			.style("position", "absolute")
			.style("top", 0)
			.style("cursor", "pointer")
			.on("click", function() {
				//提示信息
				$("#dialog_help").dialog("open");
				help_image.attr("src", "help/stateGraph_help.PNG");
			});
		toolBarDiv.append("br");*/
		//显示或隐藏action text
		toolBarDiv.append("span")
			.attr("id", "stateGraph_actionText")
			.html("<img src=\"icon/visible.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				if(self._ifActionTextVisible == true) {
					d3.select(this).html("<img src=\"icon/hide.png\">");
					self._ifActionTextVisible = false;
					self.hideText();
				}
				else {
					d3.select(this).html("<img src=\"icon/visible.png\">");
					self._ifActionTextVisible = true;
					self.showText();
				}
			});
		toolBarDiv.append("br");
		//增加显示父节点的层数
		toolBarDiv.append("span")
			.attr("id", "stateGraph_add_parent")
			.html("<img src=\"icon/add.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				self.addUpperLevelToShow();
			});
		toolBarDiv.append("br");
		//减少显示父节点的层数
		toolBarDiv.append("span")
			.attr("id", "stateGraph_minus_parent")
			.html("<img src=\"icon/minus.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				self.minusUpperLevelToShow();
			});
		toolBarDiv.append("br");
		//滑动条
		/*toolBarDiv.append("label")
			.text("dep:");
		toolBarDiv.append("label")
			.text("0")
			.attr("id", "selectInput");
		toolBarDiv.append("label")
			.text("/" + self._maxMinDepth);
		toolBarDiv.append("br");
		toolBarDiv.append("br");
		toolBarDiv.append("div")
			.attr("id", "stateGraph_slider")
			.style("height", $("#" + self.stateGraphDetailDivId).height() / 1.5);
		toolBarDiv.append("br");
		toolBarDiv.append("label")
			.text("num:");
		toolBarDiv.append("label")
			.text("0")
			.attr("id", "selectNodeIndex");
		toolBarDiv.append("label")
			.text("/");
		toolBarDiv.append("label")
			.text(self._nodeOfminDepth[0].length - 1)
			.attr("id", "selectSiblingNum");
		toolBarDiv.append("br");
		toolBarDiv.append("br");
		toolBarDiv.append("div")
			.attr("id", "stateGraph_slider2")
			.style("height", $("#" + self.stateGraphDetailDivId).height() / 1.5);*/
		//增加显示孩子节点的层数
		toolBarDiv.append("br");
		toolBarDiv.append("span")
			.attr("id", "stateGraph_add_children")
			.html("<img src=\"icon/add.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				self.addLowerLevelToShow();
			});
		toolBarDiv.append("br");
		//减少显示孩子节点的层数
		toolBarDiv.append("span")
			.attr("id", "stateGraph_minus_children")
			.html("<img src=\"icon/minus.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				self.minusLowerLevelToShow();
			});
		//定义滑动条特征、行为
		/*$("#stateGraph_slider").slider({
			orientation: "vertical",
			range: "min",
			min: -self._maxMinDepth,
			max: 0,
			value: 0,
			slide: function(event, ui) {
				$("#selectInput").text(-ui.value);
			},
			stop: function(event, ui) {
				self.showLevelsOfStategraph(-ui.value, 0);
				$("#stateGraph_slider2").slider({
					min: -self._nodeOfminDepth[-ui.value].length + 1,
					value: 0
				});
				$("#selectNodeIndex").text(0);
				$("#selectSiblingNum").text(self._nodeOfminDepth[-ui.value].length - 1);
			}
		});
		$("#stateGraph_slider2").slider({
			orientation: "vertical",
			range: "min",
			min: -self._nodeOfminDepth[0].length + 1,
			max: 0,
			value: 0,
			slide: function(event, ui) {
				$("#selectNodeIndex").text(-ui.value);
			},
			stop: function(event, ui) {
				if(!self.nodeNow) {
					console.log("error!", self.nodeNow);
				}
				self.showLevelsOfStategraph(self._idToNode[self.nodeNow].mindepth, -ui.value);
			}
		});*/
		//overview按钮部分
		/*var toolBarOverviewDiv = d3.select("#" + self.stateGraphOverviewDivid)
			.append("div")
			.style("position", "relative")
			.style("top", 0)
			.style("left", 0);*/
		toolBarDiv.append("br");
		toolBarDiv.append("span")
			.attr("id", "stateGraph_route_root")
			.html("<img src=\"icon/route-root-visible.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				if(self._ifRouteFromRootVisivle == true) {
					d3.select(this).html("<img src=\"icon/route-root-hide.png\">");
					self._ifRouteFromRootVisivle = false;
					self._renderView(self.nodeNow);
				}
				else {
					d3.select(this).html("<img src=\"icon/route-root-visible.png\">");
					self._ifRouteFromRootVisivle = true;
					self._renderView(self.nodeNow);
				}
			});
		toolBarDiv.append("br");
		toolBarDiv.append("span")
			.attr("id", "stateGraph_route_past")
			.html("<img src=\"icon/route-past-visible.png\">")
			.style("cursor", "pointer")
			.on("click", function() {
				if(self._ifRouteFromPastVisible == true) {
					d3.select(this).html("<img src=\"icon/route-past-hide.png\">");
					self._ifRouteFromPastVisible = false;
					self._renderView(self.nodeNow);
				}
				else {
					d3.select(this).html("<img src=\"icon/route-past-visible.png\">");
					self._ifRouteFromPastVisible = true;
					self._renderView(self.nodeNow);
				}
			});
	},
	_fixTheSelectProblem: function(id) {
		//d3.select()里的id不可包含一些字符，以作调整
		var l = id.length;
		var new_id = "";
		for(var i = 0; i < l; i++) {
			if((id[i] >= 'a' && id[i] <= 'z') 
				|| (id[i] >= 'A' && id[i] <= 'Z') 
				|| (id[i] >= '0' && id[i] <= '9')) 
			{
				new_id += id[i];
			}
			else if(id[i] == '\'') {
				new_id += '-';
			}
		}
		return new_id;
	},
	_searchIndex: function(depth, node_id) {
		//根据节点id返回它在_nodeOfminDepth[depth]数组中的序号
		var self = this;
		var l = self._nodeOfminDepth[depth].length;
		for(var i = 0; i < l; i++) {
			if(self._nodeOfminDepth[depth][i] == node_id) {
				return i;
			}
		}
		return undefined;
	},
	mouseoverNode: function(node_id, already_tip) {
		//鼠标悬浮节点事件
		var self = this;
		var n = self._idToNode[node_id];
		self._stateGraph_overview_g.select("#" + self._circlesOverviewPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", true);
		self._stateGraph_detail_g.select("#" + self._circlesPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", true);
		if(!already_tip) {
			var mark = compareGraph.mouseoverNodeInStateGraph(node_id, self.name);
			if(mark === false) {
				//if there is no corresponding nodes in compareGraph
				var nodes = findParentNodesDoTau(n);
				var correspondingNodesID = nodes.corresponding;
				var notCorrespondingNodesID = nodes.notCorresponding;
				self._stateGraph_overview_g.selectAll(".circle")
					.classed("semifocus-highlight", function(n) {
						if(notCorrespondingNodesID[n.id] === true) {
							return true;
						}
						return false;
					});
				self._stateGraph_detail_g.selectAll(".circle")
					.classed("semifocus-highlight", function(n) {
						if(notCorrespondingNodesID[n.id] === true) {
							return true;
						}
						return false;
					});
				self._stateGraph_overview_g.selectAll(".circle")
					.classed("otherfocus-highlight", function(n) {
						if(correspondingNodesID[n.id] === true) {
							return true;
						}
						return false;
					});
				self._stateGraph_detail_g.selectAll(".circle")
					.classed("otherfocus-highlight", function(n) {
						if(correspondingNodesID[n.id] === true) {
							return true;
						}
						return false;
					});
			}
			self._tip.html(function() {
				return "<b>CCS definition: </b><font color=\"#FF6347\">" 
					+ n.id 
					+ "</font><br><b>the minimum actions from the initial state: </b><font color=\"#FF6347\">"
					+ n.mindepth 
					+ "</font>   <b>maximum actions: </b><font color=\"#FF6347\">" 
					+ n.maxdepth 
					+ "</font>";
			});
			self._tip.show();
			self._tip.hide();
		}

		function findParentNodesDoTau(node) {
			var tauNodes = [];
			var rootNodes = [];
			var mark = [];
			var queue = [];
			mark[node.id] = true;
			queue.push(node);
			while(queue.length != 0) {
				var n = queue.shift();
				for(var i = 0; i < n.in.length; i++) {
					if(ifTauAction(n.in[i].action) === true) {
						if(!mark[n.in[i].state.id]) {
							if(compareGraph.ifDrawedInCompareGraph(n.in[i].state.id, self.name)) {
								rootNodes[n.in[i].state.id] = true;
								mark[n.in[i].state.id] = true;
							}
							else {
								tauNodes[n.in[i].state.id] = true;
								mark[n.in[i].state.id] = true;
								queue.push(n.in[i].state);
							}
						}
					}
				}
			}
			return {corresponding: rootNodes, notCorresponding: tauNodes};
		}

		function ifTauAction(action) {
			if(action.substring(0, 5) == "input" || action.substring(0, 6) == "output") {
				return false;
			}
			return true;
		}
	},
	mouseoutNode: function(node_id, already_tip) {
		//鼠标移开事件
		var self = this;
		self._stateGraph_overview_g.select("#" + self._circlesOverviewPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", false);
		self._stateGraph_detail_g.select("#" + self._circlesPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", false);
		if(!already_tip) {
			compareGraph.mouseoutNodeInStateGraph(node_id, self.name);
			self._stateGraph_overview_g.selectAll(".semifocus-highlight")
				.classed("semifocus-highlight", false);
			self._stateGraph_detail_g.selectAll(".semifocus-highlight")
				.classed("semifocus-highlight", false);
			self._stateGraph_overview_g.selectAll(".otherfocus-highlight")
				.classed("otherfocus-highlight", false);
			self._stateGraph_detail_g.selectAll(".otherfocus-highlight")
				.classed("otherfocus-highlight", false);
			self._tip.hide();
		}
	},
	_mouseoverLink: function(l) {
		//鼠标悬浮边事件
		var self = this;
		self._tip.html(function() {
			return "<b>action: </b><font color=\"#FF6347\">" 
				+ d3.select(l).attr("action")
				+ "</font>";
		});
		self._tip.show();
	},
	_mouseoutLink: function(l) {
		//鼠标移开事件
		var self = this;
		self._tip.hide();
	},
	hideText: function() {
		//隐藏action避免过于凌乱
		var self = this;
		self._stateGraph_detail_g.selectAll(".action")
			.classed("action-hidden", true);
	},
	showText: function() {
		//显示action
		var self = this;
		self._stateGraph_detail_g.selectAll(".action")
			.classed("action-hidden", false);
	},
	addUpperLevelToShow: function() {
		//增加上层的显示层数
		var self = this;
		self.numOfParentLevel++;
		self._renderView(self.nodeNow);
	},
	minusUpperLevelToShow: function() {
		//增加上层的显示层数
		var self = this;
		if(self.numOfParentLevel > 1) {
			self.numOfParentLevel--;
			self._renderView(self.nodeNow);
		}
	},
	addLowerLevelToShow: function() {
		//增加上层的显示层数
		var self = this;
		self.numOfChildrenLevel++;
		self._renderView(self.nodeNow);
	},
	minusLowerLevelToShow: function() {
		//增加上层的显示层数
		var self = this;
		if(self.numOfChildrenLevel > 1) {
			self.numOfChildrenLevel--;
			self._renderView(self.nodeNow);
		}
	},
	playAnimation: function(index, delay, duration, ifFromPast) {
		var self = this;
		var overviewLineID;
		//var detailLineID;
		if(ifFromPast === false) {
			overviewLineID = self._linesRootOverviewPrefix 
				+ self._fixTheSelectProblem(self.fromRootShortest[index].id);
			/*detailLineID = self._linesPrefix
				+ self._fixTheSelectProblem(self.fromRootShortest[index].id);*/
		}
		else if(ifFromPast === true) {
			overviewLineID = self._linesPastOverviewPrefix
				+ self._fixTheSelectProblem(self.fromPastShortest[index].id);
			/*detailLineID = self._linesPrefix
				+ self._fixTheSelectProblem(self.fromPastShortest[index].id);*/
		}
		var overviewLineObject = self._stateGraph_overview_g.select("#" + overviewLineID);
		//var detailLineObject = d3.select("#" + detailLineID);
		var oldOverviewClass = overviewLineObject.attr("class");
		self._stateGraph_overview_g.select("#" + overviewLineID)
			.transition()
			.delay(delay)
			.duration(duration)
			.attr("class", oldOverviewClass + " process-animation")
			.transition()
			.delay(delay + duration)
			.attr("class", oldOverviewClass);
		/*if(detailLineObject[0] != null) {
			console.log(detailLineObject);
			var oldDetailClass = detailLineObject.attr("class");
			d3.select("#" + detailLineID)
				.transition()
				.delay(delay)
				.duration(duration)
				.attr("class", oldDetailClass + " process-animation")
				.transition()
				.delay(delay + duration)
				.attr("class", oldDetailClass);
		}*/
	},
	outstandingFullBuffer: function(actionListIndex) {
		var self = this;
		var fullBufferNodes = self._stateGraph_overview_g.selectAll(".circle")
			.filter(function(n) {
				var out_l = n.out.length;
				for(var i = 0; i < out_l; i++) {
					if(actionListIndex[n.out[i].action] === true) {
						return true;
					}
				}
				return false;
			});
		var emptyBufferNodes =  self._stateGraph_overview_g.selectAll(".circle")
			.filter(function(n) {
				var out_l = n.out.length;
				for(var i = 0; i < out_l; i++) {
					if(actionListIndex[n.out[i].action] === true) {
						return false;
					}
				}
				return true;
			});
		self._stateGraph_overview_g.selectAll("path")
			.classed("BufferLine", true);
		fullBufferNodes.classed("fullBufferNode", true);
		emptyBufferNodes.classed("emptyBufferNode", true);
	},
	restoreFullBuffer: function() {
		var self = this;
		self._stateGraph_overview_g.selectAll("path")
			.classed("BufferLine", false);
		self._stateGraph_overview_g.selectAll(".circle")
			.classed("fullBufferNode", false);
		self._stateGraph_overview_g.selectAll(".circle")
			.classed("emptyBufferNode", false);
	},
	_drawDepartLine: function() {
		var self = this;
		var height = $("#" + self.stateGraphOverviewDivid).height();
		var width = $("#" + self.stateGraphOverviewDivid).width();
		self._stateGraph_overview_svg.append("line")
			.attr("class", "dash-segmentation-Line")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", height);
		self._stateGraph_overview_svg.append("line")
			.attr("class", "dash-segmentation-Line")
			.attr("x1", width)
			.attr("y1", 0)
			.attr("x2", width)
			.attr("y2", height);
	},
	drawNoTauLinksInOverview: function(links) {
		var self = this;
		var diagonal = d3.svg.diagonal();
		var Lines = self._stateGraph_overview_g.selectAll(".NoTauLinks")
			.data(links);
		Lines.enter()
			.append("path")
			.attr("id", function(l) {
				return self.noTauLinesPrefix 
					+ self._fixTheSelectProblem(l.source + "To" + l.target);
			})
			.attr("class", "NoTauLinks")
			.attr("action", function(l) {
				return l.action;
			})
			.attr("d", computeWidthOfNoTauLineInOverview);

		function computeWidthOfNoTauLineInOverview (l_id) {
			var l = {};
			l.source = self._idToNode[l_id.source];
			l.target = self._idToNode[l_id.target];
			var line_source = {x: l.source.overview_x, y: l.source.overview_y};
			var line_target = {x: l.target.overview_x, y: l.target.overview_y};
			var line2_source = line_target;
			var line2_target = {x: l.source.overview_x, y: l.source.overview_y};
			var tmp_x = line_target.x - line_source.x;
			var tmp_y = line_target.y - line_source.y;
			var tmp_m = Math.sqrt(tmp_y * tmp_y + tmp_x * tmp_x);
			line_source.x -= tmp_y * 2 / tmp_m;
			line_source.y += tmp_x * 2 / tmp_m;
			line2_target.x += tmp_y * 2 / tmp_m;
			line2_target.y -= tmp_x * 2 / tmp_m;
			var d1 = diagonal({source: line_source, target: line_target});
			var d2 = diagonal({source: line2_source, target: line2_target});
			var final = d1 + d2.substring(d2.indexOf('C')) + 'Z';
			return final;
		}
	},
	clear: function() {
		var self = this;
		d3.select("#" + self.stateGraphDivID)
			.selectAll("div")
			.remove();
	}
}

var stateGraph1 = Object.create(stateGraph);
var stateGraph2 = Object.create(stateGraph);