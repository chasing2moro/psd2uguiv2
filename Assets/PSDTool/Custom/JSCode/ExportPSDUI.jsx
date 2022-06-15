#include GetLayerStyle.js;

//------------------------------------------------------------------------------
function showLayerEffect(){
    var extraInfo = { "patterns": null };
    var layerStyle = jamStyles.getLayerStyle (extraInfo);
    if (layerStyle)
    {
        var patternsData = extraInfo["patterns"];
        //var jsonText = jamJSON.stringify (layerStyle, (expandTabs) ? 4 : '\t');
        if(layerStyle.layerEffects){
            var dropShadow = layerStyle.layerEffects.dropShadow;
            var _dropShadow = null;
            if(dropShadow){
                _dropShadow = {"color":{}};
                _dropShadow.distance = dropShadow.distance;
                _dropShadow.color.red = Math.round(dropShadow.color.red);
                _dropShadow.color.green = Math.round(dropShadow.color.green);
                _dropShadow.color.blue = Math.round(dropShadow.color.blue);
            }

            var frameFX = layerStyle.layerEffects.frameFX;
            var _frameFX = null;
            if(frameFX){
                _frameFX = {"color":{}};
                _frameFX.size = frameFX.size;
                _frameFX.color.red = Math.round(frameFX.color.red);
                _frameFX.color.green = Math.round(frameFX.color.green);
                _frameFX.color.blue = Math.round(frameFX.color.blue);
            }
            return {"dropShadow":_dropShadow, "frameFX":_frameFX};
        }
    }else{
        alert("layerStyle = null");
    }
}
//------------------------------------------------------------------------------

//上面脚本GetLayerStyle.js从 如下地址copy
//https://github.com/tonton-pixel/json-photoshop-scripting/tree/master/Utility-Scripts/Get-Layer-Style
//https://github.com/tonton-pixel/json-photoshop-scripting/blob/master/Utility-Scripts/Get-Layer-Style/Get%20Layer%20Style.js
//下面脚本从 如下地址copy
//https://github.com/zs9024/quick_psd2ugui/tree/master/psd2ugui/Assets/PSD2UGUI/JSCode
//https://github.com/zs9024/quick_psd2ugui/blob/master/psd2ugui/Assets/PSD2UGUI/JSCode/Export%20PSDUI.jsx

// **************************************************
// This file created by Brett Bibby (c) 2010-2013
// You may freely use and modify this file as you see fit
// You may not sell it
//**************************************************
// hidden object game exporter
//$.writeln("=== Starting Debugging Session ===");

// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
// $.level = 0;
// debugger; // launch debugger on next line

var sceneData;
var sourcePsd;
var duppedPsd;
var destinationFolder;
var uuid;
var sourcePsdName;
var slicePaddingArr = new Array(0,0,0,0)
var sliceOriArr = new Array(0,0,0,0)
var tagEscape = "~"

main();

function main(){
    // got a valid document?
    if (app.documents.length <= 0)
    {
        if (app.playbackDisplayDialogs != DialogModes.NO)
        {
            alert("You must have a document open to export!");
        }
        // quit, returning 'cancel' makes the actions palette not record our script
        return 'cancel';
    }

    // ask for where the exported files should go
    destinationFolder = Folder.selectDialog("Choose the destination for export.");
    if (!destinationFolder)
    {
        return;
    }

    // cache useful variables
    uuid = 1;
    sourcePsdName = app.activeDocument.name;
    var layerCount = app.documents[sourcePsdName].layers.length;
    var layerSetsCount = app.documents[sourcePsdName].layerSets.length;

    if ((layerCount <= 1) && (layerSetsCount <= 0))
    {
        if (app.playbackDisplayDialogs != DialogModes.NO)
        {
            alert("You need a document with multiple layers to export!");
            // quit, returning 'cancel' makes the actions palette not record our script
            return 'cancel';
        }
    }

    // setup the units in case it isn't pixels
    var savedRulerUnits = app.preferences.rulerUnits;
    var savedTypeUnits = app.preferences.typeUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.PIXELS;

    // duplicate document so we can extract everythng we need
    duppedPsd = app.activeDocument.duplicate();
    duppedPsd.activeLayer = duppedPsd.layers[duppedPsd.layers.length - 1];

    hideAllLayers(duppedPsd);

    // export layers
    sceneData = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
    sceneData += "<PSDUI>";

    sceneData += "\n<psdSize>";
    sceneData += "<width>" + duppedPsd.width.value + "</width>";
    sceneData += "<height>" + duppedPsd.height.value+ "</height>";
    sceneData += "</psdSize>";

    sceneData += "\n<layers>";
    exportAllLayers(duppedPsd);
    sceneData += "</layers>";

    sceneData += "\n</PSDUI>";
    $.writeln(sceneData);

    duppedPsd.close(SaveOptions.DONOTSAVECHANGES);

    // create export
    var sceneFile = new File(destinationFolder + "/" + destinationFolder.name + ".xml");
    sceneFile.encoding = "utf-8";   //写文件时指定编码，不然中文会出现乱码
    sceneFile.open('w');
    sceneFile.writeln(sceneData);
    sceneFile.close();

    app.preferences.rulerUnits = savedRulerUnits;
    app.preferences.typeUnits = savedTypeUnits;
}

//=========================================广州寰宇添加 Start
/* 使用例子：FindInLayers(app.activeDocument, obj.name);
function FindInLayers(obj, name){
    if  (typeof(obj) == "undefined"){
        return null;
    }

    if (typeof(obj.layers) != "undefined" && obj.layers.length>0) {
        for (var i = obj.layers.length - 1; 0 <= i; i--)
        {
            var found = FindInLayers(obj.layers[i], name)
            if(found != null)
                return found;
        }
    }
    else{
        return FindInLayer(obj, name)
    };
}

function FindInLayer(obj, name)
{
    if  (typeof(obj) == "undefined"){
        return null;
    }

    if (obj.typename == "LayerSet") {
        if (typeof(obj.layers) != "undefined" && obj.layers.length>0)//空文件夹死循环bug
            return FindInLayers(obj, name)
    }
    else if  (obj.typename = "ArtLayer"){
        if(obj.name == name){
            return obj;
        }
    }
    return null;
}
*/
//=========================================广州寰宇添加 End

function exportAllLayers(obj)
{
    if  (typeof(obj) == "undefined"){
        return;
    }

    if (typeof(obj.layers) != "undefined" && obj.layers.length>0) {

        for (var i = obj.layers.length - 1; 0 <= i; i--)
        {
            exportLayer(obj.layers[i])
        }

    }
    else{
        exportLayer(obj)
    };
}

function exportLayer(obj)
{
    if  (typeof(obj) == "undefined"){
        return;
    }

    if (obj.typename == "LayerSet") {
            exportLayerSet(obj);
    }
    else if  (obj.typename = "ArtLayer"){
        exportArtLayer(obj);
    }
}

function exportLayerSet(_layer)
{
    if (typeof(_layer.layers) == "undefined" || _layer.layers.length<=0 )
    {
        return
    }

    if (_layer.name.search("@NoExport") >= 0) {return};    //不导出标识
    if(_layer.name.search(tagEscape) >= 0) return;//波浪线不导出

    if (_layer.name.search("@PNG") >= 0 || _layer.name.search("@JPG") >= 0) 
    {
        exportLayerSetForImage(_layer);
        return
    }; 
    
    if (_layer.name.search("@ScrollView") >= 0)
    {
        exportScrollView(_layer);
    }
    else if (_layer.name.search("@Grid") >= 0)
    {
        exportGrid(_layer);
    }
    else if (_layer.name.search("@Button") >= 0)
    {
        exportButton(_layer);
    }
    else if (_layer.name.search("@Toggle") >= 0)
    {
        exportToggle(_layer);
    }
    else if (_layer.name.search("@Panel") >= 0)
    {
        exportPanel(_layer);
    }
    else if (_layer.name.search("@Slider")>=0)
    {
        exportSlider(_layer);
    }
    else if (_layer.name.search("@Group")>=0)
    {
        exportGroup(_layer);
    }
    else if (_layer.name.search("@InputField") >=0)
    {
        exportInputField(_layer);
    }
    else if (_layer.name.search("@Scrollbar") >=0)
    {
        exportScrollBar(_layer);
    }
    else if (_layer.name.search("@LE") >=0)                         //增加布局元素导出
    {
        exportLayoutElement(_layer)
    }
     else if (_layer.name.search("@TabGroup") >=0)              //增加页签类型导出
    {
        exportTabGroup(_layer)
    }
    else
    {
        sceneData += "<Layer>";
        sceneData += "<type>Normal</type>";
        sceneData += "<name>" + _layer.name + "</name>";
        sceneData += "<layers>";
        exportAllLayers(_layer)
        sceneData += "</layers>";
        sceneData += "</Layer>";
    }
}

//将组导出成图片
function exportLayerSetForImage(obj)
{
    showLayerSets (obj);
    exportArtLayer(obj);
}

function exportLayoutElement(obj)
{
    sceneData += "<Layer>";
    sceneData += "<type>LayoutElement</type>";
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += "<name>" + itemName + "</name>";

    sceneData += "<layers>";
    exportAllLayers(obj);
    sceneData += "</layers>";

    obj.visible = true;
    showAllLayers(obj);

    var recSize = getLayerRec(duppedPsd.duplicate());

    sceneData += "<position>";
    sceneData += "<x>" + recSize.x + "</x>";
    sceneData += "<y>" + recSize.y + "</y>";
    sceneData += "</position>";

    sceneData += "<size>";
    sceneData += "<width>" + recSize.width + "</width>";
    sceneData += "<height>" + recSize.height + "</height>";
    sceneData += "</size>";

    hideAllLayers(obj);

    sceneData += "</Layer>";
}

function exportScrollView(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>ScrollView</type>\n<name>" + itemName + "</name>\n");
    sceneData += ("<layers>\n");
    exportAllLayers(obj);
    sceneData += ("</layers>");

    var params = obj.name.split(":");

    if (params.length > 2)
    {
        alert(obj.name + "-------Layer's name is illegal------------");
    }

    var recSize;
    if (obj.layers[obj.layers.length - 1].name.search("@Size") < 0)
    {
        alert("Bottom layer's name doesn't contain '@Size'");
    }
    else
    {
        obj.layers[obj.layers.length - 1].visible = true;

        recSize = getLayerRec(duppedPsd.duplicate());

        sceneData += "<position>";
        sceneData += "<x>" + recSize.x + "</x>";
        sceneData += "<y>" + recSize.y + "</y>";
        sceneData += "</position>";

        sceneData += "<size>";
        sceneData += "<width>" + recSize.width + "</width>";
        sceneData += "<height>" + recSize.height + "</height>";
        sceneData += "</size>";

        obj.layers[obj.layers.length - 1].visible = false;
    }

    //以下计算padding和spacing
    obj.layers[0].visible = true;
    showAllLayers(obj.layers[0]);                           //子图层组已经在上面导出过，要再次计算size需先将其显示
    var rec0 = getLayerRec(duppedPsd.duplicate());
    hideAllLayers(obj.layers[0]);
    obj.layers[0].visible = false;

    obj.layers[1].visible = true;
    showAllLayers(obj.layers[1]);
    var rec1 = getLayerRec(duppedPsd.duplicate());
    hideAllLayers(obj.layers[0]);
    obj.layers[1].visible = false;

    var spacing;
    var paddingx;
    var paddingy;
    if(params[1].search("H") >= 0)          //水平间距
    {
        spacing = rec1.x - rec0.x - rec0.width;
        paddingx =  rec0.x - (recSize.x - recSize.width / 2) -  rec0.width / 2;                                      //x方向边距，默认左右相等
        paddingy = (recSize.height - rec0.height) / 2 ;                                                          //暂时只考虑上下边距相等
        //paddingy = recSize.height / 2 - rec0.height / 2 - (rec0.y - recSize.y);                                                                   //上边距
        //paddingy2 = recSize.height - rec0.height - paddingy;                      //下边距
    }
    else                                                //垂直间距
    {
        spacing = rec0.y - rec1.y - rec0.height;
        paddingx =  (recSize.width - rec0.width) / 2 ;
        paddingy = (recSize.y + recSize.height / 2)  - rec0.y -  rec0.height / 2;
    }

    sceneData += "<arguments>";
    sceneData += "<string>" + params[1] + "</string>";     //滑动方向
    sceneData += "<string>" + spacing + "</string>";
    sceneData += "<string>" + Math.floor (paddingx) + "</string>";
    sceneData += "<string>" + Math.floor (paddingy) + "</string>";
    sceneData += "</arguments>";

    sceneData += "</Layer>";
}

function setLayerSizeAndPos(layer)
{
    layer.visible = true;

    var recSize = getLayerRec(duppedPsd.duplicate());

    sceneData += "<position>";
    sceneData += "<x>" + recSize.x + "</x>";
    sceneData += "<y>" + recSize.y + "</y>";
    sceneData += "</position>";

    sceneData += "<size>";
    sceneData += "<width>" + recSize.width + "</width>";
    sceneData += "<height>" + recSize.height + "</height>";
    sceneData += "</size>";

    layer.visible = false;

    return recSize;
}

function exportGrid(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>Grid</type>\n<name>" + itemName + "</name>\n");
    sceneData += ("<layers>\n");
    exportAllLayers(obj);
    sceneData += ("</layers>");

    var params = obj.name.split(":");

    if (params.length != 3)
    {
        alert("Layer's name is illegal");
    }

    var recSize;
    if (obj.layers[obj.layers.length - 1].name.search("@Size") < 0)
    {
        alert("Bottom layer's name doesn't contain '@Size'");
        return;
    }
    else
    {
        recSize = setLayerSizeAndPos(obj.layers[obj.layers.length - 1]);
    }

    var totalContentCount = obj.layers.length - 1;

    obj.layers[0].visible = true;
    showAllLayers(obj.layers[0]);                           //子图层组已经在上面导出过，要再次计算size需先将其显示
    var rec0 = getLayerRec(duppedPsd.duplicate());
    hideAllLayers(obj.layers[0]);
    obj.layers[0].visible = false;

    var renderHorizontalGap = params[2] > 1 ? (recSize.width - rec0.width * params[2])/(params[2] - 1) : 0;
    var renderVerticalGap = params[1] > 1 ? (recSize.height - rec0.height * params[1])/(params[1] - 1) : 0;

    sceneData += "<arguments>";
    sceneData += "<string>" + params[1] + "</string>";   //行数
    sceneData += "<string>" + params[2] + "</string>";   //列数
    sceneData += "<string>" + rec0.width + "</string>";   //render width
    sceneData += "<string>" + rec0.height + "</string>";   //render height
    sceneData += "<string>" + Math.floor(renderHorizontalGap) + "</string>"; //水平间距
    sceneData += "<string>" + Math.floor(renderVerticalGap) + "</string>"; //垂直间距
    sceneData += "</arguments>";

    sceneData += "</Layer>";
}

function exportGroup(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>Group</type>\n<name>" + itemName + "</name>\n");

    exportAllLayers(obj);

    var params = obj.name.split(":");

    if (params.length != 3 )
    {
        alert(obj.name + "-------Layer's name not equals 2------------");
    }

    var recSize;
    if (obj.layers[obj.layers.length - 1].name.search("@Size") < 0)
    {
        alert("Bottom layer's name doesn't contain '@Size'");
    }
    else
    {
        obj.layers[obj.layers.length - 1].visible = true;

        recSize = getLayerRec(duppedPsd.duplicate());

        sceneData += "<position>";
        sceneData += "<x>" + recSize.x + "</x>";
        sceneData += "<y>" + recSize.y + "</y>";
        sceneData += "</position>";

        sceneData += "<size>";
        sceneData += "<width>" + recSize.width + "</width>";
        sceneData += "<height>" + recSize.height + "</height>";
        sceneData += "</size>";

        obj.layers[obj.layers.length - 1].visible = false;
    }

    sceneData += "<arguments>";
    sceneData += "<string>" + params[1] + "</string>";   //方向
    sceneData += "<string>" + params[2] + "</string>";   //span
    sceneData += "</arguments>";

    sceneData += "</Layer>";
}

function exportInputField(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>InputField</type>\n<name>" + itemName + "</name>\n");
    sceneData += "<layers>";

    // sceneData += "<images>\n";

    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        exportArtLayer(obj.layers[i]);
    }

    sceneData += "</layers>";
    // sceneData += "\n</images>\n</Layer>";
    sceneData += "\n</Layer>";
}

function exportButton(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>Button</type>\n<name>" + itemName + "</name>\n");
    sceneData += "<layers>";

    // sceneData += "<images>\n";

    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        //exportArtLayer(obj.layers[i]);
        exportLayer(obj.layers[i]);//广州寰宇修改
    }
    sceneData += "</layers>";
    // sceneData += "\n</images>\n</Layer>";
    sceneData += "\n</Layer>";
}

function exportToggle(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>Toggle</type>\n<name>" + itemName + "</name>\n");
    sceneData += "<layers>";

    // sceneData += "<images>\n";

    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        exportArtLayer(obj.layers[i]);
    }

    sceneData += "</layers>";
    // sceneData += "\n</images>\n</Layer>";
    sceneData += "\n</Layer>";
}

function exportSlider(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>Slider</type>\n<name>" + itemName + "</name>\n");

    var params = obj.name.split(":");

    if (params.length != 2)
    {
        alert(obj.name + "-------Layer's name is not 1 argument------------");
    }

    var recSize;
    if (obj.layers[obj.layers.length - 1].name.search("@Size") < 0)
    {
        alert("Bottom layer's name doesn't contain '@Size'");
    }
    else
    {
        setLayerSizeAndPos(obj.layers[obj.layers.length - 1]);
    }

    sceneData += "<arguments>";
    sceneData += "<string>" + params[1] + "</string>"; //滑动方向
    sceneData += "</arguments>";

    // sceneData += "<images>\n";
    sceneData += "<layers>";

    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        exportArtLayer(obj.layers[i]);
    }
    sceneData += "</layers>";

    // sceneData += "\n</images>\n</Layer>";
    sceneData += "\n</Layer>";
}

function exportScrollBar(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>ScrollBar</type>\n<name>" + itemName + "</name>\n");

    var params = obj.name.split(":");

    if (params.length != 3)
    {
        alert(obj.name + "-------Layer's name is not 1 argument------------");
    }

    sceneData += "<arguments>";
    sceneData += "<string>" + params[1] + "</string>"; //滑动方向
    sceneData += "<string>" + params[2] + "</string>"; //比例
    sceneData += "</arguments>";

    // sceneData += "<images>\n";
    sceneData += "<layers>";

    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        exportArtLayer(obj.layers[i]);
    }
    sceneData += "</layers>";

    // sceneData += "\n</images>\n</Layer>";
    sceneData += "\n</Layer>";
}

function exportPanel(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>Panel</type>\n<name>" + itemName + "</name>\n");

    exportAllLayers(obj);

    // sceneData += "<images>\n";
    sceneData += "<layers>";

    for (var j = obj.artLayers.length - 1; 0 <= j; j--)
    {
        exportArtLayer(obj.artLayers[j]);
    }
    sceneData += "</layers>";

    // sceneData += "\n</images>\n</Layer>";
    sceneData += "\n</Layer>";
}

function exportArtLayer(obj)
{
    if (typeof(obj) == "undefined") {return};
    if (obj.name.search("@Size") >= 0) {return};
    if (obj.name.search("@NoExport") >= 0) {return};    //不导出标识
    if (obj.name.search(tagEscape) >= 0) return;//波浪线不导出

    sceneData += "\n<Layer>";
    sceneData += "<type>Normal</type>";
    //sceneData += "<name>" + makeValidFileName(obj.name) + "</name>";
    var validFileName = makeValidFileName(obj.name);
    var artLayerName = getArtLayerName(validFileName);//2020-5-10广州寰宇 控件名字和图片名字 分离
    var outputFileName = getOutputFileName(validFileName);//2020-5-10广州寰宇 控件名字和图片名字 分离
    sceneData += "<name>" + artLayerName + "</name>";
    sceneData += "<image>\n";
    // sceneData += "<PSImage>\n";
    if (LayerKind.TEXT == obj.kind)
    {
        exportLabel(obj, outputFileName);
    }
    else if (obj.name.search("Texture") >= 0)
    {
        exportTexture(obj, outputFileName);
    }
    else
    {
        //if (obj.typename == "LayerSet" && (obj.name.search("@PNG") >= 0 || obj.name.search("@JPG") >= 0))
        //{
        //     
        //}
        
        exportImage(obj, outputFileName);
    }
    sceneData += "</image>";
    // sceneData += "</PSImage>";
    sceneData += "\n</Layer>";
}

function Int2Hex(number){
    var num = number.toString(16)
    if(num.length < 2)
        return '0' + num;
    else 
        return num;
}
function Color2Hex(color){
    return Int2Hex(color.red) + Int2Hex(color.green) + Int2Hex(color.blue);
}

function exportLabel(obj,validFileName)
{
    //有些文本如标题，按钮，美术用的是其他字体，可能还加了各种样式，需要当做图片切出来使用
    if(obj.name.search("_ArtStatic") >= 0 || obj.name.search("@PNG") >= 0 || obj.name.search("@JPG") >= 0)  
    {
        exportImage(obj,validFileName);   
        return;
    }

    //处理静态文本，会对应unity的静态字体
    var StaticText = false;
    if(obj.name.search("_Static") >= 0)
    {
        StaticText = true;
    }

    sceneData += "<imageType>" + "Label" + "</imageType>\n";
    //var validFileName = makeValidFileName(obj.name);
    sceneData += "<name>" + validFileName + "</name>\n";
    obj.visible = true;

    //=========================================广州寰宇添加 Start
    var layerEffect = null;
    var foundLayer = obj;//FindInLayers(app.activeDocument, obj.name);
    if(foundLayer != null){
        var activeLayer = app.activeDocument.activeLayer;
        app.activeDocument.activeLayer = foundLayer;
        layerEffect = showLayerEffect();
        app.activeDocument.activeLayer = activeLayer//为了解决执行脚本的时出现错误：“合并可见图层”当前不可用
    }
    else{
        alert("Can not find layer:" + obj.name + " in " + app.activeDocument.name);
    }
    //=========================================广州寰宇添加 End

    saveScenePng(duppedPsd.duplicate(), validFileName, false);
    if (foundLayer != null && foundLayer != obj) {
        alert("处理描边、阴影需要控件不能同名:" + obj.name + " '" + foundLayer.textItem.contents + "' '" + obj.textItem.contents + "'");
        foundLayer.visible = false; //多个text同名会出bug，需要这样处理
    }
    obj.visible = false;

    sceneData += "<arguments>";

    //0
    sceneData += "<string>" + obj.textItem.color.rgb.hexValue + "</string>";

    //1
    if(StaticText == true)
    {
        sceneData += "<string>" + obj.textItem.font + "_Static" + "</string>";
    }
    else
    {
        sceneData += "<string>" + obj.textItem.font + "</string>";
    }

    //2
    var correctedSize = CorrectTextSize(obj)
    sceneData += "<string>" + correctedSize + "</string>"; //字体大小
    // sceneData += "<string>" + obj.textItem.size.value + "</string>";

    //3
    sceneData += "<string>" + obj.textItem.contents + "</string>";

    //4
    //段落文本带文本框，可以取得对齐方式
    if(obj.textItem.kind == TextType.PARAGRAPHTEXT)
    {
        sceneData += "<string>" + obj.textItem.justification + "</string>";     //加对齐方式
    }else{
        sceneData += "<string></string>";
    }

    //5
    if(layerEffect && layerEffect.frameFX){
        var frameFX = layerEffect.frameFX;
        var color = frameFX.color;
        sceneData += "<string>" + frameFX.size + "|" + Color2Hex(color) + "</string>";
    }else{
        sceneData += "<string></string>";
    }

    //6
    if(layerEffect && layerEffect.dropShadow){
        var dropShadow = layerEffect.dropShadow;
        var color = dropShadow.color;
        sceneData += "<string>" + dropShadow.distance + "|" + Color2Hex(color) + "</string>";
    }else{
        sceneData += "<string></string>";
    }

    //7
    if(obj.name.search("_Angle") >= 0){
        var re = /\s*_Angle(\:\d+)/g;
        var result = obj.name.match(re)
        if (result) {
            var getStr = result[0];
            var getStrs = getStr.split(":");
            if ( getStrs.length != 2) 
                alert("图层名为："+obj.name+"的角度格式不对！应为_Angle:数字");
            var angleStr = getStrs[1];
            sceneData += "<string>" + angleStr + "</string>";
        }else{
            alert("图层名为："+obj.name+"的角度格式不对！应为_Angle:数字");
            sceneData += "<string></string>";
        }
    }else{
        sceneData += "<string></string>";
    }

    sceneData += "</arguments>";

	// 透明度
	sceneData += "<opacity>" + obj.opacity +"</opacity>";

	// 新增渐变
	if(obj.name.search("_JB") >= 0)
	{
		var _text = obj.name.substring(obj.name.search("_JB"), obj.name.length);

		var params = _text.split("|");
		params = params[0].split(":");

		if (params.length > 1)
		{
			sceneData += "<gradient>"

			for (var i = 0; i < params.length; ++i)
			{
				if (params[i].search("_") >=0)
				{
					continue;
				}

				sceneData += params[i];

				if (i < params.length - 1)
				{
					sceneData += "|";
				}
			}

			sceneData += "</gradient>";
		}
	}

	// 新增描边
	if(obj.name.search("_OL") >= 0)
	{
		var _text = obj.name.substring(obj.name.search("_OL"), obj.name.length);

		var params = _text.split("|");
		params = params[0].split(":");

		if (params.length > 1)
		{
			sceneData += "<outline>"

			for (var i = 0; i < params.length; ++i)
			{
				if (params[i].search("_") >=0)
				{
					continue;
				}

				sceneData += params[i];

				if (i < params.length - 1)
				{
					sceneData += "|";
				}
			}

			sceneData += "</outline>";
		}
	}
}

function exportTexture(obj,validFileName)
{
    //var validFileName = makeValidFileName(obj.name);
    sceneData += "<imageType>" + "Texture" + "</imageType>\n";
    sceneData += "<name>" + validFileName + "</name>\n";

	// 透明度
	// sceneData += "<opacity>" + obj.opacity +"</opacity>";

    obj.visible = true;
    saveScenePng(duppedPsd.duplicate(), validFileName, true);
    obj.visible = false;
}

// merge:是否合并，默认不合并
function exportImage(obj,validFileName)
{ 
    //var validFileName = makeValidFileName(obj.name);
    var oriName = obj.name
    sceneData += "<name>" + validFileName + "</name>\n";

    if (obj.name.search("@Common") >= 0)//2022-5-10 广州寰宇加@
    {
        sceneData += "<imageSource>" + "Common" + "</imageSource>\n";
    }
    else if(obj.name.search("Global") >= 0)
    {
        sceneData += "<imageSource>" + "Global" + "</imageSource>\n";
    }
	else if(obj.name.search("CustomAtlas") >= 0)
	{
		sceneData += "<imageSource>" + "CustomAtlas" + "</imageSource>\n";

		var atlasName = obj.name.substring (obj.name.lastIndexOf("@CustomAtlas"), obj.name.length);
		// 拆分出图集名


		// 添加图集名
		sceneData += "<AtlasName>" + "" + "</AtlasName>";
	}
    else
    {
        sceneData += "<imageSource>" + "Custom" + "</imageSource>\n";
    }

	if (oriName.search("_9S") >= 0)
	{
	  sceneData += "<imageType>" + "SliceImage" + "</imageType>\n";
	  obj.visible = true;
	  var _objName = obj.name
	  // var newDoc = app.documents.add(duppedPsd.width, duppedPsd.height,duppedPsd.resolution, _objName+"doc",NewDocumentMode.RGB,DocumentFill.TRANSPARENT)
	  // app.activeDocument = duppedPsd
	  // obj.copy()
	  // app.activeDocument = newDoc
	  // newDoc.paste()
	  //   newDoc.activeLayer.name = _objName
	  var recSize = getLayerRec(duppedPsd.duplicate(),true);
		sceneData += "<position>";
		sceneData += "<x>" + recSize.x + "</x>";
		sceneData += "<y>" + recSize.y + "</y>";
		sceneData += "</position>";

		sceneData += "<size>";
		sceneData += "<width>" + recSize.width + "</width>";
		sceneData += "<height>" + recSize.height + "</height>";
		sceneData += "</size>";

		// 透明度
		// sceneData += "<opacity>" + obj.opacity +"</opacity>";

	  // _9sliceCutImg(newDoc,_objName,validFileName);
	  _9sliceCutImg(duppedPsd.duplicate(),_objName,validFileName);
	  obj.visible = false;
	  return;
	}
    else if(oriName.search("LeftHalf") > 0)       //左右对称的图片切左边一半
    {
        sceneData += "<imageType>" + "LeftHalfImage" + "</imageType>\n";

        obj.visible = true;

        var recSize = getLayerRec(duppedPsd.duplicate());
        sceneData += "<position>";
        sceneData += "<x>" + recSize.x + "</x>";
        sceneData += "<y>" + recSize.y + "</y>";
        sceneData += "</position>";

        sceneData += "<size>";
        sceneData += "<width>" + recSize.width + "</width>";
        sceneData += "<height>" + recSize.height + "</height>";
        sceneData += "</size>";

		// 透明度
		// sceneData += "<opacity>" + obj.opacity +"</opacity>";

        cutLeftHalf(duppedPsd.duplicate(),validFileName);
        obj.visible = false;
        return;
    }
    else if(obj.name.search("BottomHalf") > 0)     //上下对称的图片切底部一半
    {
        sceneData += "<imageType>" + "BottomHalfImage" + "</imageType>\n";

        obj.visible = true;

        //半图要先计算出大小和位置
        var recSize = getLayerRec(duppedPsd.duplicate());
        sceneData += "<position>";
        sceneData += "<x>" + recSize.x + "</x>";
        sceneData += "<y>" + recSize.y + "</y>";
        sceneData += "</position>";

        sceneData += "<size>";
        sceneData += "<width>" + recSize.width + "</width>";
        sceneData += "<height>" + recSize.height + "</height>";
        sceneData += "</size>";

		// 透明度
		// sceneData += "<opacity>" + obj.opacity +"</opacity>";

        cutBottomHalf(duppedPsd.duplicate(),validFileName);
        obj.visible = false;
        return;
    }
    else if(obj.name.search("Quarter") > 0)     //上下左右均对称的图片切左下四分之一
    {
        sceneData += "<imageType>" + "QuarterImage" + "</imageType>\n";

        obj.visible = true;

        var recSize = getLayerRec(duppedPsd.duplicate());
        sceneData += "<position>";
        sceneData += "<x>" + recSize.x + "</x>";
        sceneData += "<y>" + recSize.y + "</y>";
        sceneData += "</position>";

        sceneData += "<size>";
        sceneData += "<width>" + recSize.width + "</width>";
        sceneData += "<height>" + recSize.height + "</height>";
        sceneData += "</size>";

		// 透明度
		// sceneData += "<opacity>" + obj.opacity +"</opacity>";

        cutQuarter(duppedPsd.duplicate(),validFileName);
        obj.visible = false;
        return;
    }
    else
    {
        sceneData += "<imageType>" + "Image" + "</imageType>\n";
		// 透明度
		// sceneData += "<opacity>" + obj.opacity +"</opacity>";
    }
    
    //支持jpg，一般用于背景
    var asJpg = false;
    var jpgQuality = 100;
    if(oriName.search("@JPG") > 0) 
    {
        asJpg = true;
        var  nums = oriName.split(":");
        if ( nums.length == 2) 
        {
            jpgQuality = parseInt(nums[1]);
        }
        
        sceneData += "<arguments>";
        sceneData += "<string>" + "JPG" + "</string>";  //标识jpg
        sceneData += "</arguments>";
    }
    
    obj.visible = true;
    saveScenePng(duppedPsd.duplicate(), validFileName, true,null,asJpg,jpgQuality);
    obj.visible = false;

}

//TODO used to debug, delete after debug
function alertObj(obj){
    var str="";
    for (var item in obj){
        //str +=item+":"+obj[item]+"\n";
        str +=item+":";
    }
    alert(str);
}

//导出页签
function exportTabGroup(obj)
{
    var itemName = obj.name.substring(0, obj.name.search("@"));
    sceneData += ("<Layer>\n<type>TabGroup</type>\n<name>" + itemName + "</name>\n");
    sceneData += "<layers>";

    exportAllLayers(obj);

    sceneData += "</layers>";

    sceneData += "\n</Layer>";
}

function hideAllLayers(obj)
{
    hideLayerSets(obj);
}

function hideLayerSets(obj)
{
    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        if (obj.layers[i].typename == "LayerSet")
        {
            hideLayerSets(obj.layers[i]);
        }
        else
        {
            obj.layers[i].visible = false;
        }
    }
}

//显示图层组及组下所有图层
function showAllLayers(obj)
{
    showLayerSets(obj);
}

function showLayerSets(obj)
{
	if(obj.layers == null){
		alert("obj.layers = null:" + obj.name);
	}
    for (var i = obj.layers.length - 1; 0 <= i; i--)
    {
        if (obj.layers[i].typename == "LayerSet")
        {
            showLayerSets(obj.layers[i]);
        }
        else
        {
            obj.layers[i].visible = true;
        }
    }
}


function getLayerRec(psd,notMerge)
{
    // we should now have a single art layer if all went well
    if  (!notMerge){
          psd.mergeVisibleLayers();
        }

    // figure out where the top-left corner is so it can be exported into the scene file for placement in game
    // capture current size
    var height = psd.height.value;
    var width = psd.width.value;
    var top = psd.height.value;
    var left = psd.width.value;
    // trim off the top and left
    psd.trim(TrimType.TRANSPARENT, true, true, false, false);
    // the difference between original and trimmed is the amount of offset
    top -= psd.height.value;
    left -= psd.width.value;
    // trim the right and bottom
    psd.trim(TrimType.TRANSPARENT);
    // find center
    top += (psd.height.value / 2)
    left += (psd.width.value / 2)
    // unity needs center of image, not top left
    top = -(top - (height / 2));
    left -= (width / 2);

    height = psd.height.value;
    width = psd.width.value;

    psd.close(SaveOptions.DONOTSAVECHANGES);

    return {
        y: top,
        x: left,
        width: width,
        height: height
    };
}

//param asJpg  bool    导出成jpg格式，默认为png
//param jpgQuality  int     jpg质量，默认60
function saveScenePng(psd, fileName, writeToDisk,notMerge,asJpg,jpgQuality)
{
    // we should now have a single art layer if all went well
    if(!notMerge)
    {
        psd.mergeVisibleLayers();
    }

    // figure out where the top-left corner is so it can be exported into the scene file for placement in game
    // capture current size
    var height = psd.height.value;
    var width = psd.width.value;
    var top = psd.height.value;
    var left = psd.width.value;
    // trim off the top and left
    psd.trim(TrimType.TRANSPARENT, true, true, false, false);
    // the difference between original and trimmed is the amount of offset
    top -= psd.height.value;
    left -= psd.width.value;
    // trim the right and bottom
    psd.trim(TrimType.TRANSPARENT);
    // find center
    top += (psd.height.value / 2)
    left += (psd.width.value / 2)
    // unity needs center of image, not top left
    top = -(top - (height / 2));
    left -= (width / 2);

    height = psd.height.value;
    width = psd.width.value;

    var rec = {
        y: top,
        x: left,
        width: width,
        height: height
    };

    // save the scene data
    if(!notMerge){
        sceneData += "<position>";
        sceneData += "<x>" + rec.x + "</x>";
        sceneData += "<y>" + rec.y + "</y>";
        sceneData += "</position>";

        sceneData += "<size>";
        sceneData += "<width>" + rec.width + "</width>";
        sceneData += "<height>" + rec.height + "</height>";
        sceneData += "</size>";
    }

     if (writeToDisk)
     {
        var suffix = ".png";
        var pngSaveOptions = new ExportOptionsSaveForWeb();
        
        if(asJpg == true)
        {
            pngSaveOptions.format = SaveDocumentType.JPEG;
            suffix = ".jpg";
            if(jpgQuality)
            {
                pngSaveOptions.quality = jpgQuality;
            }
        }
        else
        {
            pngSaveOptions.format = SaveDocumentType.PNG;
            pngSaveOptions.PNG8 = false;
        }
     
        var pngFile = new File(destinationFolder + "/" + fileName + suffix);
        psd.exportDocument(pngFile,ExportType.SAVEFORWEB,pngSaveOptions);
    }
    psd.close(SaveOptions.DONOTSAVECHANGES);

}

function makeValidFileName(fileName)
{
    var validName = fileName.replace(/^\s+|\s+$/gm, ''); // trim spaces
    //删除九宫格关键字符
    validName = validName.replace(/\s*_9S(\:\d+)+/g,"");

    //删除text角度关键字符（不应该写这里，但是暂时这样吧）
    validName = validName.replace(/\s*_Angle(\:\d+)/g,"");

	// 删除渐变色关键字
	validName = validName.replace(/\s*_JB(\:[a-zA-Z0-9]+)+/g,"");

	// 删除outline
	validName = validName.replace(/\s*_OL(\:[a-zA-Z0-9]+)+/g,"");

    validName = validName.replace(/[\\\*\/\?:"\|<>]/g, ''); // remove characters not allowed in a file name
    validName = validName.replace(/[ ]/g, '_'); // replace spaces with underscores, since some programs still may have troubles with them

    if (validName.match("@Common") ||//2022-5-10 广州寰宇加@
		validName.match("Global") ||
		validName.match("CustomAtlas") ||
        validName.match("@PNG") ||
        validName.match("@JPG"))
    {
        validName = validName.substring (0,validName.lastIndexOf ("@"));  //截取@之前的字符串作为图片的名称。
    }/* 2022-5-10 广州寰宇注释：导出图片不要加数值后缀
    else if(!sourcePsdName.match("@Common") ||//2022-5-10 广州寰宇加@
			!sourcePsdName.match("Global") ||
			!sourcePsdName.match("CustomAtlas"))    // 判断是否为公用的PSD素材文件，如果不是，则自动为图片增加后缀，防止重名。 公用psd文件的图片层不允许重名。
    {
        validName += "_" + uuid++;
    }
    */
     $.writeln(validName);
    return validName;
}

//vMakeValidFileName 是函数 makeValidFileName的返回值
function getArtLayerName(vMakeValidFileName)
{
	var layerName = vMakeValidFileName;
	if(layerName.match("!"))
	{
		layerName = layerName.substring(layerName.lastIndexOf("!") + 1, layerName.length);
	}
	return layerName;
}

//vMakeValidFileName 是函数 makeValidFileName的返回值
function getOutputFileName(vMakeValidFileName)
{
	var fileName = vMakeValidFileName;
	if(fileName.match("!"))
	{
		fileName = fileName.substring (0, fileName.lastIndexOf ("!"));
	}
	return fileName;
}
/***************************************************************************************************************************************************************************************************************/
//对称的图片处理，切一半
//2017.01.10
//by zs

// 裁切 基于透明像素
function trim(doc){
    doc.trim(TrimType.TRANSPARENT,true,true,true,true);
}

// 裁剪左半部分
function cutLeftHalf(doc,layerName){
    doc.mergeVisibleLayers();

    trim(doc);
    var _obj = doc.activeLayer

    var width = doc.width;
    var height = doc.height;
    var side = width / 2;

    var region = Array(Array(0,height),Array(0,0),Array(side,0),Array(side,height));

    var selectRect = doc.selection.select(region);
    doc.selection.copy();
    var newStem = doc.paste();
    newStem.name = layerName;

    var deltaX = 0;
    var deltaY = 0;
    if(region[0][0] != 0){
        deltaX = -(width - side*2);
    }
    newStem.translate(deltaX,deltaY);

    _obj.visible = false;
    trim(doc);
    saveScenePng(doc, layerName, true,true);
    // exportHalfImage(doc,"LeftHalf");
}

// 裁剪下半部分
function cutBottomHalf(doc,layerName){
    doc.mergeVisibleLayers();

    trim(doc);
    var _obj = doc.activeLayer
    var width = doc.width;
    var height = doc.height;
    var side = height / 2;

    //var region = Array(Array(0,side),Array(0,0),Array(width,0),Array(width,side));
    var region = Array(Array(0,height),Array(0,side),Array(width,side),Array(width,height));

    var selectRect = doc.selection.select(region);
    doc.selection.copy();
    var newStem = doc.paste();
    newStem.name = layerName;

    var deltaX = 0;
    var deltaY = 0;
    if (region[0][1] != side){
        deltaY = -(height - side*2);
    }
    newStem.translate(deltaX,deltaY);

    _obj.visible = false;

    trim(doc);
    saveScenePng(doc, layerName, true,true);
    //exportHalfImage(doc,"UpHalf");
}

// 裁剪左下四分之一
function cutQuarter(doc,layerName){
    doc.mergeVisibleLayers();

    trim(doc);
    var _obj = doc.activeLayer
    var width = doc.width;
    var height = doc.height;
    var side = height / 2;

    var region = Array(Array(0,height),Array(0,height / 2),Array(width / 2,height / 2),Array(width / 2,height));

    var selectRect = doc.selection.select(region);
    doc.selection.copy();
    var newStem = doc.paste();
    newStem.name = layerName;

    var deltaX = 0;
    var deltaY = 0;
    if (region[0][1] != side){
        deltaY = -(height - side*2);
    }
    newStem.translate(deltaX,deltaY);

    _obj.visible = false;

    trim(doc);
    saveScenePng(doc, layerName, true,true);
}

function exportHalfImage(psd,halfType)
{
    hideAllLayers(psd);

    var layerName  = "";
     for (var i = psd.layers.length - 1; 0 <= i; i--)
     {
         layerName = psd.layers[i].name;
         if(layerName.match(halfType))
         {
             psd.layers[i].visible = true;
             saveScenePng(psd, layerName, true,true);
         }
     }
}


/***************************************************************************************************************************************************************************************************************/
//九宫格切图
//2017.01.13
//by HuangLang

function _9sliceCutImg(doc,layerName,vaildName){
    // 创建图层组
    var _obj = doc.activeLayer
    var stemGroup = doc.layerSets.add();
    stemGroup.name = layerName
    // _obj.move(stemGroup,ElementPlacement.PLACEATEND)
    doc.mergeVisibleLayers();
  trim(doc);
   var width = doc.width;
   var height = doc.height;
    var re = /\s*_9S(\:\d+)+/g;
    var getStr = ""
    var result = layerName.match(re)
    if (result) {
        getStr = result[0]
    }else{
        alert("图层名为："+layerName+"的九宫格格式不对！应为_9S:XX或:XX:XX:XX:XX");
        return;
    }

   var  nums = getStr.split(":")
   if ( nums.length == 2) {
      for(var j = 0;j<slicePaddingArr.length;j++)
      {
        sliceOriArr[j] = parseInt(nums[1])
         slicePaddingArr[j] = parseInt(nums[1])
         }
     }
     else if ( nums.length == 5)
     {
      for(var j = 0;j<slicePaddingArr.length;j++)
      {
          var num = parseInt(nums[j+1])
          sliceOriArr[j] = num
          if  (num == 0 ){
              if ((j+1) %2 == 0) {
                num = parseInt(height/2)

              }else{

                num = parseInt(width/2)
              }
          }
         slicePaddingArr[j] = num
     }
    }else{
      alert("图层名为："+layerName+"的九宫格格式不对！应为_9S:XX或:XX:XX:XX:XX");
      return;
    }

    var _obj = doc.activeLayer
    //左下左上，右上右下
    var selRegion = Array(
        Array(Array(0,slicePaddingArr[1]),Array(0, 0),Array(slicePaddingArr[0] , 0),Array(slicePaddingArr[0], slicePaddingArr[1])),
        Array(Array(width-slicePaddingArr[2],slicePaddingArr[1]),Array(width-slicePaddingArr[2], 0),Array(width , 0),Array(width, slicePaddingArr[1])),
        Array(Array(0,height),Array(0, height-slicePaddingArr[3]),Array(slicePaddingArr[0] , height-slicePaddingArr[3]),Array(slicePaddingArr[0], height)),
        Array(Array(width-slicePaddingArr[2],height),Array(width-slicePaddingArr[2], height-slicePaddingArr[3]),Array(width , height-slicePaddingArr[3]),Array(width, height)),
        );
    for (var i = 0;i<selRegion.length;i++)
    {
        doc.activeLayer = _obj;
        doc.selection.select(selRegion[i]);
        // doc.selection.copy();
        executeAction(charIDToTypeID("CpTL"));
        // var newStem = doc.paste();
        var newStem = doc.activeLayer;
        newStem.name = vaildName;
        var deltaX = 0;
        var deltaY = 0;
        if(selRegion[i][0][0] != 0){
            deltaX = - (width - slicePaddingArr[0]-slicePaddingArr[2]);
        }
        if(selRegion[i][1][1] != 0){
            deltaY = - (height - slicePaddingArr[1]-slicePaddingArr[3]);
        }
        newStem.translate(deltaX,deltaY);
    }
    _obj.visible = false;
    doc.mergeVisibleLayers();
    sceneData += "<arguments>";
    sceneData += "<string>" + sliceOriArr[0] + "</string>";
    sceneData += "<string>" + sliceOriArr[1] + "</string>";
    sceneData += "<string>" + sliceOriArr[2] + "</string>";
    sceneData += "<string>" + sliceOriArr[3] + "</string>";
    sceneData += "</arguments>";

    trim(doc);
    saveScenePng(doc, vaildName, true,true);
}

function CorrectTextSize(layer)

{

    var r = new ActionReference();

    r.putProperty(stringIDToTypeID("property"), stringIDToTypeID("textKey"));

    r.putIdentifier(stringIDToTypeID("layer"), layer.id);

    return executeActionGet(r).getObjectValue(stringIDToTypeID("textKey")).getList(stringIDToTypeID('textStyleRange')).getObjectValue(0).getObjectValue(stringIDToTypeID('textStyle')).getUnitDoubleValue(stringIDToTypeID('impliedFontSize'))

}