
function showFreezersTable (_, $, SearchManager, TableView) {
	// Translations from rangemap results to CSS class
    var ICONS = {
        edit: 'gear',
        delete: 'x',
		0: 'box-unchecked',
		1: 'box-checked'
    };
	
	$("#myTable").append("<div id=\"myTable_container\"></div>");

	var time = Date.now();

    var CustomCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            // Enable this custom cell renderer for 
            return _(['edit','delete','active','default']).contains(cell.field);
        },
        render: function($td, cell) {
            var icon = 'question';
			// Fetch the icon for the value
			if (ICONS.hasOwnProperty(cell.field)) {
				icon = ICONS[cell.field];
				// Create the icon element and add it to the table cell
				$td.addClass('icon').html(_.template('<div><i class="icon-<%-icon%>"></i></div>', {
					icon: icon,
				}));
			}
			
			if (ICONS.hasOwnProperty(cell.value)) {
				icon = ICONS[cell.value];
				// Create the icon element and add it to the table cell
				$td.addClass('icon').html(_.template('<div><i class="icon-<%-icon%>"></i></div>', {
					icon: icon,
				}));
			}
            
            $td.on("click", function(e) {
                console.log("event handler fired (click-td)");
                e.stopPropagation();
                $td.trigger("iconclick", {"field": cell.field });
            });
        }
    });

    // Set up search managers
    var search_freezers = new SearchManager({
        id: "freezers_" + time,
        search: "| `freezers` | table edit, active, default, id, location, name",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: true,
        cancelOnUnload: true
    }, {tokens: true});
    
    // Create a table
    var myTableObj = new TableView({
        id: "myTable_rendered",
        managerid: "freezers_" + time,
        drilldown: "none",
        pageSize: "10",
        showPager: true,
        "link.exportResults.visible": true,
        "link.openSearch.visible": false,
        "link.visible": true,
        el: $("#myTable_container")
    });
    
    myTableObj.addCellRenderer(new CustomCellRenderer());
    console.log(myTableObj);
    myTableObj.render();
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
	
	// Set up search managers
    var search_defaults = new SearchManager({
        id: "default_freezers",
        search: "| `freezers` | search default=\"1\" | stats dc(id) AS total_defaults",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});
		
	var mainSearch = mvc.Components.get("default_freezers");
	//console.log(mainSearch)
	var myResults = mainSearch.data("preview", { count: 1, offset: 0 });
	
	myResults.on("data", function() {
		// The full data object
		var results = myResults.data();
		var defaultCount = parseInt(results.rows[0]);
		if (defaultCount > 1)
		{
			//console.log("Default count is > than 1");
			setToken("show_warning_duplicate", "true");
		}
		else
		{
			//console.log("Default count is <= than 1");
			unsetToken("show_warning_duplicate");
		}		
	});
        
    showFreezersTable(_, $, SearchManager, TableView);
    
    $(document).on("iconclick", "td", function(e, data) {
        //console.log("e", e);
        //console.log("field", data)
		
		//$("div#item_options").remove()
		//
        //if (data.field=="edit") {
        //    var item_id=($(this).parent().find("td.id")[0].innerHTML);
        //    var item_input_date=($(this).parent().find("td.input_date")[0].innerHTML);
        //    //console.log("id", item_id)
        //    
        //    var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items?action=get_item_info&id=' + item_id);
        //    $.getJSON(rest_url, function(data, status) {
        //        //showModalItemDetails(splunkUtil, mvc, data);
		//		//update_item_table = true;
        //    }, "json");
        //}
    });
	
	//(document).on("savemodal", ".btn.btn-primary.btn-save", function(e, data) {
    //   console.log("e", e);
	//	data = JSON.stringify(data);
	//	console.log(data);
	//	
	//	var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items');
	//	var post_data = {
	//		action    : 'update_item',
	//		item_data : data,
	//	};
	//	console.log(post_data);
	//	$.post( rest_url, post_data, function(data, status) {
	//		console.log(data);
	//		console.log(status);
	//	}, "json");
    //);
});