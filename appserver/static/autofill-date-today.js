require(["jquery","splunkjs/mvc","splunkjs/mvc/simplexml/ready!"],
function($, mvc){
    var now = new Date();
    var date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
    //$("input[role='textbox'").each(function( index ) {
    //    //$(this).attr("value", date)
    //    $(this).val(date)
    //});
	var datePurchased = mvc.Components.get('purchase_date');
	var dateSealed = mvc.Components.get('sealed_date');
	datePurchased.settings.set("default", date)
	dateSealed.settings.set("default", date)
});