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

function cleanGraphs() {

  var panels = $("#graphs .panel-body");
  for (var i=0;i<panels.length;i++) {
    panels[i].innerHTML="";
  }

  var headerStats = $("#graphs span");
  for (var i=0;i<headerStats.length;i++) {
    headerStats[i].innerHTML="";
  }

  var fileDownloads = $("#graphs a");
  for (var i=0;i<fileDownloads.length;i++) {
    fileDownloads[i].href="#";
  }

  $("#overall-xlsx-button").href="#";

  statsConfig.resultsCollection={};
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
  $( "#infoSsoAddress" ).html('<a href="'+statsConfig.ssoUrl+'" >SSO server</a>');
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
  var timezone = $('input[name=timezone]:checked', '#settings').val();

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
      case "perProjectEmployee" : 
        urlParameters+="&sys_project_aggregation=true&sys_project_employee_aggregation=true"; break;
      case "perCountry" :
        urlParameters+="&country_aggregation=true"; break;
      case "perCompany" :
        urlParameters+="&company_aggregation=true"; break;
    }

  }

  if (fromDateField.val() || toDateField.val() || productRadioVal!='all' || employeeRadioVal != 'anyone'
    || projectSelectedArr.length>0 || authorsSelectedArr.length>0 ) {

    if (fromDateField.val() || toDateField.val()) {

      urlParameters+="&date_range_check=true";

      if (fromDateField.val()) {
        if(timezone=='America/New_York') {
          urlParameters+="&from_date="+moment.tz(fromDateField.val(), "America/New_York").toISOString();
        } else {
          urlParameters+="&from_date="+fromDateField.val()+'T00:00:00.000Z';
        }
      }
      if (toDateField.val()) {
        if(timezone=='America/New_York') {
          urlParameters+="&to_date="+moment.tz(toDateField.val()+'T23:59:59.999', "America/New_York").toISOString();
        } else {
          urlParameters+="&to_date="+toDateField.val()+'T23:59:59.999Z';
        }
      }

    }

    
    if (productRadioVal !== undefined && productRadioVal!='all') {
      urlParameters+="&is_product_check=true&is_product="+productRadioVal;
    }

    if (employeeRadioVal !== undefined && employeeRadioVal!='anyone') {
      urlParameters+="&is_employee_check=true&is_employee="+employeeRadioVal;
    }

    /* FILTERING OVER SPECIFIC PROJECT NAMES IS CURRENTLY DISABED AND NOT SUPPORTED BY THE QUERY
    if (projectSelectedArr.length>0 ) {

      urlParameters += "&project_names_filter";

      for (var idx=0 ; idx < projectSelectedArr.length ; idx++ ) {
        urlParameters += "&sys_projects="+projectSelectedArr[idx].id;
      }

    }*/
    
    /* FILTERING OVER SPECIFIC CONTRIBUTORS IS CURRENTLY DISABLED AND NOT SUPPORTED BY THE QUERY
    if (authorsSelectedArr.length>0 ) {

      urlParameters += "&sys_contributors_filter";

      var idsArr = [];
      for (var idx=0 ; idx < authorsSelectedArr.length ; idx++ ) {
        urlParameters += "&sys_contributors="+authorsSelectedArr[idx].id;
      }

    }*/

  }
  
  urlParameters+="&interval="+interval;
  urlParameters+="&timezone_offset="+timezone;

  console.log("URL PARAMETERS: "+urlParameters);
  statsConfig.resultsCollection={};

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?sct=rht_user_profile'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var blogsDivRef = $('#rhtUserProfileDiv');
      blogsDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['rhtUserProfile']=drawChart(results.aggregations.firstLevel.buckets,'rhtUserProfileDiv','Number of developers.redhat.com registered users.',
          interval, presentationRadioVal,'rhtUserProfile-csv-button','rhtUserProfile-xlsx-button','rhtUserProfileStats','RHD new registrations', false);
      } else {
        blogsDivRef.empty();
        blogsDivRef.html('<h3>No results for developers.redhat.com registrations.</h3>');
      }

    }
  });

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?sct=jbossorg_contributor_profile'+urlParameters,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var blogsDivRef = $('#jbdUserProfileDiv');
      blogsDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['jbdUserProfile']=drawChart(results.aggregations.firstLevel.buckets,'jbdUserProfileDiv','Number of www.jboss.org registered users.',
          interval, presentationRadioVal,'jbdUserProfile-csv-button','jbdUserProfile-xlsx-button','jbdUserProfileStats','JBD new registrations', false);
      } else {
        blogsDivRef.empty();
        blogsDivRef.html('<h3>No results for www.jboss.org registrations.</h3>');
      }

    }
  });

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
          interval, presentationRadioVal,'blogs-csv-button','blogs-xlsx-button','blogsStats','Planet', true);
      } else {
        blogsDivRef.empty();
        blogsDivRef.html('<h3>No results for blogs posts report.</h3>');
      }

    }
  });

  // user forum question threads
  var additionalQuestionParam = '&is_question_thread_check=true';
  additionalQuestionParam += '&is_development_space=false';
  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=forumthread'+urlParameters+additionalQuestionParam,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var forumsDivRef = $('#forumsQuestionDiv');
      forumsDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive User Forum Question Threads']=drawChart(results.aggregations.firstLevel.buckets,'forumsQuestionDiv','Number of user forum question threads.',
          interval, presentationRadioVal,'forums-question-csv-button','forums-question-xlsx-button','forumsQuestionStats','Jive User Forum Question Threads', true);
      } else {
        forumsDivRef.empty();
        forumsDivRef.html('<h3>No results for user forum question threads report.</h3>');
      }

    }
  });


  // user forum helpful answers
  var additionalHelpfulAnswerParam = '&is_helpful_answer_question_check=true';
  additionalHelpfulAnswerParam += '&date_field=sys_comments.comment_created';
  additionalHelpfulAnswerParam += '&employee_field=sys_comments.comment_author.red_hat.employee';
  additionalHelpfulAnswerParam += '&employee_path_field=sys_comments.comment_author.red_hat';
  additionalHelpfulAnswerParam += '&author_field=sys_comments.comment_author.sys_contributor';
  additionalHelpfulAnswerParam += '&author_path_field=sys_comments';
  additionalHelpfulAnswerParam += '&main_nesting=true';
  additionalHelpfulAnswerParam += '&main_nesting_path=sys_comments';
  additionalHelpfulAnswerParam += '&product_field=sys_comments.product';
  additionalHelpfulAnswerParam += '&sys_project_field=sys_comments.sys_project';
  additionalHelpfulAnswerParam += '&is_development_space=true';
  additionalHelpfulAnswerParam += '&development_space=false';

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=forumthread'+urlParameters+additionalHelpfulAnswerParam,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var forumsDivRef = $('#forumsHelpfulDiv');
      forumsDivRef.parent().css('visibility','visible');
      if (results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive User Forum Helpful Answers']=drawChart(results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets,
          'forumsHelpfulDiv','Number of user forum helpful answers.', interval, presentationRadioVal,'forums-helpful-csv-button',
          'forums-helpful-xlsx-button','forumsHelpfulStats','Jive User Forum Helpful Answers', true);
      } else {
        forumsDivRef.empty();
        forumsDivRef.html('<h3>No results for user forum helpful answers report.</h3>');
      }

    }
  });


  // user forum correct answers
  var additionalCorrectAnswerParam = '&is_correct_answer_question_check=true';
  additionalCorrectAnswerParam += '&date_field=sys_comments.comment_created';
  additionalCorrectAnswerParam += '&employee_field=sys_comments.comment_author.red_hat.employee';
  additionalCorrectAnswerParam += '&employee_path_field=sys_comments.comment_author.red_hat';
  additionalCorrectAnswerParam += '&author_field=sys_comments.comment_author.sys_contributor';
  additionalCorrectAnswerParam += '&author_path_field=sys_comments';
  additionalCorrectAnswerParam += '&main_nesting=true';
  additionalCorrectAnswerParam += '&main_nesting_path=sys_comments';
  additionalCorrectAnswerParam += '&product_field=sys_comments.product';
  additionalCorrectAnswerParam += '&sys_project_field=sys_comments.sys_project';
  additionalCorrectAnswerParam += '&is_development_space=true';
  additionalCorrectAnswerParam += '&development_space=false';
  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=forumthread'+urlParameters+additionalCorrectAnswerParam,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var forumsDivRef = $('#forumsCorrectDiv');
      forumsDivRef.parent().css('visibility','visible');
      if (results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive User Forum Correct Answers']=drawChart(results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets,
          'forumsCorrectDiv','Number of user forum correct answers.', interval, presentationRadioVal,'forums-correct-csv-button',
          'forums-correct-xlsx-button','forumsCorrectStats','Jive User Forum Correct Answers', true);
      } else {
        forumsDivRef.empty();
        forumsDivRef.html('<h3>No results for user forum helpful answers report.</h3>');
      }

    }
  });

  // Dev forums threads
  var additionalDevForumsParams = '&is_development_space=true';
  additionalDevForumsParams += '&development_space=true';
  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=forumthread'+urlParameters+additionalDevForumsParams,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var forumsDivRef = $('#devForumsDiv');
      forumsDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive Development Forum New Threads']=drawChart(results.aggregations.firstLevel.buckets,'devForumsDiv','Number of development forum threads.',
          interval, presentationRadioVal,'forums-dev-csv-button','forums-dev-xlsx-button','devForumsStats','Jive Development Forum New Threads', true);
      } else {
        forumsDivRef.empty();
        forumsDivRef.html('<h3>No results for development forum threads report.</h3>');
      }

    }
  });

  // dev forums replies
  var additionalCommentsParams = '&main_nesting=true';
  additionalCommentsParams += '&main_nesting_path=sys_comments';
  additionalCommentsParams += '&date_field=sys_comments.comment_created';
  additionalCommentsParams += '&employee_field=sys_comments.comment_author.red_hat.employee';
  additionalCommentsParams += '&employee_path_field=sys_comments.comment_author.red_hat';
  additionalCommentsParams += '&author_field=sys_comments.comment_author.sys_contributor';
  additionalCommentsParams += '&author_path_field=sys_comments';
  additionalCommentsParams += '&product_field=sys_comments.product';
  additionalCommentsParams += '&sys_project_field=sys_comments.sys_project';
  additionalCommentsParams += '&is_development_space=true';
  additionalCommentsParams += '&development_space=true';
  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=forumthread'+urlParameters+additionalCommentsParams,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var forumsDivRef = $('#forumCommentsDiv');
      forumsDivRef.parent().css('visibility','visible');
      if (results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets.length) {
        statsConfig.resultsCollection['Jive Development Forum Replies']=drawChart(results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets,
          'forumCommentsDiv','Number of development forum replies.', interval, presentationRadioVal,'forums-comments-csv-button','forums-comments-xlsx-button',
          'forumCommentsStats','Jive Development Forum Replies', true);
      } else {
        forumsDivRef.empty();
        forumsDivRef.html('<h3>No results for development forum replies report.</h3>');
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
        statsConfig.resultsCollection['New Jive Articles']=drawChart(results.aggregations.firstLevel.buckets,'articlesDiv','Number of new articles.',
          interval, presentationRadioVal,'articles-csv-button','articles-xlsx-button','articlesStats','New Jive Articles', true);
      } else {
        articlesDivRef.empty();
        articlesDivRef.html('<h3>No results for articles report.</h3>');
      }

    }
  });

  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=article'+urlParameters+additionalCommentsParams,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var articlesDivRef = $('#articlesCommentsDiv');
      articlesDivRef.parent().css('visibility','visible');
      if (results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets.length) {
        statsConfig.resultsCollection['New Jive Articles Comments']=drawChart(results.aggregations.nested_main_level.aggregations_filtering.firstLevel.buckets,
          'articlesCommentsDiv','Number of new articles comments.', interval, presentationRadioVal,'articles-comments-csv-button',
          'articles-comments-xlsx-button','articlesCommentsStats','Jive Articles New Comments', true);
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
        statsConfig.resultsCollection['JIRA New Issues']=drawChart(results.aggregations.firstLevel.buckets,'jiraDiv','Number of new jira issues.',
          interval, presentationRadioVal,'jira-csv-button','jira-xlsx-button','jiraStats','JIRA New Issues', true);
      } else {
        jiraDivRef.empty();
        jiraDivRef.html('<h3>No results for new JIRA issues report.</h3>');
      }

    }
  });

  var additionalJiraResolvedParams = '&date_field=resolutiondate';
  additionalJiraResolvedParams += '&employee_field=assignee.red_hat.employee';
  additionalJiraResolvedParams += '&employee_path_field=assignee.red_hat';
  additionalJiraResolvedParams += '&author_field=assignee.sys_contributor';
  additionalJiraResolvedParams += '&author_path_field=assignee';
  $.ajax({
    type: "GET",
    url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?st=issue'+urlParameters+additionalJiraResolvedParams,
    xhrFields : {withCredentials:true},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(results) {
      console.log(results);
      var jiraDivRef = $('#jiraResolvedDiv');
      jiraDivRef.parent().css('visibility','visible');
      if (results.aggregations.firstLevel.buckets.length) {
        statsConfig.resultsCollection['JIRA Resolved Issues']=drawChart(results.aggregations.firstLevel.buckets,'jiraResolvedDiv','Number of resolved jira issues.',
          interval, presentationRadioVal,'jira-resolved-csv-button','jira-resolved-xlsx-button','jiraResolvedStats','JIRA Resolved Issues', true);
      } else {
        jiraDivRef.empty();
        jiraDivRef.html('<h3>No results for new JIRA issues report.</h3>');
      }

    }
  });

  /*$.ajax({
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
  });*/

  var additionalDownloadManagerParams='&company_field=sys_authors.company';
  additionalDownloadManagerParams += '&country_field=sys_authors.country';
  additionalDownloadManagerParams += '&author_field=username';
  if (statsConfig.userRoles && statsConfig.userRoles.indexOf("trusted")!=-1 ) {
    $.ajax({
      type: "GET",
      url: statsConfig.serverUrl+'/v2/rest/search/'+statsConfig.query+'?sct=jbossorg_dm_logs'+urlParameters+additionalDownloadManagerParams,
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
            interval, presentationRadioVal,'dm-csv-button','dm-xlsx-button','dmStats','DownloadManager downloads', false);
        } else {
          downloadsDivRef.empty();
          downloadsDivRef.html('<h3>No downloads results for DownloadManager report.</h3>');
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
  statsConfig.ssoUrl = ssoUrl+'/login?service='+encodeURIComponent(window.location.href);

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