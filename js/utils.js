function drawChart(data, divId, title, interval, chartType, csvAnchorId) {

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
        columns: results,
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
        columns: results,
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
        columns: results,
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
    for ( i=1, l=results.length ; i<l ; i++ ) {
      collections[collections.length]=results[i][0];
    }

    var chart = c3.generate({
      bindto: '#'+divId,
      data: {
        x: 'Time',
        xFormat: graphDateFormat,
        columns: results,
        type: 'area-spline',
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

  createCSVDownload(results,csvAnchorId);

}

function transformDataForRenderingChart(data, dateFormat, nestedBuckets) {

  var transformedData = [];

  if (nestedBuckets) {

    var xAxis = ['Time'];
    var yAxis = {};

    for ( i=0, l=data.length ; i<l ; i++ ) {

      xAxis[xAxis.length]=$.format.date(new Date(data[i].key),dateFormat);

      var correctLevelBuckets;
      if( data[i].secondLevel.thirdLevel === undefined ) {
        correctLevelBuckets = data[i].secondLevel.buckets;
      } else {
        correctLevelBuckets = data[i].secondLevel.thirdLevel.buckets;
      }

      for( j=0, k=correctLevelBuckets.length ; j<k ; j++ ) {

        var yArray;
        if( yAxis[correctLevelBuckets[j].key] === undefined ) {
          yArray=Array.apply(null, new Array(data.length+1)).map(Number.prototype.valueOf,0);
          yArray[0]=correctLevelBuckets[j].key;
          yAxis[correctLevelBuckets[j].key]=yArray;
        } else {
          yArray = yAxis[correctLevelBuckets[j].key];
        }
        yArray[i+1]=correctLevelBuckets[j].doc_count;

      }
    }

    transformedData[0]=xAxis;
    for(var key in yAxis) {
      transformedData[transformedData.length]=yAxis[key];
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
  
  
  console.log(transformedData);
  return transformedData;
}

function createCSVDownload(results, csvAnchorId) {

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
  a.download = 'results.csv';
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