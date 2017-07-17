(function(window, document, $) {

    $(document).ready(function() {
        $("table").DataTable({
            colResize: true,
            autoWidth: false
        });
    });
    
})(window, document, jQuery);