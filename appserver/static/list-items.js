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
        canRender: function(rowData) {
            // Print the rowData object to the console
            console.log("RowData: ", rowData);
            return true;
        },
        render: function($container, rowData) {
            var rowColMapping = {};

            $.each(rowData.cells, function(index, cell) {
                rowColMapping[cell.field] = index;
            });

            var showFields = ["id","status","input_date","type","action"]
            var addedFields = ''
            $.each(showFields, function(index, field) {
                addedFields = addedFields + '<b>' + rowData.fields[rowColMapping[field]]  + '</b>: ' + rowData.values[rowColMapping[field]] + '<br>'
            });
            var containerObj = '<div>' + addedFields + '</div>';

            // Display some of the rowData in the expanded row
            $container.append(containerObj);
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
});