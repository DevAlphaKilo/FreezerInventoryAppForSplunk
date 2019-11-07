require(["jquery","splunkjs/mvc/simplexml/ready!"],
function($){
    var now = new Date();
    var date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear()
    //$("input[role='textbox'").each(function( index ) {
    //    //$(this).attr("value", date)
    //    $(this).val(date)
    //});
	var datePurchased = mvc.Compoents.get("purchase_date")
	var dateSealed = mvc.Compoents.get("sealed_date")
	console.log(datePurchased);
	console.log(dateSealed);
});