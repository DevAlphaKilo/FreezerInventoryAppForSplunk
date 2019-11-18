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

require(["jquery","splunkjs/mvc",'splunk.util',"splunkjs/mvc/simplexml/ready!"],
function($, mvc, splunkUtil){
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
		
		var default_freezer_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers?action=get_default_freezer');
		var default_freezer_id = ''		
		
		$.get(default_freezer_url, function(data, status) {
			//console.log(data);
			//console.log(status);
			// post each generated event
			var default_freezer_id = data["_key"]
			$.each(tableResults, function( result_index ) {
				// each result item 
				this["freezer"] = default_freezer_id;
				this["status"] = "available";
				delete this['pack_id'];
				data = JSON.stringify(this);
				console.log(data);

				var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items');
				var post_data = {
					action    : 'add_item',
					item_data : data,
				};
				$.post( rest_url, post_data, function(data, status) {
					console.log(data);
					console.log(status);
				}, "json");
			});
		}, "json");
		
        
        var modal = ''+
'<div class="modal fade" id="post_success">' +
'  <div class="modal-dialog model-sm">' +
'    <div class="modal-content">' +
'      <div class="modal-header">' +
'        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
'        <h4 class="modal-title">Item(s) Added</h4>' +
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