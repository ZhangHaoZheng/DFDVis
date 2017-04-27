//显示tips，可以设置要提示的内容
function ShowTips(tipStr) {
    $("#tipcontent").text(tipStr);
    $("#errortip").show();
}

function SendDfdObjToServer(dfdObj) {
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
                output = data;
                stateGraph.initialize("stateGraph");
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
    $("#stateGraph").height($("#btn-row").height() + $("#dfddiv").height() / 2 - 4);
    //右下的view
    $("#furtherStateGraph").height($("#dfddiv").height() / 2 - 4);
    var leftWrapper = d3.select("#furtherStateGraph")
        .append("div")
        .attr("id", "furtherStateGraph-left-wrapper");
    var rightWrapper = d3.select("#furtherStateGraph")
        .append("div")
        .attr("id", "furtherStateGraph-right-wrapper");
    rightWrapper.append("div")
        .attr("id", "furtherStateGraph-left-div")
        .append("svg")
        .attr("id", "furtherStateGraph-left-svg")
        .attr("height", $("#furtherStateGraph").height())
        .attr("width", $("#furtherStateGraph-left-div").width());
    rightWrapper.append("div")
        .attr("id", "furtherStateGraph-right-div");
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
            SendDfdObjToServer(flowChartReturn.dfdDefine1);
            processGraph.initialize(flowChartReturn.dfdDefine1);
            //SendDfdObjToServer(flowChartReturn.dfdDefine2);
        }
    });

    //初始化流图输入
    initFlowchart();
});

//图1和图2分别得到响应
function DFD1GetTheResFromSever(resObj)
{
    console.log(resObj);
}

function DFD1GetTheResFromSever(resObj)
{
    console.log(resObj);
}