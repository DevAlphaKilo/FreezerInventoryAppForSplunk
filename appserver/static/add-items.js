
var splunkWebHttp = new splunkjs.SplunkWebHttp();
var service = new splunkjs.Service(splunkWebHttp);
var indexes = service.indexes();
function insertData(indexName, data, host, sourcetype) {
    // first get the index to use 
    indexes.fetch(function(err, indexes) {
        var myIndex = indexes.item(indexName);
        if (myIndex) {
            // console.log("Found " + myIndex.name + " index");
        } else {
            // console.log("Error!  Could not find index named " + indexName);
            return null;
        }
        // ******  Need to loop through JSON by items or text by line
        // Now loop through the data and insert each row or record
        //  lookup the sourcetype from the samples array and find the parse_method  (line | array)
        var parse_method = "line";
        // console.log("parsing as line");
        fileLines = data.split("\n")
        for (var i = 0; i < fileLines.length; i++) {
            // Submit an event to the index
            myIndex.submitEvent(fileLines[i], { host: host, sourcetype: sourcetype },
                function(err, result, myIndex) {
                    // console.log("Submitted event: ", result, "sourcetype:", sourcetype, "host:", host);
                });
        }
    });
}

//function insertData() {
//	$.ajax({
//        url: 'https://' + window.location.hostname + ':8088/services/collector/event',
//        type: 'POST',
//        async: false,
//        data: JSON.stringify({ "event": record }),
//        beforeSend: function(xhr) { xhr.setRequestHeader('Authorization', 'Splunk 1dg3235-ca51-439c-b816-64cf1963b251'); },
//        success: function(data, textStatus, xhr) {
//            $("#results").html("Success! <a href=\"" + window.location.origin + "/app/search/search?q=search%20index=_internal%20sourcetype=testdata\" target=\"_blank\">Launch Search for Data</a>")
//        },
//        error: function(xhr, textStatus, error) {
//            console.error("Error!", error);
//            $("#results").html("<p style=\"margin-top: 10px;\">Failure! Check the console for details... but probably it's because of a certificate error, unless you happen to have a valid certificate on your Splunk environment. The next leading cause of a failure here would be that there is a load balancer or firewall that's preventing access to that port.</p>")
//        }
//    })
//
//}

function resetForm(mvc) {
    // reset dropdowns after posting events
    $("div[class='input input-dropdown'").each(function( index ) {
        //console.log(this.id);
        mvc.Components.get(this.id).val(undefined);
    });
    // hide the temp item table after clearing input
    mvc.Components.getInstance('submitted').unset("input_complete");
    mvc.Components.getInstance('default').unset("input_complete");
}

require(["jquery","splunkjs/mvc","splunkjs/mvc/simplexml/ready!"],
function($, mvc){
    // clear forms when updated
    $("div[class='input input-dropdown'").each(function( index ) {
        //console.log(this.id);
        var name = this.id;
        window[name] = mvc.Components.get(this.id);
    });
    item_type.on('change', function() { item_subtype.val(undefined); });
    item_subtype.on('change', function() { item_sub_subtype.val(undefined); });
    // submit button 'click' event
    $("#submit_button").on("click", function (){
        var tableHeaders = {};
        var tableResults = {};
        $("#new_items").find("tr").each(function( row_index ) {
          // each table row  
          if (row_index==0) {
            // header row, build index of column headers
            $(this).children().each(function( cell_index ) {
              tableHeaders[cell_index] = $(this).text()
            });
          }
          else {
            // results rows
            var rowResults = {};
            $(this).children().each(function( cell_index ) {
              rowResults[tableHeaders[cell_index]] = $(this).text()
            });
            tableResults[row_index] = rowResults;
          }  
        });
        // post each generated event
        $.each(tableResults,function( result_index ) {
            // each result item 
            this["action"] = "added"
			this["status"] = "available"
            data = JSON.stringify(this);
            console.log(data);
            insertData("test", data, "FreezerInventory", "freezer:item");
        });
		var modal = ''+
'<div class="modal fade" id="post_success">' +
'  <div class="modal-dialog model-sm">' +
'    <div class="modal-content">' +
'      <div class="modal-header">' +
'        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
'        <h4 class="modal-title">Post Successful</h4>' +
'      </div>' +
'      <div class="modal-body">' +
'        <p>Your items have been added to your freezer inventory.</p>' +
'      </div>' +
'      <div class="modal-footer">' +
'        <button type="button" class="btn btn-primary" data-dismiss="modal">OK</button>' +
'      </div>' +
'    </div>' +
'  </div>' +
'</div>';
        $('body').prepend(modal);
        $('#post_success').modal('show');
        resetForm(mvc);
    });
	$("#reset_button").on("click", function (){ resetForm(mvc); });
});