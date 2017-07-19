(function(window, document, $) {

    $(document).ready(function() {
        $("table").DataTable({
            colResize: true,
            autoWidth: false,
            scrollX: false
        });
    });
    
})(window, document, jQuery);