function showItemTable (_, $, mvc, SearchManager, TableView) {
    $("#recentlyAddedItems").append("<div id=\"recentlyAddedItems_label\"><h2>Recently Added Items</h2></div><div id=\"recentlyAddedItems_container\"></div>");

    var time = Date.now();
	
	var search_freezers = new SearchManager({
        id: "freezers" + time,
        search: "| `freezers` | stats dc(id) AS total_defaults",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});
	
	var mainSearch = mvc.Components.get("freezers" + time);
    //console.log(mainSearch)
    var myResults = mainSearch.data("preview", { count: 1, offset: 0 });

    myResults.on("data", function() {
        // The full data object
        var results = myResults.data();
        var defaultCount = parseInt(results.rows[0]);
		if (defaultCount == 0)
        {
            //console.log("Default count is > than 1");
            //setToken("show_warning_none", "true");
			mvc.Components.getInstance('default', {create: true}).set("show_warning_none", true);
            mvc.Components.getInstance('submitted', {create: true}).set("show_warning_none", true);
        }
        else
        {
            //console.log("Default count is <= than 1");
            //unsetToken("show_warning_none");
			mvc.Components.getInstance('default', {create: true}).unset("show_warning_none");
            mvc.Components.getInstance('submitted', {create: true}).unset("show_warning_none");
        }
    });

    // Set up search managers
    var search_items = new SearchManager({
        id: "freezer_items" + time,
        search: "| `freezer_items` | search status=\"available\" | eval today=strftime(now(), \"%d-%m-%Y\"), input_day=strftime(input_date, \"%d-%m-%Y\"), input_is_today=case(today==input_day,1,true(),0) | search input_is_today=1 | eval input_date=strftime(input_date, \"%m/%d/%Y %H:%M:%S\"), sealed_date=strftime(sealed_date, \"%m/%d/%Y %H:%M:%S\"), purchase_date=strftime(purchase_date, \"%m/%d/%Y %H:%M:%S\") | table type, subtype, sub_subtype, pack_contains, input_date, purchase_date, sealed_date",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});

    var searchmanager_items = splunkjs.mvc.Components.get("freezer_items" + time);
    searchmanager_items.on("search:done", function (state,job) {
        if (state.content.resultCount === 0) {
            //unsetToken("show_recent");
            mvc.Components.getInstance('default', {create: true}).unset("show_recent");
            mvc.Components.getInstance('submitted', {create: true}).unset("show_recent");
        }
        else
        {
            //setToken("show_recent", true);
            mvc.Components.getInstance('default', {create: true}).set("show_recent", true);
            mvc.Components.getInstance('submitted', {create: true}).set("show_recent", true);
        }
    });

    // Create a table
    var myTableObj = new TableView({
        id: "recentlyAddedItems_rendered",
        managerid: "freezer_items" + time,
        drilldown: "none",
        pageSize: "10",
        showPager: true,
        "link.exportResults.visible": true,
        "link.openSearch.visible": false,
        "link.visible": true,
        el: $("#recentlyAddedItems_container")
    });

    console.log(myTableObj);
    myTableObj.render();

    $("#warning_none").children().addClass("custom-panel-background");
	$("#panel_instructions").children().addClass("custom-panel-background");
	$("#panel_additions").children().addClass("custom-panel-background");
    $("#panel_controls").children().addClass("custom-panel-background");
	$("#panel_recent_items").children().addClass("custom-panel-background");    
}

require([
     'underscore',
     'jquery',
     'splunk.util',
     'splunkjs/mvc',
     'splunkjs/mvc/searchmanager',
     'splunkjs/mvc/tableview',
     'splunkjs/mvc/simplexml/ready!'
],
function(_, $, splunkUtil, mvc, SearchManager, TableView){

    var defaultTokenModel = mvc.Components.getInstance('default', {create: true});
    var submittedTokenModel = mvc.Components.getInstance('submitted', {create: true});

    function setToken(name, value) {
        defaultTokenModel.set(name, value);
        submittedTokenModel.set(name, value);
    }

    function unsetToken(name) {
        defaultTokenModel.unset(name);
        submittedTokenModel.unset(name);
    }	
	
	function swapToDatepicker(input_el) {
		var today  = new Date();
		
		mvc.Components.get(input_el).children["input"].$el.remove();

		$("#" + input_el).append('<input type="text" class="datepicker" data-provide="datepicker" data-date-format="mm/dd/yyyy">');
		
		$('#' + input_el + ' .datepicker').datepicker({
			format: 'mm/dd/yyyy',
			defaultDate: today.toLocaleDateString("en-US"),
			onSelect: function(dateText) {
				setToken(input_el, dateText);
			}
		});
		
		$('#' + input_el + ' .datepicker').val($('#' + input_el + ' .datepicker').datepicker("option","defaultDate"));
		
		setToken(input_el, $('#' + input_el + ' .datepicker').datepicker("option","defaultDate"));
	}
	
    swapToDatepicker("purchase_date");
	swapToDatepicker("sealed_date");

    function resetForm() {
        // reset dropdowns after posting events
        $("div[class='input input-dropdown'").each(function( index ) {
            //console.log(this.id);
            mvc.Components.get(this.id).val(undefined);
        });
        // hide the temp item table after clearing input
        unsetToken("input_complete");
        setToken("show_instructions", true);
        $("#recentlyAddedItems_label").remove();
        mvc.Components.get("recentlyAddedItems_rendered").remove();
        showItemTable(_, $, mvc, SearchManager, TableView);
    }

    setToken("show_instructions", true);

    showItemTable(_, $, mvc, SearchManager, TableView);

    // clear forms when updated
    $("div[class='input input-dropdown'").each(function( index ) {
        //console.log(this.id);
        var name = this.id;
        window[name] = mvc.Components.get(this.id);
    });
    item_type.on('change', function() {
        item_subtype.val(undefined);
        unsetToken("show_instructions");
    });
    item_subtype.on('change', function() {
        item_sub_subtype.val(undefined);
        unsetToken("show_instructions");
    });
    // submit button 'click' event
    $("#submit_button").on("click", function (){

        setToken("show_instructions", true);

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
            var default_freezer_id = data["id"]
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

		$('#post_success').remove();

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
		setTimeout(function() {	$(document).find("#post_success").fadeOut(900); }, 2000);
		setTimeout(function() {	$("div.modal-backdrop.fade").remove(); }, 3000);
        resetForm(mvc);
    });
    $("#reset_button").on("click", function (){ resetForm(mvc); });
});