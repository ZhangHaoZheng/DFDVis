//显示tips，可以设置要提示的内容
function ShowTips(tipStr) {
    $("#tipcontent").text(tipStr);
    $("#errortip").show();
}

function SendDfdObjToServer(dfdObj, dfdIndex) {
    $.ajax({
        type: "POST",
        url: "http://xiongbear.cn:3000/dfdvis",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(dfdObj),
        success: function(data) {
            console.log("***DFD"+dfdObj.DFDID+" get Response from server successfully***");
            if(dfdObj.DFDID==1)
                DFD1GetTheResFromSever($.extend(true, {}, data));
            if(dfdObj.DFDID==2)
                DFD1GetTheResFromSever($.extend(true, {}, data));
            if(data.result != "Error"){
                if(dfdIndex === 1) {
                    stateGraph1.initialize("stateGraph1", data, processGraph1, "1");
                    compareGraph.addStateGraph(stateGraph1.rootNode, 1);
                }
                else if(dfdIndex === 2) {
                    stateGraph2.initialize("stateGraph2", data, processGraph2, "2");
                    compareGraph.addStateGraph(stateGraph2.rootNode, 2);
                }
                compareGraph.initialize("comparisondiv");
            }
            else {
                if(dfdIndex === 1) {
                    stateGraph1.clear();
                }
                else if(dfdIndex === 2) {
                    stateGraph2.clear();
                }
            }
        },
        error: function(message) {
            ShowTips("It is a failed commit.");
            console.log("***It is a failed commit***");
            return 0;
        }
    });
}

$(document).ready(function() {
    //整个页面的初始化部分

    //获得当前窗口的大小并设置各个view的尺寸
    var wWidth = window.innerWidth;
    var wHeight = window.innerHeight;

    $("#div-systitle").height(70);
    $("#div-syshelp").height($("#div-systitle").height());
    /*$("#comparison-div").height(150);*/
    var mainContentDivHeight = wHeight - $("#div-systitle").height() - 2 - 2;
    $("#main-content-div").height(mainContentDivHeight);

    var heightForTwoDfddraw = mainContentDivHeight - 34 - 36 - 36 - 12;
    $(".flowchart-example-container").height(heightForTwoDfddraw / 2);
    $("#statediv").width($("#main-right").width());
    $("#mergeStateGraph1").height($("#btn-row").height() + $("#dfddiv").height() / 2 - 4);
    $("#mergeStateGraph2").height($("#dfddiv").height() / 2 - 4);
    //mergeStateGraph1
    d3.select("#mergeStateGraph1")
        .append("div")
        .attr("id", "stateGraph1");
    d3.select("#mergeStateGraph1")
        .append("div")
        .attr("id", "furtherStateGraph1");
    var leftWrapper = d3.select("#furtherStateGraph1")
        .append("div")
        .attr("id", "furtherStateGraph1-left-wrapper");
    var rightWrapper = d3.select("#furtherStateGraph1")
        .append("div")
        .attr("id", "furtherStateGraph1-right-wrapper");
    rightWrapper.append("div")
        .attr("id", "furtherStateGraph1-left-div")
        .append("svg")
        .attr("id", "furtherStateGraph1-left-svg")
        .attr("height", $("#furtherStateGraph1").height())
        .attr("width", $("#furtherStateGraph1-left-div").width());
    rightWrapper.append("div")
        .attr("id", "furtherStateGraph1-right-div");
    //mergeStateGraph2
    d3.select("#mergeStateGraph2")
        .append("div")
        .attr("id", "stateGraph2");
    d3.select("#mergeStateGraph2")
        .append("div")
        .attr("id", "furtherStateGraph2");
    var leftWrapper = d3.select("#furtherStateGraph2")
        .append("div")
        .attr("id", "furtherStateGraph2-left-wrapper");
    var rightWrapper = d3.select("#furtherStateGraph2")
        .append("div")
        .attr("id", "furtherStateGraph2-right-wrapper");
    rightWrapper.append("div")
        .attr("id", "furtherStateGraph2-left-div")
        .append("svg")
        .attr("id", "furtherStateGraph2-left-svg")
        .attr("height", $("#furtherStateGraph2").height())
        .attr("width", $("#furtherStateGraph2-left-div").width());
    rightWrapper.append("div")
        .attr("id", "furtherStateGraph2-right-div");
    //comparisondiv
    /*d3.select("#comparisondiv")
        .append("svg")
        .attr("id", "comparison-svg");*/
    //手风琴效果的控制
    var currentDivDisplayed = 2;
    $("#accordion-element-1").on('show.bs.collapse', function() {
        $("#flowchartdiv1").show();
        currentDivDisplayed += 1;
        var currentAccordionDivHeight = heightForTwoDfddraw / currentDivDisplayed;
        $(".flowchart-example-container").height(currentAccordionDivHeight);
    });
    $("#accordion-element-1").on('hide.bs.collapse', function() {
        $("#flowchartdiv1").hide();
        currentDivDisplayed -= 1;
        if (currentDivDisplayed > 0) {
            var currentAccordionDivHeight = heightForTwoDfddraw / currentDivDisplayed;
            $(".flowchart-example-container").height(currentAccordionDivHeight);
        }
    });
    $("#accordion-element-2").on('show.bs.collapse', function() {
        $("#flowchartdiv2").show();
        currentDivDisplayed += 1;
        var currentAccordionDivHeight = heightForTwoDfddraw / currentDivDisplayed;
        $(".flowchart-example-container").height(currentAccordionDivHeight);
    });
    $("#accordion-element-2").on('hide.bs.collapse', function() {
        $("#flowchartdiv2").hide();
        currentDivDisplayed -= 1;
        if (currentDivDisplayed > 0) {
            var currentAccordionDivHeight = heightForTwoDfddraw / currentDivDisplayed;
            $(".flowchart-example-container").height(currentAccordionDivHeight);
        }
    });

    //tips关闭
    $("#tipclose").click(function() {
        $("#errortip").hide();
    });

    //btn-new1事件
    $("#btn-new1").click(function() {
        newNode1();
    });

    //btn-new2事件
    $("#btn-new2").click(function() {
        newNode2();
    });

    //btn-delete事件
    //默认disable
    $("#btn-delete").attr('disabled', "true");
    $("#btn-delete").click(function() {
        delNodeOrLink();
    });


    //btn-OOOMMO事件
    //初始默认为OO模式
    $("#btn-OO").addClass("btn-info");
    $("#btn-OO").click(function() {
        $("#btn-OO").addClass("btn-info");
        $("#btn-OM").removeClass("btn-info");
        $("#btn-MO").removeClass("btn-info");
        mode1Choosen();
    });
    $("#btn-OM").click(function() {
        $("#btn-OO").removeClass("btn-info");
        $("#btn-OM").addClass("btn-info");
        $("#btn-MO").removeClass("btn-info");
        mode2Choosen();

    });
    $("#btn-MO").click(function() {
        $("#btn-OO").removeClass("btn-info");
        $("#btn-OM").removeClass("btn-info");
        $("#btn-MO").addClass("btn-info");
        mode3Choosen();
    });

    //btn-submit
    $("#btn-submit").click(function() {
        var flowChartReturn = flowChartSubmit();
        if (flowChartReturn != 0) {
            console.log("***Ready to send to the server***");
            console.log(flowChartReturn);
            compareGraph.clear();
            SendDfdObjToServer(flowChartReturn.dfdDefine1, 1);
            processGraph1.initialize(flowChartReturn.dfdDefine1, 
                "furtherStateGraph1-left-wrapper", 
                "furtherStateGraph1-left-svg",
                "furtherStateGraph1-right-div",
                stateGraph1);
            SendDfdObjToServer(flowChartReturn.dfdDefine2, 2);
            processGraph2.initialize(flowChartReturn.dfdDefine2, 
                "furtherStateGraph2-left-wrapper", 
                "furtherStateGraph2-left-svg",
                "furtherStateGraph2-right-div",
                stateGraph2);
        }
    });
    $("#btn-retract").click(function() {
        retract();
    });
    //初始化流图输入
    initFlowchart();
});
//btn-retract
function showComparisonPart() {
    var originalStateWidth = $("#statediv").width();
    var originalFlowchartWidth = $("#left-span6-left").width();
    d3.select("#main-right")
        .style("width", originalStateWidth + originalFlowchartWidth + "px");        
    d3.select("#comparisondiv")
        .style("width", originalFlowchartWidth - 8 + "px")
        .style("height", $("#main-right").height() - 8 + "px")
        .style("display", "block")
        .classed("accordion-group", true);
    d3.select("#left-span6-left")
        .style("display", "none");
    d3.select("#left-span6-right")
        .classed("retract-float", true);
    d3.select("#main-left")
        .classed("retract-width", true);
    d3.select("#btn-retract-em")
        .html(">>");
}
function hideComparisonPart() {
    var originalStateWidth = $("#statediv").width();
    var originalFlowchartWidth = $("#comparisondiv").width() + 8;
    d3.select("#main-right")
        .style("width", originalStateWidth + "px");
    d3.select("#comparisondiv")
        .style("width", 0 + "px")
        .style("display", "none")
        .classed("accordion-group", false);
    d3.select("#left-span6-left")
        .style("width", originalFlowchartWidth + "px")
        .style("display", "block");
    d3.select("#left-span6-right")
        .classed("retract-float", false);
    d3.select("#main-left")
        .classed("retract-width", false);
    d3.select("#btn-retract-em")
        .html("<<");
}
function retract() {
    console.log("click!!!!!!!!!!!1")
    var ifRetract = d3.select("#btn-retract").attr("ifRetract");
    if(ifRetract === "false") {
        showComparisonPart();
        d3.select("#btn-retract").attr("ifRetract", "true");
    }
    else if(ifRetract === "true") {
        hideComparisonPart();
        d3.select("#btn-retract").attr("ifRetract", "false");
    }
}
//图1和图2分别得到响应
function DFD1GetTheResFromSever(resObj)
{
    console.log(resObj);
}

function DFD1GetTheResFromSever(resObj)
{
    console.log(resObj);
}