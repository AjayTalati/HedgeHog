/*!
 * Chart.js
 * http://chartjs.org/
 *
 * Copyright 2013 Nick Downie
 * Released under the MIT license
 * https://github.com/nnnick/Chart.js/blob/master/LICENSE.md
 * 
 * heavily modified by KristofVL for the HedgeHog project
 */



//Define the global Chart Variable as a class.
window.Chart = function(context){

	var chart = this;
	
	var sspan=86400;
	var soff=0;
	
	var imgdta;
	var prevx=newx=-1;
	
	var poff=34;
	
	//Variables global to the chart
	var width = context.canvas.width;
	var height = context.canvas.height;

	//High pixel density displays - multiply size of canvas by device pixel ratio, then scale.
	if (window.devicePixelRatio) {
		context.canvas.style.width = width + "px";
		context.canvas.style.height = height + "px";
		context.canvas.height = height * window.devicePixelRatio;
		context.canvas.width = width * window.devicePixelRatio;
		context.scale(window.devicePixelRatio, window.devicePixelRatio);
	}

	this.Line = function(data,options){
	
		chart.Line.defaults = {
			scaleSteps : 4,
			scaleStepWidth : 64,
			scaleStartValue : 0,
			scaleLineColor : "rgba(0,0,0,.1)",
			scaleLineWidth : 0,
			scaleShowLabels : false,
			scaleLabel : "<%=value%>",
			scaleFontFamily : "'Arial'",
			scaleFontSize : 0,
			scaleFontStyle : "normal",
			scaleFontColor : "#666",
			scaleShowGridLines : true,
			scaleGridLineColor : "rgba(0,0,0,.05)",
			scaleGridLineWidth : 1,
			datasetStrokeWidth : 0.5,
			datasetFill : false,
			animation : false,
			animationSteps : 0,
			sspan: 86400,
			soff:0
		};
		var config = (options) ? mergeChartConfig(chart.Line.defaults,options) : chart.Line.defaults;
		
		return new Line(data,config,context);
	}
	
	this.Bar = function(data,options){
		chart.Bar.defaults = {
			scaleSteps : 4,
			scaleStepWidth : 32,
			scaleStartValue : 0,
			scaleLineColor : "rgba(0,0,0,.1)",
			scaleLineWidth : 1,
			scaleShowLabels : false,
			scaleLabel : "<%=value%>",
			scaleFontFamily : "'Arial'",
			scaleFontSize : 0,
			scaleFontStyle : "normal",
			scaleFontColor : "#666",
			scaleShowGridLines : false,
			scaleGridLineColor : "rgba(0,0,0,.05)",
			scaleGridLineWidth : 1,
			barShowStroke : false,
			barStrokeWidth : 0,
			barValueSpacing : 0,
			barDatasetSpacing : 0,
			animation : false,
			animationSteps : 12,
			sspan: 86400,
			soff:0
		};
		var config = (options) ? mergeChartConfig(chart.Bar.defaults,options) : chart.Bar.defaults;
		
		return new Bar(data,config,context);		
	}
	
	var clear = function(c){
		c.clearRect(0, 0, width, height);
	};

	var Line = function(data,config,ctx){
		var maxSize, scaleHop, calculatedScale, labelHeight, scaleHeight, valueBounds, labelTemplateString, valueHop,widestXLabel, xAxisLength,yAxisPosX,xAxisPosY;
			
		for (var i=0; i<data.ds.length; i++){
			var d = [];
			while (data.ds[i].d.length) {
				d.push(parseInt(data.ds[i].d.substr(0,2),16));
				data.ds[i].d = data.ds[i].d.substr(2);
			}
			data.ds[i].d = d;
		}
		
		sspan = config.sspan;
		soff = config.soff;
		
		calculateDrawingSizes();
		
		valueBounds = getValueBounds();
		//Check and set the scale
		labelTemplateString = (config.scaleShowLabels)? config.scaleLabel : "";
		calculatedScale = {
				steps : config.scaleSteps,
				stepValue : config.scaleStepWidth,
				graphMin : config.scaleStartValue,
				labels : []
		}
		populateLabels(labelTemplateString, calculatedScale.labels,calculatedScale.steps,config.scaleStartValue,config.scaleStepWidth);
		
		
		scaleHop = Math.floor(scaleHeight/calculatedScale.steps);
		calculateXAxisSize();
		animationLoop(config,drawScale,drawLines,ctx);		
		
		function drawLines(animPc){
			for (var i=0; i<data.ds.length; i++){
				ctx.strokeStyle = data.ds[i].sc;
				ctx.lineWidth = config.datasetStrokeWidth;
				ctx.beginPath();
				ctx.moveTo(yAxisPosX, xAxisPosY - animPc*(calculateOffset(data.ds[i].d[0],calculatedScale,scaleHop)))
				for (var j=1; j<data.ds[i].d.length; j++){
					ctx.lineTo(xPos(j),yPos(i,j));
				}
				ctx.stroke();
				ctx.closePath();
			}
			function yPos(dataSet,iteration){
				return xAxisPosY - animPc*(calculateOffset(data.ds[dataSet].d[iteration],calculatedScale,scaleHop));			
			}
			function xPos(iteration){
				return yAxisPosX + (valueHop * iteration);
			}
		}
		function drawScale(){
			//X axis line
			ctx.lineWidth = config.scaleLineWidth;
			ctx.strokeStyle = config.scaleLineColor;
			ctx.beginPath();
			ctx.moveTo(width-widestXLabel/2+5,xAxisPosY);
			ctx.lineTo(width-(widestXLabel/2)-xAxisLength-5,xAxisPosY);
			ctx.stroke();
			ctx.fillStyle = config.scaleFontColor;
			if (data.l != []) {
				ctx.textAlign = "center";
				for (var i=0; i<data.l.length; i++){
					ctx.save();
					if (data.l[i]!='0') {
						ctx.fillText(data.l[i], yAxisPosX + i*valueHop,xAxisPosY + config.scaleFontSize+3);					
					}
					ctx.beginPath();
					ctx.moveTo(yAxisPosX + i * valueHop, xAxisPosY+3);
					//Check i isnt 0, so we dont go over the Y axis twice.
					if(config.scaleShowGridLines && i>0 && (data.l[i]!="0")){
						ctx.lineWidth = config.scaleGridLineWidth;
						ctx.strokeStyle = config.scaleGridLineColor;					
						ctx.lineTo(yAxisPosX + i * valueHop, 5);
					}
					else{
						ctx.lineTo(yAxisPosX + i * valueHop, xAxisPosY+3);				
					}
					ctx.stroke();
				}
			}
			//Y axis
			ctx.lineWidth = config.scaleLineWidth;
			ctx.strokeStyle = config.scaleLineColor;
			ctx.beginPath();
			ctx.moveTo(yAxisPosX,xAxisPosY+5);
			ctx.lineTo(yAxisPosX,5);
			ctx.stroke();
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			for (var j=0; j<calculatedScale.steps; j++){
				ctx.beginPath();
				ctx.moveTo(yAxisPosX-3,xAxisPosY-((j+1)*scaleHop));
				if (config.scaleShowGridLines){
					ctx.lineWidth = config.scaleGridLineWidth;
					ctx.strokeStyle = config.scaleGridLineColor;
					ctx.lineTo(yAxisPosX+xAxisLength+5,xAxisPosY-((j+1)*scaleHop));					
				}
				else{
					ctx.lineTo(yAxisPosX-0.5,xAxisPosY-((j+1)*scaleHop));
				}
				ctx.stroke();
				if (config.scaleShowLabels){
					ctx.fillText(calculatedScale.labels[j],yAxisPosX-8,xAxisPosY-((j+1)*scaleHop));
				}
			}
		}
		function calculateXAxisSize(){
			var longestText = 1;
			if (config.scaleShowLabels)
				longestText +=30;
			xAxisLength = width-longestText-widestXLabel;
			valueHop = xAxisLength/(data.ds[0].d.length-1);
			yAxisPosX = width-widestXLabel/2-xAxisLength;
			xAxisPosY = scaleHeight + config.scaleFontSize/2;				
		}
		function calculateDrawingSizes(){
			maxSize = height;
			widestXLabel = 1;
			maxSize -= config.scaleFontSize;
			labelHeight = config.scaleFontSize;
			if (config.scaleShowLabels){
				maxSize -= 9;
				maxSize -= labelHeight;
			}
			scaleHeight = maxSize;
		}
		function getValueBounds() {
			return {
				maxValue : 255,
				minValue : 0,
				maxSteps : Math.floor((scaleHeight/(labelHeight*0.66))),
				minSteps : Math.floor((scaleHeight/labelHeight*0.5))
			};
		}
	}
	
	  
	var Bar = function(data,config,ctx){
		var maxSize, scaleHop, calculatedScale, labelHeight, scaleHeight, valueBounds, labelTemplateString, valueHop,widestXLabel, xAxisLength,yAxisPosX,xAxisPosY,barWidth;
		
		for (var i=0; i<data.ds.length; i++){
			var d = [];
			while (data.ds[i].d.length) {
				d.push(parseInt(data.ds[i].d.substr(0,2),16));
				data.ds[i].d = data.ds[i].d.substr(2);
			}
			data.ds[i].d = d;
		}
		
		sspan = config.sspan;
		soff = config.soff;
		
		calculateDrawingSizes();
		
		valueBounds = getValueBounds();
		//Check and set the scale
		labelTemplateString = (config.scaleShowLabels)? config.scaleLabel : "";
		calculatedScale = {
				steps : config.scaleSteps,
				stepValue : config.scaleStepWidth,
				graphMin : config.scaleStartValue,
				labels : []
		}
		populateLabels(labelTemplateString, calculatedScale.labels,calculatedScale.steps,config.scaleStartValue,config.scaleStepWidth);
		scaleHop = Math.floor(scaleHeight/calculatedScale.steps);
		calculateXAxisSize();
		animationLoop(config,drawScale,drawBars,ctx);		
		function drawBars(animPc){
			ctx.lineWidth = config.barStrokeWidth;
			for (var i=0; i<data.ds.length; i++){
					ctx.fillStyle = data.ds[i].fc;
					ctx.strokeStyle = data.ds[i].sc;
				for (var j=0; j<data.ds[i].d.length; j++){
					var barOffset = yAxisPosX + config.barValueSpacing + valueHop*j + barWidth*i + config.barDatasetSpacing*i + config.barStrokeWidth*i;
					ctx.beginPath();
					ctx.moveTo(barOffset, xAxisPosY);
					ctx.lineTo(barOffset, xAxisPosY - animPc*calculateOffset(data.ds[i].d[j],calculatedScale,scaleHop)+(config.barStrokeWidth/2));
					ctx.lineTo(barOffset + barWidth, xAxisPosY - animPc*calculateOffset(data.ds[i].d[j],calculatedScale,scaleHop)+(config.barStrokeWidth/2));
					ctx.lineTo(barOffset + barWidth, xAxisPosY);
					if(config.barShowStroke){
						ctx.stroke();
					}
					ctx.closePath();
					ctx.fill();
				}
			}
		}
		function drawScale(){
			//X axis line
			ctx.lineWidth = config.scaleLineWidth;
			ctx.strokeStyle = config.scaleLineColor;
			ctx.beginPath();
			ctx.moveTo(width-widestXLabel/2+5,xAxisPosY);
			ctx.lineTo(width-(widestXLabel/2)-xAxisLength-5,xAxisPosY);
			ctx.fillStyle = config.scaleFontColor;
			for (var i=0; i<data.ds[0].d.length; i++){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(yAxisPosX + (i+1) * valueHop, xAxisPosY+3);
				if(config.scaleShowGridLines)
				{
					ctx.lineWidth = config.scaleGridLineWidth;
					ctx.strokeStyle = config.scaleGridLineColor;					
					ctx.lineTo(yAxisPosX + (i+1) * valueHop, 5);
				}
				ctx.stroke();
			}
			//Y axis
			ctx.lineWidth = config.scaleLineWidth;
			ctx.strokeStyle = config.scaleLineColor;
			ctx.beginPath();
			ctx.moveTo(yAxisPosX,xAxisPosY+5);
			ctx.lineTo(yAxisPosX,5);
			ctx.stroke();
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			for (var j=0; j<calculatedScale.steps; j++){
				ctx.beginPath();
				ctx.moveTo(yAxisPosX-3,xAxisPosY - ((j+1) * scaleHop));
				if (config.scaleShowGridLines){
					ctx.lineWidth = config.scaleGridLineWidth;
					ctx.strokeStyle = config.scaleGridLineColor;
					ctx.lineTo(yAxisPosX + xAxisLength + 5,xAxisPosY - ((j+1) * scaleHop));					
				}
				else{
					ctx.lineTo(yAxisPosX-0.5,xAxisPosY - ((j+1) * scaleHop));
				}
				
				ctx.stroke();
				if (config.scaleShowLabels){
					ctx.fillText(calculatedScale.labels[j],yAxisPosX-8,xAxisPosY - ((j+1) * scaleHop));
				}
			}
		}
		function calculateXAxisSize(){
			var longestText = 1;
			if (config.scaleShowLabels){
				longestText +=30;
			}
			xAxisLength = width - longestText - widestXLabel;
			valueHop = xAxisLength/(data.ds[0].d.length);
			
			barWidth = (valueHop - config.scaleGridLineWidth*2 - (config.barValueSpacing*2) - (config.barDatasetSpacing*data.ds.length-1) - ((config.barStrokeWidth/2)*data.ds.length-1))/data.ds.length;
			
			yAxisPosX = width-widestXLabel/2-xAxisLength;
			xAxisPosY = scaleHeight + config.scaleFontSize/2;		
		}
		function calculateDrawingSizes(){
			maxSize = height;
			ctx.font = config.scaleFontStyle + " " + config.scaleFontSize+"px " + config.scaleFontFamily;
			widestXLabel = 1;
			maxSize -= config.scaleFontSize;
			labelHeight = config.scaleFontSize;
			maxSize -= labelHeight;
			scaleHeight = maxSize;
		}		
		function getValueBounds() {
			return {
				maxValue : 127,
				minValue : 0,
				maxSteps : Math.floor((scaleHeight / (labelHeight*0.66))),
				minSteps : Math.floor((scaleHeight / labelHeight*0.5))
			};	
		}
	}
	
	function writeMsg(msg){
		context.clearRect(width-46,0,46,14);
		context.font = '10pt Courier';
		context.fillStyle = 'black';
		context.fillText(msg, width-2,7);
	}
	function getMousePos(e){
		var rect = context.canvas.getBoundingClientRect();
		return {x: e.clientX-rect.left, y: e.clientY-rect.top};
	}
	context.canvas.addEventListener('mousemove',function(e) {
			var p=getMousePos(e);
			if (p.x>poff) { 
				var ofs = (p.x-poff)*(sspan/3600)/(width-poff-1); 
				if (sspan==86400) {
					if (navigator.appCodeName=='Mozilla')
						context.canvas.style.cursor = '-moz-zoom-in';
					else
						context.canvas.style.cursor = '-webkit-zoom-in';
					newx = poff-2;
					for (var i=4.5;i<21;i+=3) {
						if (ofs>i) 	newx+=100;
					}
					if ((prevx>0)&&(prevx!=newx)) {
						context.putImageData(imgdta,(prevx-1)*window.devicePixelRatio,0);
					}
					if (prevx!=newx) {
						dropImgDta(202);
						prevx = newx;
					}
				}
				else if (sspan==21600) {
					if (navigator.appCodeName=='Mozilla')
						context.canvas.style.cursor = '-moz-zoom-in';
					else
						context.canvas.style.cursor = '-webkit-zoom-in';
					newx = poff-2;
					for (var i=0.75;i<5.5;i+=0.5) if (ofs>i) 	newx+=88.5;
					if ((prevx>0)&&(prevx!=newx)) {
						context.putImageData(imgdta,(prevx-1)*window.devicePixelRatio,0);
					}
					if (prevx!=newx) {
						dropImgDta(181);
						prevx = newx;
					}
				}
				else if (sspan==3600) {
					if (navigator.appCodeName=='Mozilla')
						context.canvas.style.cursor = '-moz-zoom-in';
					else
						context.canvas.style.cursor = '-webkit-zoom-in';
					newx = poff-2;
					for (var i=0.75/6;i<5.5/6;i+=1/12) if (ofs>i) newx+=88.5;
					if ((prevx>0)&&(prevx!=newx)) {
						context.putImageData(imgdta,(prevx-1)*window.devicePixelRatio,0);
					}
					if (prevx!=newx) {
						dropImgDta(181);
						prevx = newx;
					}
				}
				writeMsg(ftoTime(((soff/3600)+ofs)/24))
			};}, false);
	context.canvas.addEventListener('mouseout',function(e) {
			if (prevx>0) {
				context.putImageData(imgdta,(prevx-1)*window.devicePixelRatio,0);
				prevx= -1;
			}
			writeMsg('     ');
			}, false);
	context.canvas.addEventListener('mousedown', function(e) {
		function zoomInAnim() {
			var animIter=0
			requestAnimFrame(animLoop)
			function animLoop() {
				context.putImageData(scaleXImageData(imgdta,1+animIter),
				poff+1+((5-animIter)*(prevx-poff)/4),
				0)
				if (++animIter < 5)
					requestAnimFrame(animLoop)
				else 
					window.open ('./index_zoom.html?strtt='+strtt+
					'&stopt='+stopt+'&dayid='+dayid,'_self',false)
			}
		}
		var p=getMousePos(e)
		if (p.x>poff) {
			if (sspan==86400) {
				var ofs = Math.round((prevx-poff)*(sspan/3600)/(width-poff-1))
				strtt = ofs*3600; stopt = (ofs+6)*3600;
				zoomInAnim()
			}else if (sspan==21600) {
				var ofs = ((prevx-poff)*(sspan/3600)/(width-poff))+(1/60)
				strtt = (ofs+(soff/3600))*3600; stopt = (ofs+(soff/3600)+1)*3600;
				zoomInAnim()
			}else if (sspan==3600) {
				var ofs = ((prevx-poff)*(sspan/3600)/(width-poff))+(1/120)
				strtt = (ofs+(soff/3600))*3600; stopt = (ofs+(soff/3600)+1/6)*3600;
				zoomInAnim()
			}
		}
			}, false);
	function dropImgDta(im_w){
		imgdta = context.getImageData((newx-1)*window.devicePixelRatio,0,
			im_w*window.devicePixelRatio,height*window.devicePixelRatio);
		context.beginPath(); context.strokeStyle = "#111";
		context.lineWidth=.5;
		context.rect(newx,5,im_w-4,height-16);
		context.stroke();
	}
	
	function calculateOffset(val,calculatedScale,scaleHop){
		var outerValue = calculatedScale.steps * calculatedScale.stepValue;
		var adjustedValue = val - calculatedScale.graphMin;
		var scalingFactor = CapValue(adjustedValue/outerValue,1,0);
		return (scaleHop*calculatedScale.steps) * scalingFactor;
	}
	
	function scaleXImageData(imageData, scale) {
		var scaled = context.createImageData(imageData.width*scale, imageData.height );
		for(var row = 0; row < imageData.height; row++) {
			for(var col = 0; col < imageData.width; col++) {
			  var sourcePixel =  imageData.data.subarray(
                (row * imageData.width + col) * 4,
                (row * imageData.width + col) * 4 + 4
				);
			  for(var x = 0; x < scale; x++) {
				  var destCol = col * scale + x;
				  for(var i = 0; i < 4; i++) {
					scaled.data[(row * scaled.width + destCol) * 4 + i] =
					  sourcePixel[i];
				  }
				}
			}
		  }
		return scaled;
	}
	
	function animationLoop(config,drawScale,drawData,ctx){
		var animFrameAmount = (config.animation)? 1/CapValue(config.animationSteps,Number.MAX_VALUE,1):1,
			percentAnimComplete =(config.animation)? 0 : 1;
		requestAnimFrame(animLoop);
		function animateFrame(){
			clear(ctx);
			drawScale();
			drawData((config.animation)?CapValue(percentAnimComplete,null,0):1);				
		}
		function animLoop(){
				percentAnimComplete += animFrameAmount;
				animateFrame();	
				if (percentAnimComplete <= 1){
					requestAnimFrame(animLoop);
				}
		}
	}

	// shim layer with setTimeout fallback
	var requestAnimFrame = (function(){
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 7);
			};
	})();

	//Populate an array of all the labels by interpolating the string.
    function populateLabels(labelTemplateString, labels, numberOfSteps, graphMin, stepValue) {
        if (labelTemplateString) {
            //Fix floating point errors by setting to fixed the on the same decimal as the stepValue.
            for (var i = 1; i < numberOfSteps + 1; i++) {
                labels.push(tmpl(labelTemplateString, {value: (graphMin + (stepValue * i)).toFixed(getDecimalPlaces(stepValue))}));
            }
        }
    }
	
	function Max( array ){
		return Math.max.apply( Math, array );
	}
	function Min( array ){
		return Math.min.apply( Math, array );
	}
	function Default(userDeclared,valueIfFalse){
		if(!userDeclared){
			return valueIfFalse;
		} else {
			return userDeclared;
		}
	}
	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	function CapValue(valueToCap, maxValue, minValue){
		if(isNumber(maxValue)) {
			if( valueToCap > maxValue ) {
				return maxValue;
			}
		}
		if(isNumber(minValue)){
			if ( valueToCap < minValue ){
				return minValue;
			}
		}
		return valueToCap;
	}
	function getDecimalPlaces (num){
		var numberOfDecimalPlaces;
		if (num%1!=0)
			return num.toString().split(".")[1].length
		return 0;
	}
	function mergeChartConfig(defaults,userDefined){
		var returnObj = {};
	    for (var an in defaults) { returnObj[an] = defaults[an]; }
	    for (var an in userDefined) { returnObj[an] = userDefined[an];}
	    return returnObj;
	}
	
	//Javascript micro templating by John Resig - 
	// source at http://ejohn.org/blog/javascript-micro-templating/
	  var cache = {};
	  function tmpl(str, data){
	    var fn = !/\W/.test(str) ?
	      cache[str] = cache[str] ||
	        tmpl(document.getElementById(str).innerHTML) :
	      new Function("obj",
	        "var p=[],print=function(){p.push.apply(p,arguments);};" +
	        "with(obj){p.push('" +
	        str
	          .replace(/[\r\t\n]/g, " ")
	          .split("<%").join("\t")
	          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
	          .replace(/\t=(.*?)%>/g, "',$1,'")
	          .split("\t").join("');")
	          .split("%>").join("p.push('")
	          .split("\r").join("\\'")
	      + "');}return p.join('');");
	    return data ? fn( data ) : fn;
	  };
}
