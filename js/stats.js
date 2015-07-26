var statsConfig = {};

function switchAvailablePresentationOptions(turnOnMultibucket) {

  var elements = document.getElementsByName("presentation");

  if (turnOnMultibucket) {

    elements[0].disabled = true;
    elements[1].disabled = true;
    elements[2].disabled = false;
    elements[3].disabled = false;

    if (!elements[2].checked && !elements[3].checked ) {
      elements[2].checked=true;
    }

  } else {

    elements[0].disabled = false;
    elements[1].disabled = false;
    elements[2].disabled = true;
    elements[3].disabled = true;

    if (!elements[0].checked && !elements[1].checked ) {
      elements[0].checked=true;
    }

  }

}

function initializeRoleBasedSettings() {

  if (statsConfig.userRoles && statsConfig.userRoles.indexOf("trusted")!=-1 ) {
    $( "#employeeStatusDiv" ).show();
    $( "#createdByDiv" ).show();
    statsConfig.query="statistics_query_trusted_required";
  } else {
    $( "#employeeStatusDiv" ).hide();
    $( "#createdByDiv" ).hide();
    statsConfig.query="statistics_query_anonymous_access";
  }

  $( "#info-row" ).show();
  $( "#infoSsoAddress" ).html('<a href="'+statsConfig.ssoUrl+'" target="_blank" >'+statsConfig.ssoUrl+'</a>');
  $( "#infoServerAuthAddress" ).html('<a href="'+statsConfig.serverUrl+'/v2/rest/auth/status?roles=a" target="_blank" >'+statsConfig.serverUrl+'/v2/rest/auth/status</a>')
  // if(statsConfig.userRoles==null) {
  //   $( "#info-row" ).show();
  // } else {
  //   $( "#info-row" ).hide();
  // }

}

var datepickerOptions = { autoclose: true, format: "yyyy-mm-dd" };
$( "#fromDate" ).datepicker(datepickerOptions);
$( "#toDate" ).datepicker(datepickerOptions);

function drawGraphs() {

  var urlParameters = "";

  var serverUrl = $( "#serverUrl" ).val();

  var fromDateField = $( "#fromDate" );
  var toDateField = $( "#toDate" );
  var productRadioVal = $('input[name=product]:checked', '#settings').val();
  var employeeRadioVal = $('input[name=employee]:checked', '#settings').val();
  var presentationRadioVal = $('input[name=presentation]:checked', '#settings').val();
  var bucketRadioVal = $('input[name=bucket]:checked', '#settings').val();
  var projectSelectedArr = $("#projectsSelect").select2("data");
  var authorsSelectedArr = $("#authorsSelect").select2("data");
  var interval = $('input[name=interval]:checked', '#settings').val();

  if (bucketRadioVal!='off') {

    urlParameters+="&second_level_aggregation=true";

    switch (bucketRadioVal) {

      case "employeeStatus" : 
        urlParameters+="&employee_nonemployee_aggregation=true"; break;
      case "productStatus" : 
        urlParameters+="&product_project_aggregation=true"; break;
      case "perAuthor" : 
        urlParameters+="&sys_contributor_aggregation=true"; break;
      case "perProject" : 
        urlParameters+="&sys_project_aggregation=true"; break;
    }

  }

  if (fromDateField.val() || toDateField.val() || productRadioVal!='all' || employeeRadioVal != 'anyone'
    || projectSelectedArr.length>0 || authorsSelectedArr.length>0 ) {

    if (fromDateField.val() || toDateField.val()) {

      urlParameters+="&date_range_check=true";

      if (fromDateField.val()) {
        urlParameters+="&from_date="+fromDateField.val()+"T00:00:00.000Z";
      }
      if (toDateField.val()) {
        urlParameters+="&to_date="+toDateField.val()+"T00:00:00.000Z";
      }

    }

    
    if (productRadioVal !== undefined && productRadioVal!='all') {
      urlParameters+="&is_product_check=true&is_product="+productRadioVal;
    }

    if (employeeRadioVal !== undefined && employeeRadioVal!='anyone') {
      urlParameters+="&is_employee_check=true&is_employee="+employeeRadioVal;
    }

    if (projectSelectedArr.length>0 ) {

      urlParameters += "&project_names_filter";

      for (var idx=0 ; idx < projectSelectedArr.length ; idx++ ) {
        urlParameters += "&sys_projects="+projectSelectedArr[idx].id;
      }

    }
    
    if (authorsSelectedArr.length>0 ) {

      urlParameters += "&sys_contributors_filter";

      var idsArr = [];
      for (var idx=0 ; idx < authorsSelectedArr.length ; idx++ ) {
        urlParameters += "&sys_contributors="+authorsSelectedArr[idx].id;
      }

    }

  }
  
  urlParameters+="&interval="+interval;

  console.log("URL PARAMETERS: "+urlParameters);
  statsConfig.resultsCollection={};


  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=blogpost'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var blogsDivRef = $('#blogsDiv');
      blogsDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Planet']=drawChart(results.aggregations.firstLevel.buckets,'blogsDiv','Number of blog posts.',
          interval, presentationRadioVal,'blogs-csv-button','blogs-xlsx-button','Planet');
      } else {
        blogsDivRef.empty();
        blogsDivRef.html('<h3>No results for blogs posts report.</h3>');
      }

    }
  });

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=forumthread'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var forumsDivRef = $('#forumsDiv');
      forumsDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive Forums']=drawChart(results.aggregations.firstLevel.buckets,'forumsDiv','Number of forum threads.',
          interval, presentationRadioVal,'forums-csv-button','forums-xlsx-button','Jive Forums');
      } else {
        forumsDivRef.empty();
        forumsDivRef.html('<h3>No results for forum threads report.</h3>');
      }

    }
  });

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=article'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var articlesDivRef = $('#articlesDiv');
      articlesDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive Articles']=drawChart(results.aggregations.firstLevel.buckets,'articlesDiv','Number of articles.',
          interval, presentationRadioVal,'articles-csv-button','articles-xlsx-button','Jive Articles');
      } else {
        articlesDivRef.empty();
        articlesDivRef.html('<h3>No results for articles report.</h3>');
      }

    }
  });

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=issue'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var jiraDivRef = $('#jiraDiv');
      jiraDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['JIRA']=drawChart(results.aggregations.firstLevel.buckets,'jiraDiv','Number of jira issues.',
          interval, presentationRadioVal,'jira-csv-button','jira-xlsx-button','JIRA');
      } else {
        jiraDivRef.empty();
        jiraDivRef.html('<h3>No results for JIRA report.</h3>');
      }

    }
  });

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=mailing_list_message'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var mlDivRef = $('#mailListDiv');
      mlDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Mailing-lists']=drawChart(results.aggregations.firstLevel.buckets,'mailingListDiv','Number of mails.',
          interval, presentationRadioVal,'ml-csv-button','ml-xlsx-button', 'Mailing-lists');
      } else {
        mlDivRef.empty();
        mlDivRef.html('<h3>No results for mailing list report.</h3>');
      }

    }
  });


  if (statsConfig.userRoles && statsConfig.userRoles.indexOf("trusted")!=-1 ) {
    $.ajax({
      type: "GET",
      url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?sct=jbossorg_dm_logs'+urlParameters,
      xhrFields : {withCredentials:true},
      crossDomain: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(results) {
        console.log(results);
        var downloadsDivRef = $('#downloadsDiv');
        downloadsDivRef.parent().css('visibility','visible');
        if (results.aggregations.firstLevel.buckets.length) {
          statsConfig.resultsCollection['DownloadManager']=drawChart(results.aggregations.firstLevel.buckets,'downloadsDiv','Number of downloads.',
            interval, presentationRadioVal,'dm-csv-button','dm-xlsx-button','DownloadManager');
        } else {
          downloadsDivRef.empty();
          downloadsDivRef.html('<h3>No results for mailing list report.</h3>');
        }

      }
    });
  }

  // $.ajax({
  //   type: "GET",
  //   url: serverUrl+'/data_contributor_profile/_search?source='+encodeURIComponent(JSON.stringify(data)),
  //   contentType: "application/json; charset=utf-8",
  //   dataType: "json",
  //   success: function(results) {
  //     console.log(results);
  //     if (results.facets.firstLevel.entries.length) {
  //       drawChart(results.facets.firstLevel.entries,'usersDiv','Number of new users.',data.facets.firstLevel.date_histogram.interval);
  //     } else {
  //       var blogsDivRef = $('#usersDiv');
  //       blogsDivRef.empty();
  //       blogsDivRef.html('<h3>No results for new users report.</h3>');
  //     }
  //   }
  // });

}

/*
$("#projectsSelect").select2({ 
  "placeholder" : "None selected" ,
  "width" : "100%",
  "multiple" : true,
  "minimumInputLength" : "2",
  query: function (query) {
    var data = {results: []};
    var serverUrl = $( "#serverUrl" ).val();

    if (!checkIfServerUrlIsProvided()) {
      return data;
    }

      // Getting sys_projects
      $.ajax({
        type: "POST",
        url: serverUrl+'/v2/rest/sys/es/search/sys_projects/_search?size=5&_source_include=code,name',
        data: JSON.stringify({
          "query" : {
            "filtered" : {
              "filter" : {
                "regexp" : { "code" : ".*"+query.term.toLowerCase()+".*" }
              }
            }
          }
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(results) {
          console.log(results);

          var selectObj = $('#projectsSelect', '#settings')[0];

          if (results.hits.total>0) {

            results.hits.hits.sort(function(a,b) { 
              return a._source.name.localeCompare(b._source.name);
            });

            for (var index = 0 ; index < results.hits.hits.length ; index++ ) {
              var name = results.hits.hits[index]._source.name;
              var code = results.hits.hits[index]._source.code;
              name = ( name === undefined || name=='' ? code : name ) ;
              data.results.push({id:code,text: name});
            }

          }

          query.callback(data);
        }
      });
  }
});

$("#authorsSelect").select2({ 
  "placeholder" : "None selected" ,
  "width" : "100%",
  "multiple" : true,
  "minimumInputLength" : "2",
  query: function (query) {
    var data = {results: []};
    var serverUrl = $( "#serverUrl" ).val();

    if (!checkIfServerUrlIsProvided()) {
      return data;
    }

    $.ajax({
      type: "POST",
      url: serverUrl+'/v2/rest/sys/es/search/sys_contributors/_search?size=5&_source_include=code',
      data: JSON.stringify(
        {
          "query" : { 
            "filtered" : {
              "filter" : {
                "regexp" : { "code" : ".*"+query.term.toLowerCase()+".*" }
              }
            }
          }
        }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(results) {

        if (results.hits.total>0) {

          for (var index = 0 ; index < results.hits.hits.length ; index++ ) {
            var code = results.hits.hits[index]._source.code;
            data.results.push({id:code,text: code});
          }

        }

        query.callback(data);
      }
    });

  }
});*/

$( document ).ready(function() {
  var sv = getQueryVariable('serverUrl');
  if (sv) {
    statsConfig.serverUrl=sv;
  } else {
    statsConfig.serverUrl = 'https://dcp2.jboss.org';
  }
  $( "#serverUrl" ).val(statsConfig.serverUrl);

  var ssoUrl = getQueryVariable('ssoUrl');
  if (!ssoUrl) {
    ssoUrl = 'https://sso.jboss.org';
  }
  statsConfig.ssoUrl = ssoUrl;

  var loginDiv = $( "#login-info" );
  // $.ajax({
  //   type: "GET",
  //   url: statsConfig.serverUrl+'/v2/rest/auth/status?roles=a',
  //   xhrFields:  { withCredentials: true },
  //   success: function(results) {
  //     console.log(results);

      // $.ajax({
      //   type: "GET",
      //   url: ssoUrl+'/logininfo?backurl='+document.URL,
      //   xhrFields:  { withCredentials: true },
      //   success: function(ssoResults) {
      //     loginDiv.html(ssoResults.part1+" | "+ssoResults.part2);
      //   }
      // });

      // if (results.authenticated) {
      //   statsConfig.userRoles=results.roles;
      // } else {

      // }


  //   },
  //   error: function(jqXHR, textStatus, errorThrown ) {
  //     alert('Please reload the page because SSO integration with Searchisko failed.');
  //   }
  // });

  statsConfig.userRoles=["trusted"];

  initializeRoleBasedSettings();

});