/*
 * To print output to console:
 *    console.error(yScales[is](0));
 * 
 * To do:
 * //- add axis labels
 * //- add legend
 * //- add symbol shapes, also to legends
 * //- allow metadata to be set in final rows
 * //- allow y axis titles to be set
 * //- automate output
 *   //o generate svg from js: use node.js
 *   //o convert svg to png: convert -size 1024 acit.svg acit.png
 *   //o embed styles in svg
 *   //o write batch script to take csvs to pngs
 * //- allow override of default bottom-right legend position
 * //- support secondary yScale
 * //- make symbol order like existing LO calc graphs
 * - add unit support eg so data can be in mn but converted to bn for axis
 * //- add switch for lines and symbols
 * //- setting of secondary scale
 * //- ensure primary and secondary scales align - AJC: don't use .nice()!
 * //- add support for multi column bars
 * //- add support for stacked column bars
 */

d3 = require('d3');
exports.d3=d3;

var NOTSET="-NOTSET-";
var CATEGORY="CATEGORY", LINEAR="LINEAR", DATE="DATE"; //xScaleType
var width = 1000;
var height = 600;
var padding = 80;
var symbolSize=100;
var maxBarWidthLegend=50;
var tickSize=6;
var gridStrokeColor="#BBB";

//Exact values I used in LO calc: blue,red,green,maroon,cyan
var colors_normal = ["#004586", "#ff420e", "#579d1c", "#7e0021", "#83caff","#111111"];
var barLineColour_normal = "crimson";
var colors_grey = ["#000000", "#888888", "#222222", "#666666", "#444444","#111111"];
var barLineColour_grey = "#000000";
var colors=colors_normal;
var barLineColour=barLineColour_normal;
var isFillPatterned=false;
var fillPatternCol=-1;

//Note: font is a CSS property NOT an SVG style
//font-family
var titleFont="Liberation Sans";
var legendFont="Liberation Sans";
var axisFont="Liberation Sans";
//font-size
var titleFontSize="18px";
var legendFontSize="18px";
var axisFontSize="18px";

/* Following are all meta info that can be set in CSV */
var xAxisTitle="";
var yAxisTitle=["Primary y axis","Secondary y axis"];
var isMetaSection=false;
var ymin=[NaN,NaN];
var ymax=["auto","auto"];
var isNice=true;
var legendx=NOTSET;
var legendy=NOTSET;
var xScaleType=CATEGORY;
var parseDate = d3.timeParse("%d-%b-%y");//03-mar-13
var isLegendShown=true;
var isSymbols=false;
var isLines=true;
var isXgrid=false;
var isBars=false;
var barsLineCol=NaN;
var isStacked=false;
var isStackedLegendRight=false;
var iTicks=1;
var horizLines=[];
var topPadding = 0; //In addition to padding, useful if bar legend wraps
var bottomPadding = 0;//In addition to padding, useful if bottom labels too long
var leftPadding = 0;
var rightPadding = 0;
var xRotate=-45; //Rotation for xlabels in degrees clockwise.
//scales contains either 0 for left axis or 1 for right.
//First index is for j=0 which is x axis but is ignored.
var scales=[];

//Calculated later after data and so leftPadding loaded.
var plotAreaWidth;
var plotAreaHeight;

exports.rowConverter = function(d, i, colNames) {
        if(scales.length==0){
            scales = new Array(colNames.length+1).fill(0);
        }
        var firstCol=d[colNames[0]];
        if(firstCol.trim()[0]=="#"){
            return;//ignore line
        } else if(firstCol=="-META-"){
            isMetaSection=true;
            return;
        } else if(!isMetaSection){
            var obj ={};
            obj[colNames[0]]=firstCol;
            for(j=1;j<colNames.length;j++){
	      	//console.error(d[colNames[j]];
	        //Replace thousand commas but not locale safe
                obj[colNames[j]]=parseFloat(d[colNames[j]].replace(/,/g, ''));
		//console.error(obj[colNames[j]]);
            }
            return obj;
        } else {
            var secCol=d[colNames[1]];
            if(secCol instanceof String){
                var secCol=secCol.trim();
            }
            switch(firstCol){
                case "XAXISTITLE":
                xAxisTitle=secCol;
                break;
                case "YAXISTITLE":
                yAxisTitle[0]=secCol;
                break;
                case "YAXISTITLE2":
                yAxisTitle[1]=secCol;
                break;
                case "USEYAXIS2":
                scales[secCol]=1;
                break;
                case "YMIN":
                ymin[0]=parseFloat(secCol);
                break;
                case "YMAX":
                ymax[0]=parseFloat(secCol);
                break;
                case "YMIN2":
                ymin[1]=parseFloat(secCol);
                break;
                case "YMAX2":
                ymax[1]=parseFloat(secCol);
                break;
		case "NICE":
                isNice=(secCol.toLowerCase()=="true");
                break;
                case "LEGENDX":
                legendx=secCol;
                break;
                case "LEGENDY":
                legendy=parseFloat(secCol);
                break;
                case "LEGEND":
                isLegendShown=(secCol.toLowerCase()=="true");
                break;
                case "LINES":
                isLines=(secCol.toLowerCase()=="true");
                break;
		case "XGRID":
                isXgrid=(secCol.toLowerCase()=="true");
                break;
                case "SYMBOLS":
                isSymbols=(secCol.toLowerCase()=="true");
                break;
                case "SYMSTYLES":
                for(j=1;j<colNames.length;j++){
                    setSymbol(j-1,d[colNames[j]]);
                }
                break;
                case "HORIZLINES":
                horizLines.push(0);//dummy
                for(j=1;j<colNames.length;j++){
                    horizLines.push(parseFloat(d[colNames[j]]));
                }
                break;                
                case "BARS":
                isBars=(secCol.toLowerCase()=="true");
                if(isBars){
                    isLines=false;//Lines off unless user says Otherwise AFTER bars
                    isSymbols=false;//Ditto for symbols
                }
                break;
                case "STACKED"://only for bars - will get set back to false if isBars==false
                isStacked=(secCol.toLowerCase()=="true");
                break;
                case "STACKEDLEGENDRIGHT":
                isStackedLegendRight=(secCol.toLowerCase()=="true");
                break;
                case "FILLPATTERNED":
                isFillPatterned=(secCol.toLowerCase()=="true");
		if(isFillPatterned==false){
		  isFillPatterned=true;
		  fillPatternCol=parseInt(secCol);
		}
                break;                   
                case "USELINE"://only for bars - this column will be plotted as a line
                barsLineCol=parseInt(secCol);
                break;
                case "XTICKSEVERY":
                iTicks=parseInt(secCol);
                break;
                case "BOTTOMPADDING":
                bottomPadding=parseInt(secCol);
                break;
                case "TOPPADDING":
                topPadding=parseInt(secCol);
                break;
                case "LEFTPADDING":
                leftPadding=parseInt(secCol);
                break;
                case "RIGHTPADDING":
                rightPadding=parseInt(secCol);
                break;
                case "XROTATE":
                xRotate=parseInt(secCol);
                break;
                case "BARLINECOLOUR":
                barLineColour=secCol;
                break;
                case "XSCALETYPE":
                xScaleType=secCol;
                bottomPadding=50;
                break;
            }
            return;
        }
}          

//Sums column values in d up to but not including end
function sumd(d,data,end){
    if(typeof end === "undefined") {
        end = data.columns.length;
    }
    var dSum=0;
    for(k=1;k<end;k++){dSum+=d[data.columns[k]];}
    return dSum;    
}

function definedOrZero(x){
    return (x==0 || x);
}

exports.createSVG = function(body,data, isGrey) {
    if(isGrey){
      colors=colors_grey;
      barLineColour=barLineColour_grey;
    } else {
      isFillPatterned=false;//if colour, override fill patterns if set from CSV
      fillPatternCol=-1;      
    }
    var xName=data.columns[0];
    plotAreaWidth=width-2*padding-leftPadding-rightPadding;
    plotAreaHeight=height-2*padding-topPadding-bottomPadding;
    if(!isBars){isStacked=false;}//stacked is only for bars just now
    var yScales = [];
    var isSecondaryScale= !isStacked && scales.includes(1);
    for(is=0;is<=1;is++){
        var mins=[],maxs=[];
        if(!isStacked){
            for(j=1;j<data.columns.length;j++){
                if(scales[j]==is){
                    mins.push(d3.min(data, function(d){return d[data.columns[j]];}));
                    maxs.push(d3.max(data, function(d){return d[data.columns[j]];}));                 
                }
            }
        } else {
            mins.push(d3.min(data, function(d){return sumd(d,data);}));
            maxs.push(d3.max(data, function(d){return sumd(d,data);}));             
        }
        var dmin = ymin[is];
        var dmax = ymax[is];
        if(dmax=="auto"){
            dmax = Math.max(...maxs);
        }
        var dtmpmin = Math.min(...mins);
        if(ymin[is]==="auto"){//User asked for min to be determined
            dmin = ymin[is];
        } else if(!isNaN(ymin[is])){//User set it to a value
            dmin = ymin[is];
        } else if(isNaN(ymin[is]) && dtmpmin<0.){
            //User hasn't set min but there are negative values
            dmin = dtmpmin;
        } else {//Otherwise default to zero
            dmin=0.0;
        }
        //Disable .nice() as it can cause second axis to misalign with first.
        yScales[is] = d3.scaleLinear()
                    .domain([dmin,dmax])
                    .range([height-padding-bottomPadding-topPadding,padding+topPadding]);
	if(isNice){
	  yScales[is]=yScales[is].nice();
	}
    }

    var xScale;
    var xOffset=0.;
    var xRange=[padding+leftPadding, width-padding-rightPadding];
    if(xScaleType==LINEAR){
        var xx = data.map(function(a){return parseFloat(a[xName]);});
        xScale = d3.scaleLinear()
                    .domain([d3.min(xx),d3.max(xx)])
                    .range(xRange);
    } else if(xScaleType==DATE) {
        var xx = data.map(function(a){
            a[xName]=parseDate(a[xName]);
            return a[xName];
        });
        xScale = d3.scaleTime()
                    .domain([d3.min(xx),d3.max(xx)])
                    .range(xRange);
    } else if(xScaleType==CATEGORY) {
        xScale = d3.scaleBand()
                .domain(data.map(function(a){return a[xName];}))
                .rangeRound(xRange)
                .paddingInner(0.2)    
                .paddingOuter(0.2);
                 xOffset=xScale.bandwidth()/2;//Offset from left yaxis to first x axis tick             
    }
        
                
    var svg = body.append("svg")
                .attr("width",width)
                .attr("height",height);
    
    if(isFillPatterned){
        setupPatterns(svg);
    }
    svg.append('defs')
        .append('pattern')
            .attr('id', 'diagonalHatch')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4)
        .append('path')
            .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1);          
                
    //yBarBase set on primary scale but must be same for secondary scale            
    var yBarBase=yScales[0](Math.max(0,yScales[0].domain()[0]));//where bottom of bars end

    var xFirstBarLeft, nBars,barWidth;
    
    if(isBars){
        xFirstBarLeft=xOffset-xScale.bandwidth()/2;
        nBars=data.columns.length-1;
        if(!isNaN(barsLineCol)){
            nBars-=1;
        } 
        var barWidth=xScale.bandwidth()/nBars;
    }
    
    if(isStacked){barWidth=xScale.bandwidth();}
    
    var yGroup=makeYAxis(svg,yScales,0,xRange[0])
    if(isSecondaryScale){
        makeYAxis(svg,yScales,1,xRange[1])   
    }
    
    var yPosXAxis=yScales[0].range()[0];
    makeXAxis(svg,xScale,yPosXAxis,xAxisTitle,true);
    if(isBars && yBarBase<yPosXAxis){//For negative bars
        makeXAxis(svg,xScale,yBarBase,"",false);        
    }

    var isToDoStackedLegendLater=false;
    if(isLegendShown && data.columns.length>2){        
        if(isBars){
            if(isStacked && isStackedLegendRight){
                isToDoStackedLegendLater=true;              
            }
            else {
                makeBarLegend(svg.append("g"),data.columns,padding+leftPadding
                    ,Math.min(barWidth,maxBarWidthLegend));
            }
        }
        else {//If only one series YAXISTITLE will suffice
            makeLegend(svg.append("g"),data.columns,xOffset,xScale,yScales);
        }
    }
    
    for(j=1;j<data.columns.length;j++){
        var yScale=yScales[scales[j]];
        var yName=data.columns[j];
        if(isBars && j!=barsLineCol){
            var xBarLeftj=xFirstBarLeft;
            if(!isStacked){xBarLeftj+=(j-1)*barWidth;}
            var bars = svg.append("g").attr("id","bars")
                .selectAll("rect")
                .data(data.filter(function(d){return definedOrZero(d[yName]);}))
                .enter()
                .append("rect")
                .attr("x", function(d){return xBarLeftj+xScale(d[xName]);})
                .attr("y", function(d){
                    var y;
                    if(!isStacked){
                        y=yScale(d[yName]);
                    } else {
                        y=yScale(sumd(d,data,j+1));
                    }
                    return Math.min(y,yBarBase);//negative bar
                 })
                .attr("width", barWidth)
                .attr("height", function(d){return  Math.abs(yBarBase-yScale(d[yName]));});
            applyBarStyles(bars,j);
        }
        
        if(isLines || j==barsLineCol){
            var line = d3.line()
                        .defined(function(d){return definedOrZero(d[yName]);})
                        .x(function(d){return xScale(d[xName])+xOffset;})        
                        .y(function(d){return yScale(d[yName]);});    
                        
            var linePath=svg.append("g").attr("id","lines")
                .append("path")
                .datum(data)
                .attr("d",line);
            applyLineStyles(linePath,j);
        }
        
        if(isSymbols){
            var symbol=d3.symbol().type(symbols[j-1]);
            var syms = svg.append("g").attr("id","symbols")
            .selectAll(".point")
            .data(data.filter(function(d){return definedOrZero(d[yName]);}))
            .enter()
            .append("path")
            .attr("d", symbol.size(symbolSize))
            .attr("transform", function(d) {
                var x = xScale(d[xName])+xOffset;
                var y = yScale(d[yName]);
                return "translate("+x+","+y+")";
            });
            applySymbolStyles(syms,j);
        }
    }
    
    var horizLineGroup=svg.append("g").attr("id","horizLines")
    for(j=1;j<horizLines.length;j++){
        var yScale=yScales[scales[j]];        
        var line = horizLineGroup.append("line")
        .attr("x1",xScale.range()[0])
        .attr("y1",yScale(horizLines[j]))
        .attr("x2",xScale.range()[1])
        .attr("y2",yScale(horizLines[j]));
        applyLineStyles(line,j,1);
        
    }
    
    if(isToDoStackedLegendLater){
        makeStackedBarLegend(svg.append("g"),data.columns,padding
            ,Math.min(barWidth,maxBarWidthLegend),data, yScales); 
    }
    return body.html();
}


function setupPatterns(svg){
    //NOTE: Careful with these. Fiddly plus seat share figs in chap 7 depend on them
    //fillPatternCol means only one of the following is set.
    j=2;
    if(fillPatternCol==-1 || fillPatternCol==j){
      svg.append('defs')
	  .append('pattern')
	      .attr('id', 'diagonalHatch2')
	      .attr('patternUnits', 'userSpaceOnUse')
	      .attr('width', 8)
	      .attr('height', 8)
	  .append('path')
	      .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
	      .attr('stroke', '#000000')
	      .attr('stroke-width', 2);
      colors[j]="url(#diagonalHatch2)";
    }
    j=0;
    if(fillPatternCol==-1 || fillPatternCol==j){
      svg.append('defs')
	  .append('pattern')
	      .attr('id', 'diagonalHatch0')
	      .attr('patternUnits', 'userSpaceOnUse')
	      .attr('width', 8)
	      .attr('height', 8)
	  .append('path')
	      .attr('d', 'M0,0 l10,10')
	      .attr('stroke', '#000000')
	      .attr('stroke-width', 2);
      colors[j]="url(#diagonalHatch0)";
    }
    j=4;
    if(fillPatternCol==-1 || fillPatternCol==j){
      svg.append('defs')
	  .append('pattern')
	      .attr('id', 'diagonalHatch4')
	      .attr('patternUnits', 'userSpaceOnUse')
	      .attr('width', 4)
	      .attr('height', 4)
	  .append('path')
	      .attr('d', 'M0,0 l2,2')
	      .attr('stroke', '#000000')
	      .attr('stroke-width', 2);
      colors[j]="url(#diagonalHatch4)";
    }
    if(fillPatternCol==-1){//Only if all fill patterns are used
      colors[3]='#000000'
      colors[5]='#444444'
    }
}
            
var lineStyles = ["","8,8","6,2","2,6","6,2,2,6","4,4"];
//var symbols = d3.symbols;
var symbols = [d3.symbolCircle,d3.symbolSquare,d3.symbolTriangle,d3.symbolDiamond,d3.symbolStar,d3.symbolCross];

function setSymbol(j,symbolName){
    symbols[j]=d3[symbolName];
}

function applyBarStyles(bars,j){
    if(j==barsLineCol){//The line in a bar chart
        bars.style("fill", barLineColour)
    } else if((j-1)<colors.length){
        bars.style("fill", colors[j-1]);
        //bars.style("fill", "url(#diagonalHatch)");
    } else {
        bars.style("fill", "yellow");
    }
}

function applyLineStyles(lines,j,lineStyle){
    lines.style("fill", "none")
    lines.style("stroke-width","3")
    if (typeof(lineStyle)==='undefined'){
        lineStyle=lineStyles[j-1];
    } else {
        lineStyle=lineStyles[lineStyle];
        lines.style("stroke-width","4")
    }
    if(j==barsLineCol){//The line in a bar chart
        lines.style("stroke-width","5");
        lines.style("stroke", barLineColour);
        lines.style("stroke-dasharray","");    
    } else if((j-1)<colors.length){
        lines.style("stroke", colors[j-1])
        lines.style("stroke-dasharray",lineStyle);
    } else {
        lines.style("stroke", "yellow")
        lines.style("stroke-dasharray","");
    }

}

function applySymbolStyles(syms,j){
    syms.style("fill", colors[j-1]);
}

function getTickLabel(isLabels,d,i){
    if(isLabels && i%iTicks==0){
        if(xScaleType==DATE)
            return d3.timeFormat("%d-%b-%y")(d);
        else 
            return d;
    } else return "";
}

function makeXAxis(svg,xScale,yPos,xName,isLabels){ 
    var xAxis;
    var xGrid;
    if(xScaleType==DATE){
        xAxis = d3.axisBottom().scale(xScale);
	xGrid = d3.axisBottom().scale(xScale);
    } else {
        xAxis = d3.axisBottom().scale(xScale).ticks(5);
	xGrid = d3.axisBottom().scale(xScale).ticks(5);
    }
    var xAxisGroup = svg.append("g").attr("id","xAxisGroup");
    
    if(isXgrid){
      xGrid=xGrid.tickFormat("").tickSize(-plotAreaHeight);
      xAxisGroup.append("g")//grid lines only for primary axis
	      .attr("class","xgrid")
	      .call(xGrid);
      xAxisGroup.selectAll(".xgrid line")
	  .attr("stroke",gridStrokeColor);
      xAxisGroup.selectAll(".xgrid path")//Stops a big line appearing at the top
	  .attr("stroke-width",0);
    }
    
    var dx=Math.sin(xRotate)*parseInt(legendFontSize)/2;
    var dy=parseInt(legendFontSize)/5;
    var textAnchor="end";
    if(xRotate==0){textAnchor="middle";}
    xAxisGroup.append("g")   
            .attr("class", "axis")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor",textAnchor)
            .style("font-family",axisFont)
            .style("font-size",axisFontSize)
            .attr("transform","translate("+dx+","+dy+")rotate("+xRotate+")")
            .text(function(d,i){return getTickLabel(isLabels,d,i);});
    
    xAxisGroup.attr("transform", "translate(0," + yPos + ")");
    if(isLabels){    
            xAxisGroup.append("text")
            .style("font-family",titleFont)
            .style("font-size",titleFontSize)
            .style("text-anchor","middle")
            .attr("transform", "translate("+(width/2)+"," + (bottomPadding+padding*0.8) + ")")
            .text(xName);
    }
}

function makeYAxis(svg,yScales,num,dx){
    var yAxis, tickTrans;
    var yAxisGroup = svg.append("g").attr("id","yAxisGroup"+(num+1));        
    if(num==0){
        yAxis=d3.axisLeft().scale(yScales[0]).ticks(5);
        var yGrid=d3.axisLeft().scale(yScales[0]).ticks(5)
            .tickFormat("")
            .tickSize(-plotAreaWidth);
        yAxisGroup.append("g")//grid lines only for primary axis
                .attr("class","ygrid")
                .call(yGrid);
        yAxisGroup.selectAll(".ygrid line")
            .attr("stroke",gridStrokeColor);
        yAxisGroup.selectAll(".ygrid path")//Stops a big line appearing at the top
            .attr("stroke-width",0);
    } else {
        yAxis=d3.axisRight().scale(yScales[1]).ticks(5);
    }
    yAxisGroup.append("g")
            .style("font-family",axisFont)
            .style("font-size",axisFontSize)
            .attr("class", "axis")
            .call(yAxis);
    var yPos;
    if(num==0){
        yPos = -0.6*dx;
    } else {
        yPos = 0.8*(padding+rightPadding);
    }
            
    yAxisGroup.attr("transform", "translate(" + dx + ",0)")
        .append("text")
        .style("font-family",titleFont)
        .style("font-size",titleFontSize)
        .style("text-anchor","middle")
        .attr("transform","rotate(-90)") //With -90 rotation
         .attr("x", -(-bottomPadding/2+height/2)) //x is negative y
         .attr("y",yPos) //y is x
        .text(yAxisTitle[num]);
}

function makeBarLegend(legendGroup,colNames,dx,barWidth){
    //user setting of legendx and legendy are ignored - legend at top
    var dp=0.3; //30% of padding is above and below legend
    var lx=1.1*dx;
    var lHeight=(1-2*dp)*padding;
    var ly=dp*lHeight;
    legendGroup.attr("id","bar-legend");
    legendGroup.attr("transform", "translate("+lx+"," + ly + ")");
    
    var lWidth=width-padding-lx;
    var ldx=lWidth/(colNames.length-1);
    var fontSize=parseInt(legendFontSize);
    var xPos=0;
    var yPos=0;
    for(j=1;j<colNames.length;j++){
        var barSpace=barWidth+ fontSize/3;
        var textSpace=(0.2+0.5)*getLegendTextWidth(colNames[j])*fontSize;
        var xPosNext=xPos+barSpace+textSpace;
        if(xPosNext>=lWidth){
            xPos=0;
            yPos+=1.1*lHeight;
        }
        var barHeight=lHeight;
        var yTextPos=yPos+lHeight/2+ fontSize/3;        
        var yBar=yPos;
        if(j==barsLineCol){
            barHeight=5;
            yBar=yPos+(lHeight-barHeight)/2;
        }
        var bar = legendGroup.append("rect")
            .attr("x", xPos)
            .attr("y", yBar)
            .attr("width", barWidth)
            .attr("height", barHeight);
        applyBarStyles(bar,j);
        xPos+=barSpace;
        legendGroup.append("text")
                .style("font-family",legendFont)
                .style("font-size",legendFontSize)
                .attr("transform", "translate("+xPos+","+yTextPos+")")
                .text(getLegendText(colNames[j]));
        xPos+= textSpace;       
    }
}

//Returns size of string roughly accounting for caps
function getLegendTextWidth(colName){
    var w=0;
    for(var i=0;i<colName.length;i++){
        character = colName.charAt(i);
        if (!isNaN(character * 1)){//Numeric
            w+=1.3;
        }else{//Non-numeric
            if (character == character.toLowerCase()){
                w+=1.1;
            } else {//upper case or anything else
                w+=1.3;
            }
        }
    }
    return w;
}

function getLegendText(colName){
    if(scales[j]==1){
        return colName+" (right axis)";
    } else {
        return colName;
    }
}

function makeLegend(legendGroup,colNames,xOffset,xScale,yScales){
    var legendLineWidth=padding/2
    legendData=[[0,0],[legendLineWidth,0]];
    legendSymbolData=[[legendLineWidth/2,0]];
    //lx,ly are legend svg coords. legendx,legendy are in data coords, if set.
    var lx;
    var ly;
    if(legendx==NOTSET){
        lx=0.65*width;
    } else if(legendx=='-YAXIS-'){
        lx=1.1*(padding+leftPadding);
    } else {
        if(xScaleType==DATE) legendx=parseDate(legendx);
        lx=xScale(legendx)+xOffset;
    }
    if(legendy==NOTSET){
        ly=0.75*yScales[0].range()[0];
    } else {
        ly=yScales[0](legendy);
    }

    var lineHeight=1.2*parseInt(legendFontSize);
    var lHeight=lineHeight*(colNames.length-1);
    var maxNameLength=d3.max(colNames, function(d){return d.length;});
    var lWidth=maxNameLength*0.55*lineHeight;
    
    legendGroup.attr("id","legend");
    legendGroup.attr("transform", "translate("+lx+"," + ly + ")");
    legendGroup.append("rect").attr("y",-lineHeight/2)
        .attr("width",lWidth).attr("height",lHeight)
        .attr("fill","white").attr("opacity",0.7);

    for(j=1;j<colNames.length;j++){
        var dy=(j-1)*lineHeight;
        if(isLines){
            var legendLine=legendGroup.append("path")
                    .attr("transform", "translate(0,"+dy+")")
                    .datum(legendData)
                    .attr("d",d3.line())
            applyLineStyles(legendLine,j);
        }
        if(isSymbols){
            var symbol=d3.symbol().type(symbols[j-1]);
            var legendSym=legendGroup.selectAll(".point")
                    .data(legendSymbolData)
                    .enter()
                    .append("path")
                    .attr("d", symbol.size(symbolSize))
                    .attr("transform", function(d) {
                        return "translate("+d[0]+","+dy+")";
            });
            applySymbolStyles(legendSym,j);
        }

        dy+= parseInt(legendFontSize)/3;
        legendGroup.append("text")
                //.style("dominant-baseline","middle") instead dy adjusted by legendFontSize above
                .style("font-family",legendFont)
                .style("font-size",legendFontSize)
                .attr("transform", "translate("+(1.1*legendLineWidth)+","+dy+")")
                .text(getLegendText(colNames[j]));
        
    }
}

function makeStackedBarLegend(legendGroup,colNames,dx,barWidth,data,yScales){
    var lastRow=data[data.length-1];

    //user setting of legendx and legendy are ignored - legend at right
    var dp=0.3; //30% of padding is left and right of legend
    var lx=width-padding-rightPadding;
    var lHeight=height-2*padding-topPadding-bottomPadding;
    var ldy=0.8*lHeight/(colNames.length-1);
    var ly=0;
    
    legendGroup.attr("id","bar-legend");
    legendGroup.attr("transform", "translate("+lx+"," + ly + ")");
    var fontSize=parseInt(legendFontSize);
    var xPos=dp*padding;
    var yPos=padding+topPadding+ldy;
    var yScale=yScales[scales[1]];//stacked bar charts don't have sec y axis
    var yLast=sumd(lastRow,data,colNames.length);
    for(j=colNames.length-1;j>0;j--){
        legendGroup.append("text")
                .style("font-family",legendFont)
                .style("font-size",legendFontSize)
                .attr("transform", "translate("+xPos+","+yPos+")")
                .text(getLegendText(colNames[j]));
        var yBar=sumd(lastRow,data,j);
        var yMid = (yLast+yBar)/2;
        yLast=yBar;
        var lineData = [  
                        {'x': 0.9*xPos, 'y': yPos}, 
                        {'x': -0.4*xPos,    'y': yScale(yMid)},
                        ];
        var line = d3.line()
                 .x(function(d) { return d['x']; })
                 .y(function(d) { return d['y']; });    
                    
        var linePath=legendGroup.append("path")
            .datum(lineData)
            .attr("d",line);
        applyLineStyles(linePath,1);                       
        yPos+= ldy;       
    }
}
