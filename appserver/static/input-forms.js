require([ "jquery", "splunkjs/mvc/simplexml/ready!"],
function($){
    $( document ).ready(function() {
        console.log("document ready")
        var now = new Date();
        var date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear()
        $("input[role='textbox'").each(function( index ) {
           //$(this).attr("value", date)
           $(this).val(date)
        });
    ));
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
        $.each(tableResults,function( result_index ) {
          // each result item 
          console.log(JSON.stringify(this));
        });
    });
});