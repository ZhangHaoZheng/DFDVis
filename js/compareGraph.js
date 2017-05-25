var compareGraph = {
	dfd1Root: undefined,
	dfd2Root: undefined,
	newDfd1Root: undefined,
	newDfd2Root: undefined,
	mergedRoot: undefined,
	mergedDict: undefined,
	links: undefined,
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

	initialize: function (divID, svgID) {
		var self = this;
		var tmpMergedObject;
		var tmpBlock1Object;
		var tmpBlock2Object;
		if(self.dfd1Root === undefined || self.dfd2Root === undefined) {
			return null;
		}
		self.compareGraphDivID = divID;
		self.compareGraphSvgID = svgID;
		self.compareGraphSvgG = d3.select("#" + self.compareGraphSvgID)
			.append("g")
			.attr("id", self.compareGraphSvgID + "-g");
		self.compareGraphSvgG.call(self._tip);
		self.newDfd1Root = self._constructNewGraph(self.dfd1Root);
		self.newDfd2Root = self._constructNewGraph(self.dfd2Root);
		console.log(self.newDfd1Root)
		console.log(self.newDfd2Root)
		tmpMergedObject = self._constructMergedGraph(self.newDfd1Root, self.newDfd2Root);
		self.mergedRoot = tmpMergedObject.root;
		self.mergedDict = tmpMergedObject.dict;
		self.links = self._constructLinks(self.mergedRoot);
		tmpBlock1Object = self._constructBlocks(self.newDfd1Root);
		tmpBlock2Object = self._constructBlocks(self.newDfd2Root);
		self.blocks1 = tmpBlock1Object.blocks;
		self.blocks1Dict = tmpBlock1Object.blocksDict;
		self.blocks2 = tmpBlock2Object.blocks;
		self.blocks2Dict = tmpBlock2Object.blocksDict;
		self.matrix = self._constructMatrix(self.blocks1, self.blocks2, self.mergedDict);
		retract();//缩进页面
		self._renderView(
			self.compareGraphDivID,
			self.compareGraphSvgG,
			self.matrix,
			self.blocks1Dict,
			self.blocks2Dict,
			self.links);
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
							head.parent.actionDict[head.action].push(childObject);
						}
					}
					else {
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
						head.parent.actionDict[head.action].push(ccsObject);
					}
					else {
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
		return newRoot;
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
				if(nodes != false) {
					for(var j = 0; j < nodes.length; j++) {
						mergedObject.commonActionDict[action].count++;
						var nextNode1 = nodes[j].node1;
						var nextNode2 = nodes[j].node2;
						if(pairOfCcsDict[nextNode1.id + "To" + nextNode2.id]) {
							var tmp = pairOfCcsDict[nextNode1.id + "To" + nextNode2.id];
							mergedObject.commonActionDict[action].developList.push(tmp);
							if(tmp.ifBalance === 0) {
								mergedObject.commonActionDict[action].count--;
							}
						}
						else {
							var nextMergedObject = mergeRecursively(nextNode1, nextNode2);
							if(nextMergedObject.ifBalance === 0) {
								mergedObject.commonActionDict[action].count--;
							}
							mergedObject.commonActionDict[action].developList.push(nextMergedObject);
						}
					}
				}
				else {
					mergedObject.commonActionDict[action].count = 0;
					mergedObject.commonActionDict[action].developList = [];
					mark = true;
				}
				if(mergedObject.commonActionDict[action].count === 0) {
					mark = true;
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
	_constructLinks: function (mergedRoot) {
		var self = this;
		var links = [];
		var queue = [];
		var ifVisited = [];
		queue.push(mergedRoot);
		ifVisited[mergedRoot.id] = true;
		while(queue.length != 0) {
			var head = queue.shift();
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
					if(ifVisited[link.target.id] != true) {
						ifVisited[link.target.id] = true;
						queue.push(link.target);
					}
				}
			}
		}
		return links;
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
	_constructMatrix: function (blocks1, blocks2, mergedDict) {
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
				if(mergedDict[mergedID]) {
					matrix[i][j].type = "circle";
					if(mergedDict[mergedID].ifBalance === 1) {
						matrix[i][j].class = " BalancedCircle";
					}
					else {
						matrix[i][j].class = " unBalancedCircle";
					}
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
		self.compareGraphSvgG.select("#" + self.nodePrefix + self._fixTheSelectProblem(id))
			.classed("focus-highlight", true);
	},
	mouseoutNodeFromStateGraph: function(id) {
		var self = this;
		self.compareGraphSvgG.select("#" + self.nodePrefix + self._fixTheSelectProblem(id))
			.classed("focus-highlight", false);
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