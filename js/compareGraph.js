var compareGraph = {
	dfd1Root: undefined,
	dfd2Root: undefined,
	newDfd1Root: undefined,
	newDfd2Root: undefined,
	mergedRoot: undefined,
	mergedDict: undefined,
	dictCircle: undefined,
	links: undefined,
	Dfd1Links: undefined,
	Dfd2Links: undefined,
	blocks1: undefined,
	blocks1Dict: undefined,
	blocks2: undefined,
	blocks2Dict: undefined,
	matrix: undefined,
	compareGraphDivID: undefined,
	compareGraphSvgID: undefined,
	compareGraphSvgG: undefined,
	nodePrefix: "compare-node-",
	circlePrefix: "compare-circle-",
	linkPrefix: "compare-line-",
	_tip: d3.tip().attr("class", "d3-tip"),

	_changedMergedRoot: undefined,
	_nodeOfminDepth: [],
	_maxMinDepth: 0,
	maxDepth:undefined,
	_idToNode: undefined,
	_overview_nodes: undefined,
	_maxWidth: 0,
	compareGraphDetailDivID: undefined,
	compareGraphOverviewDivID: undefined,
	compareGraphToolbarDivID: undefined,
	_compareGraphDetailSvgG: undefined,
	_compareGraphOverviewSvgG: undefined,
	numOfParentLevel: 2,
	numOfChildrenLevel: 3,
	nodeNow: undefined,
	nodePast: undefined,
	nodesNow: undefined,
	nodesPast: undefined,
	fromRootShortest: undefined,
	fromPastShortest: undefined,
	_leftOverviewInterval: 20,
	_leftDetailInterval: 10,
	_border: 20,
	_interval: 20,
	_overview_r: 0,
	rectlength: 8,
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

	initialize: function (divID) {
		var self = this;
		var tmpDfd1Object;
		var tmpDfd2Object;
		var tmpMergedObject;
		var tmpBlock1Object;
		var tmpBlock2Object;
		var tmpLinksObject;
		if(self.dfd1Root === undefined || self.dfd2Root === undefined) {
			return null;
		}
		initializeVariables();
		self.compareGraphDivID = divID;
		self.compareGraphDetailDivID = divID + "-detail";
		self.compareGraphOverviewDivID = divID + "-overview";
		self.compareGraphToolbarDivID = divID + "-toolbar";
		d3.select("#" + self.compareGraphDivID)
			.append("div")
			.attr("id", self.compareGraphToolbarDivID)
			.attr("class", "compareGraphToolbarDiv");
		var graphDiv = d3.select("#" + self.compareGraphDivID)
			.append("div")
			.attr("class", "compareGraphDiv");
		self._compareGraphOverviewSvgG = graphDiv.append("div")
			.attr("id", self.compareGraphOverviewDivID)
			.attr("class", "compareGraphOverviewDiv")
			.append("svg")
			.attr("class", "fullSvg")
			.append("g")
			.attr("transform", "translate(" + self._leftOverviewInterval + "," + self._border + ")");
		self._compareGraphDetailSvgG = graphDiv.append("div")
			.attr("id", self.compareGraphDetailDivID)
			.attr("class", "compareGraphDetailDiv")
			.append("svg")
			.attr("class", "fullSvg")
			.append("g")
			.attr("transform", "translate(" + self._leftDetailInterval + ",0)");
		self._compareGraphOverviewSvgG.call(self._tip);
		tmpDfd1Object = self._constructNewGraph(self.dfd1Root);
		tmpDfd2Object = self._constructNewGraph(self.dfd2Root);
		self.newDfd1Root = tmpDfd1Object.Root;
		self.newDfd2Root = tmpDfd2Object.Root;
		self.Dfd1Links = tmpDfd1Object.links;
		self.Dfd2Links = tmpDfd2Object.links;
		tmpMergedObject = self._constructMergedGraph(self.newDfd1Root, self.newDfd2Root);
		self.mergedRoot = tmpMergedObject.root;
		self.mergedDict = tmpMergedObject.dict;
		self._idToNode = self.mergedDict;
		/*node-link-form*/
		self._changedMergedRoot = self._changeIntoSGDataStructure(self.mergedRoot);
		console.log(self._changedMergedRoot);
		/*node-link-form*/

		/*tmpLinksObject = self._constructLinks(self.mergedRoot);
		self.links = tmpLinksObject.links;
		self.dictCircle = tmpLinksObject.dict;
		tmpBlock1Object = self._constructBlocks(self.newDfd1Root);
		tmpBlock2Object = self._constructBlocks(self.newDfd2Root);
		self.blocks1 = tmpBlock1Object.blocks;
		self.blocks1Dict = tmpBlock1Object.blocksDict;
		self.blocks2 = tmpBlock2Object.blocks;
		self.blocks2Dict = tmpBlock2Object.blocksDict;
		self.matrix = self._constructMatrix(self.blocks1, self.blocks2, self.mergedDict, self.dictCircle);*/
		retract();//缩进页面
		self._computeNodesPositionInOverview();
		self.showLevelsOfStategraph(0, 0);
		/*self._renderView(
			self.compareGraphDivID,
			self.compareGraphSvgG,
			self.matrix,
			self.blocks1Dict,
			self.blocks2Dict,
			self.links);*/
		self.letStateGraphDrawNoTauLinks(self.Dfd1Links, self.Dfd2Links);


		function initializeVariables() {
			self._nodeOfminDepth = [];
			self._maxMinDepth = 0;
			self.maxDepth = undefined;
			self._maxWidth = 0;
			self.nodeNow = undefined;
			self.nodePast = undefined;
			self.nodesNow = undefined;
			self.nodesPast = undefined;
			self.fromRootShortest = undefined;
			self.fromPastShortest = undefined;
		}
	},
	addStateGraph: function (root, graphNumber) {
		var self = this;
		if(graphNumber === 1) {
			self.dfd1Root = root;
		}
		else if(graphNumber === 2) {
			self.dfd2Root = root;
		}
	},
	_constructNewGraph: function (dfdRoot) {
		var self = this;
		var queue = [];
		var links = [];
		var ccsDict = [];
		var newRoot = {};
		newRoot.id = dfdRoot.id;
		newRoot.actionList = [];
		newRoot.actionDict = [];
		ccsDict[newRoot.id] = newRoot;
		for(var i = 0; i < dfdRoot.out.length; i++) {
			var objectInQueue = {};
			dfdRoot.out[i].state.pastParents = [];
			dfdRoot.out[i].state.pastParents[newRoot.id] = true;
			objectInQueue.action = dfdRoot.out[i].action;
			objectInQueue.parent = newRoot;
			objectInQueue.child = dfdRoot.out[i].state;
			queue.push(objectInQueue);
		}
		while(queue.length != 0) {
			var head = queue.shift();
			if(head.action.substring(0, 5) == "input" || head.action.substring(0, 6) == "output") {
				if(ccsDict[head.child.id]) {
					var childObject = ccsDict[head.child.id];
					if(head.parent.actionDict[head.action]) {
						var array = head.parent.actionDict[head.action];
						var ifExisted = false;
						for(var i = 0; i < array.length; i++) {
							if(array[i].id === childObject.id) {
								ifExisted = true;
								break;
							}
						}
						if(ifExisted === false) {
							var link = {};
							link.source = head.parent.id;
							link.target = childObject.id;
							link.action = head.action;
							links.push(link);
							head.parent.actionDict[head.action].push(childObject);
						}
					}
					else {
						var link = {};
						link.source = head.parent.id;
						link.target = childObject.id;
						link.action = head.action;
						links.push(link);
						head.parent.actionList.push(head.action);
						head.parent.actionDict[head.action] = [];
						head.parent.actionDict[head.action].push(childObject);
					}
				}
				else {
					var ccsObject = {};
					ccsObject.id = head.child.id;
					ccsObject.actionList = [];
					ccsObject.actionDict = [];
					if(head.parent.actionDict[head.action]) {
						var link = {};
						link.source = head.parent.id;
						link.target = ccsObject.id;
						link.action = head.action;
						links.push(link);
						head.parent.actionDict[head.action].push(ccsObject);
					}
					else {
						var link = {};
						link.source = head.parent.id;
						link.target = ccsObject.id;
						link.action = head.action;
						links.push(link);
						head.parent.actionList.push(head.action);
						head.parent.actionDict[head.action] = [];
						head.parent.actionDict[head.action].push(ccsObject);
					}
					ccsDict[ccsObject.id] = ccsObject;
					for(var i = 0; i < head.child.out.length; i++) {
						var objectInQueue = {};
						if(head.child.out[i].state.pastParents) {
							head.child.out[i].state.pastParents[ccsObject.id] = true;
						}
						else {
							head.child.out[i].state.pastParents = [];
							head.child.out[i].state.pastParents[ccsObject.id] = true;
						}
						objectInQueue.action = head.child.out[i].action;
						objectInQueue.parent = ccsObject;
						objectInQueue.child = head.child.out[i].state;
						queue.push(objectInQueue);
					}
				}
			}
			else {
				//action === tau
				for(var i = 0; i < head.child.out.length; i++) {
					var objectInQueue = {};
					if(head.child.out[i].state.pastParents) {
						if(head.child.out[i].state.pastParents[head.parent.id] === true) {
							continue;
						}
						head.child.out[i].state.pastParents[head.parent.id] = true;
					}
					else {
						head.child.out[i].state.pastParents = [];
						head.child.out[i].state.pastParents[head.parent.id] = true;
					}
					objectInQueue.action = head.child.out[i].action;
					objectInQueue.parent = head.parent;
					objectInQueue.child = head.child.out[i].state;
					queue.push(objectInQueue);
				}
			}
		}
		return {Root: newRoot, links: links};
	},
	/*_simplifiedGraph: function () {

	},*/
	_constructMergedGraph: function(newDfd1Root, newDfd2Root) {
		var self = this;
		var mergedRoot = null;
		var pairOfCcsDict = [];
		if(self._ifEqual(newDfd1Root, newDfd2Root) === true) {
			mergedRoot = mergeRecursively(newDfd1Root, newDfd2Root);
		}
		return {root: mergedRoot, dict: pairOfCcsDict};

		function mergeRecursively(node1, node2) {
			var mergedObject = {};
			var mark = false;
			mergedObject.id = node1.id + "To" + node2.id;
			mergedObject.CCSid1 = node1.id;
			mergedObject.CCSid2 = node2.id;
			mergedObject.commonActionList = [];
			mergedObject.commonActionDict = [];
			mergedObject.maxdepth = undefined;
			mergedObject.mindepth = undefined;
			mergedObject.out = [];
			mergedObject.in = [];

			for(var i = 0; i < node1.actionList.length; i++) {
				mergedObject.commonActionList.push(node1.actionList[i]);
				mergedObject.commonActionDict[node1.actionList[i]] = {};
				mergedObject.commonActionDict[node1.actionList[i]].count = 0;
				mergedObject.commonActionDict[node1.actionList[i]].developList = [];
			}
			pairOfCcsDict[mergedObject.id] = mergedObject;
			for(var i = 0; i < mergedObject.commonActionList.length; i++) {
				var action = mergedObject.commonActionList[i];
				var devList1 = node1.actionDict[mergedObject.commonActionList[i]];
				var devList2 = node2.actionDict[mergedObject.commonActionList[i]];
				var nodes = searchBalancedActionsNodes(devList1, devList2);
				var list1ToCheck = [];
				var list2ToCheck = [];
				if(nodes != false) {
					for(var j = 0; j < nodes.length; j++) {
						mergedObject.commonActionDict[action].count++;
						var nextNode1 = nodes[j].node1;
						var nextNode2 = nodes[j].node2;
						if(pairOfCcsDict[nextNode1.id + "To" + nextNode2.id]) {
							var tmp = pairOfCcsDict[nextNode1.id + "To" + nextNode2.id];
							mergedObject.commonActionDict[action].developList.push(tmp);
							//construct out and in array
							var outObject = {};
							outObject.action = action;
							outObject.state = tmp;
							mergedObject.out.push(outObject);
							var inObject = {};
							inObject.action = action;
							inObject.state = mergedObject;
							tmp.in.push(inObject);

							if(tmp.ifBalance === 0) {
								mergedObject.commonActionDict[action].count--;
							}
							else {
								list1ToCheck[nextNode1.id] = true;
								list2ToCheck[nextNode2.id] = true;
							}
						}
						else {
							var nextMergedObject = mergeRecursively(nextNode1, nextNode2);
							if(nextMergedObject.ifBalance === 0) {
								mergedObject.commonActionDict[action].count--;
							}
							else {
								list1ToCheck[nextNode1.id] = true;
								list2ToCheck[nextNode2.id] = true;
							}
							mergedObject.commonActionDict[action].developList.push(nextMergedObject);
							//construct out and in array
							var outObject = {};
							outObject.action = action;
							outObject.state = nextMergedObject;
							mergedObject.out.push(outObject);
							var inObject = {};
							inObject.action = action;
							inObject.state = mergedObject;
							nextMergedObject.in.push(inObject);
						}
					}
				}
				else {
					mergedObject.ifStop = true;
					mergedObject.commonActionDict[action].count = -1;
					mergedObject.commonActionDict[action].developList = [];
					mergedObject.out = [];
					mark = true;
					break;
				}
				/*if(mergedObject.commonActionDict[action].count === 0) {
					mark = true;
				}*/
				for(var x = 0; x < devList1.length; x++) {
					if(list1ToCheck[devList1[x].id] != true) {
						mark = true;
						break;
					}
				}
				for(var x = 0; x < devList2.length; x++) {
					if(list2ToCheck[devList2[x].id] != true) {
						mark = true;
						break;
					}
				}
			}
			if(mark === true) {
				mergedObject.ifBalance = 0;
			}
			else {
				mergedObject.ifBalance = 1;
			}
			return mergedObject;
		}

		function searchBalancedActionsNodes(list1, list2) {
			var list1Mark = [];
			var list2Mark = [];
			var nodes = [];
			for(var i = 0; i < list1.length; i++) {
				for(var j = 0; j < list2.length; j++) {
					var nodesObject = {};
					if(self._ifEqual(list1[i], list2[j]) === false) {
						continue;
					}
					list1Mark[list1[i].id] = true;
					list2Mark[list2[j].id] = true;
					nodesObject.node1 = list1[i];
					nodesObject.node2 = list2[j];
					nodes.push(nodesObject);
				}
			}
			for(var i = 0; i < list1.length; i++) {
				if(list1Mark[list1[i].id] != true) {
					return false;
				}
			}
			for(var i = 0; i < list2.length; i++) {
				if(list2Mark[list2[i].id] != true) {
					return false;
				}
			}
			return nodes;
		}
	},
	_ifEqual: function (object1, object2) {
		var self = this;
		var actions1 = object1.actionList;
		var actions2 = object2.actionList;
		if(actions1.length == actions2.length) {
			for(var k = 0; k < actions1.length; k++) {
				if(!object2.actionDict[actions1[k]]) {
					return false;
				}
			}
		}
		else {
			return false;
		}
		return true;
	},
	_changeIntoSGDataStructure: function(mergedRoot) {
		var self = this;
		var idpath = [];
		idpath[mergedRoot.id] = true;
		self.maxDepth = 0;
		mergedRoot.maxdepth = 0;
		_calculateMaxDepthForNodes(mergedRoot, idpath, 1);
		for(var i = 0; i < self.maxDepth + 1; i++) {
			self._nodeOfminDepth[i] = [];
		}
		_calculateMinDepthForNodes();
		return mergedRoot;

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
			queue.push(mergedRoot);
			mergedRoot.mindepth = 0;
			ifPushed[mergedRoot.id] = true;
			self._nodeOfminDepth[0].push(mergedRoot.id);
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
		var x_r = (($("#" + self.compareGraphOverviewDivID).width() - self._leftOverviewInterval)
			/ self._maxWidth - 1) / 2;
		var y_r = (($("#" + self.compareGraphOverviewDivID).height() - 2 * self._border)
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
		height_interval = ($("#" + self.compareGraphOverviewDivID).height() - 2 * self._border) 
							/ self._maxMinDepth - 2 * r;
		for(var i = 0; i <= self._maxMinDepth; i++) {
			var l = self._nodeOfminDepth[i].length;
			var width_interval = ($("#" + self.compareGraphOverviewDivID).width() - self._leftOverviewInterval)
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
	showLevelsOfStategraph: function(level, index) {
		//根据参数level显示相应部分状态图，level为null则默认为最高的几层
		var self = this;
		if(self._nodeOfminDepth[level].length - 1 < index) {
			console.log("level unavailable", level, index, self._nodeOfminDepth[level]);
			return undefined;
		}
		self._renderNodeLinkView(self._nodeOfminDepth[level][index]);
	},
	_renderNodeLinkView: function(node_id) {
		//根据选定节点，渲染View
		var self = this;
		//var ifProcessGraph = false;
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
		//var transitionMark;
		var overviewRootShortest = [];
		var overviewPastShortest = [];
		_selectNodesToShow();
		_computeNodesPosition();
		x_linear_detail.domain([smallest_x, largest_x]);
		y_linear_detail.domain([smallest_y, largest_y]);
		_drawRoute();	
		_drawCompareGraphDetail();
		_drawCompareGraphOverview();

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
			var total_height = $("#" + self.compareGraphDetailDivID).height();
			var total_width = $("#" + self.compareGraphDetailDivID).width();
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
		function _drawCompareGraphDetail() {
			//作图detail
			transitionMark = false;
			var lines = self._compareGraphDetailSvgG.selectAll(".line")
				.data(links, function(l) {
					return l.id;
				});
			lines.exit()
				.remove();			
			var nodesCircle = nodes.filter(function(n) {
				if(n.ifBalance === 1) {
					return true;
				}
				return false;
			});
			var nodesRect = nodes.filter(function(n) {
				if(n.ifStop === true) {
					return true;
				}
				return false;
			});
			var nodesTri = nodes.filter(function(n) {
				if(n.ifBalance === 0 && !n.ifStop) {
					return true;
				}
				return false;
			});
			var circles = self._compareGraphDetailSvgG.selectAll(".circle")
				.data(nodesCircle, function(n) {
					return n.id;
				});
			var rectangles = self._compareGraphDetailSvgG.selectAll(".rect")
				.data(nodesRect, function(n) {
					return n.id;
				});
			var triangles = self._compareGraphDetailSvgG.selectAll(".triangle")
				.data(nodesTri, function(n) {
					return n.id;
				});
			circles.exit()
				.remove();
			rectangles.exit()
				.remove();
			triangles.exit()
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
					return classStr;
				})
				.attr("cx", function(n) {
					return x_linear_detail(n.x);
				})
				.attr("cy", function(n) {
					return y_linear_detail(n.y);
				});
			rectangles.transition()
				.delay(300)
				.duration(800)
				.attr("class", function(n) {
					transitionMark = true;
					var l1 = n.class.length;
					var classStr = "rect";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				})
				.attr("x", function(n) {
					return x_linear_detail(n.x) - self.rectlength / 2;
				})
				.attr("y", function(n) {
					return y_linear_detail(n.y) - self.rectlength / 2;
				})
				.attr("width", self.rectlength)
				.attr("height", self.rectlength);
			triangles.transition()
				.delay(300)
				.duration(800)
				.attr("class", function(n) {
					transitionMark = true;
					var l1 = n.class.length;
					var classStr = "triangle";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				})
				.attr("points", function(n) {
					var centerX = x_linear_detail(n.x);
					var centerY = y_linear_detail(n.y);
					var point1X = centerX;
					var point1Y = centerY - self.rectlength;
					var point2X = centerX - self.rectlength / 2 * 1.7;
					var point2Y = centerY + self.rectlength / 2;
					var point3X = centerX + self.rectlength / 2 * 1.7;
					var point3Y = centerY + self.rectlength / 2;
					return point1X + "," + point1Y + " " 
						+ point2X + "," + point2Y + " " 
						+ point3X + "," + point3Y;
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
					self._compareGraphOverviewSvgG.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._compareGraphOverviewSvgG.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
					self._mouseoverLink(this);
				})
				.on("mouseout", function(l) {
					self._compareGraphOverviewSvgG.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._compareGraphOverviewSvgG.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
					d3.select(this).classed("focus-highlight", false);
					self._mouseoutLink(this);
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
					//self._renderNodeLinkView(n.id);
				})
				.on("mouseover", function(n) {
					//self._mouseoverNode(n.id);
				})
				.on("mouseout", function(n) {
					//self._mouseoutNode(n.id);
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
					return classStr;
				});
			rectangles.enter()
				.append("rect")
				.attr("id", function(n) {
					return self._circlesPrefix + self._fixTheSelectProblem(n.id);
				})
				.attr("x", function(n) {
					return x_linear_detail(n.x) - self.rectlength / 2;
				})
				.attr("y", function(n) {
					return y_linear_detail(n.y) - self.rectlength / 2;
				})
				.attr("width", self.rectlength)
				.attr("height", self.rectlength)
				.on("click", function(n) {
					//self._renderNodeLinkView(n.id);
				})
				.on("mouseover", function(n) {
					//self._mouseoverNode(n.id);
				})
				.on("mouseout", function(n) {
					//self._mouseoutNode(n.id);
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
					var classStr = "rect";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				});
			triangles.enter()
				.append("polygon")
				.attr("id", function(n) {
					return self._circlesPrefix + self._fixTheSelectProblem(n.id);
				})
				.attr("points", function(n) {
					var centerX = x_linear_detail(n.x);
					var centerY = y_linear_detail(n.y);
					var point1X = centerX;
					var point1Y = centerY - self.rectlength;
					var point2X = centerX - self.rectlength / 2 * 1.7;
					var point2Y = centerY + self.rectlength / 2;
					var point3X = centerX + self.rectlength / 2 * 1.7;
					var point3Y = centerY + self.rectlength / 2;
					return point1X + "," + point1Y + " " 
						+ point2X + "," + point2Y + " " 
						+ point3X + "," + point3Y;
				})
				.on("click", function(n) {
					//self._renderNodeLinkView(n.id);
				})
				.on("mouseover", function(n) {
					//self._mouseoverNode(n.id);
				})
				.on("mouseout", function(n) {
					//self._mouseoutNode(n.id);
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
					var classStr = "triangle";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
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
			var actions = self._compareGraphDetailSvgG.selectAll(".action")
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
		function _drawCompareGraphOverview() {
			//作图overview
			var nodesCircle = self._overview_nodes.filter(function(n) {
				if(n.ifBalance === 1) {
					return true;
				}
				return false;
			});
			var circles = self._compareGraphOverviewSvgG.selectAll(".circle")
				.data(nodesCircle, function(n) {
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
						return classStr;
					}
					else {
						var classStr = "circle undrawedNode";
						return classStr;
					}
				})
				.on("click", function(n) {
					self._renderNodeLinkView(n.id);
				})
				.on("mouseover", function(n) {
					self._mouseoverNode(n.id);
				})
				.on("mouseout", function(n) {
					self._mouseoutNode(n.id);
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
						return classStr;
					}
					else if(self.nodePast != n.id) {
						var classStr = "circle undrawedNode";
						return classStr;
					}
					else {
						var classStr = "circle pastNode undrawedNode";
						return classStr;
					}
				});
			var nodesRect = self._overview_nodes.filter(function(n) {
				if(n.ifStop === true) {
					return true;
				}
				return false;
			});
			var rectangles = self._compareGraphOverviewSvgG.selectAll(".rect")
				.data(nodesRect, function(n) {
					return n.id;
				});
			rectangles.exit()
				.remove();
			rectangles.enter()
				.append("rect")
				.attr("id", function(n) {
					return self._circlesOverviewPrefix + self._fixTheSelectProblem(n.id);
				})
				.attr("x", function(n) {
					return n.overview_x - self.rectlength / 2;
				})
				.attr("y", function(n) {
					return n.overview_y - self.rectlength / 2;
				})
				.attr("width", self.rectlength)
				.attr("height", self.rectlength)
				.on("click", function(n) {
					//self._renderNodeLinkView(n.id);
				})
				.on("mouseover", function(n) {
					//self._mouseoverNode(n.id);
				})
				.on("mouseout", function(n) {
					//self._mouseoutNode(n.id);
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
					var classStr = "rect";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				});
			rectangles.transition()
				.delay(300)
				.duration(800)
				.attr("class", function(n) {
					transitionMark = true;
					var l1 = n.class.length;
					var classStr = "rect";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				});
			var nodesTri = self._overview_nodes.filter(function(n) {
				if(n.ifBalance === 0 && !n.ifStop) {
					return true;
				}
				return false;
			});
			var triangles = self._compareGraphOverviewSvgG.selectAll(".triangle")
				.data(nodesTri, function(n) {
					return n.id;
				});
			triangles.exit()
				.remove();
			triangles.enter()
				.append("polygon")
				.attr("id", function(n) {
					return self._circlesOverviewPrefix + self._fixTheSelectProblem(n.id);
				})
				.attr("points", function(n) {
					var centerX = n.overview_x;
					var centerY = n.overview_y;
					var point1X = centerX;
					var point1Y = centerY - self.rectlength;
					var point2X = centerX - self.rectlength / 2 * 1.7;
					var point2Y = centerY + self.rectlength / 2;
					var point3X = centerX + self.rectlength / 2 * 1.7;
					var point3Y = centerY + self.rectlength / 2;
					return point1X + "," + point1Y + " " 
						+ point2X + "," + point2Y + " " 
						+ point3X + "," + point3Y;
				})
				.on("click", function(n) {
					//self._renderNodeLinkView(n.id);
				})
				.on("mouseover", function(n) {
					//self._mouseoverNode(n.id);
				})
				.on("mouseout", function(n) {
					//self._mouseoutNode(n.id);
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
					var classStr = "triangle";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				});
			triangles.transition()
				.delay(300)
				.duration(800)
				.attr("class", function(n) {
					transitionMark = true;
					var l1 = n.class.length;
					var classStr = "triangle";
					for(var i = 0; i < l1; i++) {
						classStr += (" " + n.class[i]);
					}
					return classStr;
				});
		}
		function _drawRoute() {
			if(!self.nodePast || (self.nodePast == self.nodeNow)) {
				return null;
			}
			self.fromRootShortest = [];
			self.fromPastShortest = [];
			if(node_id != self._changedMergedRoot.id) {
				self.fromRootShortest = _findShortestRoute(self._changedMergedRoot, node_id);
			}
			if(self.nodePast != self._changedMergedRoot.id) {
				self.fromPastShortest = _findShortestRoute(self._idToNode[self.nodePast], node_id);
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
					if(source.id == self._changedMergedRoot.id) {
						overviewRootShortest[line.id] = true;
					}
					else if(source.id == self.nodePast) {
						overviewPastShortest[line.id] = true;
					}
				}
				return lines;
			}

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
				var fromLines = self._compareGraphOverviewSvgG.selectAll("." + classname)
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
						self._compareGraphDetailSvgG.select("#" 
							+ self._linesPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._compareGraphOverviewSvgG.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._compareGraphOverviewSvgG.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", true);
						self._mouseoverLink(this);
					})
					.on("mouseout", function(l) {
						self._compareGraphDetailSvgG.select("#" 
							+ self._linesPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._compareGraphOverviewSvgG.select("#" 
							+ self._linesRootOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._compareGraphOverviewSvgG.select("#" 
							+ self._linesPastOverviewPrefix 
							+ self._fixTheSelectProblem(l.id))
							.classed("focus-highlight", false);
						self._mouseoutLink(this);
					})
			}
			function _setRouteVisibleOrNotInOverview() {
				if(self._ifRouteFromRootVisivle == true) {
					self._compareGraphOverviewSvgG.selectAll(".overviewRootLine")
						.style("visibility", "visible");
				}
				else {
					self._compareGraphOverviewSvgG.selectAll(".overviewRootLine")
						.style("visibility", "hidden");
				}
				if(self._ifRouteFromPastVisible == true) {
					self._compareGraphOverviewSvgG.selectAll(".overviewPastLine")
						.style("visibility", "visible");
				}
				else {
					self._compareGraphOverviewSvgG.selectAll(".overviewPastLine")
						.style("visibility", "hidden");
				}
			}
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
	_mouseoverNode: function(node_id) {
		//鼠标悬浮节点事件
		var self = this;
		var n = self._idToNode[node_id];
		self._compareGraphOverviewSvgG.select("#" + self._circlesOverviewPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", true);
		self._compareGraphDetailSvgG.select("#" + self._circlesPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", true);
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
	},
	_mouseoutNode: function(node_id) {
		//鼠标移开事件
		var self = this;
		self._compareGraphOverviewSvgG.select("#" + self._circlesOverviewPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", false);
		self._compareGraphDetailSvgG.select("#" + self._circlesPrefix + self._fixTheSelectProblem(node_id))
						.classed("focus-highlight", false);
		self._tip.hide();
	},
	hideText: function() {
		//隐藏action避免过于凌乱
		var self = this;
		self._compareGraphDetailSvgG.selectAll(".action")
			.classed("action-hidden", true);
	},
	showText: function() {
		//显示action
		var self = this;
		self._compareGraphDetailSvgG.selectAll(".action")
			.classed("action-hidden", false);
	},
	_constructLinks: function (mergedRoot) {
		var self = this;
		var links = [];
		var queue = [];
		var ifVisited = [];
		var dictForCircle = [];
		queue.push(mergedRoot);
		ifVisited[mergedRoot.id] = true;
		while(queue.length != 0) {
			var head = queue.shift();
			if(head.ifStop === true) {
				dictForCircle[head.id] = {class: " stopPoint"};
				continue;
			}
			for(var i = 0; i < head.commonActionList.length; i++) {
				var action = head.commonActionList[i];
				var nextList = head.commonActionDict[action].developList;
				for(var j = 0; j < nextList.length; j++) {
					var link = {};
					link.action = action;
					link.source = head;
					link.target = nextList[j];
					if(link.source.ifBalance === 1 && link.target.ifBalance === 1) {
						link.class = " majorLine";
					}
					else {
						link.class = " minorLine";
					}
					links.push(link);
					if(!dictForCircle[link.source.id]) {
						if(link.source.ifBalance === 1) {
							dictForCircle[link.source.id] = {class: " BalancedCircle"};
						}
						else {
							dictForCircle[link.source.id] = {class: " unBalancedCircle"};
						}
					}
					if(!dictForCircle[link.target.id]) {
						if(link.target.ifBalance === 1) {
							dictForCircle[link.target.id] = {class: " BalancedCircle"};
						}
						else {
							dictForCircle[link.target.id] = {class: " unBalancedCircle"};
						}
					}
					if(ifVisited[link.target.id] != true) {
						ifVisited[link.target.id] = true;
						queue.push(link.target);
					}
				}
			}
		}
		return {links: links, dict: dictForCircle};
	},
	_constructBlocks: function (Root) {
		var self = this;
		console.log(Root)
		var blocks = [];
		var blocksDict = [];
		var queue = [];
		var ifVisited = [];
		queue.push(Root);
		ifVisited[Root.id] = true;
		while(queue.length != 0) {
			var head = queue.shift();
			blocks.push(head);
			blocksDict[head.id] = blocks.length - 1;
			for(var i = 0; i < head.actionList.length; i++) {
				var action = head.actionList[i];
				var nextList = head.actionDict[action];
				for(var j = 0; j < nextList.length; j++) {
					if(ifVisited[nextList[j].id] != true) {
						queue.push(nextList[j]);
						ifVisited[nextList[j].id] = true;
					}
				}
			}
		}
		return {blocks: blocks, blocksDict: blocksDict};
	},
	_constructMatrix: function (blocks1, blocks2, mergedDict, dictCircle) {
		var self = this;
		var matrix = [];
		matrix.length = blocks2.length + 1;
		for(var i = 0; i < matrix.length; i++) {
			matrix[i] = [];
			matrix[i].length = blocks1.length + 1;
			if(i != 0) {
				matrix[i][0] = {};
				matrix[i][0].type = "node";
				matrix[i][0].node = blocks2[i - 1];
			}
		}
		for(var i = 1; i < matrix[0].length; i++) {
			matrix[0][i] = {};
			matrix[0][i].type = "node";
			matrix[0][i].node = blocks1[i - 1];
		}
		matrix[0][0] = {};
		matrix[0][0].type = "none";
		for(var i = 1; i < matrix.length; i++) {
			for(var j = 1; j < matrix[i].length; j++) {
				var mergedID = matrix[0][j].node.id + "To" + matrix[i][0].node.id;
				matrix[i][j] = {};
				if(dictCircle[mergedID]) {
					matrix[i][j].type = "circle";
					/*if(dictCircle[mergedID].ifBalance === 1) {
						matrix[i][j].class = " BalancedCircle";
					}
					else if{
						matrix[i][j].class = " unBalancedCircle";
					}*/
					matrix[i][j].class = dictCircle[mergedID].class;
					matrix[i][j].id = mergedID;
					matrix[i][j].CCSid1 = mergedDict[mergedID].CCSid1;
					matrix[i][j].CCSid2 = mergedDict[mergedID].CCSid2;
				}
				else {
					matrix[i][j].type = "square";
				}
			}
		}
		return matrix;
	},
	_renderView: function (divID, SvgG, matrix, blocks1Dict, blocks2Dict, links) {
		var self = this;
		var diagonal = d3.svg.diagonal();
		var marginPercentage = 0.1;
		var totalWidth = $("#" + divID).width() * (1 - marginPercentage);
		var totalHeight = $("#" + divID).height() * (1 - marginPercentage);
		var startPoint = {};
		var unitLength;
		unitLength = Math.min(totalHeight / matrix.length, totalWidth / matrix[0].length, 30);
		startPoint.x = ($("#" + divID).width() - unitLength * matrix[0].length) / 2;
		startPoint.y = ($("#" + divID).height() - unitLength * matrix.length) / 2;
		drawBackground(SvgG, matrix);
		drawLines(SvgG, blocks1Dict, blocks2Dict, links);

		function drawBackground (SvgG, matrix) {
			for(var i = 0; i < matrix.length; i++) {
				for(var j = 0; j < matrix[0].length; j++) {
					var toDrawObject = matrix[i][j];
					switch(toDrawObject.type) {
						case "none":
							break;
						case "node":
							SvgG.append("circle")
								.attr("id", function() {
									return self.nodePrefix 
										+ self._fixTheSelectProblem(toDrawObject.node.id);
								})
								.attr("cx", startPoint.x + (j + 0.5) * unitLength)
								.attr("cy", startPoint.y + (i + 0.5) * unitLength)
								.attr("ifTheTopOne", function() {
									if(i === 0) {
										return true;
									}
									else if(j === 0) {
										return false;
									}
								})
								.attr("CCS", toDrawObject.node.id)
								.attr("class", "compareNode")
								.on("mouseover", function() {
									self.mouseoverNode(this);
								})
								.on("mouseout", function() {
									self.mouseoutNode(this);
								});
							break;
						case "square":
							SvgG.append("rect")
								.attr("x", startPoint.x + j * unitLength)
								.attr("y", startPoint.y + i * unitLength)
								.attr("width", unitLength)
								.attr("height", unitLength)
								.attr("class", "compareSquare");
							break;
						case "circle":
							SvgG.append("circle")
								.attr("cx", startPoint.x + (j + 0.5) * unitLength)
								.attr("cy", startPoint.y + (i + 0.5) * unitLength)
								.attr("r", unitLength / 3)
								.attr("mergedCCS", toDrawObject.id)
								.attr("CCS1", toDrawObject.CCSid1)
								.attr("CCS2", toDrawObject.CCSid2)
								.attr("class", "compareCircle" + toDrawObject.class)
								.on("mouseover", function() {
									self.mouseoverCircle(this);
								})
								.on("mouseout", function() {
									self.mouseoutCircle(this);
								});
							break;
					}
				}
			}
		}
		function drawLines (SvgG, blocks1Dict, blocks2Dict, links) {
			var lines = SvgG.selectAll(".compareLine")
				.data(links);
			lines.enter()
				.append("path")
				.attr("action", function(l) {
					return l.action;
				})
				.attr("class", function(l) {
					return "compareLine" + l.class;
				})
				.attr("d", computeWidthOfLine)
				.on("mouseover", function(l) {
					self.mouseoverLine(this, l.action);
				})
				.on("mouseout", function(l) {
					self.mouseoutLine(this);
				});
		}
		function computeWidthOfLine(l) {
		 	var sourceIndex1 = blocks1Dict[l.source.CCSid1] + 1;
		 	var sourceIndex2 = blocks2Dict[l.source.CCSid2] + 1;
		 	var targetIndex1 = blocks1Dict[l.target.CCSid1] + 1;
		 	var targetIndex2 = blocks2Dict[l.target.CCSid2] + 1;
			var line_source = {x: startPoint.x + (sourceIndex1 + 0.5) * unitLength,
							y: startPoint.y + (sourceIndex2 + 0.5) * unitLength};
			var line_target = {x: startPoint.x + (targetIndex1 + 0.5) * unitLength,
							y: startPoint.y + (targetIndex2 + 0.5) * unitLength};
			var line2_source = line_target;
			var line2_target = {x: line_source.x, y: line_source.y};
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
			/*var final = 'M' + line_source.x + ' ' + line_source.y + ' L' + line_target.x + ' '
						+ line_target.y + ' L' + line2_target.x + ' ' + line2_target.y + ' Z';*/
			return final;
		}
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
	letStateGraphDrawNoTauLinks: function(Dfd1Links, Dfd2Links) {
		var self = this;
	//	stateGraph1.drawNoTauLinksInOverview(Dfd1Links);
	//	stateGraph2.drawNoTauLinksInOverview(Dfd2Links);
	},
	mouseoverCircle: function (n) {
		var self = this;
		var mergedID = d3.select(n).attr("mergedCCS");
		var CCS1 = d3.select(n).attr("CCS1");
		var CCS2 = d3.select(n).attr("CCS2");
		var canDo = "";
		var cannotDo = "";
		for(action in self.mergedDict[mergedID].commonActionDict) {
			var dict = self.mergedDict[mergedID].commonActionDict;
			if(dict[action].count === 0) {
				cannotDo = cannotDo + " " + action;
			}
			else {
				canDo = canDo + " " + action;
			}
		}
		self._tip.html(function() {
			return "<b>available actions: </b><font color=\"#FF6347\">" 
				+ canDo
				+ "</font><br><b>unavailable actions: </b><font color=\"#FF6347\">"
				+ cannotDo
				+ "</font>";
		});
		self._tip.show();
		stateGraph1.mouseoverNode(CCS1, true);
		stateGraph2.mouseoverNode(CCS2, true);
	},
	mouseoutCircle: function (n) {
		var self = this;
		var CCS1 = d3.select(n).attr("CCS1");
		var CCS2 = d3.select(n).attr("CCS2");
		self._tip.hide();
		stateGraph1.mouseoutNode(CCS1, true);
		stateGraph2.mouseoutNode(CCS2, true);
	},
	mouseoverLine: function(l, action) {
		var self = this;
		d3.select(l)
			.classed("focus-highlight", true);
		self._tip.html(function() {
			return "<b>action: </b><font color=\"#FF6347\">" + action + "</font>";
		});
		self._tip.show();
	},
	mouseoutLine: function(l) {
		var self = this;
		d3.select(l)
			.classed("focus-highlight", false);
		self._tip.hide();
	},
	mouseoverNode: function(n) {
		var self = this;
		var CCSid = d3.select(n).attr("CCS");
		var ifTheTopOne = d3.select(n).attr("ifTheTopOne");
		d3.select(n)
			.classed("focus-highlight", true);
		if(ifTheTopOne === "true") {
			stateGraph1.mouseoverNode(CCSid);
		}
		else {
			stateGraph2.mouseoverNode(CCSid);
		}
	},
	mouseoutNode: function(n) {
		var self = this;
		var CCSid = d3.select(n).attr("CCS");
		var ifTheTopOne = d3.select(n).attr("ifTheTopOne");
		d3.select(n)
			.classed("focus-highlight", false);
		if(ifTheTopOne === "true") {
			stateGraph1.mouseoutNode(CCSid);
		}
		else {
			stateGraph2.mouseoutNode(CCSid);
		}
	},
	mouseoverNodeFromStateGraph: function(id) {
		var self = this;
		/*self.compareGraphSvgG.select("#" + self.nodePrefix + self._fixTheSelectProblem(id))
			.classed("focus-highlight", true);*/
	},
	mouseoutNodeFromStateGraph: function(id) {
		var self = this;
		/*self.compareGraphSvgG.select("#" + self.nodePrefix + self._fixTheSelectProblem(id))
			.classed("focus-highlight", false);*/
	},
	clear: function () {
		var self = this;
		self.dfd1Root = undefined;
		self.dfd2Root = undefined;
		d3.select("#" + self.compareGraphSvgID)
			.selectAll("g")
			.remove();
	}
}