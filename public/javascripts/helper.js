$( document ).ready(function() {
	
	$( '#fixed' ).change(function() {
		$( '#usage' ).prop('disabled', ! this.checked);
	});

});