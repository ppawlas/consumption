$( document ).ready(function() {
	
	$( '#fixed' ).change(function() {
		$( '#usage' ).prop('disabled', ! this.checked);
	});

	var pathname = window.location.pathname;
	if( pathname.split('/').length > 1) {
		var activePath = pathname.split('/').length > 2 ? pathname.split('/')[1] : pathname;
		if(activePath.length > 1) {
			$('a[href*="' + activePath +'"]').closest('.dropdown').addClass('active');
		}
	}
});