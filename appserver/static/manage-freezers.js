
function showFreezersTable (_, $, mvc, SearchManager, SingleView, TableView) {

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

        // Translations from rangemap results to CSS class
    var ICONS = {
        edit: 'gear',
        delete: 'x',
        0: 'box-unchecked',
        1: 'box-checked'
    };

    $("#myTable").append("<div id=\"myTable_container\"></div>");
        $("#freezersTotal").append("<div id=\"freezersTotal_container\"></div>");
        $("#freezersActive").append("<div id=\"freezersActive_container\"></div>");
        $("#freezersInactive").append("<div id=\"freezersInactive_container\"></div>");

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

    var HiddenCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            // Only use the cell renderer for the specific field
            return (cell.field==="id" || cell.field==="name" || cell.field==="location");
        },
        render: function($td, cell) {
            // ADD class to cell -> CSS
            $td.addClass(cell.field).html(cell.value);
        }
    });

    // Set up search managers
        var search_defaults = new SearchManager({
        id: "default_freezers" + time,
        search: "| `freezers` | search default=\"1\" | stats dc(id) AS total_defaults",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});

        var search_freezers_total = new SearchManager({
        id: "total_freezers_" + time,
        search: "| `freezers` | stats dc(id)",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});

        var search_freezers_active = new SearchManager({
        id: "active_freezers_" + time,
        search: "| `freezers` | search active=1 | stats dc(id)",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});

        var search_freezers_inactive = new SearchManager({
        id: "inactive_freezers_" + time,
        search: "| `freezers` | search NOT active=1| stats dc(id)",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});

        var search_freezers = new SearchManager({
        id: "freezers_" + time,
        search: "| `freezers` | table edit, active, default, id, name, location",
        earliest_time: "-15m",
        latest_time: "now",
        preview: true,
        cache: false,
        cancelOnUnload: true
    }, {tokens: true});

    // Create a table
    var freezersTotal = new SingleView({
        id: "freezersTotal_rendered",
        managerid: "total_freezers_" + time,
                underLabel: "Total Freezers",
        drilldown: "none",
        el: $("#freezersTotal_container")
    });

        var freezersActive = new SingleView({
        id: "freezersActive_rendered",
        managerid: "active_freezers_" + time,
                underLabel: "Active Freezers",
        drilldown: "none",
        el: $("#freezersActive_container")
    });

        var freezersInactive = new SingleView({
        id: "freezersInactive_rendered",
        managerid: "inactive_freezers_" + time,
                underLabel: "Inactive Freezers",
        drilldown: "none",
        el: $("#freezersInactive_container")
    });

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

        freezersTotal.render();
        freezersActive.render();
        freezersInactive.render();

        var mainSearch = mvc.Components.get("default_freezers" + time);
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

    myTableObj.addCellRenderer(new CustomCellRenderer());
    myTableObj.addCellRenderer(new HiddenCellRenderer());
    console.log(myTableObj);
    myTableObj.render();
}

require([
     'underscore',
     'jquery',
     'splunk.util',
     'splunkjs/mvc',
     'splunkjs/mvc/searchmanager',
     'splunkjs/mvc/singleview',
     'splunkjs/mvc/tableview',
     'splunkjs/mvc/simplexml/ready!'
],
function(_, $, splunkUtil, mvc, SearchManager, SingleView, TableView){

    var section_header_info = '<div>'
	var section_body_info   =   '<div class="control-group shared-controls-controlgroup">' +
								'  <label for="name" class="control-label">Name:</label>' +
								'    <div class="controls"><input type="text" name="name" id="name" ></input></div>' +
								'  <label for="location" class="control-label">Location:</label>' +
								'    <div class="controls"><input type="text" name="location" id="location" ></div>' +
								'  <label for="active" class="control-label">Active:</label>' +
								'    <div role="group" class="controls controls-join">' +
								'		<div class="control btn-group btn-group-radio shared-controls-booleanradiocontrol control-default" data-view="views/shared/controls/BooleanRadioControl" data-name="inputRadioBoolean">' +
								'			<button type="button" role="button" name="inputRadioBoolean" aria-label="Yes" class="btn btn-status" data-value="1" aria-pressed="false">Yes</button>' +
								'			<button type="button" role="button" name="inputRadioBoolean" aria-label="No" class="btn btn-status active" data-value="0" aria-pressed="true">No</button>' +
								'		</div>' +
								'	</div>' +
								'  <label for="default" class="control-label">Default:</label>' +
								'    <div role="group" class="controls controls-join">' +
								'		<div class="control btn-group btn-group-radio shared-controls-booleanradiocontrol control-default" data-view="views/shared/controls/BooleanRadioControl" data-name="inputRadioBoolean">' +
								'			<button type="button" role="button" name="inputRadioBoolean" aria-label="Yes" class="btn btn-default" data-value="1" aria-pressed="false">Yes</button>' +
								'			<button type="button" role="button" name="inputRadioBoolean" aria-label="No" class="btn btn-default active" data-value="0" aria-pressed="true">No</button>' +
								'		</div>' +
								'	</div>' +
								'</div>';
    var section_footer_info = '</div>';
    var section_info = section_header_info + section_body_info + section_footer_info;

    showFreezersTable(_, $, mvc, SearchManager, SingleView, TableView);

    $(document).on("iconclick", "td", function(e, data) {
        console.log("e", e);
        console.log("field", data)

                $("div#add_freezer").remove()
                $("div#freezer_settings").remove()

        var section_header_delete = '<div>';
        var section_body_delete   = '  <div class="delete-row"><div class="delete-label"></div><div class="delete-value">' +
                                '<a class="delete-row-link" data-dismiss="modal" href="#">DELETE THIS FREEZER</a>' +
                                '</div></div>';
        var section_footer_delete = '</div>';
        var section_delete = section_header_delete + section_body_delete + section_footer_delete;

        var modal = '' +
                '<div class="modal fade" id="freezer_settings">' +
                '  <div class="modal-dialog model-sm">' +
                '    <div class="modal-content">' +
                '      <div class="modal-header">' +
                '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
                '        <h4 class="modal-title">Freezer Settings</h4>' +
                '      </div>' +
                '      <div class="modal-body">' +
                         section_info +
                '       <hr>' +
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
        $('#freezer_settings').modal('show');
		
		$("div button.btn-status").click(function() {
			// remove previous active button
			$("div button.btn-status[aria-pressed='true']").attr("aria-pressed","false");
			$("div button.btn-status.active").removeClass("active");
			
			// set clicked button as active
			$(this).addClass("active");
			$(this).attr("aria-pressed","true");
		});

		$("div button.btn-default").click(function() {
			// remove previous active button
			$("div button.btn-default[aria-pressed='true']").attr("aria-pressed","false");
			$("div button.btn-default.active").removeClass("active");
			
			// set clicked button as active
			$(this).addClass("active");
			$(this).attr("aria-pressed","true");
		});

        var freezer_id = ($(this).parent().find("td.id")[0].innerHTML);
        console.log(freezer_id);

        if (data.field=="edit") {
            var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers?action=get_freezer_info&id=' + freezer_id);
            $.getJSON(rest_url, function(data, status) {
                console.log("freezer_info: ", data);
                $("#name").val(data['name']);
                $("#location").val(data['location']);
				if (data['active']) 
				{
					// remove previous active button
					$("div button.btn-status[aria-pressed='true']").attr("aria-pressed","false");
					$("div button.btn-status.active").removeClass("active");
					// set clicked button as active
					$("div button.btn-status[aria-label='Yes']").addClass("active");
					$("div button.btn-status[aria-label='Yes']").attr("aria-pressed","true");
				}
				if (data['default']) 
				{
					// remove previous active button
					$("div button.btn-default[aria-pressed='true']").attr("aria-pressed","false");
					$("div button.btn-default.active").removeClass("active");
					// set clicked button as active
					$("div button.btn-default[aria-label='Yes']").addClass("active");
					$("div button.btn-default[aria-label='Yes']").attr("aria-pressed","true");
				}
            }, "json");
        }

        // Click Events
        $(".delete-row-link").on("click", function(e) {
            console.log("event handler fired (click-delete-row-link)");
            //e.stopPropagation();
            //e.stopImmediatePropagation();
            //e.preventDefault();
            $(".delete-row-link").trigger("deleteclick", {"id": freezer_id});
        });

        $(".btn.btn-primary.btn-save").on("click", function(e) {
            console.log("event handler fired (click-save-button [update freezer])");
            var name = $("#name").val();
            var location = $("#location").val();
            var isActive = $("div button.btn-status.active[aria-pressed='true']").data("value");
            var isDefault = $("div button.btn-default.active[aria-pressed='true']").data("value");

            $(".btn.btn-primary.btn-save").trigger("savemodal-update_freezer", {"id": freezer_id, "name": name, "location": location, "active": isActive, "default": isDefault});
        });
    });

    $(document).on("deleteclick", ".delete-row-link", function(e, data) {
        console.log("e", e);
        //e.stopPropagation();
        var id = $.trim(data["id"]);
        console.log("deleteing freezer - id: ", id);
        var confirm_delete = window.confirm("Are you sure you want to delete this item?");
        if (confirm_delete)
        {
            var freezer_delete_uri = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers?action=delete_freezer&id=' + id);
            console.log("freezer_delete_uri", freezer_delete_uri);
            $.get(freezer_delete_uri, function(data, status) {
                console.log(data);
                console.log(status);
            });
            //setTimeout("location.reload();", 0);
            mvc.Components.get("myTable_rendered").remove();
			mvc.Components.get("freezersTotal_rendered").remove();
			mvc.Components.get("freezersActive_rendered").remove();
			mvc.Components.get("freezersInactive_rendered").remove();
			showFreezersTable(_, $, mvc, SearchManager, SingleView, TableView);
        }
    });

    $("#fix_issue_button").on("click", function(e) {

        $("div#set_default").remove()

        var section_header_fix = '<div>'
        var section_body_fix   = '    <div class="control-group shared-controls-controlgroup">' +
                                    '      <label for="location" class="control-label">Storage Location:</label>' +
                                    '        <div class="controls"><select name="location" id="location" disabled="disabled"></select></div>' +
                                    '    </div>';
        var section_footer_fix = '</div>';
        var section_fix = section_header_fix + section_body_fix + section_footer_fix;

        var modal = '' +
                '<div class="modal fade" id="set_default">' +
                '  <div class="modal-dialog model-sm">' +
                '    <div class="modal-content">' +
                '      <div class="modal-header">' +
                '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
                '        <h4 class="modal-title">Select a Default Freezer</h4>' +
                '      </div>' +
                '      <div class="modal-body">' +
                         section_fix +
                '      </div>' +
                '      <div class="modal-footer">' +
                '        <button type="button" class="btn cancel modal-btn-cancel pull-left" data-dismiss="modal">Cancel</button>' +
                '        <button type="button" class="btn btn-primary btn-save" data-dismiss="modal">Save</button>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</div>';

        $('body').prepend(modal);
        $('#set_default').modal('show');

        $("#location").select2();

        var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers?action=get_freezers');
        $.getJSON(rest_url, function(data, status) {
            // each freezer in collection
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

        $(".btn.btn-primary.btn-save").on("click", function(e) {
            console.log("event handler fired (click-save-button)");
            var dropdown_location = $("#location").select2('val');

            console.log(dropdown_location);
            $(".btn.btn-primary.btn-save").trigger("savemodal-set_default", {"id": dropdown_location});
        });
    });

    $(document).on("savemodal-set_default", ".btn.btn-primary.btn-save", function(e, data) {
        console.log("e", e);
        data = JSON.stringify(data);
        console.log(data);
        var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers');
        var post_data = {
            action    : 'set_default_freezer',
            freezer_data : data,
        };
        console.log(post_data);
        $.post( rest_url, post_data, function(data, status) {
            console.log(data);
            console.log(status);
            if (status == "success")
            { unsetToken("show_warning_duplicate"); }
        }, "json");

        var update_item_table = true;
        if (update_item_table) {
            mvc.Components.get("myTable_rendered").remove();
			mvc.Components.get("freezersTotal_rendered").remove();
			mvc.Components.get("freezersActive_rendered").remove();
			mvc.Components.get("freezersInactive_rendered").remove();
			showFreezersTable(_, $, mvc, SearchManager, SingleView, TableView);
        }
    });

    /* Add Custom Buttons */
    var button = '<div id="button-add" class="button-container"><a class="button" href="#">Add Freezer</a></div>';
    $('body').append(button);

    $("#button-add a").on("click", function(e) {
        console.log("Button Clicked: Add Freezer");

        $("div#add_freezer").remove()
                $("div#freezer_settings").remove()

        var modal = '' +
                '<div class="modal fade" id="add_freezer">' +
                '  <div class="modal-dialog model-sm">' +
                '    <div class="modal-content">' +
                '      <div class="modal-header">' +
                '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
                '        <h4 class="modal-title">New Freezer Information</h4>' +
                '      </div>' +
                '      <div class="modal-body">' +
                         section_info +
                '      </div>' +
                '      <div class="modal-footer">' +
                '        <button type="button" class="btn cancel modal-btn-cancel pull-left" data-dismiss="modal">Cancel</button>' +
                '        <button type="button" class="btn btn-primary btn-save" data-dismiss="modal">Save</button>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</div>';

        $('body').prepend(modal);
        $('#add_freezer').modal('show');
		
		$("div button.btn-status").click(function() {
			// remove previous active button
			$("div button.btn-status[aria-pressed='true']").attr("aria-pressed","false");
			$("div button.btn-status.active").removeClass("active");
			
			// set clicked button as active
			$(this).addClass("active");
			$(this).attr("aria-pressed","true");
		});

		$("div button.btn-default").click(function() {
			// remove previous active button
			$("div button.btn-default[aria-pressed='true']").attr("aria-pressed","false");
			$("div button.btn-default.active").removeClass("active");
			
			// set clicked button as active
			$(this).addClass("active");
			$(this).attr("aria-pressed","true");
		});

        $(".btn.btn-primary.btn-save").on("click", function(e) {
            console.log("event handler fired (click-save-button [add freezer])");
            var name = $("#name").val();
            var location = $("#location").val();
            var isActive = $("div button.btn-status.active[aria-pressed='true']").data("value");
            var isDefault = $("div button.btn-default.active[aria-pressed='true']").data("value");
			
			console.log("isActive: ", isActive);
			console.log("isDefault: ", isDefault);

            $(".btn.btn-primary.btn-save").trigger("savemodal-add_new_freezer", {"name": name, "location": location, "active": isActive, "default": isDefault});
        });
    });

    $(document).on("savemodal-add_new_freezer", ".btn.btn-primary.btn-save", function(e, data) {
        console.log("e", e);

        var new_freezer = data;

        // get number of current freezers
        var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers?action=get_freezers');
        $.get( rest_url, function(data, status) {
            console.log("freezers count: ", data.length);
            console.log(status);

            new_freezer['id'] = ("000" + (data.length + 1)).slice(-4);
            new_freezer = JSON.stringify(new_freezer);
            console.log(new_freezer);
            var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers');
            var post_data = {
                action    : 'add_freezer',
                freezer_data : new_freezer,
            };
            console.log(post_data);

            // post new freezer
            $.post( rest_url, post_data, function(data, status) {
                console.log(data);
                console.log(status);
				mvc.Components.get("myTable_rendered").remove();
				mvc.Components.get("freezersTotal_rendered").remove();
				mvc.Components.get("freezersActive_rendered").remove();
				mvc.Components.get("freezersInactive_rendered").remove();
				showFreezersTable(_, $, mvc, SearchManager, SingleView, TableView);
            }, "json");

        }, "json");

        //setTimeout("location.reload();", 0);

    });

    $(document).on("savemodal-update_freezer", ".btn.btn-primary.btn-save", function(e, data) {
        console.log("e", e);
        freezer_update = JSON.stringify(data);
        console.log(freezer_update);
        var rest_url = splunkUtil.make_url('/splunkd/__raw/services/freezer_inventory/freezers');
        var post_data = {
            action    : 'update_freezer',
            freezer_data : freezer_update,
        };
        console.log(post_data);

        // post freezer update
        $.post( rest_url, post_data, function(data, status) {
            console.log(data);
            console.log(status);
        }, "json");

        //setTimeout("location.reload();", 0);
		mvc.Components.get("myTable_rendered").remove();
		mvc.Components.get("freezersTotal_rendered").remove();
		mvc.Components.get("freezersActive_rendered").remove();
		mvc.Components.get("freezersInactive_rendered").remove();
		showFreezersTable(_, $, mvc, SearchManager, SingleView, TableView);
    });
});