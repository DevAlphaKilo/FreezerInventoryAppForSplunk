
function showModalItemDetails (splunkUtil, item) {
	
	//$.each(data, function(key, value) { 
	//    item[key] = value;
	//    //gen_modal = '          <div class="control-group shared-controls-controlgroup">' +
	//    //            '            <label for="' + key + '" class="control-label">' + key + ':</label>' +
	//    //            '            <div class="controls controls-block"><div class="control shared-controls-labelcontrol" id="' + key + '"><span class="input-label-' + key + '">' + value + '</span></div></div>' +
	//    //            '          </div>'    
	//   //add_modal = add_modal + gen_modal;
	//});
	
	var section_header_item_details = '<div>' +
	                                  '  <h5 class="item-details-header">Item Details</h5>';
	var section_body_item_details   = '  <div class="item-details-row"><div class="item-details-label">ID:</div><div class="item-details-value">' + item["id"] + '</div></div>' +
	                                  '  <div class="item-details-row"><div class="item-details-label">Type:</div><div class="item-details-value">' + item["type"] + '</div></div>' +
	                                  '  <div class="item-details-row"><div class="item-details-label">Subtype:</div><div class="item-details-value">' + item["subtype"] + '</div></div>' +
	                                  '  <div class="item-details-row"><div class="item-details-label">Sub_Subtype:</div><div class="item-details-value">' + item["sub_subtype"] + '</div></div>';
	var section_footer_item_details = '</div>';
	var section_item_details = section_header_item_details + section_body_item_details + section_footer_item_details;
	
	var section_header_location = '<div>' +
	                              '  <h5 class="location-header">Update Item</h5>';
	var section_body_location   = '    <div class="control-group shared-controls-controlgroup">' +
								  '      <label for="location" class="control-label">Storage Location:</label>' +
								  '        <div class="controls"><select name="status" id="location" disabled="disabled"></select></div>' +
								  '    </div>';
	var section_footer_location= '</div>';
	var section_location = section_header_location + section_body_location + section_footer_location;

	var modal = ''+
				'<div class="modal fade" id="item_options">' +
				'  <div class="modal-dialog model-sm">' +
				'    <div class="modal-content">' +
				'      <div class="modal-header">' +
				'        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
				'        <h4 class="modal-title">Item Options</h4>' +
				'      </div>' +
				'      <div class="modal-body">' +
						 section_item_details + 
				'        <hr>' +
						 section_location + 
				'      </div>' +
				'      <div class="modal-footer">' +
                '        <button type="button" class="btn cancel modal-btn-cancel pull-left" data-dismiss="modal">Cancel</button>' +
				'        <button type="button" class="btn btn-primary" data-dismiss="modal">Save</button>' +
				'      </div>' +
				'    </div>' +
				'  </div>' +
				'</div>';
	$('body').prepend(modal);
	$('#item_options').modal('show');
	
	var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items?action=get_freezers');
	$.getJSON(rest_url, function(data, status) {
		// each freezer in collection
		$("#location").select2();
		$.each(data, function(index, freezer) {
			if (freezer["active"]) { $('#location').append( $('<option></option>').val(freezer["name"]).html(freezer["name"]) ); }
		});		
	}, "json");
	$("#location").prop("disabled", false);	
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
            
            $td.on("click", function(e) {
                console.log("event handler fired");
                e.stopPropagation();
                $td.trigger("iconclick", {"field": cell.field });
            });
        }
    });
    
    var HiddenCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            // Only use the cell renderer for the specific field
            return (cell.field==="id" || cell.field==="status" || cell.field==="input_date" || cell.field==="type" || cell.field==="action");
        },
        render: function($td, cell) {
            // ADD class to cell -> CSS
            $td.addClass(cell.field).html(cell.value);
        }
    });
    
    var CustomRowRenderer = TableView.BaseRowExpansionRenderer.extend({
        initialize: function(args) {
            // initialize will run once, so we will set up a search and a chart to be reused.

            this._detailsSearchManager = new SearchManager({
                id: 'item_details',
                preview: false
            });

        },
        canRender: function(rowData) {
            // Print the rowData object to the console
            console.log("RowData: ", rowData);
            return true;
        },
        setup: function($container,rowData) {
            var rowColMapping = {};

            $.each(rowData.cells, function(index, cell) {
                rowColMapping[cell.field] = index;
            });
            
            var search_string = "| `freezer_items` | search id=\"" + rowData.values[rowColMapping["id"]] + "\" | eval input_date=strftime(input_date, \"%m/%d/%Y %H:%M:%S\"), sealed_date=strftime(sealed_date, \"%m/%d/%Y %H:%M:%S\"), purchase_date=strftime(purchase_date, \"%m/%d/%Y %H:%M:%S\") | table edit, id, status, input_date, type, subtype, sub_subtype, purchase_date, sealed_date, pack_contains | transpose | rename column AS \"field\", \"row 1\" AS \"value\"";
            
            this._detailsSearchManager.set({
                search: search_string,
                earliest_time: "-15m",
                latest_time: "now",
                autostart: false,
                cancelOnUnload: true
            });
            
            this._detailsSearchManager.startSearch();
            
            this._detailsTableView = new TableView({
                id: 'item_details_'+rowData.values[rowColMapping["id"]]+'_'+Date.now(),
                managerid: 'item_details',
                'drilldown': 'none',
                'wrap': true,
                'displayRowNumbers': false,
                'pageSize': '20',
                //'el': $("#incident_details_exp")
            });

            this._detailsSearchManager.on("search:start", function(state, job){
                console.log("Detail Search starting...")
            });
            
            var section_header_item_details = '<hr><h3 class="section_header">Item Details</h3>';
            var section_footer_item_details = '<hr>';
            
            $container.append(section_header_item_details);
            $container.append(this._detailsTableView.render().el);
            $container.append(section_footer_item_details);
        },
        render: function($container, rowData) {
            

            //var showFields = ["id","status","input_date","type","action"]
            //var addedFields = ''
            //$.each(showFields, function(index, field) {
            //    addedFields = addedFields + '<b>' + rowData.fields[rowColMapping[field]]  + '</b>: ' + rowData.values[rowColMapping[field]] + '<br>'
            //});
            //var containerObj = '<div>' + addedFields + '</div>';

            // Display some of the rowData in the expanded row
            //$container.append(containerObj);
        }
    });

    // Set up search managers
    var search_items = new SearchManager({
        id: "freezer_items",
        search: "| `freezer_items` | eval input_date=strftime(input_date, \"%m/%d/%Y %H:%M:%S\"), sealed_date=strftime(sealed_date, \"%m/%d/%Y %H:%M:%S\"), purchase_date=strftime(purchase_date, \"%m/%d/%Y %H:%M:%S\") | table edit, id, status, input_date, type, subtype, sub_subtype, purchase_date, sealed_date, pack_contains, action",
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
    });
    
    myTableObj.addCellRenderer(new CustomCellRenderer());
    myTableObj.addCellRenderer(new HiddenCellRenderer());
    myTableObj.addRowExpansionRenderer(new CustomRowRenderer());
    console.log(myTableObj);
    myTableObj.render();
    
    $(document).on("iconclick", "td", function(e, data) {
        //console.log("e", e);
        //console.log("field", data)

        if (data.field=="edit") {
            var item_id=($(this).parent().find("td.id")[0].innerHTML);
            var item_input_date=($(this).parent().find("td.input_date")[0].innerHTML);
            //console.log("id", item_id)
            
            var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items?action=get_item_info&id=' + item_id);
            $.getJSON(rest_url, function(data, status) {
                showModalItemDetails(splunkUtil, data);
            }, "json");
        }
    });
});