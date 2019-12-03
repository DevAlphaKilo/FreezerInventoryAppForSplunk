function showModalItemDetails (splunkUtil, mvc, item) {

    var section_header_item_details = '<div>' +
                                      '  <h5 class="item-details-header">Item Details</h5>';
    var section_body_item_details   = '  <div class="item-details-row"><div class="item-details-label">ID:</div><div class="item-details-value">' + item["id"] + '</div></div>' +
                                      '  <div class="item-details-row"><div class="item-details-label">Type:</div><div class="item-details-value">' + item["type"] + '</div></div>' +
                                      '  <div class="item-details-row"><div class="item-details-label">Subtype:</div><div class="item-details-value">' + item["subtype"] + '</div></div>' +
                                      '  <div class="item-details-row"><div class="item-details-label">Sub_Subtype:</div><div class="item-details-value">' + item["sub_subtype"] + '</div></div>';
    var section_footer_item_details = '</div>';
    var section_item_details = section_header_item_details + section_body_item_details + section_footer_item_details;

    var section_header_update = '<div>' +
                                '  <h5 class="location-header">Update Item</h5>';
    var section_body_update   = '    <div class="control-group shared-controls-controlgroup">' +
                                '      <label for="status" class="control-label">Item Status:</label>' +
                                '        <div class="controls"><select name="status" id="status" disabled="disabled"></select></div>' +
                                '        <br>' +
                                '      <label for="location" class="control-label">Storage Location:</label>' +
                                '        <div class="controls"><select name="location" id="location" disabled="disabled"></select></div>' +
                                '    </div>';
    var section_footer_update = '</div>';
    var section_update = section_header_update + section_body_update + section_footer_update;

    var section_header_delete = '<div>' +
                                '  <h5 class="delete-header">Delete Item</h5>';
    var section_body_delete   = '  <div class="delete-row"><div class="delete-label"></div><div class="delete-value">' +
                                '<a class="delete-row-link" data-dismiss="modal" href="#">DELETE THIS ITEM</a>' +
                                '</div></div>';
    var section_footer_delete = '</div>';
    var section_delete = section_header_delete + section_body_delete + section_footer_delete;

    var modal = '' +
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
                         section_update +
                '        <hr>' +
                         section_delete +
                '      </div>' +
                '      <div class="modal-footer">' +
                '        <button type="button" class="btn cancel modal-btn-cancel pull-left" data-dismiss="modal">Cancel</button>' +
                '        <button type="button" class="btn btn-primary btn-save" data-dismiss="modal">Save</button>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</div>';

    $('body').prepend(modal);
    $('#item_options').modal('show');

    $("#status").select2();

    var selectOptionsStatus = ['available','on-hold'];
    $.each(selectOptionsStatus, function(index, option) {
        if (index == 0)
        {
            $('#status').append( $('<option></option>').attr("selected", "selected").val(option).html(option) );
            $('#status').select2('data', {id: option, text: option});
        }
        else
        {
            $('#status').append( $('<option></option>').val(option).html(option) );
        }
    });
    $("#status").prop("disabled", false);

    $("#location").select2();

    var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers?action=get_freezers');
    $.getJSON(rest_url, function(data, status) {
        // each freezer in collection
        $("#location").select2();
        $.each(data, function(index, freezer) {
            if (freezer["active"]) {
                if (freezer["default"]) {
                    $('#location').append( $('<option></option>').attr("selected", "selected").val(freezer["id"]).html(freezer["name"]) );
                    // set default selection
                    $('#location').select2('data', {id: freezer["id"], text: freezer["name"]});
                }
                else
                { $('#location').append( $('<option></option>').val(freezer["id"]).html(freezer["name"]) ); }
            }
        });
    }, "json");
    $("#location").prop("disabled", false);

    // Click Events
    $(".delete-row-link").on("click", function(e) {
        console.log("event handler fired (click-delete-row-link)");
        //e.stopPropagation();
        //e.stopImmediatePropagation();
        //e.preventDefault();
        var id = $('.modal-body').children().find("div.item-details-value").html()
        $(".delete-row-link").trigger("deleteclick", {"id": id});
    });

    $(".btn.btn-primary.btn-save").on("click", function(e) {
        console.log("event handler fired (click-save-button)");
        //e.stopPropagation();
        //e.stopImmediatePropagation();
        //e.preventDefault();
        var id = $('.modal-body').children().find("div.item-details-value").html()
        var dropdown_status = $("#status").select2('data').text;
        var dropdown_location = $("#location").select2('val');

        console.log(dropdown_status);
        console.log(dropdown_location);
        $(".btn.btn-primary.btn-save").trigger("savemodal", {"id": id, "status": dropdown_status, "freezer": dropdown_location});
    });
}

function showItemTable (_, $, SearchManager, TableView) {
    // Translations from rangemap results to CSS class
    var ICONS = {
        edit: 'settings',
        delete: 'x'
    };

    $("#myTable").append("<div id=\"myTable_container\"></div>");

    var time = Date.now();

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
                console.log("event handler fired (click-td)");
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
                id: 'item_details' + time,
                preview: false
            });

            this._freezerSearchManager = new SearchManager({
                id: 'item_freezer' + time,
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

            var details_search_string = "| `freezer_items` | search id=\"" + rowData.values[rowColMapping["id"]] + "\" | eval input_date=strftime(input_date, \"%m/%d/%Y %H:%M:%S\"), sealed_date=strftime(sealed_date, \"%m/%d/%Y %H:%M:%S\"), purchase_date=strftime(purchase_date, \"%m/%d/%Y %H:%M:%S\") | table id, status, input_date, type, subtype, sub_subtype, purchase_date, sealed_date, pack_contains | transpose | rename column AS \"field\", \"row 1\" AS \"value\"";

            this._detailsSearchManager.set({
                search: details_search_string,
                earliest_time: "-15m",
                latest_time: "now",
                autostart: false,
                cancelOnUnload: true
            });

            this._detailsSearchManager.startSearch();

            this._detailsTableView = new TableView({
                id: 'item_details_'+rowData.values[rowColMapping["id"]]+'_'+Date.now(),
                managerid: 'item_details' + time,
                'drilldown': 'none',
                'wrap': true,
                'displayRowNumbers': false,
                'pageSize': '20',
                //'el': $("#incident_details_exp")
            });

            this._detailsSearchManager.on("search:start", function(state, job){
                console.log("Detail Search starting...")
            });

            var section_header_item_details = '<hr><div id="header-details" class="section-header"><h3>Item Details</h3></div>';
            var section_footer_item_details = '';

            $container.append(section_header_item_details);
            $container.append(this._detailsTableView.render().el);
            $container.append(section_footer_item_details);

            //$("#section-details").each(function (index, data) {
            //    $(data).children().each(function (index, data) {
            //        if ($(data).attr('id') == "body-details")
            //        {
            //            $(data).append(this._detailsTableView.render().el)
            //        }
            //    })
            //});

            var freezer_search_string = "| `freezer_items` | search id=\"" + rowData.values[rowColMapping["id"]] + "\" | table freezer | rename freezer AS id | join [ | `freezers` ] | fields - _* | transpose | rename column AS \"field\", \"row 1\" AS \"value\"";

            this._freezerSearchManager.set({
                search: freezer_search_string,
                earliest_time: "-15m",
                latest_time: "now",
                autostart: false,
                cancelOnUnload: true
            });

            this._freezerSearchManager.startSearch();

            this._freezerTableView = new TableView({
                id: 'freezer_details_'+rowData.values[rowColMapping["id"]]+'_'+Date.now(),
                managerid: 'item_freezer' + time,
                'drilldown': 'none',
                'wrap': true,
                'displayRowNumbers': false,
                'pageSize': '20',
                //'el': $("#incident_details_exp")
            });

            this._freezerSearchManager.on("search:start", function(state, job){
                console.log("Freezer Search starting...")
            });

            var section_header_freezer_details = '<div id="header-freezer" class="section-header"><h3>Freezer Details</h3></div>';
            var section_footer_freezer_details = '<br><hr>';

            $container.append(section_header_freezer_details);
            $container.append(this._freezerTableView.render().el);
            $container.append(section_footer_freezer_details);
        },
        render: function($container, rowData) {

        }
    });

    // Set up search managers
    var search_items = new SearchManager({
        id: "freezer_items" + time,
        search: "| `freezer_items` | search $freezers$ | eval input_date=strftime(input_date, \"%m/%d/%Y %H:%M:%S\"), sealed_date=strftime(sealed_date, \"%m/%d/%Y %H:%M:%S\"), purchase_date=strftime(purchase_date, \"%m/%d/%Y %H:%M:%S\") | table edit, id, status, input_date, type, subtype, sub_subtype, purchase_date, sealed_date, pack_contains, action",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: true,
        cancelOnUnload: true
    }, {tokens: true});

    // Create a table
    var myTableObj = new TableView({
        id: "myTable_rendered",
        managerid: "freezer_items" + time,
        drilldown: "none",
        pageSize: "10",
        showPager: true,
        "link.exportResults.visible": true,
        "link.openSearch.visible": false,
        "link.visible": true,
        el: $("#myTable_container")
    });

    myTableObj.addCellRenderer(new CustomCellRenderer());
    myTableObj.addCellRenderer(new HiddenCellRenderer());
    myTableObj.addRowExpansionRenderer(new CustomRowRenderer());
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

    showItemTable(_, $, SearchManager, TableView);

    $(document).on("iconclick", "td", function(e, data) {
        //console.log("e", e);
        //console.log("field", data)

        $("div#item_options").remove()

        if (data.field=="edit") {
            var item_id=($(this).parent().find("td.id")[0].innerHTML);
            var item_input_date=($(this).parent().find("td.input_date")[0].innerHTML);
            //console.log("id", item_id)

            var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items?action=get_item_info&id=' + item_id);
            $.getJSON(rest_url, function(data, status) {
                showModalItemDetails(splunkUtil, mvc, data);
                //update_item_table = true;
            }, "json");
        }
    });

    $(document).on("deleteclick", ".delete-row-link", function(e, data) {
        console.log("e", e);
        //e.stopPropagation();
        var id = $.trim(data["id"]);
        console.log("deleteing item - id: ", id);
        var confirm_delete = window.confirm("Are you sure you want to delete this item?");
        if (confirm_delete)
        {
            var item_delete_uri = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items?action=delete_item&id=' + id);
            console.log("item_delete_uri", item_delete_uri);
            $.get(item_delete_uri, function(data, status) {
                console.log(data);
                console.log(status);
            });
        }

        var update_item_table = true;
        if (update_item_table) {
            mvc.Components.get("myTable_rendered").remove();
            showItemTable(_, $, SearchManager, TableView);
        }
    });

    $(document).on("savemodal", ".btn.btn-primary.btn-save", function(e, data) {
        console.log("e", e);
        data = JSON.stringify(data);
        console.log(data);

        var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/items');
        var post_data = {
            action    : 'update_item',
            item_data : data,
        };
        console.log(post_data);
        $.post( rest_url, post_data, function(data, status) {
            console.log(data);
            console.log(status);
        }, "json");
    });
});