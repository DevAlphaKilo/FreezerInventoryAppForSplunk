
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
            data = JSON.stringify(this);
            console.log(data);
            insertData("test", data, "FreezerInventory", "freezer:item");
        });
        // reset dropdowns after posting events
        $("div[class='input input-dropdown'").each(function( index ) {
            //console.log(this.id);
            mvc.Components.get(this.id).val(undefined);
        });
        // hide the temp item table after clearing input
        mvc.Components.getInstance('submitted').unset("input_complete")
    });
});