
var splunkWebHttp = new splunkjs.SplunkWebHttp();
var service = new splunkjs.Service(splunkWebHttp);

require([
     'jquery',
     'splunkjs/mvc',
     'splunkjs/mvc/tableview',
     'splunkjs/mvc/simplexml/ready!'
],
function($, mvc, TableView){
    // Search everything and return the first 100 results
    var searchQuery = "| inputlookup freezer_items";

    // Set the search parameters
    var searchParams = {
      exec_mode: "normal",
      earliest_time: "-15m@m"
    };

    // Run a normal search that immediately returns the job's SID
    service.search(
      searchQuery,
      searchParams,
      function(err, job) {

        // Display the job's search ID
        console.log("Job SID: ", job.sid);

        // Poll the status of the search job
        job.track({period: 200}, {
          done: function(job) {
            console.log("Done!");

            // Print out the statics
            console.log("Job statistics:");
            console.log("  Event count:  " + job.properties().eventCount); 
            console.log("  Result count: " + job.properties().resultCount);
            console.log("  Disk usage:   " + job.properties().diskUsage + " bytes");
            console.log("  Priority:     " + job.properties().priority);

            // Get the results and print them
            job.results({}, function(err, results, job) {
              var fields = results.fields;
              var rows = results.rows;
              for(var i = 0; i < rows.length; i++) {
                var values = rows[i];
                console.log("Row " + i + ": ");
                for(var j = 0; j < values.length; j++) {
                  var field = fields[j];
                  var value = values[j];
                  console.log("  " + field + ": " + value);
                }
              }
            });
            
          },
          failed: function(job) {
            console.log("Job failed")
          },
          error: function(err) {
            done(err);
          }
        });

      }
    );

    var TableView =  
    var element1 = new TableView({
    id: "element1",
    count: 10,
    dataOverlayMode: "none",
    drilldown: "cell",
    rowNumbers: "false",
    wrap: "true",
    managerid: "search1",
    el: $("#myTable")
    });
});