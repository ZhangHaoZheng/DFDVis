function doSave(value, type, name) {  
    var blob;  
    if (typeof window.Blob == "function") {  
        blob = new Blob([value], {type: type});  
    } else {  
        var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;  
        var bb = new BlobBuilder();  
        bb.append(value);  
        blob = bb.getBlob(type);  
    }  
    var URL = window.URL || window.webkitURL;  
    var bloburl = URL.createObjectURL(blob);  
    var anchor = document.createElement("a");  
    if ('download' in anchor) {  
        anchor.style.visibility = "hidden";  
        anchor.href = bloburl;  
        anchor.download = name;  
        document.body.appendChild(anchor);  
        var evt = document.createEvent("MouseEvents");  
        evt.initEvent("click", true, true);  
        anchor.dispatchEvent(evt);  
        document.body.removeChild(anchor);  
    } else if (navigator.msSaveBlob) {  
        navigator.msSaveBlob(blob, name);  
    } else {  
        location.href = bloburl;  
    }  
}   
  
function Save(){
    var text1 = JSON.stringify(flowChartReturn.dfdDefine1);
    var text2 = JSON.stringify(flowChartReturn.dfdDefine2);
    var DFDhtml = $("#dfddiv").html();
    var fileName = prompt("save as: ", "");
    doSave(text1 + "$" + text2 + "$" + DFDhtml, "text/latex", fileName + ".txt");
} 

function handleFileSelect(evt) {  
    var files = evt.target.files; // FileList object  
    if(files[0])  
    {  
        var reader = new FileReader();  
        reader.readAsText(files[0]);  
        reader.onload = loaded;      
    }  
}  
  
function loaded(evt) {  
    var fileString = evt.target.result;  
    var textArray = fileString.split("$");
    if(textArray.length === 3) {
        var dfdDefine1 = JSON.parse(textArray[0]);
        var dfdDefine2 = JSON.parse(textArray[1]);
        var DFDhtml = textArray[2];
        
        $("#dfddiv").html(DFDhtml);

        console.log("***Ready to send to the server***");
        compareGraph.clear();
        SendDfdObjToServer(dfdDefine1, 1);
        processGraph1.initialize(dfdDefine1, 
            "furtherStateGraph1-left-wrapper", 
            "furtherStateGraph1-left-svg",
            "furtherStateGraph1-right-div",
            stateGraph1);
        SendDfdObjToServer(dfdDefine2, 2);
        processGraph2.initialize(dfdDefine2, 
            "furtherStateGraph2-left-wrapper", 
            "furtherStateGraph2-left-svg",
            "furtherStateGraph2-right-div",
            stateGraph2);
    }
    else {
        alert("load error!");
    }
}  