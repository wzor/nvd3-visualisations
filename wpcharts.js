
charts = new Array();
bootup = 1;

// API component to draw charts directly on WP page by one JS call

function jsChart(id, infile, type, dims, options) {

	if (bootup) {
		bootup = 0;
		checkJQ();
	}

	// Default size of chart: VGA screen
	var height = '480';
	var width = ' width:640px; ';
	if (dims) {
		height = dims['height'];
		width = ' width:'+dims['width']+'px; ';
	}

	if (!options)
		options = new Object(); 

	// console.info(height); // {height:'200', width:'350'}

	var svg = "<svg id='svg"+id+"' style='height:"+height+"px; "+width+" '/>";
	jQuery('#chart'+id).empty();

	if (typeof options.noPopup)
	if (! options.noPopup ) {
		if (!options.title)
			options.title = 'My ('+type+') chart';
		options.height = +dims['height'];
		options.width = +dims['width'];
//	var svg = '<svg id="svg'+id+'" style="height:'+height+'px; '+width+'"/>";
		var popup = '<img src="'+rootpath+'../icons/newindow.png" style="float:left"><br />';
		var inopts = '<script> opts=new Object('+JSON.stringify(options)+'); </script>';
		popup = inopts+'<a onclick="svg2Win('+id+', opts)" style="cursor:pointer" >'+popup+'</a>';
		jQuery('#chart'+id).append(popup);
	}
	jQuery('#chart'+id).append(svg);

	// svgChart(id);
	type = type.toLowerCase();
	dataRead(infile, id, type, options);
	/*
	if (typeof options.class)
		jQuery('.'+options.class.name).css(options.class);
		d3.selectAll('#svg888 .nv-point-paths').style({'stroke':'navy'})
	*/
}

// Data reader from different sources: demos / own file / function's output 
function dataRead(infile, id, type, options) {

	// console.info(infile);
	ginfile = infile; // make global

	if (infile == '')
		demoShows(id, '', type, options);
	else if (infile.indexOf(".json") > 0)
	d3.json(infile,function(error,data) {
		// console.info(data);
		// jsonbody = data;
		// printLines(data);
		chartSelector(id, data, type, options);
	});
	else if (infile.indexOf('.xml') > 0)
	d3.text(infile,function(error,data) { // d3.xml has parsing problems
//		data = buildXML(data);
		data = xml2json(data, ' ');
		chartSelector(id, data, type, options); 
	});
	else if (infile.indexOf(".tsv") > 0)
	d3.tsv(infile,function(error,data) { 
		// console.info(data);
		data = parseJSON(data,type);
		console.info(data);
		chartSelector(id, data, type, options);
	});
	else if (infile.indexOf('.csv') > 0)
	d3.csv(infile,function(error,data) {
		// console.info(data);
		data = parseJSON(data,type);
		chartSelector(id, data, type, options);
	});
	else if (typeof infile == 'object') // Direct input of data set by variable
		chartSelector(id, infile, type, options);
}
function printLines(data) {
	var tab = '	';
	var newline = "\n";
	var out = '';
	for (line=0; line<data.length; line++) {
		if (data[line].values)
			for (line2=0; line2<data[line].values.length; line2++)
				out += data[line].values[line2][0] +tab+ data[line].values[line2][1] +newline;
		out += 'DATA SET'+newline;
	}
	console.info(out);
}

function parseJSON(data, chart) {

		var lines = new Array();
		var titles = new Array();
		for (line=0; line<data.length; line++) {
			var colss = new Array();
			for (label in data[line]) {
				colss.push(data[line][label]);
				if (line == 0) titles.push(label);
			}
			lines.push(colss);
		}
		// console.info(titles);
		// console.info(lines);
		var res = new Array();
		if (chart == 'pie' || chart == 'donut')
			for (t=0; t<lines.length; t++)
					res.push(new Object( { "label":lines[t][0], "value":+lines[t][1] } ));
		else if (chart == 'discretebar')
			for (t=1; t<titles.length; t++)  // 1st column passed (eq t=0)
				res.push(new Object( { "key":titles[t], "values":forceNumb(lines, t) } ));
		else if (chart == 'stackedarea'  || chart == 'lineplusbar'  || chart == 'cumulativeline')
			for (t=1; t<titles.length; t++)  // 1st column passed (eq t=0)
				res.push(new Object( { "key":titles[t], "values":forceNumb2(lines, t) } ));
		else // multibars etc
			for (t=1; t<titles.length; t++)  // 1st column passed (eq t=0)
				res.push(new Object( { "key":titles[t], "values":getCol(t,lines) } ));

		// console.info(res);
		return res;

	return data;
}
function forceNumb(arr, t) {  // Name data points + force numbers type for values 

	for (i=0; i<arr.length; i++) {
		arr[i]['label'] = arr[i][0];
		if (+arr[i][1] || arr[i][1] == '0')
			arr[i]['value'] = +arr[i][1];
	}
	return arr;
}

function forceNumb2(arr, t) {  // Name data points + force numbers type for values 

	var out = new Array();
	for (i=0; i<arr.length; i++) {
		if (+arr[i][t] || arr[i][t] == '0')
			out.push( new Array( +arr[i][0], +arr[i][t] ) );
	}
	return out;
}

function getCol(colname, lines) {
	var out = new Array();
	// console.info(lines);
	for (i=0; i<lines.length; i++) { // Note: forcing numerical value out
		if (! +lines[i][colname]) console.warning( 'Illegal value on input:'+lines[i][colname] );
		var cell = new Object( {"y": (+lines[i][colname]), "x":lines[i][0]  } );
		out.push( cell );
	}
	return out;
}

function demoShows(id, data, type, options) {

	// Demo data sets for gallery
	var demos = { lineplusbar:'linePlusBarData.json', simpleline:'simpleLineData.json', cumulativeline:'cumulativeLineData.json', stackedarea: 'stackedAreaData.json', discretebar:'discreteBarData.json', horizontalmultibar:'multibarData.json', pie:'pieData.json', donut:'pieData.json', bullet:'bulletData.json', scatterbubble:'scatterData.json', multibar:'multiData.json', viewfinder:'viewFinderData.json' };

	if (options.xmldemo)
		demos[type] = demos[type].replace(/json/g, 'xml');

	// Home dir of demo data sets
	var infile = 'wp-content/plugins/nvd3/data/'+demos[type];
	if (rootpath) // Global URL of root set by shortcode of WP
		 infile = rootpath + demos[type];

	var desc = 'Data File: data/'+demos[type];
	var subs = '<sup> ?</sup>';
	var msg = '<b class="title_nvd3" title="'+desc+'">Chart Type: '+type+subs+'</b>';
	msg = '<br /><a href="'+infile+'" target="_blank">'+msg+'</a>';

	var pp = rootpath+'../postchart.php?new=';
	var ctype = '&type='+type;
	var filepath = '&filepath='+demos[type];
	var tt = 'Clone data set from this example into your new draft on WordPress';

	var shortmsg = '<br />Add this into: ';

	var idmenu = "gmenu"+id;
	var mpostpage = '<select id='+idmenu+'><option value="post">New Post</option><option value="page">New Page</option></select>';

	var idmenu2 = "gformat"+id;
	var mformat = '<select id='+idmenu2+'><option value="json">JSON data</option><option value="xml">XML data</option><option value="csv">CSV data</option><option value="tsv">TSV data</option></select>';

	var query = rootpath+"../postchart.php?type="+type;
	var ctype = demos[type];
	var mbutt = '<button style="cursor:pointer" onclick="newpost2('+sQuote(query)+', '+sQuote(ctype)+', '+sQuote(idmenu)+', '+sQuote(idmenu2)+')" title="'+tt+'">New Chart</button>'

	var aform = shortmsg + mpostpage + ' in ' + mformat + mbutt;

	if (infile.indexOf(".json") > 0)
	d3.json(infile,function(error,data) {
		chartSelector(id, data, type, options);
		console.info('Drawing chart demo "'+type+'" from a file: data/'+demos[type]);
		jQuery("#chart"+id).append(msg+aform);
	});
	else if (infile.indexOf('.xml') > 0)
	d3.text(infile,function(error,data) { // d3.xml has parsing problems
//		data = buildXML(data);
		data = xml2json(data, '  ');
		// console.info(data);
		chartSelector(id, data, type, options);
		console.info('Drawing chart demo "'+type+'" from a XML file: data/'+demos[type]); // demos[type]
		jQuery("#chart"+id).append(msg+aform);
	});
}
function sQuote(w) { return " '"+w+"' "; }

function newpost(linkjson, linkxml, id) {

	var choice = jQuery('#'+id).val();

	if (choice == 'xmlpage' || choice == 'jsonpage') {
		linkjson = linkjson.replace('new=post', 'new=page');
		linkxml = linkxml.replace('new=post', 'new=page');
	}

	if (choice == 'jsonpost' || choice == 'jsonpage')
		window.open(linkjson);
	else if (choice == 'xmlpost'  || choice == 'xmlpage')
		window.open(linkxml);
}
function newpost2(alink, afile, id, id2) {

	var post_type = jQuery('#'+id).val();
	var data_format = jQuery('#'+id2).val();

	alink = alink + '&new=' + post_type;
	if (data_format != 'json')
		alink = alink + '&filepath='+afile.replace('json', data_format);
	else
		alink = alink + '&filepath='+afile;

	console.info(alink);
	window.open(alink);
}

function chartSelector(id, data, type, options) {

	if (type == 'lineplusbar')
		linePlusBar(id, data, options);
	else if (type == 'simpleline')
		simpleLine(id, data, options);
	else if (type == 'scatterbubble')
		ScatterBubble(id, data, options);
	else if (type == 'viewfinder')
		viewFinder(id, data, options)
	else if (type == 'multibar')
		MultiBar(id, data, options);
	else if (type == 'cumulativeline')
		cumulativeLineData(id, data, options);
	else if (type == 'stackedarea')
		stackedArea(id, data, options);
	else if (type == 'discretebar')
		discreteBar(id, data, options);
	else if (type == 'horizontalmultibar')
		horizontalMultiBar(id, data, options);
	else if (type == 'pie')
		Pie(id, data, options);
	else if (type == 'donut')
		Donut(id, data, options); 
	else if (type == 'bullet')
		Bullet(id, data, options);
/*
	nvd3Dump = JSON.stringify(data);
//	xdata = "'data'";
	var cbutt = '<br /><button onclick="copyToClipboard()">Copy Data</button>';
	jQuery("#chart"+id).append(cbutt);
*/
}
// Axis should be time formatted with chart ?
function timeStamp(x, options) {
	if (options.xtime)
			return d3.time.format('%x')(new Date(x))
	else
		return x
}

/* ALL Supported NVD3 Chart Types: 1 function/type */

// Drawing chart: linePlusBar
function linePlusBar(chartID, data, options) {

  nv.addGraph(function() {
	  var chart = nv.models.linePlusBarChart()
            .margin(setMargin({top: 30, right: 90, bottom: 50, left: 90}, options))
            //We can set x data accessor to use index. Reason? So the bars all appear evenly spaced.
            .x(function(d,i) { return i })
            .y(function(d,i) {return d[1] })
            ;

	  chart.xAxis.tickFormat(function(d) {
        var dx = data[0].values[d] && data[0].values[d][0] || 0;
		return timeStamp(dx, options);
      });

/* Uncomment => original demo show
	  chart.xAxis.tickFormat(function(d) {
        var dx = data[0].values[d] && data[0].values[d][0] || 0;
        return d3.time.format('%x')(new Date(dx))
      });

      chart.y1Axis
          .tickFormat(d3.format(',f'));

      chart.y2Axis
          .tickFormat(function(d) { return d3.format(',f')(d) });

    chart.y1Axis
		.axisLabel(data[0]['key']);
    chart.y2Axis
		.axisLabel(data[1]['key']);

    chart.y1Axis
        .tickFormat(d3.format(',.1%')); 
*/
	chart.bars.forceY([0]);

	chart.options(options);

	  d3.select("#svg"+chartID)
        .datum(data)
        .transition()
        .duration(500)
        .call(chart);

  if (options.style) { // TODO: better way to set different styles for 2 series
	d3.selectAll('#svg'+chartID+' rect').style(options.style);
	d3.selectAll('#svg'+chartID+' path').style(options.style);
	}

      nv.utils.windowResize(chart.update); 

      return chart;
  });
}
// Drawing chart: cumulativeLineData
function cumulativeLineData(chartID, data, options) {
 
  nv.addGraph(function() {
    var chart = nv.models.cumulativeLineChart()
                  .margin(setMargin({left: 50, bottom: 50}, options))
				  .x(function(d) { return d[0] })
                  .y(function(d) { return d[1]/100 }) //adjusting, 100% is 1.00, not 100 as it is in the data
                  .color(d3.scale.category10().range())
                  .useInteractiveGuideline(true)
                  ;

    // console.info(data);

	 chart.xAxis
        .tickValues([1078030800000,1122782400000,1167541200000,1251691200000])
        .tickFormat(function(d) {
            return d3.time.format('%x')(new Date(d))
          });

    chart.yAxis
        .tickFormat(d3.format(',.1%')); 

	  chart.options(options);

	  d3.select("#svg"+chartID)
        .datum(data)
        .call(chart);

    //TODO: Figure out a good way to do this automatically
    nv.utils.windowResize(chart.update); 

	return chart;
  });
}
// Drawing chart: stackedArea
function stackedArea(chartID, data, options) {

  nv.addGraph(function() {
    var chart = nv.models.stackedAreaChart()
                  .margin(setMargin({right: 100, bottom: 50}, options))
                  .x(function(d) { return d[0] })   //We can modify the data accessor functions...
                  .y(function(d) { return d[1] })   //...in case your data is formatted differently.
                  .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                  .rightAlignYAxis(true)      //Let's move the y-axis to the right side.
                  .transitionDuration(500)
                  .showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                  .clipEdge(true);

    //Format x-axis labels with custom function.
    chart.xAxis
        .tickFormat(function(d) { 
          return d3.time.format('%x')(new Date(d)) 
    });

    chart.yAxis
        .tickFormat(d3.format(',.2f'));

    chart.options(options);

	d3.select("#svg"+chartID)
      .datum(data)
      .call(chart);

  if (options.style)
	d3.selectAll('#svg'+chartID+' path').style(options.style);

    nv.utils.windowResize(chart.update);

    return chart;
  });
}
// Drawing chart: discreteBar
function discreteBar(chartID, data, options) {

nv.addGraph(function() {
  var chart = nv.models.discreteBarChart()
      .margin(setMargin({left: 50, bottom: 50}, options))
	  .x(function(d) { return d.label })    //Specify the data accessors.
      .y(function(d) { return d.value })
      .staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
      .tooltips(false)        //Don't show tooltips
      .showValues(true)       //...instead, show the bar value right on top of each bar.
      .transitionDuration(350)
      ;

    chart.options(options);

  d3.select("#svg"+chartID)
      .datum(data)
      .call(chart);

  if (options.style)
	d3.selectAll('#svg'+chartID+' rect').style(options.style);
 
  nv.utils.windowResize(chart.update);

  return chart;
});
}
// Drawing chart: horizontalMultiBar
function horizontalMultiBar(chartID, data, options) {

  nv.addGraph(function() {
    var chart = nv.models.multiBarHorizontalChart()
        .margin(setMargin({left: 150, bottom: 50}, options))
		.x(function(d) { return d.label })
        .y(function(d) { return d.value })
		.margin(setMargin({top: 30, right: 20, bottom: 50, left: 175}, options))
        .showValues(true)           //Show bar value next to each bar.
        .tooltips(true)             //Show tooltips on hover.
        .transitionDuration(350)
        .showControls(true);        //Allow user to switch between "Grouped" and "Stacked" mode.

    chart.yAxis
        .tickFormat(d3.format(',.2f'));

	chart.options(options);

	d3.select("#svg"+chartID)
        .datum(data)
        .call(chart);
  
   if (options.style)
	 d3.selectAll('#svg'+chartID+' rect').style(options.style);

    nv.utils.windowResize(chart.update);

    return chart;
  });

}
// Drawing chart: ScatterBubble
function ScatterBubble(chartID, data, options) {

nv.addGraph(function() {
  var chart = nv.models.scatterChart()
                .margin(setMargin({left: 50, bottom: 50}, options))
				.showDistX(true)    //showDist, when true, will display those little distribution lines on the axis.
                .showDistY(true)
                .transitionDuration(350)
                .color(d3.scale.category10().range());

  //Configure how the tooltip looks.
  chart.tooltipContent(function(key) {
      return '<h3>' + key + '</h3>';
  });

  //Axis settings
  chart.xAxis.tickFormat(d3.format('.02f'));
  chart.yAxis.tickFormat(d3.format('.02f'));

  //We want to show shapes other than circles.
  chart.scatter.onlyCircles(false);

  // var myData = randomData(4,40);
  // console.info( JSON.stringify(myData) );

	chart.options(options);

  d3.select("#svg"+chartID)
      .datum(data)
      .call(chart);

  if (options.style)
	d3.selectAll('#svg'+chartID+' path').style(options.style);

  nv.utils.windowResize(chart.update);

  return chart;
});
}
// Drawing chart: MultiBar
function MultiBar(chartID, data, options) {

nv.addGraph(function() {
    var chart = nv.models.multiBarChart()
      .margin(setMargin({left: 150, bottom: 50}, options))
	  .transitionDuration(350)
      .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
      .rotateLabels(0)      //Angle to rotate x-axis labels.
      .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
      .groupSpacing(0.1)    //Distance between each group of bars.
	  .x(function(d,i) { return i })
    ;
/*
    chart.xAxis
        .tickFormat(d3.format(',f'));
*/
	chart.xAxis.tickFormat(function(d) {
		var dx = data[0].values[d] && data[0].values[d]["x"] || 0;
		return timeStamp(dx, options);
    });

    chart.yAxis
        .tickFormat(d3.format('.f'));
//   console.info( JSON.stringify( exampleData() ) );

	chart.options(options);

    d3.select("#svg"+chartID)
        .datum(data)
        .call(chart);

  if (options.style)
	d3.selectAll('#svg'+chartID+' rect').style(options.style);

    nv.utils.windowResize(chart.update);

    return chart;
});
}
// Drawing chart: viewFinder
function viewFinder(chartID, data, options) {

nv.addGraph(function() {
  var chart = nv.models.lineWithFocusChart()
	.margin(setMargin({left: 150, bottom: 50}, options))
	.x(function(d,i) { return i })
  ;
/*
  chart.xAxis
      .tickFormat(d3.format(',f'));
*/
	chart.xAxis.tickFormat(function(d) {
        var dx = data[0].values[d] && data[0].values[d]["x"] || 0;
		return timeStamp(dx, options);
    });

  chart.yAxis
      .tickFormat(d3.format('.f'));

  chart.y2Axis
      .tickFormat(d3.format(',.2f'));

	chart.options(options);

    d3.select("#svg"+chartID)
      .datum(data)
      .transition().duration(500)
      .call(chart);

  if (options.style)
	d3.selectAll('#svg'+chartID+' path').style(options.style);

  nv.utils.windowResize(chart.update);

  return chart;
});
}
// Drawing chart: simpleLine
function simpleLine(chartID, data, options) { 

/*These lines are all chart setup.  Pick and choose which chart features you want to utilize. */
nv.addGraph(function() {
  var chart = nv.models.lineChart()
                .margin(setMargin({left: 150, bottom: 50}, options))  //Adjust chart margin wider.
                .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                .transitionDuration(350)  //how fast do you want the lines to transition?
                .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                .showYAxis(true)        //Show the y-axis
                .showXAxis(true)        //Show the x-axis
  .x(function(d,i) { return i })
  ;

	chart.xAxis.tickFormat(function(d) {
        var dx = data[0].values[d] && data[0].values[d]["x"] || 0;
		return timeStamp(dx, options);
    });
/*
  chart.xAxis     //Chart x-axis settings
      // .axisLabel('Time (ms)')
      .tickFormat(d3.format(',r'));
*/
  chart.yAxis     //Chart y-axis settings
      // .axisLabel('Voltage (v)')
      .tickFormat(d3.format('.f'));

//  var myData = sinAndCos();   //You need data...

	chart.options(options);

  d3.select("#svg"+chartID) 
      .datum(data)         //Populate the <svg> element with chart data...
      .call(chart);          //Finally, render the chart!

  if (options.style) // Example: {"stroke":"navy"}
	d3.selectAll('#svg'+chartID+' path').style(options.style);

  //Update the chart when window resizes.
  nv.utils.windowResize(function() { chart.update() });
  return chart;
});
}
// Drawing chart: Pie
function Pie(chartID, data, options) {

//Regular pie chart example
nv.addGraph(function() {
  var chart = nv.models.pieChart()
      .margin(setMargin({left: 10, bottom: 50}, options))
	  .x(function(d) { return d.label })
      .y(function(d) { return d.value })
      .showLabels(true);

	chart.options(options);

	d3.select("#svg"+chartID)
        .datum(data)
        .transition().duration(350)
        .call(chart);

  if (options.style) // Example: {"fill":"navy"}
	d3.selectAll('#svg'+chartID+' path').style(options.style);

  return chart;
});
}
// Drawing chart: Donut
function Donut(chartID, data, options) {

//Donut chart example
nv.addGraph(function() {
  var chart = nv.models.pieChart()
      .margin(setMargin({left: 10, bottom: 50}, options))
	  .x(function(d) { return d.label })
      .y(function(d) { return d.value })
      .showLabels(true)     //Display pie labels
      .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
      .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
      .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
      .donutRatio(0.35)     //Configure how big you want the donut hole size to be.
      ;

	chart.options(options);

	d3.select("#svg"+chartID)
        .datum(data)
        .transition().duration(350)
        .call(chart);

  if (options.style) // Example: {"fill":"navy"}
	d3.selectAll('#svg'+chartID+' path').style(options.style);

  return chart;
});
}
// Drawing chart: Bullet
function Bullet(chartID, data, options) {

nv.addGraph(function() {  
  var chart = nv.models.bulletChart()
				.margin(setMargin({left: 150, bottom: 50}, options));

	chart.options(options);

	d3.select("#svg"+chartID)
      .datum(data)
      .transition().duration(1000)
      .call(chart);

  return chart;
});
}

function setMargin(m, options) {

  if (options.margin)
	return options.margin;

  return m;
}

function checkJQ() {

	if ('undefined' == typeof window.jQuery)
		window.alert('Please, load jQuery to use NVD3 visualisations properly.');
	else
		console.info('jQuery: %ok%');
}

// A test for WP shortcode's calls
function svgChart(chartID, infile, type, dims, options) {

charts.push(chartID+' ');

nv.addGraph(function() {
    var chart = nv.models.lineChart();

    chart.xAxis
        .axisLabel("X-axis Label");

    chart.yAxis
        .axisLabel("Y-axis Label")
        .tickFormat(d3.format("d"))
        ;

	// var cID = charts.pop();
	var cID = charts[charts.length-1];
	d3.select("#chart"+cID+" svg")
        .datum(myData())
        .transition().duration(500).call(chart);

    nv.utils.windowResize(
            function() {
                chart.update();
            }
        );
	return chart;
});

};
function saveData(header, databox, filename) {

	var mydata = encodeURIComponent( jQuery('#'+databox).val() );
	mydata = jQuery('#'+header).html() + mydata;
	// console.info(mydata);
	// var rec = { infile: filename, data: mydata };
	var query = 'http://www.tere-tech.eu/balticfinns/wp-content/plugins/nvd3-visualisations/updatechart.php';

	jQuery.post( query, { infile: filename, indata: mydata }, function( data ) {
		if (data)
			location.reload();  // Ok, reload view on browser & chart(s)
		else
			alert('Data Set failed to write!');
	}); //, "json");
}

// Converter between different data inputs
function dataConvert(intype, input, output) {

	var data = jQuery('#'+input).val();
	var tab = '';

	if (intype == 'json')
		data = json22xml(jQuery.parseJSON(data), tab, true);
	else if (intype == 'xml')
		data = xml2json(data, tab, true);

	jQuery('#'+output).empty();
	jQuery('#'+output).val(data);
}
// A function to show SVG element in a new window
  function svg2Win(svgid, options) {

	var header = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> ';
	var svgstyle = jQuery("#svg"+svgid).attr("style");
	var viewbox = ' viewBox="0 0 '+options.width+' '+options.height+'" ';
	var svg = '<svg id="svg'+svgid+'" '+viewbox+' >' + $('#svg'+svgid).html() + '</svg>'; // height="100%" width="100%"

	var css = rootpath+"../nv.d3.css"; 
	css = '<link rel="stylesheet" href="'+css+'" type="text/css" media="all"/> ';
/* TODO: resize buttons of chart
	var smallerB = '<button style="font-size:xx-small" onClick="svgscaler('+svgid+', -1)"> « </button> ';
	var biggerB = '<button style="font-size:xx-small" onClick="svgscaler('+svgid+', +1)"> » </button> ';
*/
	var printIco = '<img src="'+rootpath+'../icons/print.gif">';
	var printB = '<button style="float:right; cursor:pointer;" onClick="window.print()">'+printIco+'</button> ';

	var title = "D3 Chart";
	if (typeof options.title != 'undefined')
		title = options.title;
	var html = header+' <html><head><title> '+title+' </title>'+css+'</head> ';
	html = html + '<body>';
	html = html + '<table class="svgtable" >';
	html = html + '<tr><td>';
//	html = html + '<p style="float:right">' + smallerB + biggerB + '</p>';
	var cid = "'chart"+svgid+"'";
	var sid = "'svg"+svgid+"'";
	var resize = ' resize:both; overflow:auto; ';
	if (typeof options.noResize != 'undefined')
	if (options.noResize)
		resize = '';
	html = html + '</td></tr><tr><td class="svgchart" ><div id="chart'+svgid+'" style="'+svgstyle+resize+' " onmouseup="document.getElementById('+sid+').style.height = document.getElementById('+cid+').style.height; document.getElementById('+sid+').style.width = document.getElementById('+cid+').style.width;">';
	html = html + svg + '</div><br />'+printB;
	html = html + '</td></tr></table></body></html>';
	var cwidth = 100 + parseInt(options.width);
	var cheight = 100 + parseInt(options.height);
	myWindow=window.open('','','location=0,status=0,menubar=0,width='+cwidth+',height='+cheight);
	myWindow.document.writeln(html);
   }

// Resizing of a chart on its popup window
function svgscaler(svgid, dir) {

	var sizer = 0.1;

	// Old existing whole canvas of chart
	var svgH = parseInt(jQuery('#chart'+svgid).attr('height'));
	var svgW = parseInt(jQuery('#chart'+svgid).attr('width'));

	// Resize of it
	$('svg').attr('height',svgH + dir*Math.round(svgH*sizer));
	$('svg').attr('width',svgW + dir*Math.round(svgW*sizer));
	// console.info(svgW);

	// Resize of chart itself
	var svgG = '.g'+svgid; // Group of svg objects
	var oldT = $(svgG).attr('transform');
	// Magic of resizing svg chart
	var diffW = Math.round(svgW*(1+sizer)/2);
	var diffH = Math.round(svgH*(1+sizer)/2);
	console.info(svgW);
	console.info(diffW);

	if (diffW == diffH) { // For Pies: its center must move when scaled down/up too
		var moveC = ' translate('+diffW+','+diffH+') ';
		sizer = 1+2*sizer;
		$(svgG).attr('transform', moveC+' scale('+ sizer +') '); 
	} else {
		sizer = 1+sizer;
		$(svgG).attr('transform', oldT+' scale('+ sizer +') '); 
	}
	// Scaling window size around a chart
	var w=parseInt(window.innerWidth);
	var h=parseInt(window.innerHeight);
	window.innerWidth = Math.round(w*sizer);
	window.innerHeight = Math.round(h*sizer);
}

// Parse JSON data structure into TSV table
function json2tsv(input) {

	var data = jQuery('#'+input).val();
	data = jQuery.parseJSON(data);
	// console.info(data);
	if (typeof data[0] == 'object' && !data[0].value)
		data = data[0];

	var keys = new Array();
	var values = new Array();
	var labels = new Array();

	if (typeof data == 'object')
	for (cell in data) {
		if (cell == 'key')
			keys.push(data[cell]);
		if (cell == 'values')
			for (i=0; i<data[cell].length ; i++) {
				var dcell = data[cell][i];
				if (dcell.label)
					labels.push(dcell.label);
				if (dcell.value || dcell.value=='0')
					values.push(dcell.value);
			}
		// Simple case
		if (+cell || cell == '0') { // Simple arr of tuples: [label,value]...[label,value]
			labels.push(data[cell]['label']);
			values.push(data[cell]['value']);
		}
	}
	// console.info(keys);
	// console.info(labels);
	// console.info(values);

	var tab = '	';
	var newline = '\n';
	var tsv = new Array();
	var tsvstr = '';

	tsv.push('keys'+tab+keys[0]);
	tsvstr = 'keys'+tab+keys[0];
	for (i=0; i<values.length; i++)
		tsvstr += newline + labels[i]+tab+values[i];
		// tsv.push(labels[i]+tab+values[i]);
	console.info(tsvstr);
}

function copyToClipboard() { // copyToClipboard(cdata)
//  console.info(field);
  window.prompt("Copy chart's data: Ctrl+C", JSON.stringify(nvd3Dump));
//  window.alert(JSON.stringify(nvd3Dump));
}

// Data set generator, original mychart.js example

function myData() {
    var series1 = [];
    for(var i =1; i < 100; i ++) {
        series1.push({
            x: i, y: 100 / i
        });
    }
    return [
        {
            key: "Series #1",
            values: series1,
            color: "#0000ff"
        }
    ];
}