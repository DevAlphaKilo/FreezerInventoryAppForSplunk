require([
     'underscore',
     'jquery',
     'splunkjs/mvc',
     'splunkjs/mvc/searchmanager',
     'splunkjs/mvc/tableview',
     'splunkjs/mvc/simplexml/ready!'
],
function(_, $, mvc, SearchManager, TableView){
    	
	// Translations from rangemap results to CSS class
    var ICONS = {
        edit: 'settings',
		delete: 'x'
    };
	
	var CustomCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            // Enable this custom cell renderer for 
            return _(['edit','delete']).contains(cell.field);
        },
        render: function($td, cell) {
            var icon = 'question';
            // Fetch the icon for the value
            if (ICONS.hasOwnProperty(cell.field)) {
                icon = ICONS[cell.field];
                // Create the icon element and add it to the table cell
                $td.addClass('icon').html(_.template('<div style="float:left; max-height:22px; margin:0px;"><i class="icon-<%-icon%>"></i></div>', {
                    icon: icon,
                }));
            }
        }
    });

	// Set up search managers
    var search_items = new SearchManager({
        id: "freezer_items",
        search: "| inputlookup freezer_items | table edit, id, status, type, subtype, sub_subtype, purchase_date, sealed_date",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: true,
		cancelOnUnload: true
    });
	
    // Create a table
    var myTableObj = new TableView({
        id: "myTable_rendered",
        managerid: "freezer_items",
		drilldown: "none",
		pageSize: "10",
		showPager: true,
		"link.exportResults.visible": true,
		"link.openSearch.visible": false,
		"link.visible": true,
        el: $("#myTable")
    })
	
	myTableObj.addCellRenderer(new CustomCellRenderer());
	console.log(myTableObj);
	myTableObj.render();
});