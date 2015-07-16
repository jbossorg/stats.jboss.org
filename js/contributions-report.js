var reportCfg={};

$( document ).ready(function() {
  var sv = getQueryVariable('serverUrl');
  if (sv) {
    $( "#serverUrl" ).val(sv);
    reportCfg.serverUrl=sv;
  }

  var loginDiv = $( "#login-info" );
  $.ajax({
    type: "GET",
    url: reportCfg.serverUrl+'/v2/rest/auth/status?roles=a',
    xhrFields:  { withCredentials: true },
    success: function(results) {
      console.log(results);

        $.ajax({
          type: "GET",
          url: 'https://sso-dev.jboss.org/logininfo?backurl='+document.URL,
          //url: 'https://sso.stage.jboss.org/logininfo?backurl='+document.URL,
          xhrFields:  { withCredentials: true },
          success: function(ssoResults) {
            loginDiv.html(ssoResults.part1+" | "+ssoResults.part2);
          }
        });

      if (results.authenticated) {
        reportCfg.userRoles=results.roles;
        
      }
    }
  });

  if (reportCfg.userRoles && reportCfg.userRoles.indexOf("admin")!=-1 ) {
  $( "#employeeStatusDiv" ).show();
  $( "#createdByDiv" ).show();
  reportCfg.query="statsJBossOrgQueryWithAdminRole";
} else {
  $( "#employeeStatusDiv" ).hide();
  $( "#createdByDiv" ).hide();
  reportCfg.query="statsJBossOrgQuery";
}

});