function drawChart(data, divId, title, interval, chartType, csvAnchorId, xlsxAnchorId, statsDiv, niceName, detailedResults) {

  var graphDateFormat = "%m/%Y";
  var calendarDateFormat = "MM/yyyy";
  switch(interval) {
    case 'year':
      graphDateFormat = "%Y";
      calendarDateFormat = "yyyy";
      break;
    case 'day':
      graphDateFormat = "%d/%m/%Y";
      calendarDateFormat = "dd/MM/yyyy";
      break;
    case 'week':
      graphDateFormat = "%d/%m/%Y";
      calendarDateFormat = "dd/MM/yyyy";
  };

  var results;

  if(chartType=='lineChart') {

    results = transformDataForRenderingChart(data,calendarDateFormat,false);

    var chart = c3.generate({
      bindto: '#'+divId,
      data: {
        x: 'Time',
        xFormat: graphDateFormat,
        columns: results[0],
        type: 'spline'
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: graphDateFormat
          }
        },
        y: {
          min: 0
        }
      }
    });

  } else if (chartType=='barsChart') {

    results = transformDataForRenderingChart(data,calendarDateFormat,false);

    var chart = c3.generate({
      bindto: '#'+divId,
      data: {
        x: 'Time',
        xFormat: graphDateFormat,
        columns: results[0],
        type: 'bar'
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: graphDateFormat
          }
        },
        y: {
          min: 0
        }
      }
    });

  } else if (chartType=='multilineChart') {

    results = transformDataForRenderingChart(data,calendarDateFormat,true);

    var chart = c3.generate({
      bindto: '#'+divId,
      data: {
        x: 'Time',
        xFormat: graphDateFormat,
        columns: results[0],
        type: 'spline'
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: graphDateFormat
          }
        },
        y: {
          min: 0
        }
      },
      tooltip: {
        grouped: true // Default true
      }
    });

  } else if (chartType=='stackedBarsChart') {

    results = transformDataForRenderingChart(data,calendarDateFormat,true);

    var collections = [];
    // Collecting data collections names
    for ( i=1, l=results[0].length ; i<l ; i++ ) {
      collections[collections.length]=results[0][i][0];
    }

    var chart = c3.generate({
      bindto: '#'+divId,
      data: {
        x: 'Time',
        xFormat: graphDateFormat,
        columns: results[0],
        //type: 'area-spline',
        type: 'bar',
        groups: [ collections ]
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: graphDateFormat
          }
        },
        y: {
          min: 0
        }
      },
      tooltip: {
        grouped: true // Default true
      }
    });

  }

  if(detailedResults) {
    createCSVDownload(results[1],csvAnchorId,niceName);
    createXLSXDownload(results[1],xlsxAnchorId,niceName);
  } else {
    createCSVDownload(results[0],csvAnchorId,niceName);
    createXLSXDownload(results[0],xlsxAnchorId,niceName);
  }
  generateDataStatistics(results[0],statsDiv);

  return results;
}

function transformDataForRenderingChart(data, dateFormat, nestedBuckets) {

  var transformedData = [];
  var transformedDataExt = [];

  if (nestedBuckets) {

    var xAxis = ['Time'];
    var yAxis = {};

    // Additional axis for 3D employee/non-employee data
    var xAxisExt = ['Time'];
    var yAxisExt = {};

    for ( i=0, l=data.length ; i<l ; i++ ) {

      var formattedDate=$.format.date(new Date(data[i].key),dateFormat);

      xAxis[xAxis.length] = formattedDate;
      xAxisExt[xAxisExt.length] = formattedDate+' - overall';
      xAxisExt[xAxisExt.length] = formattedDate+' - non-employee';
      xAxisExt[xAxisExt.length] = formattedDate+' - employee';

      var correctLevelBuckets;

      if( data[i].secondLevel.thirdLevel === undefined ) {
        correctLevelBuckets = data[i].secondLevel.buckets;
      } else {
        correctLevelBuckets = data[i].secondLevel.thirdLevel.buckets;
      }

      for( j=0, k=correctLevelBuckets.length ; j<k ; j++ ) {

        var yArray;
        var yArrayExt;

        if( yAxis[correctLevelBuckets[j].key] === undefined ) {

          yArray=Array.apply( null, new Array(data.length+1) ).map(Number.prototype.valueOf,0);
          yArray[0]=correctLevelBuckets[j].key;
          yAxis[correctLevelBuckets[j].key]=yArray;

          yArrayExt=Array.apply( null, new Array(3*data.length+1) ).map(Number.prototype.valueOf,0);
          yArrayExt[0]=correctLevelBuckets[j].key;
          yAxisExt[correctLevelBuckets[j].key]=yArrayExt;

        } else {

          yArray = yAxis[correctLevelBuckets[j].key];
          yArrayExt = yAxisExt[correctLevelBuckets[j].key];

        }

        yArray[i+1]=correctLevelBuckets[j].doc_count;
        if( correctLevelBuckets[j].splitting_level === undefined ) {
          yArrayExt[i*3+1]=correctLevelBuckets[j].doc_count;
        } else {
          yArrayExt[i*3+1]=correctLevelBuckets[j].splitting_level.doc_count;
        }

        if( correctLevelBuckets[j].splitting_level != undefined ) {
          var splittingBuckets = correctLevelBuckets[j].splitting_level.thirdLevel.buckets;

          // Manually putting 0 for True and False in case one of them is missing.
          yArrayExt[i*3+2]=0;
          yArrayExt[i*3+3]=0;

          for( m=0, n=splittingBuckets.length ; m<n ; m++ ) {
            if(splittingBuckets[m].key=="non-employee") {
              yArrayExt[i*3+2]=splittingBuckets[m].doc_count;
            }
            if(splittingBuckets[m].key=="employee") {
              yArrayExt[i*3+3]=splittingBuckets[m].doc_count;
            }
          }
        }

      }
    }

    transformedData[0]=xAxis;
    for(var key in yAxis) {
      transformedData[transformedData.length]=yAxis[key];
    }

    transformedDataExt[0]=xAxisExt;
    for(var key in yAxisExt) {
      transformedDataExt[transformedDataExt.length]=yAxisExt[key];
    }

  } else {

    var xAxis = ['Time'];
    var yAxis = ['Count'];
    transformedData[transformedData.length]=xAxis;
    transformedData[transformedData.length]=yAxis;

    for (i = 0; i < data.length; i++) { 
      var formattedDate = $.format.date(new Date(data[i].key),dateFormat);
      xAxis[xAxis.length] = formattedDate;
      yAxis[yAxis.length] = data[i].doc_count;
    }
  }
  
  var returnedArr = [ transformedData, transformedDataExt ];
  console.log( returnedArr );
  return returnedArr;
}

function createCSVDownload(results, csvAnchorId, niceName) {

  var csvContent = '';
  for ( i=0, l=results.length ; i<l ; i++ ) {
    for( j=0, k=results[i].length ; j<k ; j++ ) {
      csvContent=csvContent+results[i][j];
      if( j<(k-1) ) {
        csvContent=csvContent+'|';
      } else {
        csvContent=csvContent+'\n';
      }
    }
  }

  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
  var file = new Blob([csvContent]);

  var a = document.getElementById(csvAnchorId);
  a.href = window.URL.createObjectURL(file);
  a.download = niceName+'.csv';
}

function createXLSXDownload(results, xlsxAnchorId, fileName) {
 
  require(['Excel/Workbook','excel-builder'], function (Workbook,EB) {
    var resultsWorkbook = new Workbook();
    var resultsList = resultsWorkbook.createWorksheet({name: fileName});
 
    resultsList.setData(results);
 
    resultsWorkbook.addWorksheet(resultsList);
 
    var processedContent = EB.createFile(resultsWorkbook);
    $("#"+xlsxAnchorId).attr({
        download: fileName,
        href: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + processedContent
    });
  });

}

function generateDataStatistics( results, statsDiv ) {

  var sum=0;
  var count=0;
  var max=Number.MIN_VALUE;
  var min=Number.MAX_VALUE;
  for ( i=1, l=results.length ; i<l ; i++ ) {
    for( j=1, k=results[i].length ; j<k ; j++ ) {
      sum=sum+results[i][j];
      count = count+1;
      if(results[i][j]>max) {
        max = results[i][j];
      }
      if(results[i][j]<min) {
        min = results[i][j];
      }
    }
  }
  if(count!=0) {
    $("#"+statsDiv).html('&nbsp;&nbsp;Max: '+max+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Min: '
      +min+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Avg: '+sum/count);
  } else {
    $("#"+statsDiv).html('');
  }
}

function createMultiSheetXLSXDownload(resultsCollection, xlsxAnchorId, fileName) {

  if ( $.isEmptyObject(resultsCollection) ) {
    alert('You need to generate results first.');
    return false;
  }

  require(['Excel/Workbook','excel-builder'], function (Workbook,EB) {
    var resultsWorkbook = new Workbook();
    for (var resultsName in resultsCollection) {
      if (resultsCollection.hasOwnProperty(resultsName)) {
        var resultsList = resultsWorkbook.createWorksheet({name: resultsName});
        resultsList.setData(resultsCollection[resultsName]);
        resultsWorkbook.addWorksheet(resultsList);
      }
    }

    var processedContent = EB.createFile(resultsWorkbook);
    //$("#"+xlsxAnchorId).attr({
    //    download: fileName,
    //    href: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + processedContent
    //});
    window.location.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + processedContent;
  });

}

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if(pair[0] == variable){return pair[1];}
  }
  return(false);
}

function getSelectedOptions(oList) {
  var sdValues = [];
  for(var i = 1; i < oList.options.length; i++) {
    if(oList.options[i].selected == true) {
      sdValues.push(oList.options[i].value);
    }
  }
  return sdValues;
}

function checkIfServerUrlIsProvided() {
  var serverUrlField = $( "#serverUrl" );
  if (!serverUrlField.val()) {
    serverUrlField.parent().parent().addClass('has-error');
    window.scrollTo(0,0);
    serverUrlField.focus();
    return false;
  }
  return true;
}